'use client'

import type { Entry, Fact } from '@/modules/facts/facts.schema'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Deck } from '@/modules/decks/decks.schema'
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
import { addFactsAction, deleteFactAction } from '@/modules/facts/facts.action'
import AppTooltip from '@/components/app/AppTooltip'
import AppLink from '@/components/app/AppLink'
import DeleteModal from '@/components/common/DeleteModal'
import FactsTagsModal from '@/components/facts/FactsTagsModal'
import type { FactsCellMenuAction } from '@/components/facts/FactsCellContextMenu'
import FactsCellContextMenu from '@/components/facts/FactsCellContextMenu'
import type { FactsSheetApi, FactsSheetCellChange, FactsSheetMenuRequest } from '@/components/facts/FactsSpreadsheet'
import FactsSpreadsheet from '@/components/facts/FactsSpreadsheet'
import { endScrollRow, FACTS_PAGE_SIZE, FACTS_SORT, nextPageStart, sheetRowCount } from '@/components/facts/factsSheet'

// A failing background request is retried this often before the loader gives up.
const MAX_LOAD_FAILURES = 5
const LOAD_RETRY_MS = 2000

/**
 * A sheet row, at the same index as in the sheet. Fact rows carry the fact under rawSymbol and its entries by column
 * key; `loading` marks a fact not downloaded yet; rows with neither are the empty rows below the last fact.
 */
type SheetRow = Record<string | symbol, any> & {
  loading?: boolean
  /** Created but not identified yet: the texts it was created with, to recognise it when downloaded. */
  added?: string[]
  /** Its create failed (the server may still have made it): tried again only once a failed row is edited again. */
  addFailed?: boolean
  /** Being created: kept in the sheet even if emptied meanwhile, since its fact is on its way. */
  creating?: boolean
}

function rowFact(data?: Record<string | symbol, any>) {
  return data?.[rawSymbol] as Fact | undefined
}

/**
 * A field column's data key, by its position: it never changes when the column is renamed (only the header does),
 * so rows keep lining up with their columns.
 */
function fieldKeyAt(index: number) {
  return `col${index}`
}

