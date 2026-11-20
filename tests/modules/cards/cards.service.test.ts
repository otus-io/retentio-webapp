import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as cardsApi from '@/api/cards'
import {
  deleteCardService,
  getCardStatsService,
  getNextCardService,
  getReviewsByDayService,
  hideCardService,
  reviewCardService,
} from '@/modules/cards/cards.service'
import { RequestError } from '@/utils/request'

vi.mock('@/api/cards', () => ({
  getNextCard: vi.fn(),
  reviewCard: vi.fn(),
  hideCard: vi.fn(),
  deleteCard: vi.fn(),
  getCardStats: vi.fn(),
  getReviewsByDay: vi.fn(),
}))

const ok = { data: {}, meta: { msg: 'ok' } }

describe('cards service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it.each([
    ['getNextCardService', () => getNextCardService('d1', 't1'), cardsApi.getNextCard, ['d1', 't1']],
    ['hideCardService', () => hideCardService('d1', 'c1'), cardsApi.hideCard, ['d1', 'c1']],
    ['deleteCardService', () => deleteCardService('d1', 'c1'), cardsApi.deleteCard, ['d1', 'c1']],
    ['getCardStatsService', () => getCardStatsService('d1', 't1'), cardsApi.getCardStats, ['d1', 't1']],
    ['getReviewsByDayService', () => getReviewsByDayService('d1', 7), cardsApi.getReviewsByDay, ['d1', 7]],
  ] as const)('%s wraps success and failure', async (_, call, api, args) => {
    vi.mocked(api).mockResolvedValueOnce(ok as never)
    expect(await call()).toMatchObject({ success: true })
    expect(api).toHaveBeenCalledWith(...args)
    vi.mocked(api).mockRejectedValueOnce(new RequestError('boom', 500))
    expect(await call()).toMatchObject({ success: false, message: 'boom', status: 500 })
  })

  it('reviewCardService rounds the interval and stamps last_review', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(1_700_000_000_500))
    vi.mocked(cardsApi.reviewCard).mockResolvedValueOnce(ok as never)
    expect(await reviewCardService('d1', 'c1', 600.4)).toMatchObject({ success: true })
    expect(cardsApi.reviewCard).toHaveBeenCalledWith('d1', { card_id: 'c1', interval: 600, last_review: 1_700_000_000 })
    vi.mocked(cardsApi.reviewCard).mockRejectedValueOnce(new RequestError('bad interval', 400))
    expect(await reviewCardService('d1', 'c1', 1)).toMatchObject({ success: false, message: 'bad interval' })
  })
})
