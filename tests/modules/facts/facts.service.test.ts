import { describe, expect, it, vi } from 'vitest'
import * as factsApi from '@/api/facts'
import { getFactsPageService } from '@/modules/facts/facts.service'
import { RequestError } from '@/utils/request'

vi.mock('@/api/facts', () => ({ getFactsPage: vi.fn() }))

describe('getFactsPageService', () => {
  it('passes limit, offset and sort through', async () => {
    vi.mocked(factsApi.getFactsPage).mockResolvedValueOnce({ data: { facts: [] }, meta: { msg: 'ok', total: 0 } } as never)
    const params = { limit: 100, offset: 200, sort: 'created_at' } as const
    expect(await getFactsPageService('d1', params)).toMatchObject({ success: true, data: { facts: [] } })
    expect(factsApi.getFactsPage).toHaveBeenCalledWith('d1', params)
    vi.mocked(factsApi.getFactsPage).mockRejectedValueOnce(new RequestError('Bad sort', 400))
    expect(await getFactsPageService('d1')).toMatchObject({ success: false, status: 400 })
  })
})
