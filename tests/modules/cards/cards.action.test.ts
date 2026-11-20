import { beforeEach, describe, expect, it, vi } from 'vitest'

const services = vi.hoisted(() => ({
  getNextCardService: vi.fn(),
  getCardStatsService: vi.fn(),
  reviewCardService: vi.fn(),
  hideCardService: vi.fn(),
  deleteCardService: vi.fn(),
}))

vi.mock('@/modules/cards/cards.service', () => services)

import { deleteCardAction, getNextCardAction, hideCardAction, reviewCardAction } from '@/modules/cards/cards.action'

const stats = { due_cards: 3 }

describe('cards actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getNextCardAction returns the card and stats', async () => {
    services.getNextCardService.mockResolvedValue({ success: true, data: { card: { id: 'c1' } } })
    services.getCardStatsService.mockResolvedValue({ success: true, data: { stats } })
    expect(await getNextCardAction('d1', 't1')).toEqual({
      success: true,
      data: { card: { card: { id: 'c1' } }, stats },
    })
    expect(services.getNextCardService).toHaveBeenCalledWith('d1', 't1')
    expect(services.getCardStatsService).toHaveBeenCalledWith('d1', 't1')
  })

  it('getNextCardAction tolerates missing stats', async () => {
    services.getNextCardService.mockResolvedValue({ success: true, data: {} })
    services.getCardStatsService.mockResolvedValue({ success: false, message: 'x' })
    expect(await getNextCardAction('d1')).toEqual({ success: true, data: { card: {}, stats: null } })
  })

  it('getNextCardAction fails when the card request fails', async () => {
    services.getNextCardService.mockResolvedValue({ success: false, message: 'Deck not found' })
    services.getCardStatsService.mockResolvedValue({ success: true, data: { stats } })
    expect(await getNextCardAction('d1')).toEqual({ success: false, error: 'Deck not found' })
  })

  it.each([
    ['reviewCardAction', () => reviewCardAction({ deckId: 'd1', cardId: 'c1', interval: 60 }), services.reviewCardService],
    ['hideCardAction', () => hideCardAction({ deckId: 'd1', cardId: 'c1' }), services.hideCardService],
    ['deleteCardAction', () => deleteCardAction({ deckId: 'd1', cardId: 'c1' }), services.deleteCardService],
  ] as const)('%s reports success and failure', async (_, call, service) => {
    service.mockResolvedValueOnce({ success: true })
    expect(await call()).toEqual({ success: true })
    service.mockResolvedValueOnce({ success: false, message: 'nope' })
    expect(await call()).toEqual({ success: false, error: 'nope' })
  })
})
