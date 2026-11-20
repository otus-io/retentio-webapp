import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '@/utils/request'
import { deleteCard, getCardStats, getNextCard, getReviewsByDay, hideCard, reviewCard } from '@/api/cards'

vi.mock('@/utils/request', () => ({
  request: vi.fn(),
}))

describe('cards api', () => {
  beforeEach(() => {
    vi.mocked(request).mockReset()
  })

  it('gets the next card with and without a tag filter', () => {
    getNextCard('d1')
    expect(request).toHaveBeenLastCalledWith('/api/decks/d1/card')
    getNextCard('d1', 'tag 1')
    expect(request).toHaveBeenLastCalledWith('/api/decks/d1/card?tag_id=tag+1')
  })

  it('reviews a card', () => {
    reviewCard('d1', { card_id: 'c1', interval: 600, last_review: 100 })
    expect(request).toHaveBeenCalledWith('/api/decks/d1/card', {
      method: 'PATCH',
      body: JSON.stringify({ card_id: 'c1', interval: 600, last_review: 100 }),
    })
  })

  it('hides a card', () => {
    hideCard('d1', 'c1')
    expect(request).toHaveBeenCalledWith('/api/decks/d1/card', {
      method: 'PATCH',
      body: JSON.stringify({ card_id: 'c1', hidden: true }),
    })
  })

  it('deletes a card', () => {
    deleteCard('d1', 'c1')
    expect(request).toHaveBeenCalledWith('/api/decks/d1/cards/c1', { method: 'DELETE' })
  })

  it('gets stats only, optionally per tag', () => {
    getCardStats('d1')
    expect(request).toHaveBeenLastCalledWith('/api/decks/d1/cards?stats_only=true')
    getCardStats('d1', 't1')
    expect(request).toHaveBeenLastCalledWith('/api/decks/d1/cards?stats_only=true&tag_id=t1')
  })

  it('gets reviews by day', () => {
    getReviewsByDay('d1', 30)
    expect(request).toHaveBeenCalledWith('/api/decks/d1/reviews/by-day?days=30')
  })
})
