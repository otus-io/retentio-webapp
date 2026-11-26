import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { forwardRef, useImperativeHandle } from 'react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ColDef, IGetRowsParams } from 'ag-grid-community'
import { getFactsPage, updateFact } from '@/api/facts'
import { updateDeck } from '@/api/decks'
import { clearFactsBlocks } from '@/components/facts/factsBlockCache'
import { rawSymbol } from '@/components/facts/token'
import type { Deck } from '@/modules/decks/decks.schema'
import type { Fact } from '@/modules/facts/facts.schema'

const h = vi.hoisted(() => ({
  gridProps: {} as Record<string, any>,
  nodes: [] as { data?: Record<string | symbol, any>; setData: (d: unknown) => void; rowIndex?: number }[],
  liveDefs: null as ColDef[] | null,
  api: {
    getColumnDefs: () => h.liveDefs ?? h.gridProps.columnDefs,
    setGridOption: (key: string, value: ColDef[]) => {
      if (key === 'columnDefs') h.liveDefs = value
    },
    forEachNode: (cb: (node: unknown) => void) => h.nodes.forEach(cb),
    getRowNode: () => undefined,
    ensureIndexVisible: vi.fn(),
    setFocusedCell: vi.fn(),
    startEditingCell: vi.fn(),
    getDisplayedRowAtIndex: vi.fn((): { data?: unknown } | undefined => undefined),
    getLastDisplayedRowIndex: vi.fn(() => 0),
  },
  capture: (props: Record<string, any>) => {
    h.gridProps = props
  },
  modals: {} as Record<string, Record<string, any>>,
  captureModal: (name: string, props: Record<string, any>) => {
    h.modals[name] = props
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
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
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
vi.mock('@/components/common/DeleteModal', () => modalMock('delete'))
vi.mock('@/components/facts/FactsCellContextMenu', () => modalMock('menu'))

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

function renderGrid(total = 250) {
  return render(<FactsGridPage deck={deck} facts={[fact('f0')]} total={total} />)
}

function getRows(startRow: number, endRow = startRow + 100) {
  const params = { startRow, endRow, successCallback: vi.fn(), failCallback: vi.fn() }
  act(() => h.gridProps.datasource.getRows(params as unknown as IGetRowsParams))
  return params
}

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

function scrollEnd(lastRow: number, direction = 'vertical') {
  h.api.getLastDisplayedRowIndex.mockReturnValue(lastRow)
  act(() => h.gridProps.onBodyScrollEnd({ direction, api: h.api }))
}

describe('FactsGridPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.api.getDisplayedRowAtIndex.mockReset()
    vi.mocked(addFactAction).mockReset()
    vi.mocked(sendToAuthor).mockReset()
    h.nodes = []
    h.liveDefs = null
    h.modals = {}
    clearFactsBlocks('d1')
    vi.mocked(getFactsPage).mockImplementation(async (_d, p) => ({
      data: { facts: [fact(`f${p?.offset}`)] },
      meta: { msg: 'ok', count: 1, has_more: false, limit: 100, offset: p?.offset ?? 0, total: 260 },
    }))
  })

  it('configures the infinite row model with 100-row blocks', () => {
    renderGrid()
    expect(h.gridProps).toMatchObject({
      rowModelType: 'infinite',
      cacheBlockSize: 100,
      maxBlocksInCache: 20,
      blockLoadDebounceMillis: 150,
      scrollbarWidth: 14,
    })
    // 250 facts round up to 300 rows.
    expect(h.gridProps.datasource.rowCount).toBe(300)
    expect(screen.getByText('common.all')).toBeDefined()
  })

  it('serves the first block from the server render without fetching', async () => {
    renderGrid()
    const params = getRows(0)
    await waitFor(() => expect(params.successCallback).toHaveBeenCalled())
    expect(getFactsPage).not.toHaveBeenCalled()
    const [rows, total] = params.successCallback.mock.calls[0]
    expect(total).toBe(300)
    expect(rows).toHaveLength(100)
    expect(rows[1]).toEqual({ id: 'empty-1' })
    expect(rows[0]).toMatchObject({ id: 'f0', Front: { text: 'f' }, Back: { text: 'b' } })
    expect(rows[0][rawSymbol]).toEqual(fact('f0'))
  })

  it('fetches later blocks by offset and reports failures to the grid', async () => {
    renderGrid()
    const ok = getRows(200)
    await waitFor(() => expect(ok.successCallback).toHaveBeenCalled())
    expect(getFactsPage).toHaveBeenCalledWith('d1', { limit: 100, offset: 200, sort: 'created_at' })
    expect(ok.successCallback.mock.calls[0][1]).toBe(300)
    expect(ok.successCallback.mock.calls[0][0]).toHaveLength(100)

    vi.mocked(getFactsPage).mockRejectedValueOnce(new Error('offline'))
    const failed = getRows(100)
    await waitFor(() => expect(failed.failCallback).toHaveBeenCalled())
  })

  it('maps entries by deck fields before the grid has columns', async () => {
    renderGrid()
    h.liveDefs = []
    const params = getRows(0)
    await waitFor(() => expect(params.successCallback).toHaveBeenCalled())
    expect(params.successCallback.mock.calls[0][0][0]).toMatchObject({ Front: { text: 'f' }, Back: { text: 'b' } })
  })

  it('maps entries by position of the live field columns', async () => {
    renderGrid()
    h.liveDefs = [{ context: { uid: 'a' } }, { field: 'Renamed', context: { uid: 'b' } }]
    const params = getRows(0)
    await waitFor(() => expect(params.successCallback).toHaveBeenCalled())
    const row = params.successCallback.mock.calls[0][0][0]
    expect(row.Renamed).toEqual({ text: 'b' })
    expect(row.Front).toBeUndefined()
  })

  it('numbers rows from their index', () => {
    renderGrid()
    const rowNumber = h.gridProps.columnDefs[0]
    expect(rowNumber.headerName).toBe('term.id')
    expect(rowNumber.valueGetter({ node: { rowIndex: 4 } })).toBe(5)
    expect(rowNumber.valueGetter({ node: null })).toBe(1)
  })

  it('prefetches the next block only after scrolling down near the block end', () => {
    renderGrid()
    scrollEnd(80, 'horizontal')
    scrollEnd(40)
    expect(getFactsPage).not.toHaveBeenCalled()
    scrollEnd(80)
    expect(getFactsPage).toHaveBeenCalledWith('d1', { limit: 100, offset: 100, sort: 'created_at' })
    scrollEnd(75)
    expect(getFactsPage).toHaveBeenCalledTimes(1)
  })

  it('saves loaded edited rows, skips loading rows and clears cached blocks', async () => {
    renderGrid()
    const cached = getRows(100)
    await waitFor(() => expect(cached.successCallback).toHaveBeenCalled())
    const row = { id: 'f1', Front: { text: 'new' }, Back: { text: 'b' }, [rawSymbol]: fact('f1') }
    h.nodes = [
      { data: undefined, setData: vi.fn() },
      { data: { id: 'empty-7', Front: { text: 'typed' } }, setData: vi.fn() },
      { data: row, setData: vi.fn() },
    ]
    act(() => { h.gridProps.onCellValueChanged() })
    await waitFor(() => expect(updateFact).toHaveBeenCalledWith('d1', 'f1', {
      entries: [{ text: 'new' }, { text: 'b' }],
    }))
    await waitFor(() => expect(row[rawSymbol].entries[0]).toEqual({ text: 'new' }))
    expect(updateFact).toHaveBeenCalledTimes(1)
    getRows(100)
    await waitFor(() => expect(getFactsPage).toHaveBeenCalledTimes(2))
  })

  it('saves deck fields on sync without touching rows and clears cached blocks', async () => {
    renderGrid()
    const setData = vi.fn()
    h.nodes = [{ data: { id: 'f1', Front: { text: 'f' }, Back: { text: 'b' }, [rawSymbol]: fact('f1') }, setData }]
    fireEvent.click(document.getElementById('facts-grid-sync-button')!)
    await waitFor(() => expect(updateDeck).toHaveBeenCalledWith('d1', expect.objectContaining({
      fields: ['Front', 'Back'],
    })))
    expect(setData).not.toHaveBeenCalled()
    expect(updateFact).not.toHaveBeenCalled()
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

  it('shows 100 empty rows for an empty deck', async () => {
    render(<FactsGridPage deck={deck} facts={[]} total={0} />)
    expect(h.gridProps.datasource.rowCount).toBe(100)
    const params = getRows(0)
    await waitFor(() => expect(params.successCallback).toHaveBeenCalled())
    const [rows, rowCount] = params.successCallback.mock.calls[0]
    expect(rowCount).toBe(100)
    expect(rows).toHaveLength(100)
    expect(rows.every((r: Record<string, unknown>) => String(r.id).startsWith('empty-'))).toBe(true)
  })

  it('never fills past the padded row count', async () => {
    renderGrid()
    const params = getRows(200, 400)
    await waitFor(() => expect(params.successCallback).toHaveBeenCalled())
    expect(params.successCallback.mock.calls[0][0]).toHaveLength(100)
  })

  it('lets fact rows and the first empty row be edited', () => {
    renderGrid()
    const { editable } = h.gridProps.columnDefs[1]
    expect(editable({ data: { id: 'f1', [rawSymbol]: fact('f1') }, node: { rowIndex: 3 } })).toBe(true)
    expect(editable({ data: { id: 'empty-250' }, node: { rowIndex: 250 } })).toBe(true)
    expect(editable({ data: { id: 'empty-251' }, node: { rowIndex: 251 } })).toBe(false)
    expect(editable({ data: { id: 'empty-250', adding: true }, node: { rowIndex: 250 } })).toBe(false)
    expect(editable({ data: undefined, node: { rowIndex: 250 } })).toBe(false)
  })

  describe('add fact button', () => {
    const press = () => act(() => {
      fireEvent.click(document.getElementById('facts-grid-create-row')!)
    })

    it('jumps to the first empty row and opens it for typing without creating a fact', () => {
      renderGrid()
      h.api.getDisplayedRowAtIndex.mockReturnValue({ data: { id: 'empty-250' } })
      press()
      expect(h.api.ensureIndexVisible).toHaveBeenCalledWith(250, 'bottom')
      expect(h.api.getDisplayedRowAtIndex).toHaveBeenCalledWith(250)
      expect(h.api.setFocusedCell).toHaveBeenCalledWith(250, 'Front')
      expect(h.api.startEditingCell).toHaveBeenCalledWith({ rowIndex: 250, colKey: 'Front' })
      expect(addFactAction).not.toHaveBeenCalled()
    })

    it('opens the row once its block loads when it is not loaded yet', async () => {
      renderGrid()
      press()
      expect(h.api.startEditingCell).not.toHaveBeenCalled()
      const other = getRows(0)
      await waitFor(() => expect(other.successCallback).toHaveBeenCalled())
      expect(h.api.startEditingCell).not.toHaveBeenCalled()
      const params = getRows(200)
      await waitFor(() => expect(h.api.startEditingCell).toHaveBeenCalledWith({ rowIndex: 250, colKey: 'Front' }))
      expect(params.successCallback).toHaveBeenCalled()
      // Opened once only.
      const again = getRows(200)
      await waitFor(() => expect(again.successCallback).toHaveBeenCalled())
      expect(h.api.startEditingCell).toHaveBeenCalledTimes(1)
    })

    it('follows the latest total from loaded blocks', async () => {
      renderGrid()
      const params = getRows(100)
      await waitFor(() => expect(params.successCallback).toHaveBeenCalled())
      press()
      expect(h.api.ensureIndexVisible).toHaveBeenCalledWith(260, 'bottom')
    })

    it('does nothing without field columns', () => {
      renderGrid()
      h.liveDefs = []
      h.api.getDisplayedRowAtIndex.mockReturnValue({ data: { id: 'empty-250' } })
      press()
      expect(h.api.startEditingCell).not.toHaveBeenCalled()
    })
  })

  describe('typing in the first empty row', () => {
    const typed = (data: Record<string, any> = { id: 'empty-250', Front: { text: 'new' } }) => {
      const node = { data, setData: vi.fn(), rowIndex: 250 }
      h.nodes = [node, { data: { id: 'empty-251', Front: { text: 'x' } }, setData: vi.fn(), rowIndex: 251 }]
      act(() => { h.gridProps.onCellValueChanged() })
      return node
    }

    it('creates the fact once, then jumps to the next empty row after the refresh', async () => {
      vi.mocked(addFactAction).mockResolvedValue({ success: true, data: { newFactIds: [] } })
      const { rerender } = renderGrid()
      const node = typed()
      await waitFor(() => expect(addFactAction).toHaveBeenCalledWith('d1', [{ text: 'new' }, { text: '' }], false, false))
      expect(node.data.adding).toBe(true)
      expect(updateFact).not.toHaveBeenCalled()
      expect(sendToAuthor).not.toHaveBeenCalled()
      // A second edit before the refresh does not create it again.
      act(() => { h.gridProps.onCellValueChanged() })
      await act(() => new Promise((r) => setTimeout(r, 150)))
      expect(addFactAction).toHaveBeenCalledTimes(1)
      rerender(<FactsGridPage deck={deck} facts={[fact('f0'), fact('f1')]} total={251} />)
      expect(h.api.ensureIndexVisible).toHaveBeenCalledWith(251, 'bottom')
      rerender(<FactsGridPage deck={deck} facts={[fact('f0')]} total={250} />)
      expect(h.api.ensureIndexVisible).toHaveBeenCalledTimes(1)
    })

    it('ignores the row while it has no text', async () => {
      renderGrid()
      typed({ id: 'empty-250', Front: { text: '' } })
      await act(() => new Promise((r) => setTimeout(r, 150)))
      expect(addFactAction).not.toHaveBeenCalled()
    })

    it('unlocks the row and reports a failed create', async () => {
      vi.mocked(addFactAction).mockResolvedValueOnce({ success: false, error: 'boom' })
      const { rerender } = renderGrid()
      const node = typed()
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('boom'))
      expect(node.data.adding).toBe(false)
      rerender(<FactsGridPage deck={deck} facts={[fact('f0'), fact('f1')]} total={251} />)
      expect(h.api.ensureIndexVisible).not.toHaveBeenCalled()
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
        expect(addFactAction).toHaveBeenCalledWith('d1', [{ text: 'new' }, { text: '' }], false, true)
        await act(() => new Promise((r) => setTimeout(r, 0)))
        expect(showSuccessToast).not.toHaveBeenCalled()
        expect(showFailToast).not.toHaveBeenCalled()
        vi.mocked(sendToAuthor).mockResolvedValueOnce({ sent: 0, unsent: 1 })
        typed()
        await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('auto-send.fact-added-unsent'))
      })

      it('quietly sends cell edits to the author, warning only when they are not sent', async () => {
        vi.mocked(sendFactEdits).mockResolvedValueOnce({ sent: 1, unsent: 0 })
        renderImported()
        const row = { id: 'f1', Front: { text: 'new' }, Back: { text: 'b' }, [rawSymbol]: fact('f1') }
        h.nodes = [{ data: row, setData: vi.fn() }]
        act(() => { h.gridProps.onCellValueChanged() })
        await waitFor(() => expect(sendFactEdits)
          .toHaveBeenCalledWith('d1', [{ factId: 'f1', entries: [{ text: 'new' }, { text: 'b' }] }]))
        await act(() => new Promise((r) => setTimeout(r, 0)))
        expect(showSuccessToast).not.toHaveBeenCalled()
        expect(showFailToast).not.toHaveBeenCalled()
        vi.mocked(sendFactEdits).mockResolvedValueOnce({ sent: 0, unsent: 1 })
        row.Front = { text: 'newer' }
        act(() => { h.gridProps.onCellValueChanged() })
        await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('auto-send.unsent'))
      })

      it('marks edits to facts the importer added as local', async () => {
        vi.mocked(sendFactEdits).mockResolvedValueOnce({ sent: 1, unsent: 0 })
        renderImported()
        const row = { id: 'n1', Front: { text: 'new' }, Back: { text: 'b' }, [rawSymbol]: { ...fact('n1'), local: true } }
        h.nodes = [{ data: row, setData: vi.fn() }]
        act(() => { h.gridProps.onCellValueChanged() })
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
      expect(h.gridProps.columnDefs.map((d: ColDef) => d.field ?? d.colId)).toEqual(['rowNumber', 'Front', 'Back'])
      expect(h.gridProps.columnDefs.some((d: ColDef) => d.cellRenderer || d.pinned === 'right')).toBe(false)
    })

    it('opens at the pointer on a field cell and focuses that cell', () => {
      renderGrid()
      expect(h.modals.menu.position).toBeNull()
      rightClick()
      expect(h.api.setFocusedCell).toHaveBeenCalledWith(3, 'Front')
      expect(h.modals.menu.position).toEqual({ x: 40, y: 60 })
    })

    it('ignores the row-number column, loading rows and missing pointer events', () => {
      renderGrid()
      rightClick({ colDef: h.gridProps.columnDefs[0] })
      rightClick({ data: undefined })
      rightClick({ event: null })
      rightClick({ rowIndex: null })
      expect(h.modals.menu.position).toBeNull()
      expect(h.api.setFocusedCell).not.toHaveBeenCalled()
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

    it('keeps focus on the same cell once the data refreshes after a delete', async () => {
      vi.mocked(deleteFactAction).mockResolvedValueOnce({ success: true })
      const { rerender } = renderGrid()
      rightClick()
      act(() => h.modals.menu.onAction('delete'))
      h.api.setFocusedCell.mockClear()
      await act(() => h.modals.delete.action(null, new FormData()))
      rerender(<FactsGridPage deck={deck} facts={[fact('f0')]} total={249} />)
      expect(h.api.ensureIndexVisible).toHaveBeenCalledWith(3)
      expect(h.api.setFocusedCell).toHaveBeenCalledWith(3, 'Front')
      rerender(<FactsGridPage deck={deck} facts={[fact('f0')]} total={248} />)
      expect(h.api.setFocusedCell).toHaveBeenCalledTimes(1)
    })

    it('does not move focus when the delete fails', async () => {
      vi.mocked(deleteFactAction).mockResolvedValueOnce({ success: false, error: 'boom' })
      const { rerender } = renderGrid()
      rightClick()
      act(() => h.modals.menu.onAction('delete'))
      h.api.setFocusedCell.mockClear()
      await act(() => h.modals.delete.action(null, new FormData()))
      rerender(<FactsGridPage deck={deck} facts={[fact('f0')]} total={249} />)
      expect(h.api.setFocusedCell).not.toHaveBeenCalled()
    })

    it('refocuses the cell on close and ignores actions while closed', () => {
      renderGrid()
      act(() => h.modals.menu.onClose())
      act(() => h.modals.menu.onAction('tag'))
      expect(h.api.setFocusedCell).not.toHaveBeenCalled()
      expect(h.modals.tags).toBeUndefined()
      rightClick()
      act(() => h.modals.menu.onClose())
      expect(h.api.setFocusedCell).toHaveBeenCalledTimes(2)
      expect(h.modals.menu.position).toBeNull()
    })
  })
})
