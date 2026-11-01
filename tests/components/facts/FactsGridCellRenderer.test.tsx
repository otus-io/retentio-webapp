import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import FactsGridCellRenderer from '@/components/facts/FactsGridCellRenderer'
import { resolveCellEntry } from '@/components/facts/resolveCellEntry'
import { spliceDeletedFieldFromRow } from '@/components/facts/spliceDeletedFieldFromRow'
import { rawSymbol } from '@/components/facts/token'
import type { Deck } from '@/modules/decks/decks.schema'
import type { Fact } from '@/modules/facts/facts.schema'
import type { ICellRendererParams } from 'ag-grid-community'

vi.mock('@/components/facts/FactsAction', () => ({
  default: () => <div data-testid="facts-action" />,
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/components/app/AppTooltip', () => ({
  default: ({ children, content }: { children?: React.ReactNode; content?: React.ReactNode }) => (
    <>
      <div data-testid="attachment-tooltip">{content}</div>
      {children}
    </>
  ),
}))

const deck = { id: 'deck-1', name: 'Deck', fields: ['Front'] } as Deck

function makeFact(audio = 'audio-1'): Fact {
  return {
    id: 'fact-1',
    entries: [{ text: 'hello', audio, image: '', video: '' }],
    fields: [],
    tags: [],
  }
}

function renderCell(overrides: Partial<ICellRendererParams> & {
  data?: Record<string, unknown>
  colDef?: { context?: { isActionColumn?: boolean }; field?: string; headerName?: string }
  onAttachmentClick?: (fact: Fact, fieldKey: string, entry: unknown) => void
} = {}) {
  const fact = makeFact()

  const params = {
    data: {
      id: 'fact-1',
      Front: { text: 'hello', audio: 'audio-1', image: '', video: '' },
      [rawSymbol]: fact,
      ...overrides.data,
    },
    column: {
      getColId: () => 'Front',
    },
    api: {
      getColumnDefs: () => [{ field: 'Front' }],
    },
    getValue: () => 'hello',
    colDef: { field: 'Front', context: {} },
    deck,
    ...overrides,
  } as unknown as ICellRendererParams & {
    deck: Deck
    onAttachmentClick?: (fact: Fact, fieldKey: string, entry: unknown) => void
  }

  return render(<FactsGridCellRenderer {...params} />)
}

function paperclipDisplay() {
  return (document.querySelector('.facts-grid-cell-media') as HTMLElement).style.display
}

describe('spliceDeletedFieldFromRow', () => {
  it('removes the field key and splices raw entries at the deleted index', () => {
    const next = spliceDeletedFieldFromRow(
      {
        Front: { text: 'a', audio: 'x' },
        Back: { text: 'b', audio: '' },
        [rawSymbol]: {
          id: 'f1',
          entries: [
            { text: 'a', audio: 'x' },
            { text: 'b', audio: '' },
          ],
          fields: [],
          tags: [],
        },
      },
      0,
      'Front',
    )
    expect(next.Front).toBeUndefined()
    expect(next.Back).toEqual({ text: 'b', audio: '' })
    expect((next[rawSymbol] as Fact).entries).toEqual([{ text: 'b', audio: '' }])
  })

  it('leaves data unchanged when there is no raw fact snapshot', () => {
    const next = spliceDeletedFieldFromRow({ Front: { text: 'a' } }, 0, undefined)
    expect(next).toEqual({ Front: { text: 'a' } })
  })
})

