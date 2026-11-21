import { describe, expect, it, vi } from 'vitest'
import * as contributionsApi from '@/api/contributions'
import { submitDeckContributionsBatchService } from '@/modules/contributions/contributions.service'
import type { PendingDeckContribution } from '@/modules/contributions/contributions.schema'
import { RequestError } from '@/utils/request'

vi.mock('@/api/contributions', () => ({
  submitDeckTagContribution: vi.fn(),
  submitFieldRenameContribution: vi.fn(),
  submitDescriptionContribution: vi.fn(),
  submitFactEditContribution: vi.fn(),
  submitFactAddContribution: vi.fn(),
}))

describe('submitDeckContributionsBatchService', () => {
  it('keeps the backend error code on failed items', async () => {
    vi.mocked(contributionsApi.submitDeckTagContribution).mockRejectedValue(
      new RequestError('Email verification required', 403, 'email_not_verified'),
    )
    const contribution = {
      id: 'local-1',
      kind: 'deck_tags',
      addTags: ['a'],
      removeTags: [],
    } as unknown as PendingDeckContribution
    const res = await submitDeckContributionsBatchService('import-1', [contribution])
    expect(res.success && res.data.failed).toEqual([
      { localId: 'local-1', error: 'Email verification required', code: 'email_not_verified' },
    ])
  })

  it('sends the optional message with every contribution in the batch', async () => {
    const created = (id: string) => ({ data: { contribution_id: id } }) as never
    vi.mocked(contributionsApi.submitDeckTagContribution).mockResolvedValue(created('c1'))
    vi.mocked(contributionsApi.submitFieldRenameContribution).mockResolvedValue(created('c2'))
    const tags = {
      id: 'deck_tags',
      kind: 'deck_tags',
      addTags: ['a'],
      removeTags: ['b'],
    } as unknown as PendingDeckContribution
    const rename = {
      id: 'field_rename',
      kind: 'field_rename',
      proposedFields: ['Word'],
    } as unknown as PendingDeckContribution

    const res = await submitDeckContributionsBatchService('import-1', [tags, rename], 'Thanks!')
    expect(res.success && res.data.submitted.map((item) => item.contributionId)).toEqual(['c1', 'c2'])
    expect(vi.mocked(contributionsApi.submitDeckTagContribution).mock.lastCall?.[1])
      .toEqual({ add_tags: ['a'], remove_tags: ['b'], message: 'Thanks!' })
    expect(vi.mocked(contributionsApi.submitFieldRenameContribution).mock.lastCall?.[1])
      .toEqual({ proposed_fields: ['Word'], message: 'Thanks!' })

    await submitDeckContributionsBatchService('import-1', [rename])
    expect(vi.mocked(contributionsApi.submitFieldRenameContribution).mock.lastCall?.[1])
      .toEqual({ proposed_fields: ['Word'] })
  })

  it('sends a description suggestion with its own note unless the batch has one', async () => {
    vi.mocked(contributionsApi.submitDescriptionContribution).mockResolvedValue({ data: { contribution_id: 'd1' } } as never)
    const description = {
      id: 'description_edit',
      kind: 'description_edit',
      proposedDescription: 'Everyday verbs',
      message: 'clearer',
    } as unknown as PendingDeckContribution

    const res = await submitDeckContributionsBatchService('import-1', [description])
    expect(res.success && res.data.submitted).toEqual([
      { localId: 'description_edit', kind: 'description_edit', contributionId: 'd1' },
    ])
    expect(contributionsApi.submitDescriptionContribution)
      .toHaveBeenLastCalledWith('import-1', { proposed_description: 'Everyday verbs', message: 'clearer' })

    await submitDeckContributionsBatchService('import-1', [description], 'typed now')
    expect(contributionsApi.submitDescriptionContribution)
      .toHaveBeenLastCalledWith('import-1', { proposed_description: 'Everyday verbs', message: 'typed now' })

    vi.mocked(contributionsApi.submitDescriptionContribution).mockRejectedValue(new RequestError('Offline', 0))
    const failed = await submitDeckContributionsBatchService('import-1', [description])
    expect(failed.success && failed.data.failed).toEqual([
      expect.objectContaining({ localId: 'description_edit', error: 'Offline' }),
    ])
  })

  it('sends queued fact edits and new facts to their endpoints', async () => {
    const made = (id: string) => ({ data: { contribution_id: id } }) as never
    vi.mocked(contributionsApi.submitFactEditContribution).mockResolvedValue(made('e1'))
    vi.mocked(contributionsApi.submitFactAddContribution).mockResolvedValue(made('a1'))
    const edit = { id: 'fact_edit:f1', kind: 'fact_edit', factId: 'f1' } as unknown as PendingDeckContribution
    const add = { id: 'fact_add:f2', kind: 'fact_add', factId: 'f2' } as unknown as PendingDeckContribution
    const res = await submitDeckContributionsBatchService('import-1', [edit, add], 'note')
    expect(res.success && res.data.submitted.map((s) => s.contributionId)).toEqual(['e1', 'a1'])
    expect(contributionsApi.submitFactEditContribution).toHaveBeenCalledWith('import-1', 'f1', { message: 'note' })
    expect(contributionsApi.submitFactAddContribution).toHaveBeenCalledWith('import-1', 'f2', { message: 'note' })
  })
})
