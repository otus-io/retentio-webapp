import { beforeEach, describe, expect, it, vi } from 'vitest'

const services = vi.hoisted(() => ({
  getUnverifiedFactIdsService: vi.fn(),
  getQualityStatsService: vi.fn(),
  getQaFactService: vi.fn(),
  putFactQualityService: vi.fn(),
  submitQaReviewService: vi.fn(),
}))

vi.mock('@/modules/quality/quality.service', () => services)

import {
  getQaFactAction,
  getQualityStatsAction,
  putFactQualityAction,
  startQaWalkAction,
  submitQaReviewAction,
} from '@/modules/quality/quality.action'

const stats = { verified_aspects: 1, total_aspects: 2, verified_facts: 0, total_facts: 1 }

describe('quality actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('startQaWalkAction returns ids and stats', async () => {
    services.getUnverifiedFactIdsService.mockResolvedValue({ success: true, data: { fact_ids: ['f1'] } })
    services.getQualityStatsService.mockResolvedValue({ success: true, data: stats })
    expect(await startQaWalkAction('d1', [0, 1])).toEqual({ success: true, data: { factIds: ['f1'], stats } })
    expect(services.getUnverifiedFactIdsService).toHaveBeenCalledWith('d1', [0, 1])
  })

  it('startQaWalkAction tolerates missing stats and a null id list', async () => {
    services.getUnverifiedFactIdsService.mockResolvedValue({ success: true, data: {} })
    services.getQualityStatsService.mockResolvedValue({ success: false, message: 'x' })
    expect(await startQaWalkAction('d1', [0])).toEqual({ success: true, data: { factIds: [], stats: null } })
  })

  it('startQaWalkAction fails when ids cannot be listed', async () => {
    services.getUnverifiedFactIdsService.mockResolvedValue({ success: false, message: 'bad columns' })
    services.getQualityStatsService.mockResolvedValue({ success: true, data: stats })
    expect(await startQaWalkAction('d1', [9])).toEqual({ success: false, error: 'bad columns' })
  })

  it('getQualityStatsAction', async () => {
    services.getQualityStatsService.mockResolvedValueOnce({ success: true, data: stats })
    expect(await getQualityStatsAction('d1')).toEqual({ success: true, data: stats })
    services.getQualityStatsService.mockResolvedValueOnce({ success: false, message: 'x' })
    expect(await getQualityStatsAction('d1')).toEqual({ success: false, error: 'x' })
  })

  it('getQaFactAction', async () => {
    const data = { fact: { id: 'f1' }, quality: null }
    services.getQaFactService.mockResolvedValueOnce({ success: true, data })
    expect(await getQaFactAction('d1', 'f1')).toEqual({ success: true, data })
    services.getQaFactService.mockResolvedValueOnce({ success: false, message: 'x' })
    expect(await getQaFactAction('d1', 'f1')).toEqual({ success: false, error: 'x' })
  })

  it('putFactQualityAction', async () => {
    services.putFactQualityService.mockResolvedValueOnce({ success: true })
    expect(await putFactQualityAction('d1', 'f1', {})).toEqual({ success: true })
    expect(services.putFactQualityService).toHaveBeenCalledWith('d1', 'f1', {})
    services.putFactQualityService.mockResolvedValueOnce({ success: false, message: 'x' })
    expect(await putFactQualityAction('d1', 'f1', {})).toEqual({ success: false, error: 'x' })
  })

  it('submitQaReviewAction returns the shared aspect count', async () => {
    services.submitQaReviewService.mockResolvedValueOnce({ success: true, data: { qa_review: { facts: 1, aspects: 4 } } })
    expect(await submitQaReviewAction('i1')).toEqual({ success: true, data: { aspects: 4 } })
    services.submitQaReviewService.mockResolvedValueOnce({ success: false, message: 'nothing to review' })
    expect(await submitQaReviewAction('i1')).toEqual({ success: false, error: 'nothing to review' })
  })
})
