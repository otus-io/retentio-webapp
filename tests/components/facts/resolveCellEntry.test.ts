import { describe, expect, it } from 'vitest'
import { resolveCellEntry } from '@/components/facts/resolveCellEntry'
import { rawSymbol } from '@/components/facts/token'
import type { Fact } from '@/modules/facts/facts.schema'

function makeFact(audio = 'audio-1'): Fact {
  return {
    id: 'fact-1',
    entries: [{ text: 'hello', audio, image: '', video: '' }],
    fields: [],
    tags: [],
  }
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

  it('skips the pinned row-number column when matching the raw entry', () => {
    const entry = resolveCellEntry({
      data: { [rawSymbol]: makeFact('raw-front') },
      column: { getColId: () => 'Front' },
      api: { getColumnDefs: () => [{ colId: 'rowNumber', context: { isRowNumber: true } }, { field: 'Front' }] },
    })
    expect(entry?.audio).toBe('raw-front')
  })
})
