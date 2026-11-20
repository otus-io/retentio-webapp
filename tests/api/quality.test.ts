import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '@/utils/request'
import { getFactIds, getFactQuality, getQualityStats, putFactQuality, submitQaReview } from '@/api/quality'

vi.mock('@/utils/request', () => ({
  request: vi.fn(),
}))

describe('quality api', () => {
  beforeEach(() => {
    vi.mocked(request).mockReset()
  })

  it('lists fact ids, optionally unverified in columns', () => {
    getFactIds('d1')
    expect(request).toHaveBeenLastCalledWith('/api/decks/d1/facts/ids')
    getFactIds('d1', [])
    expect(request).toHaveBeenLastCalledWith('/api/decks/d1/facts/ids')
    getFactIds('d1', [0, 2])
    expect(request).toHaveBeenLastCalledWith('/api/decks/d1/facts/ids?unverified_columns=0%2C2')
  })

  it('reads stats and fact quality', () => {
    getQualityStats('d1')
    expect(request).toHaveBeenLastCalledWith('/api/decks/d1/quality/stats')
    getFactQuality('d1', 'f1')
    expect(request).toHaveBeenLastCalledWith('/api/decks/d1/facts/f1/quality')
  })

  it('replaces fact quality', () => {
    const entries = { 0: { text: { score: 10, model: 'human' } } }
    putFactQuality('d1', 'f1', { entries })
    expect(request).toHaveBeenCalledWith('/api/decks/d1/facts/f1/quality', {
      method: 'PUT',
      body: JSON.stringify({ entries }),
    })
  })

  it('submits a qa review request', () => {
    submitQaReview('i1')
    expect(request).toHaveBeenCalledWith('/api/decks/i1/contributions/qa-review', { method: 'POST' })
  })
})