function hasText(row: SheetRow, columns: number) {
  return Array.from({ length: columns }, (_, i) => row[fieldKeyAt(i)]?.text).some(Boolean)
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
  // Read through a ref so the save handlers stay stable across renders.
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])
  const [isOpen, setIsOpen] = useState(false)
  const [target, setTarget] = useState<{ factId: string; fieldKey: string; entry: Entry }>()
  const sheetRef = useRef<FactsSheetApi | null>(null)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(initialTotal)
  // Facts are the rows before `total`; the first empty row sits at index `total`.
  const totalRef = useRef(initialTotal)
  // The column names shown; saved to the deck when one is renamed.
  const headersRef = useRef<string[]>(deck.fields)
  const lastDecksFields = useRef<string[]>(deck.fields)

  const createRowData = useCallback((fact: Fact): SheetRow => {
    const result: SheetRow = { id: fact.id, [rawSymbol]: fact }
    headersRef.current.forEach((_, index) => {
      result[fieldKeyAt(index)] = fact.entries[index]
    })
    return result
  }, [])

  const rowTexts = useCallback((row: SheetRow) => (
    headersRef.current.map((_, i) => String(row[fieldKeyAt(i)]?.text ?? ''))
  ), [])

  // Every row of the sheet, in order: facts, facts not downloaded yet, then the empty row.
  const [initialRows] = useState<SheetRow[]>(() => [
    ...facts.map(createRowData),
    ...Array.from({ length: Math.max(0, initialTotal - facts.length) }, () => ({ loading: true })),
    {},
  ])
  const rowsRef = useRef<SheetRow[]>(initialRows.slice())
  // Whole rows that fit on screen; sets how many empty rows follow the last fact.
  const visibleRowsRef = useRef(0)

  // Add or drop empty rows at the end, so scrolled to the end the last facts sit at the top above a screenful of
  // empty rows. Only empty rows are dropped, and one always follows the last row with anything in it.
  const syncTrailingRows = useCallback(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const rows = rowsRef.current
    const target = sheetRowCount(totalRef.current, visibleRowsRef.current)
    // The sheet reports the rows it adds (handleRowsInsert).
    if (rows.length < target) sheet.appendRows(target - rows.length)
    const columns = headersRef.current.length
    const empty = (row: SheetRow) => !rowFact(row) && !row.loading && !row.creating && !hasText(row, columns)
    while (rows.length > target && empty(rows[rows.length - 1]) && empty(rows[rows.length - 2])) {
      rows.pop()
      sheet.deleteRow(rows.length)
    }
  }, [])
  const [sheetSeed] = useState(() => ({
    rows: initialRows.map(rowTexts),
    readOnlyRows: initialRows.flatMap((row, i) => (row.loading ? [i] : [])),
  }))

  // A row takes no typing while its fact downloads, or when it is a row the server no longer lists.
  const isReadOnly = useCallback((row: SheetRow, index: number) => (
    Boolean(row.loading) || (!rowFact(row) && index < totalRef.current)
  ), [])

  const writeRow = useCallback((row: SheetRow) => {
    const index = rowsRef.current.indexOf(row)
    sheetRef.current?.setRow(index, rowTexts(row), isReadOnly(row, index))
  }, [rowTexts, isReadOnly])

  // Rows whose cells changed since the last save; only these are compared and saved.
  const dirtyRowsRef = useRef(new Set<SheetRow>())

  // Settles once no delete is under way: the loader waits on it, so no page is requested while rows may shift.
  const deletesSettledRef = useRef<Promise<unknown>>(Promise.resolve())
  // Bumped when a delete starts and when it shifts the rows, so a page requested before is not filled into them.
  const layoutVersionRef = useRef(0)
  const unmountedRef = useRef(false)
  const loaderRunningRef = useRef(false)

  // Saves held edits; set once the save handler exists below.
  const saveEditsRef = useRef<() => void>(() => {})

  /** Fills not-yet-loaded rows from `start` with downloaded facts; returns how many it filled. */
  const fillRows = useCallback((start: number, loaded: Fact[]) => {
    let filled = 0
    let foreign = false
    let lostEdits = false
    loaded.forEach((fact, i) => {
      const row = rowsRef.current[start + i]
      if (!row?.loading) return
      if (row.added) {
        const created = row.added
        Object.assign(row, { loading: false, added: undefined })
        const texts = fact.entries.map((entry) => (entry.text ?? '').trim())
        if (created.some((text, j) => text.trim() !== (texts[j] ?? '')) || texts.slice(created.length).some(Boolean)) {
          // Not the fact created here (the deck changed elsewhere): never save onto it; the row stays read-only
          // and a reload shows both facts.
          if (dirtyRowsRef.current.delete(row)) lostEdits = true
          foreign = true
        } else {
          // The fact just added here: keep what was typed (maybe more since it was created), save the difference.
          Object.assign(row, { id: fact.id, [rawSymbol]: fact })
          dirtyRowsRef.current.add(row)
          saveEditsRef.current()
        }
      } else {
        Object.assign(row, createRowData(fact), { loading: false })
      }
      writeRow(row)
      filled += 1
    })
    if (foreign) showFailToast(tRef.current('facts-grid.load-failed'))
    if (lostEdits) showFailToast(tRef.current('facts-grid.save-failed'))
    return filled
  }, [createRowData, writeRow])

  // The server listed nothing at `start`: the rows from there on will never be found. Show them as blank, read-only
  // rows; new facts among them can no longer be identified, so stop holding their edits and say so.
  const releaseFrom = useCallback((start: number) => {
    const stale = rowsRef.current.slice(start).filter((row) => row.loading)
    const drafts = stale.filter((row) => row.added)
    stale.forEach((row) => Object.assign(row, { loading: false, added: undefined }))
    drafts.forEach((row) => dirtyRowsRef.current.delete(row))
    stale.forEach(writeRow)
    showFailToast(tRef.current('facts-grid.load-failed'))
    if (drafts.length) showFailToast(tRef.current('facts-grid.save-failed'))
  }, [writeRow])

  // Set when the loader is asked to run while a pass is under way, so a pass about to give up runs once more.
  const restartRequestedRef = useRef(false)

  // Download every fact in the background, one page at a time, nearest the rows on screen first.
  const runLoader = useCallback(async () => {
    if (loaderRunningRef.current) {
      restartRequestedRef.current = true
      return
    }
    if (!sheetRef.current) return
    loaderRunningRef.current = true
    restartRequestedRef.current = false
    let failures = 0
    try {
      while (!unmountedRef.current) {
        await deletesSettledRef.current
        if (unmountedRef.current) break
        const rows = rowsRef.current
        const anchor = sheetRef.current.firstVisibleRow()
        const start = nextPageStart((i) => Boolean(rows[i].loading), rows.length, anchor)
        if (start === null) break
        const version = layoutVersionRef.current
        try {
          const res = await getFactsPage(deck.id, { limit: FACTS_PAGE_SIZE, offset: start, sort: FACTS_SORT })
          failures = 0
          if (version !== layoutVersionRef.current) continue
          // Nothing left to list from there (the deck changed elsewhere); rows before it keep loading.
          if (!fillRows(start, res.data.facts)) releaseFrom(start)
          // Progress made: an earlier request to run again is covered by this pass.
          restartRequestedRef.current = false
        } catch {
          failures += 1
          if (failures >= MAX_LOAD_FAILURES) {
            if (restartRequestedRef.current) {
              // Asked again meanwhile (another add): try once more before giving up.
              restartRequestedRef.current = false
              failures = 0
              continue
            }
            // Rows stay pending (a new fact among them may still be identified by a later download).
            showFailToast(tRef.current('facts-grid.load-failed'))
            break
          }
          await new Promise((resolve) => setTimeout(resolve, LOAD_RETRY_MS))
        }
      }
    } finally {
      loaderRunningRef.current = false
    }
  }, [deck.id, fillRows, releaseFrom])

  // Started when the sheet is ready, and again on (re)mount in case a remount stopped it.
  const handleSheetReady = useCallback((api: FactsSheetApi) => {
    sheetRef.current = api
    syncTrailingRows()
    runLoader()
  }, [runLoader, syncTrailingRows])

  const handleVisibleRowsChange = useCallback((rows: number) => {
    visibleRowsRef.current = rows
    syncTrailingRows()
  }, [syncTrailingRows])
  useEffect(() => {
    unmountedRef.current = false
    runLoader()
    return () => {
      unmountedRef.current = true
    }
  }, [runLoader])

  /** Removes a deleted fact's row; the rows below move up. */
  const removeFactRow = useCallback((factId: string) => {
    const index = rowsRef.current.findIndex((row) => rowFact(row)?.id === factId)
    if (index < 0) return
    const [row] = rowsRef.current.splice(index, 1)
    dirtyRowsRef.current.delete(row)
    layoutVersionRef.current += 1
    totalRef.current -= 1
    setTotal(totalRef.current)
    sheetRef.current?.deleteRow(index)
    syncTrailingRows()
  }, [syncTrailingRows])

  const saveFields = useCallback(async () => {
    const fields = headersRef.current.slice()
    if (JSON.stringify(fields) !== JSON.stringify(lastDecksFields.current)) {
      setLoading(true)
      try {
        await updateDeck(deck.id, { ...deck, fields })
        lastDecksFields.current = fields
      } catch {
        // Not marked saved, so the next rename retries it.
        showFailToast(tRef.current('facts-grid.save-failed'))
      } finally {
        setLoading(false)
      }
    }
  }, [deck])

  // One header save at a time, each saving the headers shown when it runs: a later rename never lands before an
  // earlier one, so the saved headers end up matching the shown ones.
  const fieldsSaveQueueRef = useRef<Promise<void>>(Promise.resolve())
  // Renames not saved yet: the deck the server re-sends meanwhile still has the old names.
  const pendingRenamesRef = useRef(0)
  const handleHeaderRename = useCallback((x: number, title: string) => {
    headersRef.current = headersRef.current.map((name, i) => (i === x ? title : name))
    pendingRenamesRef.current += 1
    fieldsSaveQueueRef.current = fieldsSaveQueueRef.current.then(saveFields).finally(() => {
      pendingRenamesRef.current -= 1
    })
  }, [saveFields])

  // Field names changed elsewhere (a column added or removed remounts the page instead).
  const fieldsKey = JSON.stringify(deck.fields)
  useEffect(() => {
    if (pendingRenamesRef.current) return
    const fields = JSON.parse(fieldsKey) as string[]
    fields.forEach((name, x) => {
      if (headersRef.current[x] !== name) sheetRef.current?.setHeader(x, name)
    })
    headersRef.current = fields
    lastDecksFields.current = fields
  }, [fieldsKey])

  const getEntriesFromData = useCallback((data: SheetRow) => (
    headersRef.current.map((_, i) => (data[fieldKeyAt(i)] ?? { text: '' }) as Entry)
  ), [])

  // Sends to the author run one at a time on their own queue: they keep their order without holding up saves.
  const sendQueueRef = useRef<Promise<void>>(Promise.resolve())
  const queueSend = useCallback((
    send: () => Promise<{ unsent: number }>,
    unsentMessage: 'auto-send.unsent' | 'auto-send.fact-added-unsent',
  ) => {
    sendQueueRef.current = sendQueueRef.current.then(send).then(
      ({ unsent }) => {
        // Quiet on success; only a failed send is shown.
        if (unsent > 0) showFailToast(tRef.current(unsentMessage))
      },
      () => {
        showFailToast(tRef.current(unsentMessage))
      },
    )
  }, [])

  /** Creates the facts typed or pasted below the last one, in one request and in row order. */
  const addRows = useCallback(async (rows: SheetRow[]) => {
    const entriesList = rows.map(getEntriesFromData)
    // The rows keep taking typing while they are created; a later save sends what changed.
    const createdTexts = rows.map(rowTexts)
    const imported = Boolean(deck.source_deck_id)
    rows.forEach((row) => {
      row.creating = true
    })
    try {
      setLoading(true)
      // No facts page refresh (the sheet keeps its own rows); the deck page still refreshes for its counts.
      const res = await addFactsAction(deck.id, entriesList, false, false).catch(() => ({ success: false as const }))
      rows.forEach((row) => {
        row.creating = false
      })
      if (!res.success) {
        // Not retried on its own (the server may have created them before the connection dropped), not even by an
        // edit held meanwhile or typing in another row: the rows keep the text, and editing one again tries again.
        rows.forEach((row) => {
          dirtyRowsRef.current.delete(row)
          row.addFailed = true
        })
        showFailToast(String(('error' in res && res.error) || '') || tRef.current('add-fact.failed'))
        return
      }
      const newFactIds = res.data?.newFactIds ?? []
      rows.forEach((row, i) => {
        if (newFactIds.length === rows.length) {
          // The row is now this fact.
          const id = newFactIds[i]
          const fact: Fact = { id, entries: entriesList[i], fields: [], tags: [], ...(imported ? { local: true } : {}) }
          Object.assign(row, { id, [rawSymbol]: fact })
        } else {
          // Not identified: the loader downloads it (for its id) while the row keeps the typed text.
          row.loading = true
          row.added = createdTexts[i]
        }
      })
      totalRef.current += rows.length
      setTotal(totalRef.current)
      rows.forEach(writeRow)
      syncTrailingRows()
      // Save anything typed into them, or below them, meanwhile.
      saveEditsRef.current()
      // Also picks up rows left pending after an earlier download stopped on network errors.
      runLoader()
      if (imported && res.data?.idsUnknown) {
        showFailToast(tRef.current('auto-send.fact-added-not-sent'))
      } else if (imported && newFactIds.length) {
        // A new fact on an imported deck goes to the author right away, as on mobile.
        const contributions = newFactIds.map((id, i) => (
          factContribution('fact_add', id, previewFromEntries(entriesList[i]))
        ))
        queueSend(() => sendToAuthor(deck.id, contributions), 'auto-send.fact-added-unsent')
      }
    } finally {
      setLoading(false)
    }
  }, [deck.id, deck.source_deck_id, getEntriesFromData, rowTexts, writeRow, syncTrailingRows, runLoader, queueSend])

  /**
   * The rows below the last fact that hold text, made consecutive (empty rows between them are dropped) so they
   * become the next facts in order. None while a failed one waits to be edited again: rows below it would otherwise
   * become facts ahead of it.
   */
  const takeNewRows = useCallback(() => {
    const columns = headersRef.current.length
    const below = rowsRef.current.slice(totalRef.current)
    if (below.some((row) => row.addFailed && hasText(row, columns))) return []
    const last = below.findLastIndex((row) => hasText(row, columns))
    for (let i = last - 1; i >= 0; i--) {
      if (!hasText(below[i], columns)) {
        const index = totalRef.current + i
        rowsRef.current.splice(index, 1)
        sheetRef.current?.deleteRow(index)
      }
    }
    return rowsRef.current.slice(totalRef.current).filter((row) => hasText(row, columns))
  }, [])

  const saveDirtyRows = useCallback(async () => {
    const changedRows: { row: SheetRow; entries: Entry[] }[] = []
    const dirty = [...dirtyRowsRef.current]
    dirtyRowsRef.current.clear()
    const held: SheetRow[] = []
    let typedBelow = false
    let emptied = false
    dirty.forEach((row) => {
      // A new fact not identified yet has no id: hold its edits until the loader finds it.
      if (row.loading) {
        held.push(row)
        return
      }
      const raw = rowFact(row)
      if (!raw) {
        // Typing below the last fact makes new facts.
        typedBelow = true
        return
      }
      const entries = getEntriesFromData(row)
      if (!entries.some((entry) => entry.text || entry.audio || entry.image || entry.video)) {
        // A fact cannot be empty: put back what is saved (deleting is done on the row numbers).
        Object.assign(row, createRowData(raw))
        writeRow(row)
        emptied = true
        return
      }
      const hasChanged = entries.some((entry, i) => {
        // A missing entry is an empty one (a new fact comes back without its blank trailing entries).
        const rawEntry = raw.entries[i] ?? { text: '' }
        return (entry.text ?? '') !== (rawEntry.text ?? '')
          || entry.audio !== rawEntry.audio
          || entry.image !== rawEntry.image
          || entry.video !== rawEntry.video
      })
      if (hasChanged) changedRows.push({ row, entries })
    })

    held.forEach((row) => dirtyRowsRef.current.add(row))
    if (emptied) showFailToast(tRef.current('facts-grid.empty-fact'))

    if (typedBelow) {
      // Saves run one at a time, so no earlier new fact is still being created. A big paste goes in batches (a
      // request has a size limit); a failed batch stops the rest, which then wait as it does.
      const newRows = takeNewRows()
      for (let i = 0; i < newRows.length && !newRows[i - 1]?.addFailed; i += FACTS_PAGE_SIZE) {
        await addRows(newRows.slice(i, i + FACTS_PAGE_SIZE))
      }
    }
    if (!changedRows.length) return

    try {
      setLoading(true)
      const results = await Promise.allSettled(
        changedRows.map(({ row, entries }) => updateFact(deck.id, row.id, { entries })),
      )
      const saved = changedRows.filter((_, i) => results[i].status === 'fulfilled')
      saved.forEach(({ row, entries }) => {
        row[rawSymbol].entries = entries
      })
      if (saved.length < changedRows.length) {
        // Retried with the next save (unless deleted meanwhile); the cells keep the typed text.
        changedRows.forEach(({ row }, i) => {
          if (results[i].status === 'rejected' && rowsRef.current.includes(row)) dirtyRowsRef.current.add(row)
        })
        showFailToast(tRef.current('facts-grid.save-failed'))
      }
      // Edits on an imported deck go to the author right away, as on mobile; only a failed send is shown.
      if (deck.source_deck_id && saved.length) {
        const edits = saved.map(({ row, entries }) => ({
          factId: row.id,
          entries,
          local: (row[rawSymbol] as Fact).local,
        }))
        queueSend(() => sendFactEdits(deck.id, edits), 'auto-send.unsent')
      }
    } finally {
      setLoading(false)
    }
  }, [deck.id, deck.source_deck_id, getEntriesFromData, createRowData, writeRow, takeNewRows, addRows, queueSend])

  // One save at a time, in order: a later edit to a row never lands on the server before an earlier one.
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve())
  const handleCellChange = useCallback(() => {
    const run = saveQueueRef.current.then(saveDirtyRows)
    saveQueueRef.current = run.catch(() => {})
    return run
  }, [saveDirtyRows])

  const handleDebouncedCellChange = useDebouncedCallback(handleCellChange, 100)
  useEffect(() => {
    saveEditsRef.current = handleDebouncedCellChange
  }, [handleDebouncedCellChange])

  const handleCellsChange = useCallback((changes: FactsSheetCellChange[]) => {
    changes.forEach(({ x, y, value }) => {
      const row = rowsRef.current[y]
      if (!row || x >= headersRef.current.length) return
      const key = fieldKeyAt(x)
      row[key] = { ...row[key], text: value }
      // Editing a row whose create failed tries it again, with the rest that failed alongside it.
      if (row.addFailed) rowsRef.current.forEach((r) => delete r.addFailed)
      dirtyRowsRef.current.add(row)
    })
    handleDebouncedCellChange()
  }, [handleDebouncedCellChange])

  const handleRowsInsert = useCallback((y: number, count: number) => {
    rowsRef.current.splice(y, 0, ...Array.from({ length: count }, () => ({})))
  }, [])

  // Jump to the first empty row and select it for typing; the fact is created once something is typed.
  const handleAddRow = useCallback(() => {
    sheetRef.current?.scrollToRow(endScrollRow(totalRef.current))
    sheetRef.current?.focusCell(0, totalRef.current)
  }, [])

  const [cellMenu, setCellMenu] = useState<{
    x: number
    y: number
    rowIndex: number
    /** None on a row without a fact: only copy and paste. */
    fact?: Fact
    fieldKey: string
    entry: Entry
    /** Opened on the row number: acts on the whole row. */
    rowMenu: boolean
  } | null>(null)
  // A new key per right-click: the menu is replaced at the pointer, never a still-open one left where it was.
  const [menuKey, setMenuKey] = useState(0)
  const [menuFact, setMenuFact] = useState<Fact>()
  const menuCellRef = useRef<{ rowIndex: number; column: number } | null>(null)
  const [isTagsOpen, setIsTagsOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  // The facts the delete confirmation is for: the right-clicked one, or every row selected by its number.
  const [deleteFacts, setDeleteFacts] = useState<Fact[]>([])

  /** The facts in these rows, and the rows they are in (rows without a fact are left out). */
  const factsIn = useCallback((ys: number[]) => {
    const rows = ys.filter((y) => rowFact(rowsRef.current[y]))
    return { rows, facts: rows.map((y) => rowFact(rowsRef.current[y])!) }
  }, [])

  // Delete pressed on rows selected by their numbers: ask, then delete their facts.
  const handleRowsDelete = useCallback((ys: number[]) => {
    const { rows, facts } = factsIn(ys)
    if (!facts.length) return
    menuCellRef.current = { rowIndex: rows[0], column: 0 }
    sheetRef.current?.markRows(rows)
    setDeleteFacts(facts)
    setIsDeleteOpen(true)
  }, [factsIn])

  const handleCellContextMenu = useCallback((request: FactsSheetMenuRequest) => {
    const row = rowsRef.current[request.y]
    if (!row) return
    const fact = rowFact(row)
    const rowMenu = request.x === null
    const column = request.x ?? 0
    const fieldKey = fieldKeyAt(column)
    sheetRef.current?.markRows(rowMenu ? [request.y] : [])
    setMenuKey((key) => key + 1)
    setCellMenu({
      x: request.clientX,
      y: request.clientY,
      rowIndex: request.y,
      fact,
      fieldKey,
      entry: row[fieldKey] ?? fact?.entries[column] ?? { text: '' },
      rowMenu,
    })
  }, [])

  // Set when delete is chosen, so the row stays highlighted behind the confirmation.
  const keepMarkRef = useRef(false)
  // Set when a menu item opens a dialog: focus then belongs to the dialog, not back on the cell.
  const actionChosenRef = useRef(false)
  const handleCellMenuAction = useCallback((action: FactsCellMenuAction) => {
    if (!cellMenu) return
    // Copy and paste act on the selection; the keyboard then goes back to the cell as the menu closes.
    if (action === 'copy') {
      sheetRef.current?.copySelection()
      return
    }
    if (action === 'paste') {
      // Reading the clipboard needs the browser's leave (Ctrl+V needs none).
      navigator.clipboard.readText().then(
        (text) => sheetRef.current?.pasteAtSelection(text),
        () => showFailToast(tRef.current('facts-grid.paste-blocked')),
      )
      return
    }
    // The fact actions are offered only on a fact's row.
    const fact = cellMenu.fact!
    actionChosenRef.current = true
    setMenuFact(fact)
    menuCellRef.current = { rowIndex: cellMenu.rowIndex, column: Number(cellMenu.fieldKey.slice(3)) }
    if (action === 'attachment') {
      setTarget({ factId: fact.id, fieldKey: cellMenu.fieldKey, entry: cellMenu.entry })
      setIsOpen(true)
    } else if (action === 'tag') {
      setIsTagsOpen(true)
    } else {
      keepMarkRef.current = true
      // On a row number inside a selection of rows: the whole selection.
      const selected = cellMenu.rowMenu ? sheetRef.current?.selectedRows() ?? [] : []
      const { rows, facts } = selected.includes(cellMenu.rowIndex)
        ? factsIn(selected)
        : { rows: [cellMenu.rowIndex], facts: [fact] }
      sheetRef.current?.markRows(cellMenu.rowMenu ? rows : [])
      menuCellRef.current = { rowIndex: rows[0], column: Number(cellMenu.fieldKey.slice(3)) }
      setDeleteFacts(facts)
      setIsDeleteOpen(true)
    }
  }, [cellMenu, factsIn])

  const handleCellMenuClose = useCallback(() => {
    const actionChosen = actionChosenRef.current
    actionChosenRef.current = false
    if (cellMenu && !actionChosen) {
      // Give the keyboard back to the cell the menu was opened on, as a spreadsheet does, unless the click that
      // closed the menu chose another cell.
      const { rowIndex, fieldKey } = cellMenu
      const column = Number(fieldKey.slice(3))
      requestAnimationFrame(() => {
        const range = sheetRef.current?.selectedRange()
        if (!range) {
          sheetRef.current?.focusCell(column, rowIndex)
          return
        }
        // Still selected (a block right-clicked inside, or the cell itself): keep the selection.
        const kept = column >= range.x1 && column <= range.x2 && rowIndex >= range.y1 && rowIndex <= range.y2
        if (kept) sheetRef.current?.focusSheet()
      })
    }
    setCellMenu(null)
    if (!keepMarkRef.current) sheetRef.current?.markRows([])
    keepMarkRef.current = false
  }, [cellMenu])

  // A dialog opened from the menu hands the keyboard back to the cell it was opened on when it closes.
  const refocusMenuCell = useCallback(() => {
    const cell = menuCellRef.current
    if (cell) requestAnimationFrame(() => sheetRef.current?.focusCell(cell.column, cell.rowIndex))
  }, [])

  const handleMediaOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open) refocusMenuCell()
  }, [refocusMenuCell])

  const handleTagsOpenChange = useCallback((open: boolean) => {
    setIsTagsOpen(open)
    if (!open) refocusMenuCell()
  }, [refocusMenuCell])

  const handleDeleteOpenChange = useCallback((open: boolean) => {
    setIsDeleteOpen(open)
    if (!open) {
      sheetRef.current?.markRows([])
      refocusMenuCell()
    }
  }, [refocusMenuCell])

  const deleteChosenFacts = useMemo<ActionFunction>(() => async (state, formData) => {
    // A page requested before now may be computed after the delete: drop it; the loader waits for this delete
    // before asking for more.
    layoutVersionRef.current += 1
    let settle!: () => void
    deletesSettledRef.current = Promise.all([deletesSettledRef.current, new Promise<void>((r) => { settle = r })])
    try {
      // One at a time (there is no bulk delete); a failure leaves the rest to go on.
      let deleted = 0
      for (const fact of deleteFacts) {
        const action = deleteFactAction.bind(null, { deckId: deck.id, factId: fact.id })
        let res: Awaited<ReturnType<typeof action>>
        try {
          res = await action(state, formData)
        } catch {
          res = null
        }
        if (!res?.success) continue
        removeFactRow(fact.id)
        deleted += 1
      }
      if (deleted < deleteFacts.length) showFailToast(tRef.current('facts-grid.delete-failed'))
      if (deleted) {
        // Keep the cursor where the delete happened, like a spreadsheet; the next fact moved into it. (Choosing the
        // facts set the cell.)
        const cell = menuCellRef.current!
        sheetRef.current?.focusCell(cell.column, cell.rowIndex)
      }
      // The dialog closes once anything was deleted.
      return { success: deleted > 0 }
    } finally {
      settle()
    }
  }, [deck.id, deleteFacts, removeFactRow])

  const handleAttachmentUpload = useCallback((fileId: string, mediaType: MediaType) => {
    if (!target) return
    const row = rowsRef.current.find((r) => rowFact(r)?.id === target.factId)
    if (!row) return
    const prevEntry: Entry = row[target.fieldKey] ?? { text: '' }
    row[target.fieldKey] = { ...prevEntry, [mediaType]: fileId }
    dirtyRowsRef.current.add(row)
    handleDebouncedCellChange()
  }, [target, handleDebouncedCellChange])

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
      {/* Take the rest of the window below the breadcrumbs and toolbar; only the sheet scrolls. */}
      <div className="facts-grid flex-1 min-h-0">
        <FactsSpreadsheet
          headers={deck.fields}
          rows={sheetSeed.rows}
          readOnlyRows={sheetSeed.readOnlyRows}
          onReady={handleSheetReady}
          onVisibleRowsChange={handleVisibleRowsChange}
          onCellsChange={handleCellsChange}
          onRowsInsert={handleRowsInsert}
          onHeaderRename={handleHeaderRename}
          onCellContextMenu={handleCellContextMenu}
          onRowsDelete={handleRowsDelete}
        />
      </div>
      <FactsMediaModal
        setIsOpen={handleMediaOpenChange}
        isOpen={isOpen}
        entry={target?.entry}
        id={target?.factId}
        deckId={deck.id}
        imported={Boolean(deck.source_deck_id)}
        onUpload={handleAttachmentUpload}
      />
      <FactsCellContextMenu
        key={menuKey}
        position={cellMenu && { x: cellMenu.x, y: cellMenu.y }}
        rowMenu={cellMenu?.rowMenu}
        factActions={Boolean(cellMenu?.fact)}
        onAction={handleCellMenuAction}
        onClose={handleCellMenuClose}
      />
      {menuFact && (
        <FactsTagsModal
          key={menuFact.id}
          deck={deck}
          fact={menuFact}
          isOpen={isTagsOpen}
          setIsOpen={handleTagsOpenChange}
        />
      )}
      {/* A fresh dialog per fact: it closes on its own success, which a reused one would only see once. */}
      <DeleteModal
        key={`delete-${deleteFacts.map((fact) => fact.id).join()}`}
        isOpen={isDeleteOpen}
        setIsOpen={handleDeleteOpenChange}
        action={deleteChosenFacts}
        type={deleteFacts.length > 1 ? 'multiple' : 'single'}
        deleteCount={deleteFacts.length}
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
