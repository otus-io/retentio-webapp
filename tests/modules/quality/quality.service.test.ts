import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as factsApi from '@/api/facts'
import * as qualityApi from '@/api/quality'
import {
  getQaFactService,
  getQualityStatsService,
  getUnverifiedFactIdsService,
  putFactQualityService,
  submitQaReviewService,
} from '@/modules/quality/quality.service'
import { RequestError } from '@/utils/request'

vi.mock('@/api/facts', () => ({ getFact: vi.fn() }))
vi.mock('@/api/quality', () => ({
  getFactIds: vi.fn(),
  getQualityStats: vi.fn(),
  getFactQuality: vi.fn(),
  putFactQuality: vi.fn(),
  submitQaReview: vi.fn(),
}))

const ok = { data: {}, meta: { msg: 'ok' } }
const fact = { id: 'f1', entries: [{ text: 'a' }] }
const quality = { fact_id: 'f1', entries: {}, updated_at: '' }

describe('quality service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    ['getUnverifiedFactIdsService', () => getUnverifiedFactIdsService('d1', [0]), qualityApi.getFactIds, ['d1', [0]]],
    ['getQualityStatsService', () => getQualityStatsService('d1'), qualityApi.getQualityStats, ['d1']],
    ['putFactQualityService', () => putFactQualityService('d1', 'f1', {}), qualityApi.putFactQuality, ['d1', 'f1', { entries: {} }]],
    ['submitQaReviewService', () => submitQaReviewService('i1'), qualityApi.submitQaReview, ['i1']],
  ] as const)('%s wraps success and failure', async (_, call, api, args) => {
    vi.mocked(api).mockResolvedValueOnce(ok as never)
    expect(await call()).toMatchObject({ success: true })
    expect(api).toHaveBeenCalledWith(...args)
    vi.mocked(api).mockRejectedValueOnce(new RequestError('boom', 500))
    expect(await call()).toMatchObject({ success: false, message: 'boom' })
  })

  it('getQaFactService returns the fact and its quality', async () => {
    vi.mocked(factsApi.getFact).mockResolvedValue({ data: { fact }, meta: { msg: 'ok' } } as never)
    vi.mocked(qualityApi.getFactQuality).mockResolvedValue({ data: { quality }, meta: { msg: 'ok' } })
    expect(await getQaFactService('d1', 'f1')).toMatchObject({ success: true, data: { fact, quality } })
  })

  it('getQaFactService treats a missing quality record as null', async () => {
    vi.mocked(factsApi.getFact).mockResolvedValue({ data: { fact }, meta: { msg: 'ok' } } as never)
    vi.mocked(qualityApi.getFactQuality).mockRejectedValue(new RequestError('Quality not found', 404))
    expect(await getQaFactService('d1', 'f1')).toMatchObject({ success: true, data: { fact, quality: null } })
  })

  it('getQaFactService fails on other quality errors so a PUT cannot wipe the record', async () => {
    vi.mocked(factsApi.getFact).mockResolvedValue({ data: { fact }, meta: { msg: 'ok' } } as never)
    vi.mocked(qualityApi.getFactQuality).mockRejectedValue(new RequestError('Error retrieving quality', 500))
    expect(await getQaFactService('d1', 'f1')).toMatchObject({ success: false, message: 'Error retrieving quality' })
  })
})
