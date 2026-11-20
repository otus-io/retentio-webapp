import { describe, expect, it } from 'vitest'
import { mergeQualityEntries, scoreableAspects } from '@/modules/quality/quality.schema'

describe('scoreableAspects', () => {
  it('lists non-empty text and audio', () => {
    expect(scoreableAspects({ text: 'a', audio: 'm1' })).toEqual(['text', 'audio'])
    expect(scoreableAspects({ text: '  ', image: 'i' })).toEqual([])
    expect(scoreableAspects(undefined)).toEqual([])
  })
})

describe('mergeQualityEntries', () => {
  const human = { score: 10, model: 'human' }

  it('signs off checked columns and keeps non-human scores', () => {
    const merged = mergeQualityEntries(
      {
        fact_id: 'f1',
        updated_at: '',
        entries: { 0: { audio: { score: 2, model: 'elevenlabs' } } },
      },
      [{ text: 'hola', audio: 'a1' }, { text: 'hello' }],
      new Set([1]),
      new Set([0, 1]),
    )
    expect(merged).toEqual({
      0: { audio: { score: 2, model: 'elevenlabs' } },
      1: { text: human },
    })
  })

  it('replaces scores on a checked column with human sign-offs', () => {
    const merged = mergeQualityEntries(
      { fact_id: 'f1', updated_at: '', entries: { 0: { text: { score: 1, model: 'claude' } } } },
      [{ text: 'hola' }],
      new Set([0]),
      new Set([0]),
    )
    expect(merged).toEqual({ 0: { text: human } })
  })

  it('echoes an existing human sign-off so its signer is kept', () => {
    const signed = { ...human, by: 'author', fingerprint: 'fp' }
    const merged = mergeQualityEntries(
      { fact_id: 'f1', updated_at: '', entries: { 0: { text: signed } } },
      [{ text: 'hola', audio: 'a1' }],
      new Set([0]),
      new Set([0]),
    )
    expect(merged).toEqual({ 0: { text: signed, audio: human } })
  })

  it('withdraws human sign-offs on unchecked active columns', () => {
    const merged = mergeQualityEntries(
      { fact_id: 'f1', updated_at: '', entries: { 0: { text: { ...human, by: 'me' } } } },
      [{ text: 'hola' }],
      new Set(),
      new Set([0]),
    )
    expect(merged).toEqual({})
  })

  it('preserves inactive columns as stored', () => {
    const stored = { text: { ...human, by: 'author', fingerprint: 'fp' } }
    const merged = mergeQualityEntries(
      { fact_id: 'f1', updated_at: '', entries: { 1: stored } },
      [{ text: 'hola' }, { text: 'hello' }, { text: 'x' }],
      new Set([0]),
      new Set([0]),
    )
    expect(merged).toEqual({ 0: { text: human }, 1: stored })
  })

  it('works without a prior record', () => {
    expect(mergeQualityEntries(null, [{ text: 'a', audio: 'm' }], new Set([0]), new Set([0])))
      .toEqual({ 0: { text: human, audio: human } })
  })
})
