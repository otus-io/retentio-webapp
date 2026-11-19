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
    const contribution = { id: 'local-1', kind: 'deck_tags', addTags: ['a'], removeTags: [] } as unknown as PendingDeckContribution
    const res = await submitDeckContributionsBatchService('import-1', [contribution])
    expect(res.success && res.data.failed).toEqual([
      { localId: 'local-1', error: 'Email verification required', code: 'email_not_verified' },
    ])
  })
})
