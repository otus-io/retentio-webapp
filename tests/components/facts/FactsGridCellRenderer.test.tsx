import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import FactsGridCellRenderer from '@/components/facts/FactsGridCellRenderer'
import { resolveCellEntry } from '@/components/facts/resolveCellEntry'
import { rawSymbol } from '@/components/facts/token'
import type { Deck } from '@/modules/decks/decks.schema'
import type { Fact } from '@/modules/facts/facts.schema'
import type { ICellRendererParams } from 'ag-grid-community'

vi.mock('@/components/facts/FactsAction', () => ({
  default: () => <div data-testid="facts-action" />,
}))

vi.mock('@/components/facts/FactsAudioPlayButton', () => ({
  default: ({ mediaId }: { mediaId: string }) => (
    <button type="button" aria-label={`play-${mediaId}`} />
  ),
}))

vi.mock('@/components/app/AppTooltip', () => ({
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
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
  it('shows audio play button when entry has audio', () => {
    renderCell()
    expect(screen.getByRole('button', { name: 'play-audio-1' })).toBeDefined()
    expect(screen.getByText('hello')).toBeDefined()
  })

  it('shows play button when only raw fact has audio', () => {
    renderCell({
      data: {
        Front: { text: 'hello', audio: '', image: '', video: '' },
        [rawSymbol]: makeFact('audio-raw'),
      },
    })
    expect(screen.getByRole('button', { name: 'play-audio-raw' })).toBeDefined()
  })

  it('hides audio play button when entry has no audio', () => {
    renderCell({
      data: {
        Front: { text: 'hello', audio: '', image: '', video: '' },
        [rawSymbol]: makeFact(''),
      },
    })
    expect(screen.queryByRole('button', { name: /^play-/ })).toBeNull()
  })

  it('hides audio play button when audio is whitespace', () => {
    renderCell({
      data: {
        Front: { text: 'hello', audio: '   ', image: '', video: '' },
        [rawSymbol]: makeFact('   '),
      },
    })
    expect(screen.queryByRole('button', { name: /^play-/ })).toBeNull()
  })

  it('hides audio play button when cell entry is missing and raw has no audio', () => {
    renderCell({
      data: {
        Front: undefined,
        [rawSymbol]: makeFact(''),
      },
    })
    expect(screen.queryByRole('button', { name: /^play-/ })).toBeNull()
  })

  it('renders action column without play button', () => {
    renderCell({
      colDef: { context: { isActionColumn: true } },
    })
    expect(screen.getByTestId('facts-action')).toBeDefined()
    expect(screen.queryByRole('button', { name: /^play-/ })).toBeNull()
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

  it('does not call onAttachmentClick when entry cannot be resolved', () => {
    const onAttachmentClick = vi.fn()
    renderCell({
      onAttachmentClick,
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
      api: {
        getColumnDefs: () => null,
      },
    } as never)
    fireEvent.click(document.querySelector('.facts-grid-cell-media')!)
    expect(onAttachmentClick).not.toHaveBeenCalled()
  })

  it('renders without play button when column is missing and raw has no audio', () => {
    renderCell({
      column: undefined,
      data: {
        Front: { text: 'hello', audio: '', image: '', video: '' },
        [rawSymbol]: makeFact(''),
      },
    } as never)
    expect(screen.queryByRole('button', { name: /^play-/ })).toBeNull()
    expect(screen.getByText('hello')).toBeDefined()
  })
})
