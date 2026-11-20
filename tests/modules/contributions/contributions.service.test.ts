import { describe, expect, it, vi } from 'vitest'
import * as contributionsApi from '@/api/contributions'
import { submitDeckContributionsBatchService } from '@/modules/contributions/contributions.service'
import type { PendingDeckContribution } from '@/modules/contributions/contributions.schema'
import { RequestError } from '@/utils/request'

vi.mock('@/api/contributions', () => ({
  submitDeckTagContribution: vi.fn(),
  submitFieldRenameContribution: vi.fn(),
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
})
