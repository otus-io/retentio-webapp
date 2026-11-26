import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { forwardRef, useImperativeHandle } from 'react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ColDef } from 'ag-grid-community'
import { getFactsPage, updateFact } from '@/api/facts'
import { updateDeck } from '@/api/decks'
import { rawSymbol } from '@/components/facts/token'
import type { Deck } from '@/modules/decks/decks.schema'
import type { Fact } from '@/modules/facts/facts.schema'

type Row = Record<string | symbol, any> & { key: string }

const h = vi.hoisted(() => ({
  gridProps: {} as Record<string, any>,
  // The grid's rows, kept in step with the transactions the page applies.
  rows: [] as Row[],
  liveDefs: null as ColDef[] | null,
  api: {
    getColumnDefs: () => h.liveDefs ?? h.gridProps.columnDefs,
    setGridOption: (key: string, value: ColDef[]) => {
      if (key === 'columnDefs') h.liveDefs = value
    },
    getRowNode: (key: string) => {
      const row = h.rows.find((r) => r.key === key)
      return row && h.nodeOf(row)
    },
    applyTransaction: vi.fn((tx: { add?: Row[]; remove?: Row[]; update?: Row[] }) => {
      if (tx.remove) h.rows = h.rows.filter((r) => !tx.remove!.includes(r))
      if (tx.add) h.rows = [...h.rows, ...tx.add]
    }),
    ensureIndexVisible: vi.fn(),
    setFocusedCell: vi.fn(),
    startEditingCell: vi.fn(),
    getFirstDisplayedRowIndex: vi.fn(() => 0),
    refreshCells: vi.fn(),
    getFocusedCell: vi.fn((): { rowIndex: number; column: { getColId: () => string } } | null => null),
  },
  capture: (props: Record<string, any>) => {
    if (props.rowData !== h.gridProps.rowData) h.rows = [...props.rowData]
    h.gridProps = props
  },
  // Stable like next-intl's memoized translator.
  t: (key: string) => key,
  modals: {} as Record<string, Record<string, any>>,
  captureModal: (name: string, props: Record<string, any>) => {
    h.modals[name] = props
  },
  menuMounts: 0,
  deleteMounts: 0,
  // One node per row, like AG Grid, whose row nodes are stable objects.
  nodes: new WeakMap<object, { data: Row; rowIndex: number }>(),
  nodeOf: (row: Row) => {
    let node = h.nodes.get(row)
    if (!node) {
      node = { data: row, get rowIndex() { return h.rows.indexOf(row) } }
      h.nodes.set(row, node)
    }
    return node
  },
}))

vi.mock('ag-grid-react', () => ({
  AgGridProvider: ({ children }: { children: ReactNode }) => children,
  AgGridReact: forwardRef(function AgGridReact(props: Record<string, any>, ref) {
    h.capture(props)
    useImperativeHandle(ref, () => ({ api: h.api }))
    return null
  }),
}))
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'light' }) }))
vi.mock('next-intl', () => ({ useTranslations: () => h.t }))
vi.mock('@/api/facts', () => ({ getFactsPage: vi.fn(), updateFact: vi.fn() }))
vi.mock('@/api/decks', () => ({ updateDeck: vi.fn() }))
vi.mock('@/modules/facts/facts.action', () => ({ addFactAction: vi.fn(), deleteFactAction: vi.fn() }))
vi.mock('@/modules/contributions/auto-send', () => ({
  sendFactEdits: vi.fn(),
  sendToAuthor: vi.fn(),
  factContribution: (kind: string, id: string, preview: string) => ({ kind, id, preview }),
}))
vi.mock('@/lib/ui', () => ({ showFailToast: vi.fn(), showSuccessToast: vi.fn() }))
vi.mock('@/components/layout/LayoutPage', () => ({ default: ({ children }: { children: ReactNode }) => children }))
vi.mock('@/components/app/AppTooltip', () => ({ default: ({ children }: { children: ReactNode }) => children }))
vi.mock('@/components/app/AppLink', () => ({ default: ({ children }: { children: ReactNode }) => children }))
function modalMock(name: string) {
  return {
    default: (props: Record<string, any>) => {
      h.captureModal(name, props)
      return null
    },
  }
}
vi.mock('@/components/facts/FactsMediaModal', () => modalMock('media'))
vi.mock('@/components/facts/FactsTagsModal', () => modalMock('tags'))
vi.mock('@/components/common/DeleteModal', async () => {
  const { useEffect } = await import('react')
  return {
    default: function Delete(props: Record<string, any>) {
      h.captureModal('delete', props)
      useEffect(() => {
        h.deleteMounts += 1
      }, [])
      return null
    },
  }
})
vi.mock('@/components/facts/FactsCellContextMenu', async () => {
  const { useEffect } = await import('react')
  return {
    default: function Menu(props: Record<string, any>) {
      h.captureModal('menu', props)
      useEffect(() => {
        h.menuMounts += 1
      }, [])
      return null
    },
  }
})

import FactsGridPage from '@/components/facts/FactsGridPage'
import { addFactAction, deleteFactAction } from '@/modules/facts/facts.action'
import { sendFactEdits, sendToAuthor } from '@/modules/contributions/auto-send'
import { showFailToast, showSuccessToast } from '@/lib/ui'

const deck = { id: 'd1', name: 'Deck', fields: ['Front', 'Back'] } as Deck
const fact = (id: string, front = 'f', back = 'b'): Fact => ({
  id,
  entries: [{ text: front }, { text: back }],
  fields: [],
  tags: [],
})

// Facts on the server; pages are cut from these by offset (`serverFacts` replaces the fact at an offset).
let serverTotal = 250
let serverFacts: Record<number, Fact> = {}
function page(offset: number, limit: number, prefix = 'f') {
  const facts = Array.from({ length: Math.max(0, Math.min(limit, serverTotal - offset)) }, (_, i) =>
    serverFacts[offset + i] ?? fact(`${prefix}${offset + i}`))
  const meta = { msg: 'ok', count: facts.length, has_more: false, limit, offset, total: serverTotal }
  return { data: { facts }, meta }
}

