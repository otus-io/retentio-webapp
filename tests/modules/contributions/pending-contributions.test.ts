import { describe, expect, it } from 'vitest'
import {
  isPendingContribution,
  isSentContribution,
  previewFromEntries,
} from '@/modules/contributions/pending-contributions'

describe('pending contribution storage', () => {
  it('accepts queued fact edits and additions whose id matches the fact', () => {
    const base = { preview: 'p', savedAt: 't' }
    expect(isPendingContribution({ ...base, id: 'fact_edit:f1', kind: 'fact_edit', factId: 'f1' })).toBe(true)
    expect(isPendingContribution({ ...base, id: 'fact_add:f2', kind: 'fact_add', factId: 'f2' })).toBe(true)
    expect(isPendingContribution({ ...base, id: 'fact_edit:other', kind: 'fact_edit', factId: 'f1' })).toBe(false)
    expect(isPendingContribution({ ...base, id: 'fact_edit:f1', kind: 'fact_edit' })).toBe(false)
  })

  it('accepts sent records of every kind', () => {
    const base = { id: 'x', preview: 'p', contributionId: 'c', sentAt: 't' }
    for (const kind of ['deck_tags', 'field_rename', 'fact_edit', 'fact_add']) {
      expect(isSentContribution({ ...base, kind })).toBe(true)
    }
    expect(isSentContribution({ ...base, kind: 'report' })).toBe(false)
  })

  it('previews entry texts, shortening long ones', () => {
    expect(previewFromEntries([{ text: ' hola ' }, {}, { text: 'hello' }])).toBe('hola · hello')
    expect(previewFromEntries([{ text: 'x'.repeat(100) }])).toHaveLength(80)
  })
})
