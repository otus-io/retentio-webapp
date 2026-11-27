import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getFactsPage, updateFact } from '@/api/facts'
import { updateDeck } from '@/api/decks'
import type { Deck } from '@/modules/decks/decks.schema'
import type { Fact } from '@/modules/facts/facts.schema'

const h = vi.hoisted(() => ({
  props: {} as Record<string, any>,
  // The sheet as the page left it: each row's texts and whether it takes typing.
  sheet: [] as string[][],
  readOnly: [] as boolean[],
  api: {
    setRow: vi.fn((y: number, texts: string[], readOnly = false) => {
      h.sheet[y] = texts
      h.readOnly[y] = readOnly
    }),
    // Like the sheet, reports the rows it adds.
    appendRows: vi.fn((count: number) => {
      const at = h.sheet.length
      h.sheet.push(...Array.from({ length: count }, () => h.props.headers.map(() => '')))
      h.readOnly.push(...Array.from({ length: count }, () => false))
      h.props.onRowsInsert(at, count)
    }),
    deleteRow: vi.fn((y: number) => {
      h.sheet.splice(y, 1)
      h.readOnly.splice(y, 1)
    }),
    setHeader: vi.fn(),
    scrollToRow: vi.fn(),
    focusCell: vi.fn(),
    selectedRange: vi.fn((): { x1: number; y1: number; x2: number; y2: number } | null => null),
    focusSheet: vi.fn(),
    isEditing: vi.fn(() => false),
    shiftSelection: vi.fn(),
    selectedRows: vi.fn((): number[] => []),
    markRows: vi.fn(),
    copySelection: vi.fn(),
    pasteAtSelection: vi.fn(),
    firstVisibleRow: vi.fn(() => 0),
  },
  mounts: 0,
  // Stable like next-intl's memoized translator.
  t: (key: string) => key,
  modals: {} as Record<string, Record<string, any>>,
  captureModal: (name: string, props: Record<string, any>) => {
    h.modals[name] = props
  },
  menuMounts: 0,
  deleteMounts: 0,
}))

vi.mock('@/components/facts/FactsSpreadsheet', async () => {
  const { useEffect } = await import('react')
  return {
    default: function Sheet(props: Record<string, any>) {
      h.props = props
      useEffect(() => {
        h.mounts += 1
        h.sheet = props.rows.map((row: string[]) => [...row])
        h.readOnly = props.rows.map((_: unknown, y: number) => props.readOnlyRows.includes(y))
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])
      return null
    },
  }
})
vi.mock('next-intl', () => ({ useTranslations: () => h.t }))
vi.mock('@/api/facts', () => ({ getFactsPage: vi.fn(), updateFact: vi.fn() }))
vi.mock('@/api/decks', () => ({ updateDeck: vi.fn() }))
vi.mock('@/modules/facts/facts.action', () => ({ addFactsAction: vi.fn(), deleteFactAction: vi.fn() }))
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
import { addFactsAction, deleteFactAction } from '@/modules/facts/facts.action'
import { sendFactEdits, sendToAuthor } from '@/modules/contributions/auto-send'
import { showFailToast, showSuccessToast } from '@/lib/ui'

