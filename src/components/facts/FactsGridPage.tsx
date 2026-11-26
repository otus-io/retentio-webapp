
'use client'

import { AgGridReact } from 'ag-grid-react'
import type {
  BodyScrollEndEvent,
  CellContextMenuEvent,
  ColDef,
  IDatasource,
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
import type { AppButtonProps } from '@/components/app/AppButton'
import AppButton from '@/components/app/AppButton'
import { CircleQuestionMark, RefreshCwIcon, Rows4Icon } from 'lucide-react'
import { updateFact } from '@/api/facts'
import FactsMediaModal from '@/components/facts/FactsMediaModal'
import type { MediaType } from '@/hooks/useFactsCellAttachments'
import { rawSymbol } from '@/components/facts/token'
import { useTranslations } from 'next-intl'
import { showFailToast } from '@/lib/ui'
import { factContribution, sendFactEdits, sendToAuthor } from '@/modules/contributions/auto-send'
import { previewFromEntries } from '@/modules/contributions/pending-contributions'
import LayoutPage from '@/components/layout/LayoutPage'
import { addFactAction, deleteFactAction } from '@/modules/facts/facts.action'
import { Button } from '@heroui/react'
import clsx from 'clsx'
import AppTooltip from '@/components/app/AppTooltip'
import AppLink from '@/components/app/AppLink'
import DeleteModal from '@/components/common/DeleteModal'
import FactsTagsModal from '@/components/facts/FactsTagsModal'
import type { FactsCellMenuAction } from '@/components/facts/FactsCellContextMenu'
import FactsCellContextMenu from '@/components/facts/FactsCellContextMenu'
import { resolveCellEntry } from '@/components/facts/resolveCellEntry'
import {
  clearFactsBlocks,
  FACTS_BLOCK_SIZE,
  loadFactsBlock,
  paddedRowCount,
  prefetchNextFactsBlock,
  seedFactsBlock,
} from '@/components/facts/factsBlockCache'

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

/** The fact behind a grid row; undefined for rows still loading and for empty filler rows. */
function rowFact(data?: Record<string, any>) {
  return (data as Record<symbol, Fact | undefined> | undefined)?.[rawSymbol]
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
  /** First block, rendered on the server */
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
  // Row to open for typing once its block has loaded (set by the add-fact button).
  const pendingEditRowRef = useRef<number | null>(null)

  const getCurrentColDefs = useCallback(() => {
    const currentDefs: ColDef<Record<string, any>>[] = gridRef.current?.api.getColumnDefs() ?? []
    return currentDefs
  }, [])

  const createRowData = useCallback((fact: Fact) => {
    const result: Record<string, any> = {
      id: fact.id,
      [rawSymbol]: fact,
    }
    // Follow the live columns so blocks loaded after a column rename/delete still line up.
    const liveKeys = getCurrentColDefs().filter(isFieldColumn).map((def) => def.field)
    const keys = liveKeys.length ? liveKeys : deck.fields
    keys.forEach((key, index) => {
      if (isString(key)) {
        result[key] = fact.entries[index]
      }
    })
    return result
  }, [deck.fields, getCurrentColDefs])

  const lastDecksFields = useRef<string[]>(deck.fields)

  const startEditingRow = useCallback((rowIndex: number) => {
    const firstField = getCurrentColDefs().find(isFieldColumn)?.field
    const api = gridRef.current?.api
    if (!api || !isString(firstField)) return
    pendingEditRowRef.current = null
    api.setFocusedCell(rowIndex, firstField)
    api.startEditingCell({ rowIndex, colKey: firstField })
  }, [getCurrentColDefs])

  // Jump to the first empty row and open it for typing; the fact is created once something is typed.
  const handleAddRow = useCallback(() => {
    const api = gridRef.current?.api
    if (!api) return
    const rowIndex = totalRef.current
    api.ensureIndexVisible(rowIndex, 'bottom')
    if (api.getDisplayedRowAtIndex(rowIndex)?.data) {
      startEditingRow(rowIndex)
    } else {
      // Its block is still loading; getRows opens it on arrival.
      pendingEditRowRef.current = rowIndex
    }
  }, [startEditingRow])

  const datasource = useMemo<IDatasource>(() => {
    // New server data (navigation or revalidation after an action) supersedes cached blocks.
    clearFactsBlocks(deck.id)
    let seed: { facts: Fact[]; total: number } | null = { facts, total: initialTotal }
    return {
      rowCount: paddedRowCount(initialTotal),
      getRows: (params) => {
        if (params.startRow === 0 && seed) {
          seedFactsBlock(deck.id, 0, seed)
          seed = null
        }
        loadFactsBlock(deck.id, params.startRow)
          .then((block) => {
            setTotal(block.total)
            totalRef.current = block.total
            const rowCount = paddedRowCount(block.total)
            const rows = block.facts.map(createRowData)
            // Empty rows fill the block up to the next multiple of 100, like a spreadsheet.
            const end = Math.min(params.endRow, rowCount)
            for (let i = params.startRow + rows.length; i < end; i++) {
              rows.push({ id: `empty-${i}` })
            }
            params.successCallback(rows, rowCount)
            const pendingRow = pendingEditRowRef.current
            if (pendingRow !== null && pendingRow >= params.startRow && pendingRow < end) {
              startEditingRow(pendingRow)
            }
          })
          .catch(() => params.failCallback())
      },
    }
  }, [deck.id, facts, initialTotal, createRowData, startEditingRow])

  // Set when a fact is added; once the refreshed data arrives, keep the next empty row in view.
  const jumpToLastFactRef = useRef(false)
  useEffect(() => {
    if (!jumpToLastFactRef.current) return
    jumpToLastFactRef.current = false
    gridRef.current?.api.ensureIndexVisible(initialTotal, 'bottom')
  }, [datasource, initialTotal])

  // Set when a fact is deleted; once the refreshed data arrives, focus the same cell again, like a spreadsheet.
  const refocusCellRef = useRef<{ rowIndex: number; fieldKey: string } | null>(null)
  useEffect(() => {
    const cell = refocusCellRef.current
    if (!cell) return
    refocusCellRef.current = null
    gridRef.current?.api.ensureIndexVisible(cell.rowIndex)
    gridRef.current?.api.setFocusedCell(cell.rowIndex, cell.fieldKey)
  }, [datasource])

  const lastVisibleRowRef = useRef(0)
  const handleBodyScrollEnd = useCallback((event: BodyScrollEndEvent) => {
    if (event.direction !== 'vertical') return
    const lastRow = event.api.getLastDisplayedRowIndex()
    const scrolledDown = lastRow > lastVisibleRowRef.current
    lastVisibleRowRef.current = lastRow
    if (scrolledDown) {
      prefetchNextFactsBlock(deck.id, lastRow, total)
    }
  }, [deck.id, total])

  const handleFieldsChange = useCallback(async (force = false) => {
    const currentDefs = getCurrentColDefs()
      .filter(isFieldColumn)
      .map((e) => e.headerName || '')
    if(force || JSON.stringify(currentDefs) !== JSON.stringify(lastDecksFields.current)){
      setLoading(true)
      lastDecksFields.current = currentDefs
      await updateDeck(deck.id, {
        ...deck,
        fields: currentDefs,
      })
      clearFactsBlocks(deck.id)
      setLoading(false)
    }
  }, [deck, getCurrentColDefs])

  const handleDebouncedFieldsChange = useDebouncedCallback(handleFieldsChange, 100)

  const getEntriesFromData = useCallback(
    (data: Record<string, Entry>) => {
      return getCurrentColDefs()
        .filter(isFieldColumn)
        .map((e) => {
          const key = e.headerName || ''
          return (data[key] ?? { text: '' }) as Entry
        })
    },
    [getCurrentColDefs],
  )
  const addRow = useCallback(async (node: IRowNode, entries: Entry[]) => {
    // Lock the row until the refreshed data turns it into a real fact, so it is created only once.
    node.data.adding = true
    const imported = Boolean(deck.source_deck_id)
    try {
      setLoading(true)
      jumpToLastFactRef.current = true
      const res = await addFactAction(deck.id, entries, false, imported)
      if (!res.success) {
        node.data.adding = false
        jumpToLastFactRef.current = false
        showFailToast(String(res.error ?? '') || tRef.current('add-fact.failed'))
        return
      }
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
  }, [deck.id, deck.source_deck_id])

  const handleCellChange = useCallback(async () => {
    const changedNodes: { node: IRowNode; entries: Entry[] }[] = []
    let newRow: { node: IRowNode; entries: Entry[] } | undefined
    gridRef.current?.api.forEachNode((node) => {
      const data = node.data
      // Typing in the first empty row makes it a new fact.
      if (data && !data[rawSymbol] && !data.adding && node.rowIndex === totalRef.current) {
        const entries = getEntriesFromData(data)
        if (entries.some((entry) => entry.text)) newRow = { node, entries }
      }
      // Skip rows still loading (no data) and the empty filler rows (no fact).
      if (!data?.[rawSymbol]) return
      const raw = data[rawSymbol] as Fact
      const entries = getEntriesFromData(data)
      const hasChanged = entries.some((entry, i) => {
        const rawEntry = raw.entries[i]
        if (!rawEntry) return true
        return entry.text !== rawEntry.text
          || entry.audio !== rawEntry.audio
          || entry.image !== rawEntry.image
          || entry.video !== rawEntry.video
      })
      if (hasChanged) {
        changedNodes.push({ node, entries })
      }
    })

    if (newRow) await addRow(newRow.node, newRow.entries)
    if (!changedNodes.length) return

    try {
      setLoading(true)
      await Promise.all(changedNodes.map(({ node, entries }) => updateFact(deck.id, node.data.id, { entries })))
      changedNodes.forEach(({ node, entries }) => {
        node.data[rawSymbol].entries = entries
      })
      clearFactsBlocks(deck.id)
      // Edits on an imported deck go to the author right away, as on mobile; only a failed send is shown.
      if (deck.source_deck_id) {
        const { unsent } = await sendFactEdits(
          deck.id,
          changedNodes.map(({ node, entries }) => ({
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

  const handleDebouncedChange = useDebouncedCallback(() => {
    handleFieldsChange(true)
    handleCellChange()
  }, 100)

  const [cellMenu, setCellMenu] = useState<{
    x: number
    y: number
    rowIndex: number
    fact: Fact
    fieldKey: string
    entry: Entry
  } | null>(null)
  const [menuFact, setMenuFact] = useState<Fact>()
  const menuCellRef = useRef<{ rowIndex: number; fieldKey: string } | null>(null)
  const [isTagsOpen, setIsTagsOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleCellContextMenu = useCallback((event: CellContextMenuEvent<Record<string, any>>) => {
    const fact = rowFact(event.data)
    const mouse = event.event as MouseEvent | null
    if (!fact || !mouse || event.rowIndex === null || !isFieldColumn(event.colDef)) return
    const fieldKey = event.column.getColId()
    event.api.setFocusedCell(event.rowIndex, fieldKey)
    setCellMenu({
      x: mouse.clientX,
      y: mouse.clientY,
      rowIndex: event.rowIndex,
      fact,
      fieldKey,
      entry: resolveCellEntry(event) ?? { text: '' },
    })
  }, [])

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
      setIsDeleteOpen(true)
    }
  }, [cellMenu])

  const handleCellMenuClose = useCallback(() => {
    // Return keyboard focus to the cell the menu was opened on, as a spreadsheet does.
    if (cellMenu) gridRef.current?.api.setFocusedCell(cellMenu.rowIndex, cellMenu.fieldKey)
    setCellMenu(null)
  }, [cellMenu])

  const deleteMenuFact = useMemo<ActionFunction>(() => {
    const action = deleteFactAction.bind(null, { deckId: deck.id, factId: menuFact?.id ?? '' })
    return async (state, formData) => {
      refocusCellRef.current = menuCellRef.current
      const res = await action(state, formData)
      // On success the action redirects and the refreshed data refocuses the cell; on failure, stay put.
      if (!res?.success) refocusCellRef.current = null
      return res
    }
  }, [deck.id, menuFact?.id])

  const handleAttachmentUpload = useCallback((fileId: string, mediaType: MediaType) => {
    if (!target) return
    const node = gridRef.current?.api.getRowNode(target.factId)
    if (!node) return
    const prevEntry: Entry = node.data[target.fieldKey] ?? { text: '' }
    const nextEntry: Entry = { ...prevEntry, [mediaType]: fileId }
    node.updateData({ ...node.data, [target.fieldKey]: nextEntry })
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

  const createColDef = useCallback((field: string) => {
    return {
      field,
      sortable: false,
      headerName: field,
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
      editable: (params) => Boolean(rowFact(params.data))
        || (params.node.rowIndex === totalRef.current && Boolean(params.data) && !params.data?.adding),
      // Share the page width; past the 200px minimum the grid scrolls sideways. Drag a header edge to resize.
      flex: 1,
      minWidth: 200,
      resizable: true,
      context: {
        uid: crypto.randomUUID(),
      },
    } satisfies ColDef<Record<string, any>>
  }, [handleRenameColDef, handleDebouncedFieldsChange])

  const columnDefs = useMemo(() => {
    return [{ ...rowNumberColDef, headerName: t('term.id') }, ...deck.fields.map(createColDef)]
  }, [deck.fields, createColDef, t])

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

        <SyncButton
          onClick={handleDebouncedChange}
          isPending={loading}
        />
      </div>
      <AgGridProvider modules={modules}>
        {/* Take the rest of the window below the breadcrumbs and toolbar; only the grid scrolls. */}
        <div className="facts-grid flex-1 min-h-0">
          <AgGridReact
            ref={gridRef}
            theme={resolvedTheme === 'dark' ? darkTheme : lightTheme}
            suppressDragLeaveHidesColumns
            suppressMovableColumns
            rowModelType="infinite"
            datasource={datasource}
            cacheBlockSize={FACTS_BLOCK_SIZE}
            maxBlocksInCache={20}
            maxConcurrentDatasourceRequests={2}
            blockLoadDebounceMillis={150}
            rowHeight={32}
            // Matches the wider .facts-grid scrollbar in globals.css.
            scrollbarWidth={14}
            columnDefs={columnDefs}
            getRowId={(p) => p.data.id}
            onCellValueChanged={handleDebouncedCellChange}
            onBodyScrollEnd={handleBodyScrollEnd}
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
        position={cellMenu && { x: cellMenu.x, y: cellMenu.y }}
        onAction={handleCellMenuAction}
        onClose={handleCellMenuClose}
      />
      {menuFact && (
        <FactsTagsModal key={menuFact.id} deck={deck} fact={menuFact} isOpen={isTagsOpen} setIsOpen={setIsTagsOpen} />
      )}
      <DeleteModal isOpen={isDeleteOpen} setIsOpen={setIsDeleteOpen} action={deleteMenuFact} />
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


function SyncButton({ ...rest }: AppButtonProps){
  const t = useTranslations()
  return (
    <AppTooltip
      content={t('common.sync')}
    >
      <Button
        size="sm"
        variant="outline"
        isIconOnly
        id="facts-grid-sync-button"
        {...rest}
      >
        {
          ({ isPending }) => <RefreshCwIcon className={clsx('size-4', isPending && 'animate-spin')} />
        }
      </Button>
    </AppTooltip>
  )
}
