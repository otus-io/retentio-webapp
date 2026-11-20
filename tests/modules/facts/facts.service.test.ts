import { describe, expect, it, vi } from 'vitest'
import * as qualityApi from '@/api/quality'
import { getFactIdsService } from '@/modules/facts/facts.service'
import { RequestError } from '@/utils/request'

vi.mock('@/api/facts', () => ({}))
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
