
'use client'

import { AgGridReact } from 'ag-grid-react'
import type {
  CellContextMenuEvent,
  CellValueChangedEvent,
  ColDef,
  GridSizeChangedEvent,
  IHeaderParams,
  IRowNode,
} from 'ag-grid-community'
import type { Entry, Fact } from '@/modules/facts/facts.schema'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Deck } from '@/modules/decks/decks.schema'
import { ModuleRegistry } from 'ag-grid-community'
import { AllCommunityModule } from 'ag-grid-community'
import { AgGridProvider } from 'ag-grid-react'
import FactsGridHeaderRenderer from '@/components/facts/FactsGridHeaderRenderer'
import { themeQuartz, colorSchemeDark, colorSchemeLight } from 'ag-grid-community'
import { useTheme } from 'next-themes'
import { useDebouncedCallback } from 'use-debounce'
import { updateDeck } from '@/api/decks'
import AppButton from '@/components/app/AppButton'
import { CircleQuestionMark, Rows4Icon } from 'lucide-react'
import { getFactsPage, updateFact } from '@/api/facts'
import FactsMediaModal from '@/components/facts/FactsMediaModal'
import type { MediaType } from '@/hooks/useFactsCellAttachments'
import { rawSymbol } from '@/components/facts/token'
import { useTranslations } from 'next-intl'
import { showFailToast } from '@/lib/ui'
import { factContribution, sendFactEdits, sendToAuthor } from '@/modules/contributions/auto-send'
import { previewFromEntries } from '@/modules/contributions/pending-contributions'
import LayoutPage from '@/components/layout/LayoutPage'
import { addFactAction, deleteFactAction } from '@/modules/facts/facts.action'
import AppTooltip from '@/components/app/AppTooltip'
import AppLink from '@/components/app/AppLink'
import DeleteModal from '@/components/common/DeleteModal'
import FactsTagsModal from '@/components/facts/FactsTagsModal'
import type { FactsCellMenuAction } from '@/components/facts/FactsCellContextMenu'
import FactsCellContextMenu from '@/components/facts/FactsCellContextMenu'
import { resolveCellEntry } from '@/components/facts/resolveCellEntry'
import {
  endScrollRow,
  FACTS_PAGE_SIZE,
  FACTS_SORT,
  nextPageStart,
  sheetRowCount,
} from '@/components/facts/factsSheet'

const ROW_HEIGHT = 32
// Rows on screen until the grid is measured.
const DEFAULT_VISIBLE_ROWS = 30
// A failing background request is retried this often before the loader gives up.
const MAX_LOAD_FAILURES = 5
const LOAD_RETRY_MS = 2000

/**
 * A grid row. `key` never changes, so filling, adding and deleting rows update them in place (an open cell editor
 * survives). Fact rows carry the fact under rawSymbol and its fields by name; `loading` marks a fact not downloaded
 * yet; rows with neither are the empty rows below the last fact.
 */
type SheetRow = Record<string | symbol, any> & { key: string; loading?: boolean; adding?: boolean; added?: boolean }

let rowKeySeq = 0
function newRowKey() {
  rowKeySeq += 1
  return `row-${rowKeySeq}`
}

// Spreadsheet look: square corners and a clear line between every row and column.
const sheetTheme = themeQuartz.withParams({
  columnBorder: true,
  headerColumnBorder: true,
  rowBorder: true,
  wrapperBorderRadius: 0,
  borderRadius: 0,
  // The header column border already marks each edge; hide the extra resize bar (dragging the edge still resizes).
  headerColumnResizeHandleColor: 'transparent',
})
const lightTheme = sheetTheme.withPart(colorSchemeLight)
const darkTheme = sheetTheme.withPart(colorSchemeDark)
const modules = [AllCommunityModule]
ModuleRegistry.registerModules([AllCommunityModule])

function isString(value?: string | symbol): value is string {
  return typeof value === 'string'
}

/** The fact behind a grid row; undefined for rows not downloaded yet and for empty filler rows. */
function rowFact(data?: Record<string, any>) {
  return (data as Record<symbol, Fact | undefined> | undefined)?.[rawSymbol]
}

/**
 * A field column's data key, by its position: it never changes when the column is renamed (only the header does),
 * so rows keep lining up with their columns.
 */
