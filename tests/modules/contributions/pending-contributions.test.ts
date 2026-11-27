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

  it('accepts queued fact tag changes whose id matches the fact', () => {
    const base = { preview: 'p', savedAt: 't', kind: 'fact_tags', factId: 'f1' }
    expect(isPendingContribution({ ...base, id: 'fact_tags:f1', addTags: ['a'], removeTags: [] })).toBe(true)
    expect(isPendingContribution({ ...base, id: 'fact_tags:f2', addTags: ['a'], removeTags: [] })).toBe(false)
    expect(isPendingContribution({ ...base, id: 'fact_tags:f1', addTags: ['a'] })).toBe(false)
  })

  it('accepts a queued description suggestion and checks its note', () => {
    const base = { id: 'description_edit', kind: 'description_edit', preview: 'p', savedAt: 't' }
    expect(isPendingContribution({ ...base, proposedDescription: 'New', message: 'why' })).toBe(true)
    expect(isPendingContribution({ ...base })).toBe(false)
    expect(isPendingContribution({ ...base, proposedDescription: 'New', message: 3 })).toBe(false)
  })

  it('accepts sent records of every kind', () => {
    const base = { id: 'x', preview: 'p', contributionId: 'c', sentAt: 't' }
    for (const kind of ['deck_tags', 'field_rename', 'description_edit', 'fact_edit', 'fact_add', 'fact_tags']) {
      expect(isSentContribution({ ...base, kind })).toBe(true)
    }
    expect(isSentContribution({ ...base, kind: 'report' })).toBe(false)
  })

  it('previews entry texts, shortening long ones', () => {
    expect(previewFromEntries([{ text: ' hola ' }, {}, { text: 'hello' }])).toBe('hola · hello')
    expect(previewFromEntries([{ text: 'x'.repeat(100) }])).toHaveLength(80)
  })
})