function renderGrid(total = 250) {
  return render(<FactsGridPage deck={deck} facts={[fact('f0')]} total={total} />)
}

const ready = () => act(() => h.gridProps.onGridReady())
const loaded = (row: Row) => Boolean(row[rawSymbol]) && !row.loading
const allLoaded = () => h.rows.slice(0, serverTotal).every(loaded)
const nodeAt = (rowIndex: number) => h.nodeOf(h.rows[rowIndex])
const change = (rowIndex: number) => act(() => h.gridProps.onCellValueChanged({ node: nodeAt(rowIndex) }))
const settle = () => act(() => new Promise((r) => setTimeout(r, 150)))

function rightClick(overrides: Record<string, any> = {}) {
  const data = { id: 'f1', Front: { text: 'f', audio: 'a1' }, Back: { text: 'b' }, [rawSymbol]: fact('f1') }
  const event = {
    data,
    event: { clientX: 40, clientY: 60 },
    rowIndex: 3,
    colDef: h.gridProps.columnDefs[1],
    column: { getColId: () => 'Front' },
    api: h.api,
    ...overrides,
  }
  act(() => h.gridProps.onCellContextMenu(event))
}

describe('FactsGridPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.api.getFocusedCell.mockReset()
    h.api.getFirstDisplayedRowIndex.mockReturnValue(0)
    vi.mocked(addFactAction).mockReset()
    vi.mocked(sendToAuthor).mockReset()
    h.liveDefs = null
    h.modals = {}
    h.menuMounts = 0
    h.deleteMounts = 0
    serverTotal = 250
    serverFacts = {}
    vi.mocked(getFactsPage).mockImplementation(async (_d, p) => page(p?.offset ?? 0, p?.limit ?? 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('holds every row in the grid: facts, facts not downloaded yet, then empty rows', () => {
    renderGrid()
    expect(h.gridProps.rowModelType).toBeUndefined()
    expect(h.gridProps.scrollbarWidth).toBe(14)
    // 250 facts end with the last three at the top of the 30 rows on screen.
    expect(h.rows).toHaveLength(277)
    expect(h.rows[0]).toMatchObject({ key: 'f0', id: 'f0', col0: { text: 'f' }, col1: { text: 'b' } })
    expect(h.rows[0][rawSymbol]).toEqual(fact('f0'))
    expect(h.rows.slice(1, 250).every((r) => r.loading && !r[rawSymbol])).toBe(true)
    expect(h.rows.slice(250).every((r) => !r.loading && !r[rawSymbol])).toBe(true)
    expect(new Set(h.rows.map((r) => r.key)).size).toBe(277)
    expect(h.gridProps.getRowId({ data: h.rows[5] })).toBe(h.rows[5].key)
    expect(screen.getByText('common.all')).toBeDefined()
  })

  it('fills the screen with empty rows for an empty deck', () => {
    render(<FactsGridPage deck={deck} facts={[]} total={0} />)
    expect(h.rows).toHaveLength(30)
    expect(h.rows.every((r) => !r.loading && !r[rawSymbol])).toBe(true)
  })

  it('numbers rows from their index', () => {
    renderGrid()
    const rowNumber = h.gridProps.columnDefs[0]
    expect(rowNumber.headerName).toBe('term.id')
    expect(rowNumber.valueGetter({ node: { rowIndex: 4 } })).toBe(5)
    expect(rowNumber.valueGetter({ node: null })).toBe(1)
  })

  describe('background download', () => {
    it('downloads the rest in pages once the grid is ready', async () => {
      renderGrid()
      expect(getFactsPage).not.toHaveBeenCalled()
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      expect(vi.mocked(getFactsPage).mock.calls.map((c) => c[1])).toEqual([
        { limit: 200, offset: 1, sort: 'created_at' },
        { limit: 200, offset: 201, sort: 'created_at' },
      ])
      expect(h.rows[249]).toMatchObject({ id: 'f249', loading: false, col0: { text: 'f' } })
      expect(h.api.applyTransaction).toHaveBeenCalledWith({ update: expect.arrayContaining([h.rows[249]]) })
      // Rows keep their keys, so the grid updates them in place.
      expect(h.rows[249].key).not.toBe('f249')
    })

    it('starts nearest the rows on screen', async () => {
      h.api.getFirstDisplayedRowIndex.mockReturnValue(220)
      renderGrid()
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      expect(vi.mocked(getFactsPage).mock.calls[0][1]).toMatchObject({ offset: 21 })
    })

    it('keeps rows lined up with their columns after a column is renamed', async () => {
      const { rerender } = renderGrid()
      // The server re-sends the deck with the renamed field after an add or delete.
      rerender(<FactsGridPage deck={{ ...deck, fields: ['Word', 'Back'] }} facts={[fact('f0')]} total={250} />)
      expect(h.gridProps.columnDefs[1]).toMatchObject({ field: 'col0', headerName: 'Word' })
      expect(h.rows[0].col0).toEqual({ text: 'f' })
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      expect(h.rows[5].col0).toEqual({ text: 'f' })
      // Saving reads entries by column, not by header name.
      h.rows[0].col1 = { text: 'back!' }
      change(0)
      await waitFor(() => expect(updateFact).toHaveBeenCalledWith('d1', 'f0', {
        entries: [{ text: 'f' }, { text: 'back!' }],
      }))
    })

    it('retries a failed page, and gives up after repeated failures', async () => {
      vi.useFakeTimers()
      vi.mocked(getFactsPage).mockRejectedValueOnce(new Error('offline'))
      renderGrid()
      ready()
      await act(() => vi.advanceTimersByTimeAsync(2000))
      expect(allLoaded()).toBe(true)

      vi.mocked(getFactsPage).mockReset().mockRejectedValue(new Error('offline'))
      renderGrid()
      ready()
      await act(() => vi.advanceTimersByTimeAsync(20000))
      expect(getFactsPage).toHaveBeenCalledTimes(5)
      expect(showFailToast).toHaveBeenCalledWith('facts-grid.load-failed')
    })

    it('stops when the server has nothing left to fill', async () => {
      vi.mocked(getFactsPage).mockResolvedValue(page(0, 0))
      renderGrid()
      ready()
      await waitFor(() => expect(getFactsPage).toHaveBeenCalledTimes(1))
      await settle()
      expect(getFactsPage).toHaveBeenCalledTimes(1)
      expect(h.rows[1].loading).toBe(true)
      expect(showFailToast).toHaveBeenCalledWith('facts-grid.load-failed')
    })

    it('runs once at a time and stops when the page closes', async () => {
      let resolve!: (v: ReturnType<typeof page>) => void
      vi.mocked(getFactsPage).mockReturnValueOnce(new Promise((r) => { resolve = r }))
      const { unmount } = renderGrid()
      ready()
      ready()
      expect(getFactsPage).toHaveBeenCalledTimes(1)
      unmount()
      await act(async () => resolve(page(1, 200)))
      await settle()
      expect(getFactsPage).toHaveBeenCalledTimes(1)
    })

    it('drops a page requested before a delete shifted the rows', async () => {
      let resolve!: (v: ReturnType<typeof page>) => void
      vi.mocked(getFactsPage).mockReturnValueOnce(new Promise((r) => { resolve = r }))
      vi.mocked(deleteFactAction).mockResolvedValueOnce({ success: true })
      renderGrid()
      ready()
      rightClick({ data: h.rows[0], rowIndex: 0 })
      act(() => h.modals.menu.onAction('delete'))
      await act(() => h.modals.delete.action(null, new FormData()))
      serverTotal = 249
      await act(async () => resolve(page(1, 200, 'stale')))
      await waitFor(() => expect(allLoaded()).toBe(true))
      expect(h.rows.some((r) => String(r.id).startsWith('stale'))).toBe(false)
    })
  })

  it('saves only edited fact rows', async () => {
    renderGrid()
    h.rows[0].col0 = { text: 'new' }
    change(0)
    // A row not downloaded yet and an empty row below the first one change nothing.
    change(5)
    h.rows[260].col0 = { text: 'typed' }
    change(260)
    await waitFor(() => expect(updateFact).toHaveBeenCalledWith('d1', 'f0', {
      entries: [{ text: 'new' }, { text: 'b' }],
    }))
    await waitFor(() => expect(h.rows[0][rawSymbol].entries[0]).toEqual({ text: 'new' }))
    expect(updateFact).toHaveBeenCalledTimes(1)
    expect(addFactAction).not.toHaveBeenCalled()
    // Unchanged on the next save.
    change(0)
    await settle()
    expect(updateFact).toHaveBeenCalledTimes(1)
  })

  it('does not save a fact whose blank trailing entries the server left out', async () => {
    render(<FactsGridPage deck={deck} facts={[{ ...fact('f0'), entries: [{ text: 'f' }] }]} total={1} />)
    h.rows[0].col1 = { text: '' }
    change(0)
    await settle()
    expect(updateFact).not.toHaveBeenCalled()
  })

  it('reports a failed save and retries it with the next save', async () => {
    vi.mocked(updateFact).mockRejectedValueOnce(new Error('offline'))
    renderGrid()
    h.rows[0].col0 = { text: 'new' }
    change(0)
    await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('facts-grid.save-failed'))
    // Not marked saved: the next save (here, an edit to another cell) sends it again.
    expect(h.rows[0][rawSymbol].entries[0]).toEqual({ text: 'f' })
    act(() => h.gridProps.onCellValueChanged({ node: { data: h.rows[260], rowIndex: 260 } }))
    await waitFor(() => expect(updateFact).toHaveBeenCalledTimes(2))
    expect(updateFact).toHaveBeenLastCalledWith('d1', 'f0', { entries: [{ text: 'new' }, { text: 'b' }] })
  })

  it('runs saves one at a time, so a later edit never lands before an earlier one', async () => {
    let first!: () => void
    vi.mocked(updateFact).mockReturnValueOnce(new Promise((r) => { first = () => r(undefined as never) }))
    renderGrid()
    h.rows[0].col0 = { text: 'a' }
    change(0)
    await waitFor(() => expect(updateFact).toHaveBeenCalledTimes(1))
    h.rows[0].col0 = { text: 'ab' }
    change(0)
    await settle()
    expect(updateFact).toHaveBeenCalledTimes(1)
    await act(async () => first())
    await waitFor(() => expect(updateFact).toHaveBeenCalledTimes(2))
    expect(updateFact).toHaveBeenLastCalledWith('d1', 'f0', { entries: [{ text: 'ab' }, { text: 'b' }] })
  })

  it('does not retry a failed save of a fact deleted since', async () => {
    vi.mocked(updateFact).mockRejectedValueOnce(new Error('offline'))
    vi.mocked(deleteFactAction).mockResolvedValueOnce({ success: true })
    renderGrid()
    h.rows[0].col0 = { text: 'new' }
    change(0)
    await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('facts-grid.save-failed'))
    rightClick({ data: h.rows[0], rowIndex: 0 })
    act(() => h.modals.menu.onAction('delete'))
    await act(() => h.modals.delete.action(null, new FormData()))
    act(() => h.gridProps.onCellValueChanged({ node: { data: h.rows[260], rowIndex: 260 } }))
    await settle()
    expect(updateFact).toHaveBeenCalledTimes(1)
  })

  it('reports a failed column rename and retries it when the header loses focus again', async () => {
    vi.mocked(updateDeck).mockRejectedValueOnce(new Error('offline'))
    renderGrid()
    const header = h.gridProps.columnDefs[1].headerComponent({})
    const [rowNumber, front, back] = h.gridProps.columnDefs
    h.liveDefs = [rowNumber, { ...front, headerName: 'Word' }, back]
    act(() => { header.props.onBlur() })
    await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('facts-grid.save-failed'))
    act(() => { header.props.onBlur() })
    await waitFor(() => expect(updateDeck).toHaveBeenCalledTimes(2))
  })

  it('saves renamed field columns to the deck when the header loses focus, and nothing else', async () => {
    renderGrid()
    const header = h.gridProps.columnDefs[1].headerComponent({})
    act(() => { header.props.onBlur() })
    await settle()
    expect(updateDeck).not.toHaveBeenCalled()
    const [rowNumber, front, back] = h.gridProps.columnDefs
    h.liveDefs = [rowNumber, { ...front, headerName: 'Word' }, back]
    act(() => { header.props.onBlur() })
    await waitFor(() => expect(updateDeck).toHaveBeenCalledWith('d1', expect.objectContaining({
      fields: ['Word', 'Back'],
    })))
    expect(updateFact).not.toHaveBeenCalled()
    expect(document.getElementById('facts-grid-sync-button')).toBeNull()
  })

  it('stretches field columns to fill the width, with a minimum that scrolls sideways', () => {
    renderGrid()
    expect(h.gridProps.columnDefs[1]).toMatchObject({ flex: 1, minWidth: 200, resizable: true })
    expect(h.gridProps.columnDefs[1].width).toBeUndefined()
  })

  it('has no add-field button, row checkboxes, bulk delete or sort control', () => {
    renderGrid()
    expect(screen.queryByText('facts-grid.sort-id')).toBeNull()
    expect(document.getElementById('facts-grid-create-col-button')).toBeNull()
    expect(document.getElementById('facts-grid-delete-button')).toBeNull()
    expect(h.gridProps.rowSelection).toBeUndefined()
  })

  describe('refreshed server data', () => {
    it('keeps the grid rows and columns', () => {
      const { rerender } = renderGrid()
      const { rowData, columnDefs } = h.gridProps
      // The server re-sends the deck with a new (equal) fields array after an action.
      const resent = { ...deck, fields: ['Front', 'Back'] }
      rerender(<FactsGridPage deck={resent} facts={[fact('f0'), fact('f1')]} total={251} />)
      expect(h.gridProps.rowData).toBe(rowData)
      expect(h.gridProps.columnDefs).toBe(columnDefs)
      expect(h.api.applyTransaction).not.toHaveBeenCalled()
    })

    it('rebuilds the columns when the field names change', () => {
      const { rerender } = renderGrid()
      const { columnDefs } = h.gridProps
      const renamed = { ...deck, fields: ['Front', 'Back', 'Notes'] }
      rerender(<FactsGridPage deck={renamed} facts={[fact('f0')]} total={250} />)
      expect(h.gridProps.columnDefs).not.toBe(columnDefs)
      expect(h.gridProps.columnDefs).toHaveLength(4)
    })
  })

  describe('resizing the grid', () => {
    const viewportOf = (height: number) => {
      document.querySelector('.facts-grid .ag-body-viewport')?.remove()
      const viewport = document.createElement('div')
      viewport.className = 'ag-body-viewport'
      Object.defineProperty(viewport, 'clientHeight', { value: height })
      document.querySelector('.facts-grid')!.appendChild(viewport)
    }
    const resize = () => act(() => h.gridProps.onGridSizeChanged({ api: h.api }))

    it('sizes the empty rows to the rows that fit on screen', () => {
      renderGrid()
      viewportOf(320)
      resize()
      expect(h.rows).toHaveLength(257)
      expect(h.api.refreshCells).toHaveBeenCalledWith({ columns: ['rowNumber'], force: true })
      viewportOf(64 * 32)
      resize()
      expect(h.rows).toHaveLength(311)
      // Same height: nothing to change.
      h.api.applyTransaction.mockClear()
      resize()
      expect(h.api.applyTransaction).not.toHaveBeenCalled()
    })

    it('waits until the grid body is rendered', () => {
      renderGrid()
      resize()
      expect(h.api.applyTransaction).not.toHaveBeenCalled()
    })
  })

  it('lets fact rows and the first empty row be edited', () => {
    renderGrid()
    const { editable } = h.gridProps.columnDefs[1]
    expect(editable({ data: { id: 'f1', [rawSymbol]: fact('f1') }, node: { rowIndex: 3 } })).toBe(true)
    expect(editable({ data: { key: 'e' }, node: { rowIndex: 250 } })).toBe(true)
    expect(editable({ data: { key: 'e' }, node: { rowIndex: 251 } })).toBe(false)
    expect(editable({ data: { key: 'e', adding: true }, node: { rowIndex: 250 } })).toBe(false)
    expect(editable({ data: { key: 'e', loading: true }, node: { rowIndex: 250 } })).toBe(false)
    expect(editable({ data: undefined, node: { rowIndex: 250 } })).toBe(false)
  })

  describe('add fact button', () => {
    const press = () => act(() => {
      fireEvent.click(document.getElementById('facts-grid-create-row')!)
    })

    it('jumps to the end and opens the first empty row for typing without creating a fact', () => {
      renderGrid()
      press()
      expect(h.api.ensureIndexVisible).toHaveBeenCalledWith(247, 'top')
      expect(h.api.setFocusedCell).toHaveBeenCalledWith(250, 'col0')
      expect(h.api.startEditingCell).toHaveBeenCalledWith({ rowIndex: 250, colKey: 'col0' })
      expect(addFactAction).not.toHaveBeenCalled()
    })

    it('does nothing without field columns', () => {
      renderGrid()
      h.liveDefs = []
      press()
      expect(h.api.startEditingCell).not.toHaveBeenCalled()
    })
  })

  describe('typing in the first empty row', () => {
    const typed = (text = 'new') => {
      const row = h.rows[250]
      row.col0 = { text }
      change(250)
      return row
    }

    it('creates the fact once; the row becomes the newest fact and the view moves down a row', async () => {
      let created!: (v: Awaited<ReturnType<typeof addFactAction>>) => void
      vi.mocked(addFactAction).mockReturnValueOnce(new Promise((r) => { created = r }))
      renderGrid()
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      // Typed as the server will store it, so nothing is left to save once it is downloaded.
      h.rows[250].col1 = { text: 'b' }
      const row = typed('f')
      await waitFor(() => expect(addFactAction)
        .toHaveBeenCalledWith('d1', [{ text: 'f' }, { text: 'b' }], false, false, true))
      expect(row.adding).toBe(true)
      // A second edit while it is created does not create it again.
      change(250)
      await settle()
      serverTotal = 251
      await act(async () => created({ success: true, data: { newFactIds: [] } }))
      await waitFor(() => expect(h.api.ensureIndexVisible).toHaveBeenCalledWith(248, 'top'))
      expect(h.rows).toHaveLength(278)
      // The loader downloads the new fact for its id.
      await waitFor(() => expect(row).toMatchObject({ id: 'f250', loading: false }))
      expect(row.adding).toBe(false)
      expect(addFactAction).toHaveBeenCalledTimes(1)
      expect(updateFact).not.toHaveBeenCalled()
      expect(sendToAuthor).not.toHaveBeenCalled()
    })

    it('keeps text typed into the new fact while it is created, and saves it once the fact is known', async () => {
      let created!: (v: Awaited<ReturnType<typeof addFactAction>>) => void
      vi.mocked(addFactAction).mockReturnValueOnce(new Promise((r) => { created = r }))
      renderGrid()
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      const row = typed('apple')
      await waitFor(() => expect(addFactAction).toHaveBeenCalledTimes(1))
      // The next column is typed while the fact is still being created.
      row.col1 = { text: 'ringo' }
      change(250)
      await settle()
      serverTotal = 251
      serverFacts[250] = fact('f250', 'apple', '')
      await act(async () => created({ success: true, data: { newFactIds: [] } }))
      await waitFor(() => expect(updateFact).toHaveBeenCalledWith('d1', 'f250', {
        entries: [{ text: 'apple' }, { text: 'ringo' }],
      }))
      expect(row).toMatchObject({ id: 'f250', col0: { text: 'apple' }, col1: { text: 'ringo' } })
      expect(addFactAction).toHaveBeenCalledTimes(1)
    })

    it('takes the new fact id from the create, without waiting for the download', async () => {
      let created!: (v: Awaited<ReturnType<typeof addFactAction>>) => void
      vi.mocked(addFactAction).mockReturnValueOnce(new Promise((r) => { created = r }))
      renderGrid()
      const row = typed('apple')
      await waitFor(() => expect(addFactAction).toHaveBeenCalledTimes(1))
      row.col1 = { text: 'ringo' }
      change(250)
      await settle()
      await act(async () => created({ success: true, data: { newFactIds: ['n9'] } }))
      expect(row.id).toBe('n9')
      expect(row.loading).toBeFalsy()
      expect(row[rawSymbol]).toMatchObject({ id: 'n9', fields: [], tags: [] })
      expect(row[rawSymbol].local).toBeUndefined()
      // What was typed while it was created is saved to it.
      await waitFor(() => expect(updateFact).toHaveBeenCalledWith('d1', 'n9', {
        entries: [{ text: 'apple' }, { text: 'ringo' }],
      }))
      expect(getFactsPage).not.toHaveBeenCalled()
      expect(showFailToast).not.toHaveBeenCalled()
    })

    it('downloads the new fact when its id is unknown, without a send warning on an own deck', async () => {
      vi.mocked(addFactAction).mockResolvedValueOnce({ success: true, data: { newFactIds: [], idsUnknown: true } })
      renderGrid()
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      const row = typed()
      serverTotal = 251
      serverFacts[250] = { ...fact('f250', 'new'), entries: [{ text: 'new' }] }
      await waitFor(() => expect(row).toMatchObject({ id: 'f250', loading: false }))
      expect(showFailToast).not.toHaveBeenCalled()
    })

    it('never saves onto a different fact found where the new one was expected', async () => {
      vi.mocked(addFactAction).mockResolvedValue({ success: true, data: { newFactIds: [] } })
      renderGrid()
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      serverTotal = 251
      // Another device's fact sits at that position.
      serverFacts[250] = fact('other', 'theirs', '')
      const row = typed('mine')
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('facts-grid.load-failed'))
      // Nothing was typed after creating it, so nothing is unsaved.
      expect(showFailToast).toHaveBeenCalledTimes(1)
      expect(row.id).toBeUndefined()
      expect(row.loading).toBe(false)
      // Read-only from now on.
      expect(h.gridProps.columnDefs[1].editable({ data: row, node: { rowIndex: 250 } })).toBe(false)
      await settle()
      expect(updateFact).not.toHaveBeenCalled()
    })

    it('says typing is lost when a different fact is found, and compares the whole entries', async () => {
      let created!: (v: Awaited<ReturnType<typeof addFactAction>>) => void
      vi.mocked(addFactAction).mockReturnValueOnce(new Promise((r) => { created = r }))
      renderGrid()
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      const row = h.rows[250]
      row.col0 = { text: 'a' }
      row.col1 = { text: 'b' }
      change(250)
      await waitFor(() => expect(addFactAction).toHaveBeenCalledTimes(1))
      row.col1 = { text: 'b2' }
      change(250)
      await settle()
      serverTotal = 251
      // Shorter than what was created.
      serverFacts[250] = { ...fact('short', 'a'), entries: [{ text: 'a' }] }
      await act(async () => created({ success: true, data: { newFactIds: [] } }))
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('facts-grid.save-failed'))
      expect(row.id).toBeUndefined()
      expect(updateFact).not.toHaveBeenCalled()
    })

    it('keeps a new row pending after network errors, and finds it with the next add', async () => {
      vi.useFakeTimers()
      vi.mocked(addFactAction).mockResolvedValueOnce({ success: true, data: { newFactIds: [] } })
        .mockResolvedValueOnce({ success: true, data: { newFactIds: ['n2'] } })
      vi.mocked(getFactsPage).mockRejectedValue(new Error('offline'))
      render(<FactsGridPage deck={deck} facts={[fact('f0')]} total={1} />)
      ready()
      const row = h.rows[1]
      row.col0 = { text: 'new' }
      change(1)
      await act(() => vi.advanceTimersByTimeAsync(20000))
      expect(showFailToast).toHaveBeenCalledWith('facts-grid.load-failed')
      // The edits may still be saved, so no "not saved" warning yet.
      expect(showFailToast).not.toHaveBeenCalledWith('facts-grid.save-failed')
      expect(row).toMatchObject({ loading: true, added: ['new', ''] })

      // Back online: the next add (whose id is known) restarts the download, which finds the pending row.
      serverTotal = 3
      serverFacts[1] = { ...fact('n1', 'new'), entries: [{ text: 'new' }] }
      vi.mocked(getFactsPage).mockImplementation(async (_d, p) => page(p?.offset ?? 0, p?.limit ?? 0))
      h.rows[2].col0 = { text: 'next' }
      change(2)
      await act(() => vi.advanceTimersByTimeAsync(1000))
      expect(row).toMatchObject({ id: 'n1', loading: false })
      expect(h.rows[2].id).toBe('n2')
    })

    it('does not resend a failed add for an edit held while it was being created', async () => {
      let created!: (v: Awaited<ReturnType<typeof addFactAction>>) => void
      vi.mocked(addFactAction).mockReturnValueOnce(new Promise((r) => { created = r }))
      renderGrid()
      const row = typed('apple')
      await waitFor(() => expect(addFactAction).toHaveBeenCalledTimes(1))
      row.col1 = { text: 'ringo' }
      change(250)
      await settle()
      await act(async () => created({ success: false, error: 'boom' }))
      await settle()
      expect(addFactAction).toHaveBeenCalledTimes(1)
    })

    it('says typing is not saved when the download gives up before the new fact is known', async () => {
      vi.mocked(addFactAction).mockResolvedValue({ success: true, data: { newFactIds: [] } })
      renderGrid()
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      // The server does not list the new fact (yet), so the download stops.
      const row = typed()
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('facts-grid.save-failed'))
      expect(showFailToast).toHaveBeenCalledWith('facts-grid.load-failed')
      // Released as read-only, no longer holding edits that cannot be saved.
      expect(row).toMatchObject({ loading: false })
      expect(row.added).toBeUndefined()
      expect(h.api.applyTransaction).toHaveBeenLastCalledWith({ update: [row] })
    })

    it('tries a failed add again only when its row is edited again', async () => {
      vi.mocked(addFactAction).mockResolvedValueOnce({ success: false, error: 'boom' })
        .mockResolvedValueOnce({ success: true, data: { newFactIds: ['n1'] } })
      renderGrid()
      typed()
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('boom'))
      // Another row's save does not resend it (the server may have created it before the connection dropped).
      act(() => h.gridProps.onCellValueChanged({ node: { data: h.rows[260], rowIndex: 260 } }))
      await settle()
      expect(addFactAction).toHaveBeenCalledTimes(1)
      typed('new!')
      await waitFor(() => expect(h.rows[250].id).toBe('n1'))
      expect(addFactAction).toHaveBeenCalledTimes(2)
    })

    it('unlocks the row when creating the fact fails outright', async () => {
      vi.mocked(addFactAction).mockRejectedValueOnce(new Error('offline'))
      renderGrid()
      const row = typed()
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('add-fact.failed'))
      expect(row.adding).toBe(false)
      expect(h.gridProps.columnDefs[1].editable({ data: row, node: { rowIndex: 250 } })).toBe(true)
    })

    it('ignores the row while it has no text', async () => {
      renderGrid()
      typed('')
      await settle()
      expect(addFactAction).not.toHaveBeenCalled()
    })

    it('unlocks the row and reports a failed create', async () => {
      vi.mocked(addFactAction).mockResolvedValueOnce({ success: false, error: 'boom' })
      renderGrid()
      const row = typed()
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('boom'))
      expect(row.adding).toBe(false)
      expect(row.loading).toBeUndefined()
      expect(h.rows).toHaveLength(277)
      vi.mocked(addFactAction).mockResolvedValueOnce({ success: false })
      typed()
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('add-fact.failed'))
    })

    describe('on an imported deck', () => {
      const imported = { ...deck, source_deck_id: 'src' } as Deck
      const renderImported = () => render(<FactsGridPage deck={imported} facts={[fact('f0')]} total={250} />)

      it('quietly sends the new fact to the author, warning only when it is not sent', async () => {
        vi.mocked(addFactAction).mockResolvedValue({ success: true, data: { newFactIds: ['n1'] } })
        vi.mocked(sendToAuthor).mockResolvedValueOnce({ sent: 1, unsent: 0 })
        renderImported()
        typed()
        await waitFor(() => expect(sendToAuthor)
          .toHaveBeenCalledWith('d1', [{ kind: 'fact_add', id: 'n1', preview: expect.any(String) }]))
        expect(addFactAction).toHaveBeenCalledWith('d1', [{ text: 'new' }, { text: '' }], false, true, true)
        await act(() => new Promise((r) => setTimeout(r, 0)))
        expect(showSuccessToast).not.toHaveBeenCalled()
        expect(showFailToast).not.toHaveBeenCalled()
        vi.mocked(sendToAuthor).mockResolvedValueOnce({ sent: 0, unsent: 1 })
        // The next fact goes into the next empty row.
        const next = h.rows[251]
        next.col0 = { text: 'more' }
        change(251)
        await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('auto-send.fact-added-unsent'))
      })

      it('quietly sends cell edits to the author, warning only when they are not sent', async () => {
        vi.mocked(sendFactEdits).mockResolvedValueOnce({ sent: 1, unsent: 0 })
        renderImported()
        h.rows[0].col0 = { text: 'new' }
        change(0)
        await waitFor(() => expect(sendFactEdits)
          .toHaveBeenCalledWith('d1', [{ factId: 'f0', entries: [{ text: 'new' }, { text: 'b' }] }]))
        await act(() => new Promise((r) => setTimeout(r, 0)))
        expect(showSuccessToast).not.toHaveBeenCalled()
        expect(showFailToast).not.toHaveBeenCalled()
        vi.mocked(sendFactEdits).mockResolvedValueOnce({ sent: 0, unsent: 1 })
        h.rows[0].col0 = { text: 'newer' }
        change(0)
        await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('auto-send.unsent'))
      })

      it('marks edits to facts the importer added as local', async () => {
        vi.mocked(sendFactEdits).mockResolvedValueOnce({ sent: 1, unsent: 0 })
        render(<FactsGridPage deck={imported} facts={[{ ...fact('n1'), local: true }]} total={1} />)
        h.rows[0].col0 = { text: 'new' }
        change(0)
        await waitFor(() => expect(sendFactEdits)
          .toHaveBeenCalledWith('d1', [{ factId: 'n1', entries: [{ text: 'new' }, { text: 'b' }], local: true }]))
      })

      it('warns when the new fact cannot be identified', async () => {
        vi.mocked(addFactAction).mockResolvedValue({ success: true, data: { newFactIds: [], idsUnknown: true } })
        renderImported()
        typed()
        await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('auto-send.fact-added-not-sent'))
        expect(sendToAuthor).not.toHaveBeenCalled()
      })

      it('sends nothing when no new fact id comes back', async () => {
        vi.mocked(addFactAction).mockResolvedValue({ success: true })
        renderImported()
        typed()
        await waitFor(() => expect(addFactAction).toHaveBeenCalled())
        await act(() => new Promise((r) => setTimeout(r, 0)))
        expect(sendToAuthor).not.toHaveBeenCalled()
      })
    })
  })

  describe('cell right-click menu', () => {
    it('suppresses the browser menu and has no action column or cell renderer', () => {
      renderGrid()
      expect(h.gridProps.preventDefaultOnContextMenu).toBe(true)
      expect(h.gridProps.columnDefs.map((d: ColDef) => d.field ?? d.colId)).toEqual(['rowNumber', 'col0', 'col1'])
      expect(h.gridProps.columnDefs.some((d: ColDef) => d.cellRenderer || d.pinned === 'right')).toBe(false)
    })

    it('opens at the pointer on a field cell and focuses that cell', () => {
      renderGrid()
      expect(h.modals.menu.position).toBeNull()
      rightClick()
      expect(h.api.setFocusedCell).toHaveBeenCalledWith(3, 'Front')
      expect(h.modals.menu.position).toEqual({ x: 40, y: 60 })
    })

    it('ignores other columns, loading rows and missing pointer events', () => {
      renderGrid()
      rightClick({ colDef: {} })
      rightClick({ data: undefined })
      rightClick({ event: null })
      rightClick({ rowIndex: null })
      expect(h.modals.menu.position).toBeNull()
      expect(h.api.setFocusedCell).not.toHaveBeenCalled()
    })

    describe('on the ID cell', () => {
      const rightClickId = () =>
        rightClick({ colDef: h.gridProps.columnDefs[0], column: { getColId: () => 'rowNumber' } })
      const markStyle = () => document.querySelector('.facts-grid style')?.textContent ?? null

      it('marks the whole row and offers only delete', () => {
        renderGrid()
        rightClickId()
        expect(h.modals.menu).toMatchObject({ position: { x: 40, y: 60 }, rowMenu: true })
        expect(h.api.setFocusedCell).toHaveBeenCalledWith(3, 'rowNumber')
        expect(markStyle()).toContain('.ag-row[row-index="3"]')
      })

      it('unmarks the row when the menu closes without an action', () => {
        renderGrid()
        rightClickId()
        act(() => h.modals.menu.onClose())
        expect(markStyle()).toBeNull()
      })

      it('keeps the row marked behind the delete confirmation, then unmarks it', () => {
        renderGrid()
        rightClickId()
        act(() => h.modals.menu.onAction('delete'))
        act(() => h.modals.menu.onClose())
        expect(h.modals.delete.isOpen).toBe(true)
        expect(markStyle()).toContain('.ag-row[row-index="3"]')
        act(() => h.modals.delete.setIsOpen(false))
        expect(h.modals.delete.isOpen).toBe(false)
        expect(markStyle()).toBeNull()
      })

      it('does not mark the row for a field cell', () => {
        renderGrid()
        rightClick()
        expect(h.modals.menu.rowMenu).toBe(false)
        expect(markStyle()).toBeNull()
      })
    })

    it('opens attachments for the clicked cell entry', () => {
      renderGrid()
      rightClick()
      act(() => h.modals.menu.onAction('attachment'))
      expect(h.modals.media).toMatchObject({ isOpen: true, id: 'f1', entry: { text: 'f', audio: 'a1' } })
    })

    it('falls back to an empty entry when the cell has none', () => {
      renderGrid()
      rightClick({ data: { id: 'f1', [rawSymbol]: { ...fact('f1'), entries: [] } } })
      act(() => h.modals.menu.onAction('attachment'))
      expect(h.modals.media.entry).toEqual({ text: '' })
    })

    it('opens tags for the clicked fact', () => {
      renderGrid()
      expect(h.modals.tags).toBeUndefined()
      rightClick()
      act(() => h.modals.menu.onAction('tag'))
      expect(h.modals.tags).toMatchObject({ isOpen: true, fact: fact('f1'), deck })
    })

    it('confirms deleting the clicked fact', () => {
      renderGrid()
      rightClick()
      act(() => h.modals.menu.onAction('delete'))
      expect(h.modals.delete.isOpen).toBe(true)
      h.modals.delete.action(null, new FormData())
      expect(deleteFactAction).toHaveBeenCalledWith({ deckId: 'd1', factId: 'f1' }, null, expect.any(FormData))
    })

    it('removes the deleted fact in place and keeps the cursor on the same cell', async () => {
      vi.mocked(deleteFactAction).mockResolvedValueOnce({ success: true })
      renderGrid()
      const deleted = h.rows[0]
      rightClick({ data: deleted, rowIndex: 0 })
      act(() => h.modals.menu.onAction('delete'))
      h.api.setFocusedCell.mockClear()
      await act(() => h.modals.delete.action(null, new FormData()))
      expect(h.rows).not.toContain(deleted)
      expect(h.api.applyTransaction).toHaveBeenCalledWith({ remove: [deleted] })
      // 249 facts: the rows below moved up and the empty rows still fill the screen.
      expect(h.rows).toHaveLength(276)
      expect(h.api.refreshCells).toHaveBeenCalledWith({ columns: ['rowNumber'], force: true })
      expect(h.api.ensureIndexVisible).toHaveBeenCalledWith(0)
      expect(h.api.setFocusedCell).toHaveBeenCalledWith(0, 'Front')
    })

    it('uses a fresh delete dialog for each fact, so every successful delete closes it', async () => {
      vi.mocked(deleteFactAction).mockResolvedValue({ success: true })
      renderGrid()
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      const mounts = h.deleteMounts
      rightClick({ data: h.rows[0], rowIndex: 0 })
      act(() => h.modals.menu.onAction('delete'))
      await act(() => h.modals.delete.action(null, new FormData()))
      rightClick({ data: h.rows[0], rowIndex: 0 })
      act(() => h.modals.menu.onAction('delete'))
      expect(h.deleteMounts).toBe(mounts + 2)
    })

    it('leaves the rows alone when the deleted fact is not in the sheet', async () => {
      vi.mocked(deleteFactAction).mockResolvedValueOnce({ success: true })
      renderGrid()
      rightClick()
      act(() => h.modals.menu.onAction('delete'))
      await act(() => h.modals.delete.action(null, new FormData()))
      expect(h.api.applyTransaction).not.toHaveBeenCalled()
    })

    it('does not move focus when the delete fails', async () => {
      vi.mocked(deleteFactAction).mockResolvedValueOnce({ success: false, error: 'boom' })
      renderGrid()
      rightClick({ data: h.rows[0], rowIndex: 0 })
      act(() => h.modals.menu.onAction('delete'))
      h.api.setFocusedCell.mockClear()
      await act(() => h.modals.delete.action(null, new FormData()))
      expect(h.api.setFocusedCell).not.toHaveBeenCalled()
      expect(h.rows).toHaveLength(277)
      expect(showFailToast).toHaveBeenCalledWith('facts-grid.delete-failed')
    })

    it('reports a delete that fails outright', async () => {
      vi.mocked(deleteFactAction).mockRejectedValueOnce(new Error('offline'))
      renderGrid()
      rightClick({ data: h.rows[0], rowIndex: 0 })
      act(() => h.modals.menu.onAction('delete'))
      expect(await act(() => h.modals.delete.action(null, new FormData()))).toEqual({ success: false })
      expect(showFailToast).toHaveBeenCalledWith('facts-grid.delete-failed')
      expect(h.rows).toHaveLength(277)
    })

    it('puts an uploaded attachment into the cell and saves it', async () => {
      renderGrid()
      rightClick({ data: h.rows[0], rowIndex: 0, column: { getColId: () => 'col0' } })
      act(() => h.modals.menu.onAction('attachment'))
      act(() => h.modals.media.onUpload('file1', 'audio'))
      expect(h.rows[0].col0).toEqual({ text: 'f', audio: 'file1' })
      expect(h.api.refreshCells)
        .toHaveBeenCalledWith({ rowNodes: [expect.objectContaining({ rowIndex: 0 })], force: true })
      await waitFor(() => expect(updateFact).toHaveBeenCalledWith('d1', 'f0', {
        entries: [{ text: 'f', audio: 'file1' }, { text: 'b' }],
      }))
    })

    it('ignores an upload for a fact not in the sheet', async () => {
      renderGrid()
      act(() => h.modals.media.onUpload('file1', 'audio'))
      rightClick()
      act(() => h.modals.menu.onAction('attachment'))
      act(() => h.modals.media.onUpload('file1', 'audio'))
      await settle()
      expect(updateFact).not.toHaveBeenCalled()
    })

    it('opens a fresh menu at the pointer for every right-click', () => {
      renderGrid()
      const mounts = h.menuMounts
      rightClick()
      rightClick({ event: { clientX: 300, clientY: 60 } })
      expect(h.menuMounts).toBe(mounts + 2)
      expect(h.modals.menu.position).toEqual({ x: 300, y: 60 })
    })

    it('refocuses the cell on close and ignores actions while closed', async () => {
      renderGrid()
      act(() => h.modals.menu.onClose())
      act(() => h.modals.menu.onAction('tag'))
      expect(h.api.setFocusedCell).not.toHaveBeenCalled()
      expect(h.modals.tags).toBeUndefined()
      rightClick()
      act(() => h.modals.menu.onClose())
      expect(h.modals.menu.position).toBeNull()
      // Refocused a frame later, once a closing click would have focused its own cell.
      expect(h.api.setFocusedCell).toHaveBeenCalledTimes(1)
      await waitFor(() => expect(h.api.setFocusedCell).toHaveBeenCalledTimes(2))
      expect(h.api.setFocusedCell).toHaveBeenLastCalledWith(3, 'Front')
    })

    it('leaves focus to the dialog a menu item opens', async () => {
      renderGrid()
      rightClick()
      act(() => h.modals.menu.onAction('tag'))
      act(() => h.modals.menu.onClose())
      await act(() => new Promise((r) => requestAnimationFrame(r)))
      await act(() => new Promise((r) => requestAnimationFrame(r)))
      // Only the right-click focused the cell: the dialog has the focus.
      expect(h.api.setFocusedCell).toHaveBeenCalledTimes(1)
      // A later menu closed without an action refocuses as usual.
      rightClick()
      act(() => h.modals.menu.onClose())
      await waitFor(() => expect(h.api.setFocusedCell).toHaveBeenCalledTimes(3))
    })

    it('refocuses the cell when focus is still on it', async () => {
      renderGrid()
      rightClick()
      h.api.getFocusedCell.mockReturnValue({ rowIndex: 3, column: { getColId: () => 'Front' } })
      act(() => h.modals.menu.onClose())
      await waitFor(() => expect(h.api.setFocusedCell).toHaveBeenCalledTimes(2))
    })

    it('leaves focus on another cell chosen by the click that closed the menu', async () => {
      renderGrid()
      rightClick()
      h.api.getFocusedCell.mockReturnValueOnce({ rowIndex: 5, column: { getColId: () => 'Front' } })
        .mockReturnValueOnce({ rowIndex: 3, column: { getColId: () => 'Back' } })
      act(() => h.modals.menu.onClose())
      rightClick()
      act(() => h.modals.menu.onClose())
      await act(() => new Promise((r) => requestAnimationFrame(r)))
      await act(() => new Promise((r) => requestAnimationFrame(r)))
      // Only the two right-clicks focused a cell.
      expect(h.api.setFocusedCell).toHaveBeenCalledTimes(2)
    })
  })
})