describe('resolveCellEntry', () => {
  it('prefers entry with audio from field data', () => {
    const entry = resolveCellEntry({
      data: {
        Front: { text: 'hello', audio: 'from-field' },
        [rawSymbol]: makeFact('from-raw'),
      },
      column: { getColId: () => 'Front' },
      api: { getColumnDefs: () => [{ field: 'Front' }] },
    })
    expect(entry?.audio).toBe('from-field')
  })

  it('falls back to raw fact entry when field data has no audio', () => {
    const entry = resolveCellEntry({
      data: {
        Front: { text: 'hello', audio: '' },
        [rawSymbol]: makeFact('from-raw'),
      },
      column: { getColId: () => 'Front' },
      api: { getColumnDefs: () => [{ field: 'Front' }] },
    })
    expect(entry?.audio).toBe('from-raw')
  })

  it('falls back to headerName key when field key misses', () => {
    const entry = resolveCellEntry({
      data: {
        Word: { text: 'hello', audio: 'from-header' },
        [rawSymbol]: makeFact(''),
      },
      column: { getColId: () => 'Front' },
      colDef: { field: 'Front', headerName: 'Word' },
      api: { getColumnDefs: () => [{ field: 'Front', headerName: 'Word' }] },
    })
    expect(entry?.audio).toBe('from-header')
  })

  it('uses colDef.field when column is missing', () => {
    const entry = resolveCellEntry({
      data: {
        Front: { text: 'hello', audio: 'from-coldef' },
      },
      colDef: { field: 'Front' },
      api: { getColumnDefs: () => null },
    })
    expect(entry?.audio).toBe('from-coldef')
  })

  it('matches column via colId when field is absent', () => {
    const entry = resolveCellEntry({
      data: {
        Front: { text: 'hello', audio: '' },
        [rawSymbol]: makeFact('from-colid'),
      },
      column: { getColId: () => 'Front' },
      api: { getColumnDefs: () => [{ colId: 'Front' }] },
    })
    expect(entry?.audio).toBe('from-colid')
  })

  it('returns undefined when nothing resolves', () => {
    const entry = resolveCellEntry({
      data: {},
      column: { getColId: () => '' },
      api: { getColumnDefs: () => [] },
    })
    expect(entry).toBeUndefined()
  })

  it('uses empty field key when column and colDef field are absent', () => {
    const entry = resolveCellEntry({
      data: { Front: { text: 'hello', audio: 'hidden' } },
      column: null,
      colDef: null,
      api: { getColumnDefs: () => [{ field: 'Front' }] },
    })
    expect(entry).toBeUndefined()
  })
})

