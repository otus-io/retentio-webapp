import { describe, expect, it, vi } from 'vitest'

const getContributionsService = vi.hoisted(() => vi.fn())
const submitDeckContributionsBatchService = vi.hoisted(() => vi.fn())

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/modules/contributions/contributions.service', () => ({
  getContributionsService,
  submitDeckContributionsBatchService,
}))

import {
  getOpenContributionsAction,
  submitDeckContributionsBatchAction,
} from '@/modules/contributions/contributions.action'

describe('getOpenContributionsAction', () => {
  it('returns a page of open contributions and whether more follow', async () => {
    getContributionsService.mockResolvedValueOnce({
      success: true,
      data: { contributions: [{ id: 'c1' }] },
      meta: { has_more: true },
    })
    expect(await getOpenContributionsAction('s1', 50)).toEqual({
      success: true,
      data: { contributions: [{ id: 'c1' }], hasMore: true },
    })
    expect(getContributionsService).toHaveBeenCalledWith('s1', { status: 'open', limit: 50, offset: 50 })
  })

  it('starts at the first page and returns errors', async () => {
    getContributionsService.mockResolvedValueOnce({ success: false, message: 'Forbidden' })
    expect(await getOpenContributionsAction('s1')).toEqual({ success: false, error: 'Forbidden' })
    expect(getContributionsService).toHaveBeenLastCalledWith('s1', { status: 'open', limit: 50, offset: 0 })
  })
})

describe('submitDeckContributionsBatchAction', () => {
  it('passes a trimmed message, and none when it is blank', async () => {
    submitDeckContributionsBatchService.mockResolvedValue({ success: true, data: { submitted: [], failed: [] } })
    const submit = (message?: string) =>
      submitDeckContributionsBatchAction({ importDeckId: 'i1', contributions: [], message }, null, new FormData())
    await submit('  hi ')
    expect(submitDeckContributionsBatchService).toHaveBeenLastCalledWith('i1', [], 'hi')
    await submit('   ')
    expect(submitDeckContributionsBatchService).toHaveBeenLastCalledWith('i1', [], undefined)
    await submit()
    expect(submitDeckContributionsBatchService).toHaveBeenLastCalledWith('i1', [], undefined)
  })
})
