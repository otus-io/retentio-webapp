import { describe, expect, it, vi } from 'vitest'
import * as factsApi from '@/api/facts'
import * as qualityApi from '@/api/quality'
import { getFactIdsService, getFactsPageService } from '@/modules/facts/facts.service'
import { RequestError } from '@/utils/request'

vi.mock('@/api/facts', () => ({ getFactsPage: vi.fn() }))
vi.mock('@/api/quality', () => ({ getFactIds: vi.fn() }))

describe('getFactIdsService', () => {
  it('wraps success and failure', async () => {
    vi.mocked(qualityApi.getFactIds).mockResolvedValueOnce({ data: { fact_ids: ['a'] }, meta: { msg: 'ok' } } as never)
    expect(await getFactIdsService('d1')).toMatchObject({ success: true, data: { fact_ids: ['a'] } })
    expect(qualityApi.getFactIds).toHaveBeenCalledWith('d1')
    vi.mocked(qualityApi.getFactIds).mockRejectedValueOnce(new RequestError('Not found', 404))
    expect(await getFactIdsService('d1')).toMatchObject({ success: false, status: 404 })
  })
})

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