function fieldKeyAt(index: number) {
  return `col${index}`
}

/** Deck field columns carry a uid; the row-number column does not. */
function isFieldColumn(def: ColDef) {
  return Boolean(def.context?.uid)
}

const rowNumberColDef: ColDef<Record<string, any>> = {
  colId: 'rowNumber',
  headerName: '',
  valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
  pinned: 'left',
  lockPosition: 'left',
  suppressMovable: true,
  resizable: false,
  sortable: false,
  width: 64,
  cellClass: 'text-muted text-xs',
  context: { isRowNumber: true },
}

interface FactsGridPageProps {
  /** First page, rendered on the server; the rest downloads in the background. */
  facts: Fact[]
  total: number
  createHref?: string
  deck: Deck
}

export default function FactsGridPage({ facts, total: initialTotal, deck }: FactsGridPageProps) {
  const t = useTranslations()
  // Read through a ref so the cell-save handler (and the grid's callbacks) stay stable across renders.
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])
  const { resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [target, setTarget] = useState<{ factId: string; fieldKey: string; entry: Entry }>()
  const gridRef = useRef<AgGridReact>(null)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(initialTotal)
  // The first empty row sits at index `total`; read by the grid's editable callback.
  const totalRef = useRef(initialTotal)
  // Rows that fit on screen, which sets how many empty rows follow the last fact.
  const visibleRowsRef = useRef(DEFAULT_VISIBLE_ROWS)
  const gridContainerRef = useRef<HTMLDivElement>(null)

  const getCurrentColDefs = useCallback(() => {
    const currentDefs: ColDef<Record<string, any>>[] = gridRef.current?.api.getColumnDefs() ?? []
    return currentDefs
  }, [])

  const createRowData = useCallback((fact: Fact) => {
    const result: Record<string, any> = {
      id: fact.id,
      [rawSymbol]: fact,
    }
    deck.fields.forEach((_, index) => {
      result[fieldKeyAt(index)] = fact.entries[index]
    })
    return result
  }, [deck.fields])

  const lastDecksFields = useRef<string[]>(deck.fields)

  const startEditingRow = useCallback((rowIndex: number) => {
    const firstField = getCurrentColDefs().find(isFieldColumn)?.field
    const api = gridRef.current?.api
    if (!api || !isString(firstField)) return
    api.setFocusedCell(rowIndex, firstField)
    api.startEditingCell({ rowIndex, colKey: firstField })
  }, [getCurrentColDefs])

  // Jump to the first empty row and open it for typing; the fact is created once something is typed.
  const handleAddRow = useCallback(() => {
    const api = gridRef.current?.api
    if (!api) return
    api.ensureIndexVisible(endScrollRow(totalRef.current), 'top')
    startEditingRow(totalRef.current)
  }, [startEditingRow])

  // Every row of the sheet, in grid order; the grid holds the same row objects.
  const [initialRows] = useState<SheetRow[]>(() => [
    ...facts.map((fact) => ({ ...createRowData(fact), key: fact.id })),
    ...Array.from({ length: Math.max(0, initialTotal - facts.length) }, () => ({ key: newRowKey(), loading: true })),
    ...Array.from(
      { length: sheetRowCount(initialTotal, DEFAULT_VISIBLE_ROWS) - Math.max(initialTotal, facts.length) },
      () => ({ key: newRowKey() }),
    ),
  ])
  const rowsRef = useRef<SheetRow[]>(initialRows.slice())

  // Add or drop empty rows at the end, so scrolled to the end the last facts sit at the top.
  const syncTrailingRows = useCallback(() => {
    const rows = rowsRef.current
    const target = sheetRowCount(totalRef.current, visibleRowsRef.current)
    if (rows.length < target) {
      const add = Array.from({ length: target - rows.length }, () => ({ key: newRowKey() }))
      rows.push(...add)
      gridRef.current?.api.applyTransaction({ add })
    } else if (rows.length > target) {
      gridRef.current?.api.applyTransaction({ remove: rows.splice(target) })
    }
  }, [])

  // Read through a ref so the loader always fills rows by the live columns.
  const createRowDataRef = useRef(createRowData)
  useEffect(() => {
    createRowDataRef.current = createRowData
  }, [createRowData])

  // Rows whose cells changed since the last save; only these are compared and saved.
  const dirtyNodesRef = useRef(new Set<IRowNode>())

  // Bumped when a delete shifts the rows, so a page requested before it is not filled into the wrong rows.
  const layoutVersionRef = useRef(0)
  const unmountedRef = useRef(false)
  const loaderRunningRef = useRef(false)
  // The grid's api exists only once it is ready; the loader waits for that.
  const gridReadyRef = useRef(false)

  // Saves held edits; set once the save handler exists below.
  const saveEditsRef = useRef<() => void>(() => {})

  /** Fills not-yet-loaded rows from `start` with downloaded facts; returns how many it filled. */
  const fillRows = useCallback((start: number, loaded: Fact[]) => {
    const updated: SheetRow[] = []
    loaded.forEach((fact, i) => {
      const row = rowsRef.current[start + i]
      if (!row?.loading) return
      if (row.added) {
        // A fact just added here: keep what was typed (maybe more since it was created) and save the difference.
        Object.assign(row, { id: fact.id, [rawSymbol]: fact, loading: false, added: false })
        const node = gridRef.current?.api.getRowNode(row.key)
        if (node) dirtyNodesRef.current.add(node)
        saveEditsRef.current()
      } else {
        Object.assign(row, createRowDataRef.current(fact), { loading: false })
      }
      updated.push(row)
    })
    if (updated.length) gridRef.current?.api.applyTransaction({ update: updated })
    return updated.length
  }, [])

  // Download every fact in the background, one page at a time, nearest the rows on screen first.
  const runLoader = useCallback(async () => {
    if (loaderRunningRef.current || !gridReadyRef.current) return
    loaderRunningRef.current = true
    let failures = 0
    try {
      while (!unmountedRef.current) {
        const rows = rowsRef.current
        const anchor = gridRef.current?.api.getFirstDisplayedRowIndex() ?? 0
        const start = nextPageStart((i) => Boolean(rows[i].loading), rows.length, Math.max(0, anchor))
        if (start === null) break
        const version = layoutVersionRef.current
        try {
          const res = await getFactsPage(deck.id, { limit: FACTS_PAGE_SIZE, offset: start, sort: FACTS_SORT })
          failures = 0
          if (version !== layoutVersionRef.current) continue
          // Nothing left to fill there (the deck shrank elsewhere): stop rather than ask again.
          if (!fillRows(start, res.data.facts)) break
        } catch {
          failures += 1
          if (failures >= MAX_LOAD_FAILURES) {
            showFailToast(tRef.current('facts-grid.load-failed'))
            break
          }
          await new Promise((resolve) => setTimeout(resolve, LOAD_RETRY_MS))
        }
      }
    } finally {
      loaderRunningRef.current = false
    }
  }, [deck.id, fillRows])

  // Started when the grid is ready, and again on (re)mount in case a remount stopped it.
  const handleGridReady = useCallback(() => {
    gridReadyRef.current = true
    runLoader()
  }, [runLoader])
  useEffect(() => {
    unmountedRef.current = false
    runLoader()
    return () => {
      unmountedRef.current = true
    }
  }, [runLoader])

  const handleGridSizeChanged = useCallback((event: GridSizeChangedEvent) => {
    const height = gridContainerRef.current?.querySelector('.ag-body-viewport')?.clientHeight
    if (!height) return
    // Whole rows only, so the end never scrolls past the third-last fact.
    const rows = Math.floor(height / ROW_HEIGHT)
    if (rows === visibleRowsRef.current) return
    visibleRowsRef.current = rows
    syncTrailingRows()
    event.api.refreshCells({ columns: ['rowNumber'], force: true })
  }, [syncTrailingRows])

  /** Removes a deleted fact's row in place; the rows below move up. */
  const removeFactRow = useCallback((factId: string) => {
    const index = rowsRef.current.findIndex((row) => rowFact(row)?.id === factId)
    if (index < 0) return
    const [row] = rowsRef.current.splice(index, 1)
    layoutVersionRef.current += 1
    totalRef.current -= 1
    setTotal(totalRef.current)
    const api = gridRef.current?.api
    api?.applyTransaction({ remove: [row] })
    syncTrailingRows()
    // Row numbers come from the row index, which shifted for every row below.
    api?.refreshCells({ columns: ['rowNumber'], force: true })
  }, [syncTrailingRows])

  const handleFieldsChange = useCallback(async () => {
    const currentDefs = getCurrentColDefs()
      .filter(isFieldColumn)
      .map((e) => e.headerName || '')
    if(JSON.stringify(currentDefs) !== JSON.stringify(lastDecksFields.current)){
      setLoading(true)
      lastDecksFields.current = currentDefs
      await updateDeck(deck.id, {
        ...deck,
        fields: currentDefs,
      })
      setLoading(false)
    }
  }, [deck, getCurrentColDefs])

  const handleDebouncedFieldsChange = useDebouncedCallback(handleFieldsChange, 100)

  const getEntriesFromData = useCallback(
    (data: Record<string, Entry>) => {
      return getCurrentColDefs()
        .filter(isFieldColumn)
        .map((e) => (data[e.field ?? ''] ?? { text: '' }) as Entry)
    },
    [getCurrentColDefs],
  )
  const addRow = useCallback(async (node: IRowNode, entries: Entry[]) => {
    const row = node.data as SheetRow
    // Lock the row while the fact is created, so it is created only once.
    row.adding = true
    const imported = Boolean(deck.source_deck_id)
    try {
      setLoading(true)
      const res = await addFactAction(deck.id, entries, false, imported).catch(() => ({ success: false as const }))
      row.adding = false
      if (!res.success) {
        showFailToast(String(('error' in res && res.error) || '') || tRef.current('add-fact.failed'))
        return
      }
      // The row is now the newest fact; the loader downloads it (for its id) while it keeps the typed text.
      row.loading = true
      row.added = true
      totalRef.current += 1
      setTotal(totalRef.current)
      syncTrailingRows()
      gridRef.current?.api.ensureIndexVisible(endScrollRow(totalRef.current), 'top')
      runLoader()
      const newFactIds = res.data?.newFactIds ?? []
      if (res.data?.idsUnknown) {
        showFailToast(tRef.current('auto-send.fact-added-not-sent'))
      } else if (imported && newFactIds.length) {
        // A new fact on an imported deck goes to the author right away, as on mobile.
        const preview = previewFromEntries(entries)
        const { unsent } = await sendToAuthor(
          deck.id,
          newFactIds.map((id) => factContribution('fact_add', id, preview)),
        )
        // Quiet on success; only a failed send is shown.
        if (unsent > 0) showFailToast(tRef.current('auto-send.fact-added-unsent'))
      }
    } finally {
      setLoading(false)
    }
  }, [deck.id, deck.source_deck_id, syncTrailingRows, runLoader])

  const handleCellChange = useCallback(async () => {
    const changedNodes: { node: IRowNode; entries: Entry[] }[] = []
    let newRow: { node: IRowNode; entries: Entry[] } | undefined
    const dirty = [...dirtyNodesRef.current]
    dirtyNodesRef.current.clear()
    const held: IRowNode[] = []
    dirty.forEach((node) => {
      const data = node.data
      // A fact still being created has no id yet: hold its edits until the loader brings the id.
      if (data?.adding || data?.loading) {
        held.push(node)
        return
      }
      // Typing in the first empty row makes it a new fact.
      if (data && !data[rawSymbol] && !data.adding && !data.loading && node.rowIndex === totalRef.current) {
        const entries = getEntriesFromData(data)
        if (entries.some((entry) => entry.text)) newRow = { node, entries }
      }
      // Skip rows not downloaded yet and the empty filler rows (no fact).
      if (!data?.[rawSymbol]) return
      const raw = data[rawSymbol] as Fact
      const entries = getEntriesFromData(data)
      const hasChanged = entries.some((entry, i) => {
        // A missing entry is an empty one (a new fact comes back without its blank trailing entries).
        const rawEntry = raw.entries[i] ?? { text: '' }
        return (entry.text ?? '') !== (rawEntry.text ?? '')
          || entry.audio !== rawEntry.audio
          || entry.image !== rawEntry.image
          || entry.video !== rawEntry.video
      })
      if (hasChanged) {
        changedNodes.push({ node, entries })
      }
    })

    held.forEach((node) => dirtyNodesRef.current.add(node))

    if (newRow) await addRow(newRow.node, newRow.entries)
    if (!changedNodes.length) return

    try {
      setLoading(true)
      const results = await Promise.allSettled(
        changedNodes.map(({ node, entries }) => updateFact(deck.id, node.data.id, { entries })),
      )
      const saved = changedNodes.filter((_, i) => results[i].status === 'fulfilled')
      saved.forEach(({ node, entries }) => {
        node.data[rawSymbol].entries = entries
      })
      if (saved.length < changedNodes.length) {
        // Retried with the next save; the cells keep the typed text meanwhile.
        changedNodes.forEach(({ node }, i) => {
          if (results[i].status === 'rejected') dirtyNodesRef.current.add(node)
        })
        showFailToast(tRef.current('facts-grid.save-failed'))
      }
      // Edits on an imported deck go to the author right away, as on mobile; only a failed send is shown.
      if (deck.source_deck_id && saved.length) {
        const { unsent } = await sendFactEdits(
          deck.id,
          saved.map(({ node, entries }) => ({
            factId: node.data.id,
            entries,
            local: (node.data[rawSymbol] as Fact).local,
          })),
        )
        if (unsent > 0) showFailToast(tRef.current('auto-send.unsent'))
      }
    } finally {
      setLoading(false)
    }
  }, [deck.id, deck.source_deck_id, getEntriesFromData, addRow])

  const handleDebouncedCellChange = useDebouncedCallback(handleCellChange, 100)
  useEffect(() => {
    saveEditsRef.current = handleDebouncedCellChange
  }, [handleDebouncedCellChange])

  const handleCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    dirtyNodesRef.current.add(event.node)
    handleDebouncedCellChange()
  }, [handleDebouncedCellChange])

  const [cellMenu, setCellMenu] = useState<{
    x: number
    y: number
    rowIndex: number
    fact: Fact
    fieldKey: string
    entry: Entry
    /** Opened on the ID cell: acts on the whole row. */
    rowMenu: boolean
  } | null>(null)
  // Row highlighted while its ID-cell menu, or the delete confirmation opened from it, is showing.
  const [markedRow, setMarkedRow] = useState<number | null>(null)
  // A new key per right-click: the menu is replaced at the pointer, never a still-open one left where it was.
  const [menuKey, setMenuKey] = useState(0)
  const [menuFact, setMenuFact] = useState<Fact>()
  const menuCellRef = useRef<{ rowIndex: number; fieldKey: string } | null>(null)
  const [isTagsOpen, setIsTagsOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleCellContextMenu = useCallback((event: CellContextMenuEvent<Record<string, any>>) => {
    const fact = rowFact(event.data)
    const mouse = event.event as MouseEvent | null
    const rowMenu = Boolean(event.colDef.context?.isRowNumber)
    if (!fact || !mouse || event.rowIndex === null || !(rowMenu || isFieldColumn(event.colDef))) return
    const fieldKey = event.column.getColId()
    event.api.setFocusedCell(event.rowIndex, fieldKey)
    setMarkedRow(rowMenu ? event.rowIndex : null)
    setMenuKey((key) => key + 1)
    setCellMenu({
      x: mouse.clientX,
      y: mouse.clientY,
      rowIndex: event.rowIndex,
      fact,
      fieldKey,
      entry: resolveCellEntry(event) ?? { text: '' },
      rowMenu,
    })
  }, [])

  // Set when delete is chosen, so the row stays highlighted behind the confirmation.
  const keepMarkRef = useRef(false)
  const handleCellMenuAction = useCallback((action: FactsCellMenuAction) => {
    if (!cellMenu) return
    setMenuFact(cellMenu.fact)
    menuCellRef.current = { rowIndex: cellMenu.rowIndex, fieldKey: cellMenu.fieldKey }
    if (action === 'attachment') {
      setTarget({ factId: cellMenu.fact.id, fieldKey: cellMenu.fieldKey, entry: cellMenu.entry })
      setIsOpen(true)
    } else if (action === 'tag') {
      setIsTagsOpen(true)
    } else {
      keepMarkRef.current = true
      setIsDeleteOpen(true)
    }
  }, [cellMenu])

  const handleCellMenuClose = useCallback(() => {
    if (cellMenu) {
      const { rowIndex, fieldKey } = cellMenu
      // Return keyboard focus to the cell the menu was opened on, as a spreadsheet does, unless the click that
      // closed the menu chose another cell: wait a frame for that click to focus it, then leave focus there.
      requestAnimationFrame(() => {
        const api = gridRef.current?.api
        const focused = api?.getFocusedCell()
        if (focused && (focused.rowIndex !== rowIndex || focused.column.getColId() !== fieldKey)) return
        api?.setFocusedCell(rowIndex, fieldKey)
      })
    }
    setCellMenu(null)
    if (!keepMarkRef.current) setMarkedRow(null)
    keepMarkRef.current = false
  }, [cellMenu])

  const handleDeleteOpenChange = useCallback((open: boolean) => {
    setIsDeleteOpen(open)
    if (!open) setMarkedRow(null)
  }, [])

  const deleteMenuFact = useMemo<ActionFunction>(() => {
    const factId = menuFact?.id ?? ''
    const action = deleteFactAction.bind(null, { deckId: deck.id, factId })
    return async (state, formData) => {
      const res = await action(state, formData)
      if (res?.success) {
        removeFactRow(factId)
        // Keep the cursor where the delete happened, like a spreadsheet; the next fact moved into it.
        const cell = menuCellRef.current
        if (cell) {
          gridRef.current?.api.ensureIndexVisible(cell.rowIndex)
          gridRef.current?.api.setFocusedCell(cell.rowIndex, cell.fieldKey)
        }
      }
      return res
    }
  }, [deck.id, menuFact?.id, removeFactRow])

  const handleAttachmentUpload = useCallback((fileId: string, mediaType: MediaType) => {
    if (!target) return
    const row = rowsRef.current.find((r) => rowFact(r)?.id === target.factId)
    const node = row && gridRef.current?.api.getRowNode(row.key)
    if (!node) return
    const prevEntry: Entry = node.data[target.fieldKey] ?? { text: '' }
    const nextEntry: Entry = { ...prevEntry, [mediaType]: fileId }
    // In place: the grid and rowsRef share the row object.
    node.data[target.fieldKey] = nextEntry
    gridRef.current?.api.refreshCells({ rowNodes: [node], force: true })
    dirtyNodesRef.current.add(node)
    handleDebouncedCellChange()
  }, [target, handleDebouncedCellChange])

  const handleRenameColDef = useDebouncedCallback((uid: string, newName: string) => {
    const currentDefs = getCurrentColDefs()
    const colDef = currentDefs.find((def) => def.context?.uid === uid)
    if (colDef) {
      colDef.headerName = newName
      gridRef.current?.api.setGridOption('columnDefs', [...currentDefs])
    }
  }, 100)

  const createColDef = useCallback((name: string, index: number) => {
    return {
      field: fieldKeyAt(index),
      sortable: false,
      headerName: name,
      headerComponent: (props: IHeaderParams) => {
        return (
          <FactsGridHeaderRenderer
            {...props}
            onChange={handleRenameColDef}
            onBlur={handleDebouncedFieldsChange}
          />
        )
      },
      valueGetter: (params) => {
        const key = params.colDef.field ?? ''
        if(!isString(key)){
          return ''
        }
        const data = (params.data ?? {})[key] ?? {}
        return data?.text ?? ''
      },
      valueSetter: (params) => {
        const key = params.colDef.field ?? ''
        if(!isString(key)){
          return false
        }
        const newValue = params.newValue
        params.data[key] = {
          ...params.data[key],
          text: newValue,
        }
        return true
      },
      // Of the empty filler rows below the last fact, only the first takes typing (it becomes a new fact).
      editable: (params) => Boolean(rowFact(params.data)) || (params.node.rowIndex === totalRef.current
        && Boolean(params.data) && !params.data?.adding && !params.data?.loading),
      // Share the page width; past the 200px minimum the grid scrolls sideways. Drag a header edge to resize.
      flex: 1,
      minWidth: 200,
      resizable: true,
      context: {
        uid: crypto.randomUUID(),
      },
    } satisfies ColDef<Record<string, any>>
  }, [handleRenameColDef, handleDebouncedFieldsChange])

  // Keyed by the field names, not the array the server re-sends on every refresh, so unchanged columns are kept.
  const fieldsKey = JSON.stringify(deck.fields)
  const columnDefs = useMemo(() => {
    const fields = JSON.parse(fieldsKey) as string[]
    return [{ ...rowNumberColDef, headerName: t('term.id') }, ...fields.map((name, i) => createColDef(name, i))]
  }, [fieldsKey, createColDef, t])

  return (
    <LayoutPage
      fullScreen
      breadcrumbs={[
        { href: '/decks', title: t('term.decks') },
        { href: `/decks/${deck.id}`, title: deck.name },
        { href: `/decks/${deck.id}/facts`, title: t('term.facts') },
      ]}
    >
      <div className="flex items-center gap-2 my-2">
        <div className="flex items-center gap-1">
          <span className="text-foreground text-base font-semibold">
            {t('common.all', { name: t('term.facts'), count: total })}
          </span>
          <AppTooltip content={ <p>{t('common.what-is', { name: t('term.facts') })}</p>}>
            <AppLink className="hover:text-accent" href="/guide/key-concepts/facts">
              <CircleQuestionMark className="size-4" />
            </AppLink>
          </AppTooltip>
        </div>

        <div className="ml-auto"></div>

        <CrateRowButton isPending={loading} onPress={handleAddRow} />
      </div>
      <AgGridProvider modules={modules}>
        {/* Take the rest of the window below the breadcrumbs and toolbar; only the grid scrolls. */}
        <div ref={gridContainerRef} className="facts-grid flex-1 min-h-0">
          {/* Styled by row index (in both the pinned ID column and the fields), so the grid needs no redraw. */}
          {markedRow !== null && (
            <style>
              {`.facts-grid .ag-row[row-index="${markedRow}"] {
                background-color: var(--ag-selected-row-background-color);
              }`}
            </style>
          )}
          <AgGridReact
            ref={gridRef}
            theme={resolvedTheme === 'dark' ? darkTheme : lightTheme}
            suppressDragLeaveHidesColumns
            suppressMovableColumns
            // Every row lives in the grid: rows not downloaded yet show blank until the background loader fills them.
            rowData={initialRows}
            rowHeight={ROW_HEIGHT}
            // Matches the wider .facts-grid scrollbar in globals.css.
            scrollbarWidth={14}
            columnDefs={columnDefs}
            getRowId={(p) => p.data.key}
            onCellValueChanged={handleCellValueChanged}
            onGridReady={handleGridReady}
            onGridSizeChanged={handleGridSizeChanged}
            onCellContextMenu={handleCellContextMenu}
            preventDefaultOnContextMenu
          />
        </div>
      </AgGridProvider>
      <FactsMediaModal
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        entry={target?.entry}
        id={target?.factId}
        deckId={deck.id}
        imported={Boolean(deck.source_deck_id)}
        getApi={() => gridRef.current!.api}
        onUpload={handleAttachmentUpload}
      />
      <FactsCellContextMenu
        key={menuKey}
        position={cellMenu && { x: cellMenu.x, y: cellMenu.y }}
        rowMenu={cellMenu?.rowMenu}
        onAction={handleCellMenuAction}
        onClose={handleCellMenuClose}
      />
      {menuFact && (
        <FactsTagsModal key={menuFact.id} deck={deck} fact={menuFact} isOpen={isTagsOpen} setIsOpen={setIsTagsOpen} />
      )}
      {/* A fresh dialog per fact: it closes on its own success, which a reused one would only see once. */}
      <DeleteModal
        key={menuFact?.id}
        isOpen={isDeleteOpen}
        setIsOpen={handleDeleteOpenChange}
        action={deleteMenuFact}
      />
    </LayoutPage>
  )
}



function CrateRowButton({ isPending, onPress }: { isPending: boolean, onPress: () => void }){
  const t = useTranslations()
  return (
    <AppTooltip
      content={t('common.add', { name: t('term.facts') })}
    >
      <AppButton
        size="sm"
        variant="outline"
        id="facts-grid-create-row"
        isPending={isPending}
        isIconOnly
        onPress={onPress}
        icon={<Rows4Icon className="size-4 facts-grid-create-row-icon" />}
      />
    </AppTooltip>
  )
}