describe('FactsGridCellRenderer', () => {
  it('always shows paperclip when entry has audio', () => {
    renderCell()
    expect(paperclipDisplay()).toBe('block')
    expect(screen.getByText('hello')).toBeDefined()
    expect(screen.getByTestId('attachment-tooltip').textContent).toBe('term.attachment')
  })

  it('always shows paperclip when only raw fact has audio', () => {
    renderCell({
      data: {
        Front: { text: 'hello', audio: '', image: '', video: '' },
        [rawSymbol]: makeFact('audio-raw'),
      },
    })
    expect(paperclipDisplay()).toBe('block')
  })

  it('always shows paperclip when entry has only an image', () => {
    renderCell({
      data: {
        Front: { text: 'hello', audio: '', image: 'image-1', video: '' },
        [rawSymbol]: makeFact(''),
      },
    })
    expect(paperclipDisplay()).toBe('block')
  })

  it('always shows paperclip when entry has only a video', () => {
    renderCell({
      data: {
        Front: { text: 'hello', audio: '', image: '', video: 'video-1' },
        [rawSymbol]: makeFact(''),
      },
    })
    expect(paperclipDisplay()).toBe('block')
  })

  it('shows paperclip only on focus when entry has no media', () => {
    renderCell({
      data: {
        Front: { text: 'hello', audio: '', image: '', video: '' },
        [rawSymbol]: makeFact(''),
      },
    })
    expect(paperclipDisplay()).toBe('var(--cell-display, none)')
  })

  it('shows paperclip only on focus when media ids are whitespace', () => {
    renderCell({
      data: {
        Front: { text: 'hello', audio: '   ', image: ' ', video: ' ' },
        [rawSymbol]: makeFact('   '),
      },
    })
    expect(paperclipDisplay()).toBe('var(--cell-display, none)')
  })

  it('shows paperclip only on focus when cell entry is missing', () => {
    renderCell({
      data: {
        Front: undefined,
        [rawSymbol]: undefined,
      },
      api: {
        getColumnDefs: () => [],
      },
    } as never)
    expect(paperclipDisplay()).toBe('var(--cell-display, none)')
  })

  it('renders action column without paperclip', () => {
    renderCell({
      colDef: { context: { isActionColumn: true } },
    })
    expect(screen.getByTestId('facts-action')).toBeDefined()
    expect(document.querySelector('.facts-grid-cell-media')).toBeNull()
  })

  it('calls onAttachmentClick when paperclip is clicked', () => {
    const onAttachmentClick = vi.fn()
    renderCell({ onAttachmentClick })
    fireEvent.click(document.querySelector('.facts-grid-cell-media')!)
    expect(onAttachmentClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'fact-1' }),
      'Front',
      expect.objectContaining({ audio: 'audio-1' }),
    )
  })

  it('uses resolveCellEntry for attachments when only raw fact has audio', () => {
    const onAttachmentClick = vi.fn()
    renderCell({
      onAttachmentClick,
      data: {
        Front: { text: 'hello', audio: '', image: '', video: '' },
        [rawSymbol]: makeFact('audio-raw'),
      },
    })
    fireEvent.click(document.querySelector('.facts-grid-cell-media')!)
    expect(onAttachmentClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'fact-1' }),
      'Front',
      expect.objectContaining({ audio: 'audio-raw' }),
    )
  })

  it('shows paperclip only on focus for a remaining no-media field after deleting the first of three fields', () => {
    const before = {
      Front: { text: 'front', audio: 'audio-front', image: '', video: '' },
      Middle: { text: 'mid', audio: '', image: '', video: '' },
      Back: { text: 'back', audio: '', image: '', video: '' },
      [rawSymbol]: {
        id: 'fact-1',
        entries: [
          { text: 'front', audio: 'audio-front', image: '', video: '' },
          { text: 'mid', audio: '', image: '', video: '' },
          { text: 'back', audio: '', image: '', video: '' },
        ],
        fields: [],
        tags: [],
      } satisfies Fact,
    }
    const after = spliceDeletedFieldFromRow(before, 0, 'Front')
    renderCell({
      data: after,
      column: { getColId: () => 'Middle' },
      colDef: { field: 'Middle', context: {} },
      api: {
        getColumnDefs: () => [{ field: 'Middle' }, { field: 'Back' }],
      },
      getValue: () => 'mid',
    } as never)
    expect(paperclipDisplay()).toBe('var(--cell-display, none)')
    expect(screen.getByText('mid')).toBeDefined()
  })



  it('does not call onAttachmentClick when entry cannot be resolved', () => {
    const onAttachmentClick = vi.fn()
    renderCell({
      onAttachmentClick,
      data: {
        Front: undefined,
        [rawSymbol]: undefined,
      },
      api: {
        getColumnDefs: () => [],
      },
    } as never)
    fireEvent.click(document.querySelector('.facts-grid-cell-media')!)
    expect(onAttachmentClick).not.toHaveBeenCalled()
  })

  it('handles missing column id when resolving attachments', () => {
    const onAttachmentClick = vi.fn()
    renderCell({
      onAttachmentClick,
      column: undefined,
      colDef: { field: undefined, context: {} },
      data: {
        Front: { text: 'hello', audio: 'audio-1', image: '', video: '' },
        [rawSymbol]: makeFact(),
      },
      api: {
        getColumnDefs: () => null,
      },
    } as never)
    fireEvent.click(document.querySelector('.facts-grid-cell-media')!)
    expect(onAttachmentClick).not.toHaveBeenCalled()
  })

  it('shows paperclip only on focus when column is missing and raw has no audio', () => {
    renderCell({
      column: undefined,
      data: {
        Front: { text: 'hello', audio: '', image: '', video: '' },
        [rawSymbol]: makeFact(''),
      },
    } as never)
    expect(paperclipDisplay()).toBe('var(--cell-display, none)')
    expect(screen.getByText('hello')).toBeDefined()
  })
})
