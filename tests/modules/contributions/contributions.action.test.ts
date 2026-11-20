import { describe, expect, it, vi } from 'vitest'

const getContributionsService = vi.hoisted(() => vi.fn())

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/modules/contributions/contributions.service', () => ({ getContributionsService }))

import { getContributionsAction } from '@/modules/contributions/contributions.action'

describe('getContributionsAction', () => {
  it('returns a page of the inbox with its total', async () => {
    getContributionsService.mockResolvedValueOnce({
      success: true,
      data: { contributions: [{ id: 'c1' }] },
      meta: { total: 7 },
    })
    expect(await getContributionsAction('s1', 'open')).toEqual({
      success: true,
      data: { contributions: [{ id: 'c1' }], total: 7 },
    })
    expect(getContributionsService).toHaveBeenCalledWith('s1', { status: 'open', limit: 20, offset: 0 })
  })

  it('returns the error', async () => {
    getContributionsService.mockResolvedValueOnce({ success: false, message: 'Forbidden' })
    expect(await getContributionsAction('s1')).toEqual({ success: false, error: 'Forbidden' })
  })
})