const deck = { id: 'd1', name: 'Deck', fields: ['Front', 'Back'] } as Deck
const fact = (id: string, front = id, back = 'b'): Fact => ({
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

function renderGrid(total = 250, d: Deck = deck, facts = [fact('f0')]) {
  return render(<FactsGridPage deck={d} facts={facts} total={total} />)
}

const ready = () => act(() => h.props.onReady(h.api))
const settle = () => act(() => new Promise((r) => setTimeout(r, 150)))
const allLoaded = () => h.sheet.slice(0, serverTotal).every((row, y) => row[0] === `f${y}` && !h.readOnly[y])

/** Types into a cell; like the sheet, a value typed into the last row adds a spare row below it. */
function edit(y: number, x: number, value: string) {
  act(() => {
    h.sheet[y][x] = value
    if (value && y === h.sheet.length - 1) {
      h.sheet.push(['', ''])
      h.readOnly.push(false)
      h.props.onRowsInsert(y + 1, 1)
    }
    h.props.onCellsChange([{ x, y, value }])
  })
}

/** Pastes lines of cells at a row, adding the rows it runs past (and a spare row) as the sheet does. */
function paste(y: number, lines: string[][]) {
  act(() => {
    const extra = y + lines.length + 1 - h.sheet.length
    if (extra > 0) {
      const at = h.sheet.length
      h.sheet.push(...Array.from({ length: extra }, () => ['', '']))
      h.readOnly.push(...Array.from({ length: extra }, () => false))
      h.props.onRowsInsert(at, extra)
    }
    const changes = lines.flatMap((cells, j) => cells.map((value, x) => {
      h.sheet[y + j][x] = value
      return { x, y: y + j, value }
    }))
    h.props.onCellsChange(changes)
  })
}

function rightClick(y = 0, x: number | null = 0, at = { clientX: 40, clientY: 60 }) {
  act(() => h.props.onCellContextMenu({ x, y, ...at }))
}

describe('FactsGridPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.api.firstVisibleRow.mockReturnValue(0)
    h.api.selectedRange.mockReturnValue(null)
    h.api.isEditing.mockReturnValue(false)
    h.api.selectedRows.mockReturnValue([])
    vi.mocked(addFactsAction).mockReset()
    vi.mocked(sendToAuthor).mockReset()
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

  it('starts the sheet with the facts, read-only rows for facts not downloaded yet, then one empty row', () => {
    renderGrid()
    expect(h.props.headers).toEqual(['Front', 'Back'])
    expect(h.sheet).toHaveLength(251)
    expect(h.sheet[0]).toEqual(['f0', 'b'])
    expect(h.sheet[1]).toEqual(['', ''])
    expect(h.readOnly.slice(1, 250).every(Boolean)).toBe(true)
    expect(h.readOnly[0]).toBe(false)
    expect(h.readOnly[250]).toBe(false)
    expect(screen.getByText('common.all')).toBeDefined()
  })

  describe('empty rows below the last fact', () => {
    const fit = (rows: number) => act(() => h.props.onVisibleRowsChange(rows))

    it('fill the screen, so scrolled to the end the last three facts sit at the top', () => {
      renderGrid(10)
      fit(20)
      // Measured before the sheet is ready: applied once it is.
      expect(h.sheet).toHaveLength(11)
      ready()
      expect(h.sheet).toHaveLength(27)
      expect(h.api.appendRows).toHaveBeenCalledWith(16)
      fit(30)
      expect(h.sheet).toHaveLength(37)
      // A shorter screen drops the empty rows past it.
      fit(5)
      expect(h.sheet).toHaveLength(12)
      // Never fewer than one.
      fit(0)
      expect(h.sheet).toHaveLength(11)
    })

    it('follow the facts added and deleted', async () => {
      vi.mocked(addFactsAction).mockResolvedValueOnce({ success: true, data: { newFactIds: ['n1', 'n2'] } })
      vi.mocked(deleteFactAction).mockResolvedValue({ success: true })
      serverTotal = 10
      renderGrid(10)
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      fit(10)
      expect(h.sheet).toHaveLength(17)
      paste(10, [['a', ''], ['b', '']])
      await waitFor(() => expect(h.sheet).toHaveLength(19))
      act(() => h.props.onRowsDelete([0, 1]))
      await act(() => h.modals.delete.action(null, new FormData()))
      expect(h.sheet).toHaveLength(17)
    })

    it('are not dropped under an open editor, only once it closes', () => {
      renderGrid(10)
      ready()
      act(() => h.props.onVisibleRowsChange(20))
      h.api.isEditing.mockReturnValue(true)
      act(() => h.props.onVisibleRowsChange(5))
      expect(h.sheet).toHaveLength(27)
      h.api.isEditing.mockReturnValue(false)
      act(() => h.props.onEditEnd())
      expect(h.sheet).toHaveLength(12)
    })

    it('below a gap become facts only once an open editor closes', async () => {
      vi.mocked(addFactsAction).mockResolvedValue({ success: true, data: { newFactIds: ['n1'] } })
      renderGrid(1)
      ready()
      act(() => h.props.onVisibleRowsChange(10))
      h.api.isEditing.mockReturnValue(true)
      edit(3, 0, 'later')
      await settle()
      expect(addFactsAction).not.toHaveBeenCalled()
      expect(h.sheet[3]).toEqual(['later', ''])
      // Without a gap, an open editor does not hold it.
      h.api.isEditing.mockReturnValue(false)
      act(() => h.props.onEditEnd())
      await waitFor(() => expect(addFactsAction).toHaveBeenCalledTimes(1))
      expect(h.sheet[1]).toEqual(['later', ''])
      h.api.isEditing.mockReturnValue(true)
      edit(2, 0, 'next')
      await waitFor(() => expect(addFactsAction).toHaveBeenCalledTimes(2))
      // Nothing waiting: closing an editor sends nothing.
      act(() => h.props.onEditEnd())
      await settle()
      expect(addFactsAction).toHaveBeenCalledTimes(2)
    })

    it('keep the selection on its row as gaps above it close, and refill even when the create fails', async () => {
      vi.mocked(addFactsAction).mockResolvedValueOnce({ success: false })
      renderGrid(1)
      ready()
      act(() => h.props.onVisibleRowsChange(10))
      // Typed in row 4 (rows 1-3 empty), then moved down to row 5.
      h.api.selectedRange.mockReturnValue({ x1: 0, y1: 5, x2: 0, y2: 5 })
      edit(4, 0, 'gap')
      await waitFor(() => expect(addFactsAction).toHaveBeenCalled())
      expect(h.api.shiftSelection).toHaveBeenCalledWith(-3)
      expect(h.sheet[1]).toEqual(['gap', ''])
      expect(h.sheet).toHaveLength(10)
    })

    it('leave the selection alone when no gap above it closes', async () => {
      vi.mocked(addFactsAction).mockResolvedValueOnce({ success: true, data: { newFactIds: ['n1'] } })
      renderGrid(1)
      ready()
      act(() => h.props.onVisibleRowsChange(10))
      h.api.selectedRange.mockReturnValue({ x1: 0, y1: 1, x2: 0, y2: 1 })
      edit(5, 0, 'gap')
      await waitFor(() => expect(addFactsAction).toHaveBeenCalled())
      expect(h.api.shiftSelection).not.toHaveBeenCalled()
    })

    it('keep rows with text not saved yet', async () => {
      vi.mocked(addFactsAction).mockResolvedValueOnce({ success: false })
      renderGrid(1)
      ready()
      fit(10)
      edit(7, 0, 'typed')
      await waitFor(() => expect(addFactsAction).toHaveBeenCalled())
      // The gap above it was closed before creating it.
      expect(h.sheet[1]).toEqual(['typed', ''])
      fit(1)
      expect(h.sheet).toEqual([['f0', 'b'], ['typed', ''], ['', '']])
    })
  })

  it('shows blank entries for a fact without them', () => {
    renderGrid(1, deck, [{ ...fact('f0'), entries: [{ text: 'only' }] }])
    expect(h.sheet[0]).toEqual(['only', ''])
  })

  it('starts an empty deck with just the empty row', () => {
    renderGrid(0, deck, [])
    expect(h.sheet).toEqual([['', '']])
  })

  describe('background download', () => {
    it('downloads the rest in pages once the sheet is ready', async () => {
      renderGrid()
      expect(getFactsPage).not.toHaveBeenCalled()
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      expect(vi.mocked(getFactsPage).mock.calls.map((c) => c[1])).toEqual([
        { limit: 200, offset: 1, sort: 'created_at' },
        { limit: 200, offset: 201, sort: 'created_at' },
      ])
      expect(h.sheet[249]).toEqual(['f249', 'b'])
    })

    it('starts nearest the rows on screen', async () => {
      h.api.firstVisibleRow.mockReturnValue(220)
      renderGrid()
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      expect(vi.mocked(getFactsPage).mock.calls[0][1]).toMatchObject({ offset: 21 })
    })

    it('keeps rows lined up with their columns after a column is renamed elsewhere', async () => {
      const { rerender } = renderGrid()
      ready()
      // The server re-sends the deck with the renamed field after an add or delete.
      rerender(<FactsGridPage deck={{ ...deck, fields: ['Word', 'Back'] }} facts={[fact('f0')]} total={250} />)
      expect(h.api.setHeader).toHaveBeenCalledWith(0, 'Word')
      expect(h.api.setHeader).toHaveBeenCalledTimes(1)
      await waitFor(() => expect(allLoaded()).toBe(true))
      // Saving reads entries by column, not by header name.
      edit(0, 1, 'back!')
      await waitFor(() => expect(updateFact).toHaveBeenCalledWith('d1', 'f0', {
        entries: [{ text: 'f0' }, { text: 'back!' }],
      }))
      // Already saved by whoever renamed it.
      expect(updateDeck).not.toHaveBeenCalled()
    })

    it('keeps the sheet when the server re-sends equal data', () => {
      const { rerender } = renderGrid()
      ready()
      const mounts = h.mounts
      const resent = { ...deck, fields: ['Front', 'Back'] }
      rerender(<FactsGridPage deck={resent} facts={[fact('f0'), fact('f1')]} total={251} />)
      expect(h.mounts).toBe(mounts)
      expect(h.api.setHeader).not.toHaveBeenCalled()
      expect(h.sheet).toHaveLength(251)
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

    it('shows rows the server no longer lists as blank and read-only, and stops asking for them', async () => {
      vi.mocked(getFactsPage).mockResolvedValue(page(0, 0))
      renderGrid()
      ready()
      await waitFor(() => expect(getFactsPage).toHaveBeenCalledTimes(1))
      await settle()
      expect(getFactsPage).toHaveBeenCalledTimes(1)
      expect(h.sheet[1]).toEqual(['', ''])
      expect(h.readOnly[1]).toBe(true)
      expect(showFailToast).toHaveBeenCalledWith('facts-grid.load-failed')
      // Nothing typed was lost.
      expect(showFailToast).not.toHaveBeenCalledWith('facts-grid.save-failed')
    })

    it('keeps loading the rows before a position the server no longer lists', async () => {
      // On screen at row 220: its page comes back empty, then the rows above it still load.
      h.api.firstVisibleRow.mockReturnValue(220)
      vi.mocked(getFactsPage).mockImplementation(async (_d, p) =>
        (p?.offset ?? 0) >= 21 ? page(0, 0) : page(p?.offset ?? 0, p?.limit ?? 0))
      renderGrid()
      ready()
      await waitFor(() => expect(h.sheet[20]).toEqual(['f20', 'b']))
      await settle()
      expect(h.sheet[21]).toEqual(['', ''])
      expect(h.readOnly[21]).toBe(true)
    })

    it('runs once more before giving up when asked again during a failing pass', async () => {
      vi.useFakeTimers()
      vi.mocked(addFactsAction).mockResolvedValue({ success: true, data: { newFactIds: ['n1'] } })
      vi.mocked(getFactsPage).mockRejectedValue(new Error('offline'))
      renderGrid()
      ready()
      await act(() => vi.advanceTimersByTimeAsync(2000))
      // An add asks the loader to run while the failing pass is still going.
      edit(250, 0, 'new')
      await act(() => vi.advanceTimersByTimeAsync(1000))
      vi.mocked(getFactsPage).mockImplementation(async (_d, p) => page(p?.offset ?? 0, p?.limit ?? 0))
      await act(() => vi.advanceTimersByTimeAsync(20000))
      expect(allLoaded()).toBe(true)
      expect(showFailToast).not.toHaveBeenCalledWith('facts-grid.load-failed')
    })

    it('gives up a failing pass only after the run asked for meanwhile', async () => {
      vi.useFakeTimers()
      vi.mocked(addFactsAction).mockResolvedValue({ success: true, data: { newFactIds: ['n1'] } })
      vi.mocked(getFactsPage).mockRejectedValue(new Error('offline'))
      renderGrid()
      ready()
      edit(250, 0, 'new')
      // Still failing when the pass would give up: it starts over once instead.
      await act(() => vi.advanceTimersByTimeAsync(9000))
      expect(getFactsPage).toHaveBeenCalledTimes(6)
      expect(showFailToast).not.toHaveBeenCalledWith('facts-grid.load-failed')
      await act(() => vi.advanceTimersByTimeAsync(20000))
      expect(showFailToast).toHaveBeenCalledWith('facts-grid.load-failed')
    })

    it('ignores facts the server lists past the rows it has', async () => {
      // Added elsewhere since the page was opened.
      serverTotal = 260
      renderGrid()
      ready()
      await waitFor(() => expect(getFactsPage).toHaveBeenCalledTimes(2))
      await settle()
      expect(h.sheet).toHaveLength(251)
      expect(h.sheet[249]).toEqual(['f249', 'b'])
      expect(h.sheet[250]).toEqual(['', ''])
    })

    it('requests no page while a delete is still on its way', async () => {
      let deleted!: (v: { success: boolean }) => void
      vi.mocked(deleteFactAction).mockReturnValueOnce(new Promise((r) => { deleted = r }))
      renderGrid()
      rightClick(0)
      act(() => h.modals.menu.onAction('delete'))
      const deleting = h.modals.delete.action(null, new FormData())
      ready()
      await settle()
      expect(getFactsPage).not.toHaveBeenCalled()
      serverTotal = 249
      serverFacts = Object.fromEntries(Array.from({ length: 249 }, (_, i) => [i, fact(`f${i}`)]))
      await act(async () => {
        deleted({ success: true })
        await deleting
      })
      // Asked for only once the rows have moved up.
      await waitFor(() => expect(allLoaded()).toBe(true))
      expect(vi.mocked(getFactsPage).mock.calls[0][1]).toMatchObject({ offset: 0 })
    })

    it('runs once at a time and stops when the page closes', async () => {
      let resolve!: (v: ReturnType<typeof page>) => void
      vi.mocked(getFactsPage).mockReturnValueOnce(new Promise((r) => { resolve = r }))
      const { unmount } = renderGrid()
      ready()
      ready()
      await waitFor(() => expect(getFactsPage).toHaveBeenCalledTimes(1))
      unmount()
      await act(async () => resolve(page(1, 200)))
      await settle()
      expect(getFactsPage).toHaveBeenCalledTimes(1)
    })

    it('stops between pages when the page closes', async () => {
      let resolve!: () => void
      vi.mocked(deleteFactAction).mockReturnValueOnce(new Promise((r) => { resolve = () => r({ success: false }) }))
      const { unmount } = renderGrid()
      rightClick(0)
      act(() => h.modals.menu.onAction('delete'))
      const deleting = h.modals.delete.action(null, new FormData())
      ready()
      unmount()
      await act(async () => {
        resolve()
        await deleting
      })
      await settle()
      expect(getFactsPage).not.toHaveBeenCalled()
    })

    it('drops a page requested before a delete shifted the rows', async () => {
      let resolve!: (v: ReturnType<typeof page>) => void
      vi.mocked(getFactsPage).mockReturnValueOnce(new Promise((r) => { resolve = r }))
      vi.mocked(deleteFactAction).mockResolvedValueOnce({ success: true })
      renderGrid()
      ready()
      rightClick(0)
      act(() => h.modals.menu.onAction('delete'))
      await act(() => h.modals.delete.action(null, new FormData()))
      serverTotal = 249
      serverFacts = Object.fromEntries(Array.from({ length: 249 }, (_, i) => [i, fact(`f${i}`)]))
      await act(async () => resolve(page(1, 200, 'stale')))
      await waitFor(() => expect(allLoaded()).toBe(true))
      expect(h.sheet.some((row) => row[0].startsWith('stale'))).toBe(false)
    })
  })

  it('puts back a fact left with every cell empty, and says how to delete instead', async () => {
    renderGrid(1, deck, [{ ...fact('f0'), entries: [{ text: 'f0' }, { text: 'b' }] }])
    ready()
    paste(0, [['', '']])
    await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('facts-grid.empty-fact'))
    expect(h.sheet[0]).toEqual(['f0', 'b'])
    expect(updateFact).not.toHaveBeenCalled()
    // A cell keeping its audio is not empty.
    renderGrid(1, deck, [{ ...fact('f9'), entries: [{ text: 'x', audio: 'a1' }, { text: 'b' }] }])
    ready()
    paste(0, [['', '']])
    await waitFor(() => expect(updateFact).toHaveBeenCalledWith('d1', 'f9', {
      entries: [{ text: '', audio: 'a1' }, { text: '' }],
    }))
  })

  it('saves only edited fact rows', async () => {
    renderGrid()
    edit(0, 0, 'new')
    // Columns past the fields change nothing.
    act(() => h.props.onCellsChange([{ x: 5, y: 0, value: 'x' }]))
    await waitFor(() => expect(updateFact).toHaveBeenCalledWith('d1', 'f0', {
      entries: [{ text: 'new' }, { text: 'b' }],
    }))
    expect(updateFact).toHaveBeenCalledTimes(1)
    expect(addFactsAction).not.toHaveBeenCalled()
    // Unchanged on the next save.
    edit(0, 0, 'new')
    await settle()
    expect(updateFact).toHaveBeenCalledTimes(1)
  })

  it('ignores changes reported for rows it does not have', async () => {
    renderGrid()
    act(() => h.props.onCellsChange([{ x: 0, y: 999, value: 'x' }]))
    await settle()
    expect(updateFact).not.toHaveBeenCalled()
  })

  it('does not save a fact whose blank trailing entries the server left out', async () => {
    renderGrid(1, deck, [{ ...fact('f0'), entries: [{ text: 'f0' }] }])
    edit(0, 1, '')
    await settle()
    expect(updateFact).not.toHaveBeenCalled()
  })

  it('saves attachment changes as well as text', async () => {
    renderGrid(1, deck, [{ ...fact('f0'), entries: [{ text: 'f0', image: 'i1' }, { text: 'b', video: 'v1' }] }])
    edit(0, 0, 'f0')
    await settle()
    expect(updateFact).not.toHaveBeenCalled()
  })

  it('reports a failed save and retries it with the next save', async () => {
    vi.mocked(updateFact).mockRejectedValueOnce(new Error('offline'))
    renderGrid()
    edit(0, 0, 'new')
    await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('facts-grid.save-failed'))
    // Not marked saved: the next save (here, an edit that changes nothing) sends it again.
    edit(250, 0, '')
    await waitFor(() => expect(updateFact).toHaveBeenCalledTimes(2))
    expect(updateFact).toHaveBeenLastCalledWith('d1', 'f0', { entries: [{ text: 'new' }, { text: 'b' }] })
  })

  it('runs saves one at a time, so a later edit never lands before an earlier one', async () => {
    let first!: () => void
    vi.mocked(updateFact).mockReturnValueOnce(new Promise((r) => { first = () => r(undefined as never) }))
    renderGrid()
    edit(0, 0, 'a')
    await waitFor(() => expect(updateFact).toHaveBeenCalledTimes(1))
    edit(0, 0, 'ab')
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
    edit(0, 0, 'new')
    await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('facts-grid.save-failed'))
    rightClick(0)
    act(() => h.modals.menu.onAction('delete'))
    await act(() => h.modals.delete.action(null, new FormData()))
    edit(249, 0, '')
    await settle()
    expect(updateFact).toHaveBeenCalledTimes(1)
  })

  it('does not retry a failed save of a fact deleted while it was being saved', async () => {
    let fail!: () => void
    vi.mocked(updateFact).mockReturnValueOnce(new Promise((_, reject) => { fail = () => reject(new Error('offline')) }))
    vi.mocked(deleteFactAction).mockResolvedValueOnce({ success: true })
    renderGrid()
    edit(0, 0, 'new')
    await waitFor(() => expect(updateFact).toHaveBeenCalledTimes(1))
    rightClick(0)
    act(() => h.modals.menu.onAction('delete'))
    await act(() => h.modals.delete.action(null, new FormData()))
    await act(async () => fail())
    await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('facts-grid.save-failed'))
    edit(249, 0, '')
    await settle()
    expect(updateFact).toHaveBeenCalledTimes(1)
  })

  it('drops edits to a fact deleted before they were saved', async () => {
    vi.mocked(deleteFactAction).mockResolvedValueOnce({ success: true })
    renderGrid()
    rightClick(0)
    act(() => h.modals.menu.onAction('delete'))
    edit(0, 0, 'new')
    await act(() => h.modals.delete.action(null, new FormData()))
    await settle()
    expect(updateFact).not.toHaveBeenCalled()
  })

  describe('renaming a column', () => {
    it('saves the renamed fields to the deck, and nothing else', async () => {
      renderGrid()
      act(() => h.props.onHeaderRename(0, 'Word'))
      await waitFor(() => expect(updateDeck).toHaveBeenCalledWith('d1', expect.objectContaining({
        fields: ['Word', 'Back'],
      })))
      expect(updateFact).not.toHaveBeenCalled()
      // Back to what is saved: nothing to send.
      act(() => h.props.onHeaderRename(0, 'Word'))
      await settle()
      expect(updateDeck).toHaveBeenCalledTimes(1)
    })

    it('reports a failed rename and retries it with the next rename', async () => {
      vi.mocked(updateDeck).mockRejectedValueOnce(new Error('offline'))
      renderGrid()
      act(() => h.props.onHeaderRename(0, 'Word'))
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('facts-grid.save-failed'))
      act(() => h.props.onHeaderRename(1, 'Meaning'))
      await waitFor(() => expect(updateDeck).toHaveBeenCalledTimes(2))
      expect(vi.mocked(updateDeck).mock.lastCall?.[1]).toMatchObject({ fields: ['Word', 'Meaning'] })
    })

    it('keeps a rename not saved yet when the server re-sends the old names', async () => {
      let saved!: () => void
      vi.mocked(updateDeck).mockReturnValueOnce(new Promise((r) => { saved = () => r(undefined as never) }))
      const { rerender } = renderGrid()
      ready()
      act(() => h.props.onHeaderRename(0, 'Word'))
      rerender(<FactsGridPage deck={{ ...deck, fields: ['Front', 'Back '] }} facts={[fact('f0')]} total={250} />)
      expect(h.api.setHeader).not.toHaveBeenCalled()
      await act(async () => saved())
      await waitFor(() => expect(updateDeck).toHaveBeenCalledWith('d1', expect.objectContaining({
        fields: ['Word', 'Back'],
      })))
    })

    it('saves renames one at a time, ending with the headers shown', async () => {
      let first!: () => void
      vi.mocked(updateDeck).mockReturnValueOnce(new Promise((r) => { first = () => r(undefined as never) }))
      renderGrid()
      act(() => h.props.onHeaderRename(0, 'A'))
      await waitFor(() => expect(updateDeck).toHaveBeenCalledTimes(1))
      // Renamed again while the first save is still on its way: it waits, then saves what is shown.
      act(() => h.props.onHeaderRename(0, 'B'))
      await settle()
      expect(updateDeck).toHaveBeenCalledTimes(1)
      await act(async () => first())
      await waitFor(() => expect(updateDeck).toHaveBeenCalledTimes(2))
      expect(vi.mocked(updateDeck).mock.lastCall?.[1]).toMatchObject({ fields: ['B', 'Back'] })
    })
  })

  describe('add fact button', () => {
    it('jumps to the end and selects the first empty row without creating a fact', () => {
      renderGrid()
      ready()
      act(() => {
        fireEvent.click(document.getElementById('facts-grid-create-row')!)
      })
      expect(h.api.scrollToRow).toHaveBeenCalledWith(247)
      expect(h.api.focusCell).toHaveBeenCalledWith(0, 250)
      expect(addFactsAction).not.toHaveBeenCalled()
    })

    it('does nothing before the sheet is ready', () => {
      renderGrid()
      act(() => {
        fireEvent.click(document.getElementById('facts-grid-create-row')!)
      })
      expect(h.api.focusCell).not.toHaveBeenCalled()
    })
  })

  describe('typing below the last fact', () => {
    it('creates the fact once; the row becomes the newest fact, and the view stays put', async () => {
      let created!: (v: Awaited<ReturnType<typeof addFactsAction>>) => void
      vi.mocked(addFactsAction).mockReturnValueOnce(new Promise((r) => { created = r }))
      renderGrid()
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      paste(250, [['f250', 'b']])
      await waitFor(() => expect(addFactsAction)
        .toHaveBeenCalledWith('d1', [[{ text: 'f250' }, { text: 'b' }]], false, false))
      // An edit while it is created does not create it again; it is saved once the fact is known.
      edit(250, 1, 'back')
      await settle()
      serverTotal = 251
      serverFacts[250] = fact('f250')
      await act(async () => created({ success: true, data: { newFactIds: [] } }))
      expect(h.api.scrollToRow).not.toHaveBeenCalled()
      // Read-only until the loader downloads the new fact for its id.
      expect(h.api.setRow).toHaveBeenCalledWith(250, ['f250', 'back'], true)
      await waitFor(() => expect(h.readOnly[250]).toBe(false))
      await waitFor(() => expect(updateFact)
        .toHaveBeenCalledWith('d1', 'f250', { entries: [{ text: 'f250' }, { text: 'back' }] }))
      expect(addFactsAction).toHaveBeenCalledTimes(1)
      expect(sendToAuthor).not.toHaveBeenCalled()
    })

    it('takes the new fact id from the create, and saves what was typed meanwhile', async () => {
      let created!: (v: Awaited<ReturnType<typeof addFactsAction>>) => void
      vi.mocked(addFactsAction).mockReturnValueOnce(new Promise((r) => { created = r }))
      renderGrid()
      ready()
      edit(250, 0, 'apple')
      await waitFor(() => expect(addFactsAction).toHaveBeenCalledTimes(1))
      edit(250, 1, 'ringo')
      await settle()
      await act(async () => created({ success: true, data: { newFactIds: ['n9'] } }))
      expect(h.readOnly[250]).toBe(false)
      await waitFor(() => expect(updateFact).toHaveBeenCalledWith('d1', 'n9', {
        entries: [{ text: 'apple' }, { text: 'ringo' }],
      }))
      expect(showFailToast).not.toHaveBeenCalled()
      // The new fact is a fact row: its menu acts on it.
      rightClick(250, 1)
      act(() => h.modals.menu.onAction('tag'))
      expect(h.modals.tags.fact).toMatchObject({ id: 'n9', fields: [], tags: [] })
      expect(h.modals.tags.fact.local).toBeUndefined()
    })

    it('creates a row typed below a new fact still being created once that one is done', async () => {
      let created!: (v: Awaited<ReturnType<typeof addFactsAction>>) => void
      vi.mocked(addFactsAction).mockReturnValueOnce(new Promise((r) => { created = r }))
        .mockResolvedValueOnce({ success: true, data: { newFactIds: ['n2'] } })
      renderGrid()
      ready()
      edit(250, 0, 'one')
      await waitFor(() => expect(addFactsAction).toHaveBeenCalledTimes(1))
      edit(251, 0, 'two')
      await settle()
      expect(addFactsAction).toHaveBeenCalledTimes(1)
      await act(async () => created({ success: true, data: { newFactIds: ['n1'] } }))
      await waitFor(() => expect(addFactsAction).toHaveBeenCalledTimes(2))
      expect(vi.mocked(addFactsAction).mock.lastCall?.[1]).toEqual([[{ text: 'two' }, { text: '' }]])
    })

    it('ignores rows while they have no text', async () => {
      renderGrid()
      edit(250, 0, '')
      await settle()
      expect(addFactsAction).not.toHaveBeenCalled()
    })

    it('never saves onto a different fact found where the new one was expected', async () => {
      vi.mocked(addFactsAction).mockResolvedValue({ success: true, data: { newFactIds: [] } })
      renderGrid()
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      serverTotal = 251
      // Another device's fact sits at that position.
      serverFacts[250] = fact('other', 'theirs', '')
      edit(250, 0, 'mine')
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('facts-grid.load-failed'))
      // Nothing was typed after creating it, so nothing is unsaved.
      expect(showFailToast).toHaveBeenCalledTimes(1)
      // Read-only from now on.
      expect(h.readOnly[250]).toBe(true)
      await settle()
      expect(updateFact).not.toHaveBeenCalled()
    })

    it('says typing is lost when a different fact is found, and compares the whole entries', async () => {
      let created!: (v: Awaited<ReturnType<typeof addFactsAction>>) => void
      vi.mocked(addFactsAction).mockReturnValueOnce(new Promise((r) => { created = r }))
      renderGrid()
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      paste(250, [['a', 'b']])
      await waitFor(() => expect(addFactsAction).toHaveBeenCalledTimes(1))
      edit(250, 1, 'b2')
      await settle()
      serverTotal = 251
      // Shorter than what was created.
      serverFacts[250] = { ...fact('short', 'a'), entries: [{ text: 'a' }] }
      await act(async () => created({ success: true, data: { newFactIds: [] } }))
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('facts-grid.save-failed'))
      expect(updateFact).not.toHaveBeenCalled()
    })

    it('treats a found fact with extra text as a different one', async () => {
      vi.mocked(addFactsAction).mockResolvedValue({ success: true, data: { newFactIds: [] } })
      renderGrid(1, { ...deck, fields: ['Front', 'Back', 'Notes'] }, [fact('f0')])
      ready()
      serverTotal = 2
      serverFacts[1] = { ...fact('x', 'a', ''), entries: [{ text: 'a' }, { audio: 'x1' }, { text: 'extra' }] }
      act(() => {
        h.sheet[1] = ['a', '', '']
        h.props.onCellsChange([{ x: 0, y: 1, value: 'a' }])
      })
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('facts-grid.load-failed'))
    })

    it('keeps a new row pending after network errors, and finds it with the next add', async () => {
      vi.useFakeTimers()
      vi.mocked(addFactsAction).mockResolvedValueOnce({ success: true, data: { newFactIds: [] } })
        .mockResolvedValueOnce({ success: true, data: { newFactIds: ['n2'] } })
      vi.mocked(getFactsPage).mockRejectedValue(new Error('offline'))
      renderGrid(1)
      ready()
      edit(1, 0, 'new')
      await act(() => vi.advanceTimersByTimeAsync(20000))
      expect(showFailToast).toHaveBeenCalledWith('facts-grid.load-failed')
      // The edits may still be saved, so no "not saved" warning yet.
      expect(showFailToast).not.toHaveBeenCalledWith('facts-grid.save-failed')
      expect(h.readOnly[1]).toBe(true)

      // Back online: the next add (whose id is known) restarts the download, which finds the pending row.
      serverTotal = 3
      serverFacts[1] = { ...fact('n1', 'new'), entries: [{ text: 'new' }] }
      serverFacts[2] = fact('n2', 'next', '')
      vi.mocked(getFactsPage).mockImplementation(async (_d, p) => page(p?.offset ?? 0, p?.limit ?? 0))
      edit(2, 0, 'next')
      await act(() => vi.advanceTimersByTimeAsync(1000))
      expect(h.readOnly[1]).toBe(false)
      expect(h.sheet[1]).toEqual(['new', ''])
    })

    it('holds edits to a new fact until the download finds it', async () => {
      let listed!: (v: ReturnType<typeof page>) => void
      vi.mocked(addFactsAction).mockResolvedValueOnce({ success: true, data: { newFactIds: [] } })
      renderGrid(1)
      ready()
      await settle()
      vi.mocked(getFactsPage).mockReturnValueOnce(new Promise((r) => { listed = r }))
      edit(1, 0, 'new')
      await waitFor(() => expect(getFactsPage).toHaveBeenCalled())
      // Typed while the download is still on its way (the row is read-only in the sheet, but an upload can land).
      act(() => h.props.onCellsChange([{ x: 1, y: 1, value: 'more' }]))
      await settle()
      expect(updateFact).not.toHaveBeenCalled()
      serverTotal = 2
      expect(vi.mocked(getFactsPage).mock.lastCall?.[1]).toMatchObject({ offset: 1 })
      await act(async () => listed({ ...page(0, 0), data: { facts: [fact('n1', 'new', '')] } }))
      await waitFor(() => expect(updateFact).toHaveBeenCalledWith('d1', 'n1', {
        entries: [{ text: 'new' }, { text: 'more' }],
      }))
    })

    it('does not resend a failed add for an edit held while it was being created', async () => {
      let created!: (v: Awaited<ReturnType<typeof addFactsAction>>) => void
      vi.mocked(addFactsAction).mockReturnValueOnce(new Promise((r) => { created = r }))
      renderGrid()
      edit(250, 0, 'apple')
      await waitFor(() => expect(addFactsAction).toHaveBeenCalledTimes(1))
      edit(250, 1, 'ringo')
      await settle()
      await act(async () => created({ success: false, error: 'boom' }))
      await settle()
      expect(addFactsAction).toHaveBeenCalledTimes(1)
    })

    it('says typing is not saved when the download gives up before the new fact is known', async () => {
      vi.mocked(addFactsAction).mockResolvedValue({ success: true, data: { newFactIds: [] } })
      renderGrid()
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      // The server does not list the new fact (yet), so the download stops.
      edit(250, 0, 'new')
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('facts-grid.save-failed'))
      expect(showFailToast).toHaveBeenCalledWith('facts-grid.load-failed')
      // Released as read-only, no longer holding edits that cannot be saved.
      expect(h.readOnly[250]).toBe(true)
    })

    it('tries a failed add again only when its row is edited again', async () => {
      vi.mocked(addFactsAction).mockResolvedValueOnce({ success: false, error: 'boom' })
        .mockResolvedValueOnce({ success: true, data: { newFactIds: ['n1'] } })
      renderGrid()
      edit(250, 0, 'new')
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('boom'))
      // Another row's save does not resend it (the server may have created it before the connection dropped).
      edit(0, 0, 'f0')
      await settle()
      expect(addFactsAction).toHaveBeenCalledTimes(1)
      edit(250, 0, 'new!')
      await waitFor(() => expect(addFactsAction).toHaveBeenCalledTimes(2))
      expect(vi.mocked(addFactsAction).mock.lastCall?.[1]).toEqual([[{ text: 'new!' }, { text: '' }]])
    })

    it('never retries a failed add for typing in another row, so nothing is created twice', async () => {
      vi.mocked(addFactsAction).mockResolvedValueOnce({ success: false, error: 'timeout' })
        .mockResolvedValueOnce({ success: true, data: { newFactIds: ['n1', 'n2'] } })
      renderGrid(1)
      ready()
      paste(1, [['one', ''], ['two', '']])
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('timeout'))
      // Typing below the failed rows waits for them.
      edit(3, 0, 'three')
      await settle()
      expect(addFactsAction).toHaveBeenCalledTimes(1)
      // Editing a failed row tries again, all in order.
      edit(1, 0, 'one!')
      await waitFor(() => expect(addFactsAction).toHaveBeenCalledTimes(2))
      expect(vi.mocked(addFactsAction).mock.lastCall?.[1]).toEqual([
        [{ text: 'one!' }, { text: '' }],
        [{ text: 'two' }, { text: '' }],
        [{ text: 'three' }, { text: '' }],
      ])
    })

    it('sends a big paste in batches, stopping at a failed one', async () => {
      vi.mocked(addFactsAction).mockImplementationOnce(async (_d, list) => ({
        success: true, data: { newFactIds: list.map((_, i) => `n${i}`) },
      })).mockResolvedValueOnce({ success: false, error: 'boom' })
      renderGrid(0, deck, [])
      ready()
      paste(0, Array.from({ length: 450 }, (_, i) => [`w${i}`, '']))
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('boom'))
      await settle()
      expect(vi.mocked(addFactsAction).mock.calls.map((c) => c[1].length)).toEqual([200, 200])
      expect(vi.mocked(addFactsAction).mock.calls[1][1][0]).toEqual([{ text: 'w200' }, { text: '' }])
    })

    it('keeps a row being created even if it is emptied meanwhile', async () => {
      let created!: (v: Awaited<ReturnType<typeof addFactsAction>>) => void
      vi.mocked(addFactsAction).mockReturnValueOnce(new Promise((r) => { created = r }))
      renderGrid(1)
      ready()
      act(() => h.props.onVisibleRowsChange(3))
      edit(1, 0, 'x')
      await waitFor(() => expect(addFactsAction).toHaveBeenCalled())
      edit(1, 0, '')
      act(() => h.props.onVisibleRowsChange(1))
      expect(h.sheet).toHaveLength(3)
      await act(async () => created({ success: true, data: { newFactIds: ['n1'] } }))
      expect(screen.getByText('common.all')).toBeDefined()
      expect(h.sheet[1]).toEqual(['', ''])
    })

    it('reports a create that fails outright, keeping the row editable', async () => {
      vi.mocked(addFactsAction).mockRejectedValueOnce(new Error('offline'))
      renderGrid()
      ready()
      edit(250, 0, 'new')
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('add-fact.failed'))
      expect(h.readOnly[250]).toBe(false)
      vi.mocked(addFactsAction).mockResolvedValueOnce({ success: false })
      edit(250, 0, 'again')
      await waitFor(() => expect(showFailToast).toHaveBeenCalledTimes(2))
      expect(showFailToast).toHaveBeenLastCalledWith('add-fact.failed')
    })

    describe('pasting rows', () => {
      it('creates every pasted line past the last fact in one request, in order', async () => {
        vi.mocked(addFactsAction).mockResolvedValueOnce({ success: true, data: { newFactIds: ['n1', 'n2', 'n3'] } })
        renderGrid(1)
        ready()
        paste(0, [['hello', 'bonjour'], ['cat', 'chat'], ['dog', 'chien'], ['', 'chat2']])
        await waitFor(() => expect(addFactsAction).toHaveBeenCalledWith('d1', [
          [{ text: 'cat' }, { text: 'chat' }],
          [{ text: 'dog' }, { text: 'chien' }],
          [{ text: '' }, { text: 'chat2' }],
        ], false, false))
        // The first line went into the fact that was there.
        await waitFor(() => expect(updateFact).toHaveBeenCalledWith('d1', 'f0', {
          entries: [{ text: 'hello' }, { text: 'bonjour' }],
        }))
        expect(screen.getByText('common.all')).toBeDefined()
        expect(h.api.scrollToRow).not.toHaveBeenCalled()
        // All three are now facts.
        rightClick(3, 0)
        act(() => h.modals.menu.onAction('tag'))
        expect(h.modals.tags.fact).toMatchObject({ id: 'n3' })
      })

      it('drops empty rows between new lines so they become consecutive facts', async () => {
        vi.mocked(addFactsAction).mockResolvedValueOnce({ success: true, data: { newFactIds: ['n1', 'n2'] } })
        renderGrid(1)
        ready()
        paste(1, [['a', ''], ['', ''], ['c', '']])
        await waitFor(() => expect(addFactsAction).toHaveBeenCalledWith('d1', [
          [{ text: 'a' }, { text: '' }],
          [{ text: 'c' }, { text: '' }],
        ], false, false))
        expect(h.api.deleteRow).toHaveBeenCalledWith(2)
        expect(h.sheet.slice(1)).toEqual([['a', ''], ['c', ''], ['', '']])
      })

      it('waits for every pasted fact to be downloaded when the ids are unknown', async () => {
        vi.mocked(addFactsAction).mockResolvedValueOnce({ success: true, data: { newFactIds: [], idsUnknown: true } })
        renderGrid(1)
        ready()
        serverTotal = 3
        serverFacts = { 0: fact('f0'), 1: fact('x1', 'a', ''), 2: fact('x2', 'c', '') }
        paste(1, [['a', ''], ['c', '']])
        await waitFor(() => expect(getFactsPage).toHaveBeenCalled())
        await settle()
        expect(h.readOnly.slice(1, 3)).toEqual([false, false])
        // Own deck: no send, so no warning.
        expect(showFailToast).not.toHaveBeenCalled()
        rightClick(2, 0)
        act(() => h.modals.menu.onAction('tag'))
        expect(h.modals.tags.fact).toMatchObject({ id: 'x2' })
      })
    })

    describe('on an imported deck', () => {
      const imported = { ...deck, source_deck_id: 'src' } as Deck
      const renderImported = (facts = [fact('f0')], total = 250) => renderGrid(total, imported, facts)

      it('quietly sends new facts to the author, warning only when they are not sent', async () => {
        vi.mocked(addFactsAction).mockResolvedValueOnce({ success: true, data: { newFactIds: ['n1', 'n2'] } })
        vi.mocked(sendToAuthor).mockResolvedValueOnce({ sent: 2, unsent: 0 })
        renderImported()
        paste(250, [['new', ''], ['more', '']])
        await waitFor(() => expect(sendToAuthor).toHaveBeenCalledWith('d1', [
          { kind: 'fact_add', id: 'n1', preview: expect.any(String) },
          { kind: 'fact_add', id: 'n2', preview: expect.any(String) },
        ]))
        await act(() => new Promise((r) => setTimeout(r, 0)))
        expect(showSuccessToast).not.toHaveBeenCalled()
        expect(showFailToast).not.toHaveBeenCalled()
        // Facts the importer added are their own.
        rightClick(250, 0)
        act(() => h.modals.menu.onAction('tag'))
        expect(h.modals.tags.fact.local).toBe(true)

        vi.mocked(addFactsAction).mockResolvedValueOnce({ success: true, data: { newFactIds: ['n3'] } })
        vi.mocked(sendToAuthor).mockResolvedValueOnce({ sent: 0, unsent: 1 })
        edit(252, 0, 'third')
        await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('auto-send.fact-added-unsent'))
      })

      it('quietly sends cell edits to the author, warning only when they are not sent', async () => {
        vi.mocked(sendFactEdits).mockResolvedValueOnce({ sent: 1, unsent: 0 })
        renderImported()
        edit(0, 0, 'new')
        await waitFor(() => expect(sendFactEdits)
          .toHaveBeenCalledWith('d1', [{ factId: 'f0', entries: [{ text: 'new' }, { text: 'b' }] }]))
        await act(() => new Promise((r) => setTimeout(r, 0)))
        expect(showSuccessToast).not.toHaveBeenCalled()
        expect(showFailToast).not.toHaveBeenCalled()
        vi.mocked(sendFactEdits).mockResolvedValueOnce({ sent: 0, unsent: 1 })
        edit(0, 0, 'newer')
        await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('auto-send.unsent'))
      })

      it('sends to the author without holding up the next save, keeping the sends in order', async () => {
        let firstSend!: () => void
        vi.mocked(sendFactEdits)
          .mockReturnValueOnce(new Promise((r) => { firstSend = () => r({ sent: 1, unsent: 0 }) }))
          .mockResolvedValueOnce({ sent: 1, unsent: 0 })
        renderImported()
        edit(0, 0, 'one')
        await waitFor(() => expect(sendFactEdits).toHaveBeenCalledTimes(1))
        // The next save goes out while the first send is still on its way.
        edit(0, 0, 'two')
        await waitFor(() => expect(updateFact).toHaveBeenCalledTimes(2))
        expect(sendFactEdits).toHaveBeenCalledTimes(1)
        // Its send waits for the first one.
        await act(async () => firstSend())
        await waitFor(() => expect(sendFactEdits).toHaveBeenCalledTimes(2))
        expect(vi.mocked(sendFactEdits).mock.lastCall?.[1]).toEqual([
          { factId: 'f0', entries: [{ text: 'two' }, { text: 'b' }], local: undefined },
        ])
      })

      it('reports a send to the author that fails outright', async () => {
        vi.mocked(sendFactEdits).mockRejectedValueOnce(new Error('offline'))
        renderImported()
        edit(0, 0, 'new')
        await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('auto-send.unsent'))
      })

      it('marks edits to facts the importer added as local', async () => {
        vi.mocked(sendFactEdits).mockResolvedValueOnce({ sent: 1, unsent: 0 })
        renderImported([{ ...fact('n1'), local: true }], 1)
        edit(0, 0, 'new')
        await waitFor(() => expect(sendFactEdits)
          .toHaveBeenCalledWith('d1', [{ factId: 'n1', entries: [{ text: 'new' }, { text: 'b' }], local: true }]))
      })

      it('warns when the new facts cannot be identified', async () => {
        vi.mocked(addFactsAction).mockResolvedValue({ success: true, data: { newFactIds: [], idsUnknown: true } })
        renderImported()
        edit(250, 0, 'new')
        await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('auto-send.fact-added-not-sent'))
        expect(sendToAuthor).not.toHaveBeenCalled()
      })

      it('sends nothing when no new fact id comes back', async () => {
        vi.mocked(addFactsAction).mockResolvedValue({ success: true })
        renderImported()
        edit(250, 0, 'new')
        await waitFor(() => expect(addFactsAction).toHaveBeenCalled())
        await act(() => new Promise((r) => setTimeout(r, 0)))
        expect(sendToAuthor).not.toHaveBeenCalled()
      })
    })
  })

  describe('cell right-click menu', () => {
    it('opens at the pointer on a fact cell', () => {
      renderGrid()
      ready()
      expect(h.modals.menu.position).toBeNull()
      rightClick(0, 1)
      expect(h.modals.menu).toMatchObject({ position: { x: 40, y: 60 }, rowMenu: false })
      expect(h.api.markRows).toHaveBeenCalledWith([])
    })

    it('offers only copy and paste on a row without a fact', () => {
      renderGrid()
      rightClick(999)
      expect(h.modals.menu.position).toBeNull()
      rightClick(250)
      expect(h.modals.menu).toMatchObject({ position: { x: 40, y: 60 }, factActions: false })
      rightClick(0)
      expect(h.modals.menu.factActions).toBe(true)
    })

    it('copies the selection', () => {
      renderGrid()
      ready()
      rightClick(0)
      act(() => h.modals.menu.onAction('copy'))
      expect(h.api.copySelection).toHaveBeenCalled()
      // The keyboard goes back to the cell as the menu closes.
      act(() => h.modals.menu.onClose())
      expect(h.modals.tags).toBeUndefined()
    })

    it('pastes the clipboard at the selection', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { readText: vi.fn(async () => 'a\tb') },
      })
      renderGrid()
      ready()
      rightClick(250)
      act(() => h.modals.menu.onAction('paste'))
      await waitFor(() => expect(h.api.pasteAtSelection).toHaveBeenCalledWith('a\tb'))
    })

    it('says to use the keyboard when the browser blocks pasting from the menu', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { readText: vi.fn(async () => { throw new Error('denied') }) },
      })
      renderGrid()
      ready()
      rightClick(0)
      act(() => h.modals.menu.onAction('paste'))
      await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('facts-grid.paste-blocked'))
      expect(h.api.pasteAtSelection).not.toHaveBeenCalled()
    })

    describe('on the row number', () => {
      it('marks the whole row and offers only delete', () => {
        renderGrid()
        ready()
        rightClick(0, null)
        expect(h.modals.menu).toMatchObject({ position: { x: 40, y: 60 }, rowMenu: true })
        expect(h.api.markRows).toHaveBeenLastCalledWith([0])
      })

      it('unmarks the row when the menu closes without an action', () => {
        renderGrid()
        ready()
        rightClick(0, null)
        act(() => h.modals.menu.onClose())
        expect(h.api.markRows).toHaveBeenLastCalledWith([])
      })

      it('keeps the row marked behind the delete confirmation, then unmarks it', () => {
        renderGrid()
        ready()
        rightClick(0, null)
        act(() => h.modals.menu.onAction('delete'))
        act(() => h.modals.menu.onClose())
        expect(h.modals.delete.isOpen).toBe(true)
        expect(h.api.markRows).toHaveBeenLastCalledWith([0])
        act(() => h.modals.delete.setIsOpen(false))
        expect(h.modals.delete.isOpen).toBe(false)
        expect(h.api.markRows).toHaveBeenLastCalledWith([])
      })

      it('keeps the mark while the confirmation opens', () => {
        renderGrid()
        ready()
        rightClick(0, null)
        act(() => h.modals.menu.onAction('delete'))
        act(() => h.modals.delete.setIsOpen(true))
        expect(h.api.markRows).toHaveBeenLastCalledWith([0])
      })
    })

    it('opens attachments for the clicked cell entry', () => {
      renderGrid(1, deck, [{ ...fact('f1'), entries: [{ text: 'f', audio: 'a1' }, { text: 'b' }] }])
      rightClick(0, 0)
      act(() => h.modals.menu.onAction('attachment'))
      expect(h.modals.media).toMatchObject({ isOpen: true, id: 'f1', entry: { text: 'f', audio: 'a1' } })
    })

    it('falls back to an empty entry when the cell has none', () => {
      renderGrid(1, deck, [{ ...fact('f1'), entries: [] }])
      rightClick(0, 1)
      act(() => h.modals.menu.onAction('attachment'))
      expect(h.modals.media.entry).toEqual({ text: '' })
    })

    it('opens tags for the clicked fact', () => {
      renderGrid()
      expect(h.modals.tags).toBeUndefined()
      rightClick(0)
      act(() => h.modals.menu.onAction('tag'))
      expect(h.modals.tags).toMatchObject({ isOpen: true, fact: fact('f0'), deck })
    })

    it('confirms deleting the clicked fact', () => {
      renderGrid()
      rightClick(0)
      act(() => h.modals.menu.onAction('delete'))
      expect(h.modals.delete.isOpen).toBe(true)
      h.modals.delete.action(null, new FormData())
      expect(deleteFactAction).toHaveBeenCalledWith({ deckId: 'd1', factId: 'f0' }, null, expect.any(FormData))
    })

    it('removes the deleted fact and keeps the cursor on the same cell', async () => {
      vi.mocked(deleteFactAction).mockResolvedValueOnce({ success: true })
      renderGrid()
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      rightClick(0, 1)
      act(() => h.modals.menu.onAction('delete'))
      await act(() => h.modals.delete.action(null, new FormData()))
      expect(h.api.deleteRow).toHaveBeenCalledWith(0)
      expect(h.sheet[0]).toEqual(['f1', 'b'])
      expect(h.sheet).toHaveLength(250)
      expect(h.api.focusCell).toHaveBeenLastCalledWith(1, 0)
      // The next fact typed goes below the 249 left.
      vi.mocked(addFactsAction).mockResolvedValueOnce({ success: true, data: { newFactIds: ['n1'] } })
      edit(249, 0, 'new')
      await waitFor(() => expect(addFactsAction).toHaveBeenCalledTimes(1))
    })

    it('keys the delete dialog apart from the tags dialog of the same fact', () => {
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
      renderGrid()
      rightClick(0)
      act(() => h.modals.menu.onAction('tag'))
      expect(errors.mock.calls.some(([m]) => String(m).includes('same key'))).toBe(false)
      errors.mockRestore()
    })

    it('uses a fresh delete dialog for each fact, so every successful delete closes it', async () => {
      vi.mocked(deleteFactAction).mockResolvedValue({ success: true })
      renderGrid()
      ready()
      await waitFor(() => expect(allLoaded()).toBe(true))
      const mounts = h.deleteMounts
      rightClick(0)
      act(() => h.modals.menu.onAction('delete'))
      await act(() => h.modals.delete.action(null, new FormData()))
      rightClick(0)
      act(() => h.modals.menu.onAction('delete'))
      expect(h.deleteMounts).toBe(mounts + 2)
    })

    it('leaves the rows alone when the deleted fact is not in the sheet', async () => {
      vi.mocked(deleteFactAction).mockResolvedValue({ success: true })
      renderGrid()
      rightClick(0)
      act(() => h.modals.menu.onAction('delete'))
      const deleteFirst = h.modals.delete.action
      await act(() => deleteFirst(null, new FormData()))
      h.api.deleteRow.mockClear()
      // The same fact again: already gone.
      await act(() => deleteFirst(null, new FormData()))
      expect(h.api.deleteRow).not.toHaveBeenCalled()
    })

    it('does not move the cursor when the delete fails', async () => {
      vi.mocked(deleteFactAction).mockResolvedValueOnce({ success: false, error: 'boom' })
      renderGrid()
      rightClick(0)
      act(() => h.modals.menu.onAction('delete'))
      await act(() => h.modals.delete.action(null, new FormData()))
      expect(h.api.focusCell).not.toHaveBeenCalled()
      expect(h.api.deleteRow).not.toHaveBeenCalled()
      expect(showFailToast).toHaveBeenCalledWith('facts-grid.delete-failed')
    })

    it('reports a delete that fails outright', async () => {
      vi.mocked(deleteFactAction).mockRejectedValueOnce(new Error('offline'))
      renderGrid()
      rightClick(0)
      act(() => h.modals.menu.onAction('delete'))
      expect(await act(() => h.modals.delete.action(null, new FormData()))).toEqual({ success: false })
      expect(showFailToast).toHaveBeenCalledWith('facts-grid.delete-failed')
    })

    it('deletes nothing before a fact is chosen', async () => {
      renderGrid()
      expect(await act(() => h.modals.delete.action(null, new FormData()))).toEqual({ success: false })
      expect(deleteFactAction).not.toHaveBeenCalled()
      expect(showFailToast).not.toHaveBeenCalled()
    })

    describe('deleting several facts', () => {
      it('asks once for the rows selected by number when Delete is pressed, then deletes their facts', async () => {
        vi.mocked(deleteFactAction).mockResolvedValue({ success: true })
        renderGrid()
        ready()
        await waitFor(() => expect(allLoaded()).toBe(true))
        act(() => h.props.onRowsDelete([1, 2, 3]))
        expect(h.modals.delete).toMatchObject({ isOpen: true, type: 'multiple', deleteCount: 3 })
        expect(h.api.markRows).toHaveBeenLastCalledWith([1, 2, 3])
        expect(deleteFactAction).not.toHaveBeenCalled()
        expect(await act(() => h.modals.delete.action(null, new FormData()))).toEqual({ success: true })
        expect(vi.mocked(deleteFactAction).mock.calls.map((c) => c[0])).toEqual([
          { deckId: 'd1', factId: 'f1' },
          { deckId: 'd1', factId: 'f2' },
          { deckId: 'd1', factId: 'f3' },
        ])
        expect(h.sheet.slice(0, 2)).toEqual([['f0', 'b'], ['f4', 'b']])
        expect(h.sheet).toHaveLength(248)
        expect(h.api.focusCell).toHaveBeenLastCalledWith(0, 1)
      })

      it('leaves out selected rows without a fact, and does nothing when none has one', () => {
        renderGrid()
        act(() => h.props.onRowsDelete([250]))
        expect(h.modals.delete.isOpen).toBe(false)
        act(() => h.props.onRowsDelete([0, 250]))
        expect(h.modals.delete).toMatchObject({ isOpen: true, type: 'single', deleteCount: 1 })
      })

      it('deletes the whole selection from the menu of a row number inside it', async () => {
        vi.mocked(deleteFactAction).mockResolvedValue({ success: true })
        renderGrid()
        ready()
        await waitFor(() => expect(allLoaded()).toBe(true))
        h.api.selectedRows.mockReturnValue([2, 3])
        rightClick(3, null)
        act(() => h.modals.menu.onAction('delete'))
        expect(h.modals.delete.deleteCount).toBe(2)
        expect(h.api.markRows).toHaveBeenLastCalledWith([2, 3])
        await act(() => h.modals.delete.action(null, new FormData()))
        expect(vi.mocked(deleteFactAction).mock.calls.map((c) => c[0].factId)).toEqual(['f2', 'f3'])
        expect(h.api.focusCell).toHaveBeenLastCalledWith(0, 2)
      })

      it('deletes only the clicked row when it is outside the selection, or from a cell menu', () => {
        renderGrid()
        h.api.selectedRows.mockReturnValue([2, 3])
        rightClick(0, null)
        act(() => h.modals.menu.onAction('delete'))
        expect(h.modals.delete.deleteCount).toBe(1)
        h.api.selectedRows.mockClear()
        rightClick(0, 1)
        act(() => h.modals.menu.onAction('delete'))
        expect(h.api.selectedRows).not.toHaveBeenCalled()
        expect(h.modals.delete.deleteCount).toBe(1)
      })

      it('goes on past a failed delete, reports it, and closes once any was deleted', async () => {
        vi.mocked(deleteFactAction).mockResolvedValueOnce({ success: false })
          .mockRejectedValueOnce(new Error('offline'))
          .mockResolvedValueOnce({ success: true })
        renderGrid()
        ready()
        await waitFor(() => expect(allLoaded()).toBe(true))
        act(() => h.props.onRowsDelete([1, 2, 3]))
        expect(await act(() => h.modals.delete.action(null, new FormData()))).toEqual({ success: true })
        expect(deleteFactAction).toHaveBeenCalledTimes(3)
        expect(showFailToast).toHaveBeenCalledWith('facts-grid.delete-failed')
        expect(h.sheet.slice(0, 4)).toEqual([['f0', 'b'], ['f1', 'b'], ['f2', 'b'], ['f4', 'b']])
      })
    })

    it('puts an uploaded attachment into the cell and saves it', async () => {
      renderGrid()
      rightClick(0, 0)
      act(() => h.modals.menu.onAction('attachment'))
      act(() => h.modals.media.onUpload('file1', 'audio'))
      await waitFor(() => expect(updateFact).toHaveBeenCalledWith('d1', 'f0', {
        entries: [{ text: 'f0', audio: 'file1' }, { text: 'b' }],
      }))
    })

    it('starts an empty entry for an upload to a cell without one', async () => {
      renderGrid(1, deck, [{ ...fact('f0'), entries: [{ text: 'f0' }] }])
      rightClick(0, 1)
      act(() => h.modals.menu.onAction('attachment'))
      act(() => h.modals.media.onUpload('file1', 'image'))
      await waitFor(() => expect(updateFact).toHaveBeenCalledWith('d1', 'f0', {
        entries: [{ text: 'f0' }, { text: '', image: 'file1' }],
      }))
    })

    it('ignores an upload for a fact not in the sheet', async () => {
      vi.mocked(deleteFactAction).mockResolvedValueOnce({ success: true })
      renderGrid()
      act(() => h.modals.media.onUpload('file1', 'audio'))
      rightClick(0)
      act(() => h.modals.menu.onAction('attachment'))
      act(() => h.modals.menu.onClose())
      rightClick(0)
      act(() => h.modals.menu.onAction('delete'))
      await act(() => h.modals.delete.action(null, new FormData()))
      act(() => h.modals.media.onUpload('file1', 'audio'))
      await settle()
      expect(updateFact).not.toHaveBeenCalled()
    })

    it('opens a fresh menu at the pointer for every right-click', () => {
      renderGrid()
      const mounts = h.menuMounts
      rightClick(0)
      rightClick(0, 0, { clientX: 300, clientY: 60 })
      expect(h.menuMounts).toBe(mounts + 2)
      expect(h.modals.menu.position).toEqual({ x: 300, y: 60 })
    })

    it('gives the keyboard back to the cell a frame after the menu closes', async () => {
      renderGrid()
      ready()
      act(() => h.modals.menu.onClose())
      act(() => h.modals.menu.onAction('tag'))
      expect(h.modals.tags).toBeUndefined()
      rightClick(0, 1)
      act(() => h.modals.menu.onClose())
      expect(h.modals.menu.position).toBeNull()
      expect(h.api.focusCell).not.toHaveBeenCalled()
      await waitFor(() => expect(h.api.focusCell).toHaveBeenCalledWith(1, 0))
    })

    it('leaves the keyboard to the dialog a menu item opens', async () => {
      renderGrid()
      ready()
      rightClick(0)
      act(() => h.modals.menu.onAction('tag'))
      act(() => h.modals.menu.onClose())
      await act(() => new Promise((r) => requestAnimationFrame(r)))
      await act(() => new Promise((r) => requestAnimationFrame(r)))
      expect(h.api.focusCell).not.toHaveBeenCalled()
    })

    it('hands the keyboard back to the cell when a dialog opened from the menu closes', async () => {
      renderGrid()
      ready()
      rightClick(0, 1)
      act(() => h.modals.menu.onAction('tag'))
      act(() => h.modals.menu.onClose())
      act(() => h.modals.tags.setIsOpen(true))
      act(() => h.modals.tags.setIsOpen(false))
      await waitFor(() => expect(h.api.focusCell).toHaveBeenCalledWith(1, 0))
      h.api.focusCell.mockClear()
      rightClick(0, 0)
      act(() => h.modals.menu.onAction('attachment'))
      act(() => h.modals.menu.onClose())
      act(() => h.modals.media.setIsOpen(true))
      act(() => h.modals.media.setIsOpen(false))
      await waitFor(() => expect(h.api.focusCell).toHaveBeenCalledWith(0, 0))
      h.api.focusCell.mockClear()
      rightClick(0, null)
      act(() => h.modals.menu.onAction('delete'))
      act(() => h.modals.menu.onClose())
      act(() => h.modals.delete.setIsOpen(false))
      await waitFor(() => expect(h.api.focusCell).toHaveBeenCalledWith(0, 0))
    })

    it('has no cell to hand the keyboard back to before the menu was used', async () => {
      renderGrid()
      ready()
      act(() => h.modals.delete.setIsOpen(false))
      await act(() => new Promise((r) => requestAnimationFrame(r)))
      expect(h.api.focusCell).not.toHaveBeenCalled()
    })

    it('leaves the keyboard on another cell chosen by the click that closed the menu', async () => {
      renderGrid()
      ready()
      // Another row, then another column of the same row.
      for (const [x, y] of [[0, 3], [1, 0]]) {
        rightClick(0, 0)
        h.api.selectedRange.mockReturnValue({ x1: x, y1: y, x2: x, y2: y })
        act(() => h.modals.menu.onClose())
        await act(() => new Promise((r) => requestAnimationFrame(r)))
        await act(() => new Promise((r) => requestAnimationFrame(r)))
      }
      expect(h.api.focusCell).not.toHaveBeenCalled()
      expect(h.api.focusSheet).not.toHaveBeenCalled()
    })

    it('gives the keyboard back, keeping the selection, when the menu cell is still selected', async () => {
      renderGrid()
      ready()
      // A block right-clicked inside, as for copying it.
      rightClick(2, 1)
      h.api.selectedRange.mockReturnValue({ x1: 0, y1: 1, x2: 1, y2: 3 })
      act(() => h.modals.menu.onClose())
      await waitFor(() => expect(h.api.focusSheet).toHaveBeenCalled())
      expect(h.api.focusCell).not.toHaveBeenCalled()
    })
  })
})
