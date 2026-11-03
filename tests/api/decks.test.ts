import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '@/utils/request'
import { createDeck, deleteDeck, getAllDecks, getDeck, updateDeck, updateImportedDeck } from '@/api/decks'

vi.mock('@/utils/request', () => ({
  request: vi.fn(),
}))

describe('decks api', () => {
  beforeEach(() => {
    vi.mocked(request).mockReset()
  })

  it('only sends rate when updating an imported deck', () => {
    updateImportedDeck('import-deck-id', { rate: 30 })

    expect(request).toHaveBeenCalledWith('/api/decks/import-deck-id', {
      method: 'PATCH',
      body: JSON.stringify({ rate: 30 }),
    })
  })

  it('lists every deck', async () => {
    const decks = [{ id: 'deck-1' }]
    vi.mocked(request).mockResolvedValue(decks)

    await expect(getAllDecks()).resolves.toBe(decks)
    expect(request).toHaveBeenCalledWith('/api/decks')
  })

  it('loads one deck by id', () => {
    getDeck('deck-1')

    expect(request).toHaveBeenCalledWith('/api/decks/deck-1')
  })

  it('creates a deck', () => {
    createDeck({ name: 'Spanish', fields: ['front', 'back'], rate: 20 })

    expect(request).toHaveBeenCalledWith('/api/decks', {
      method: 'POST',
      body: JSON.stringify({ name: 'Spanish', fields: ['front', 'back'], rate: 20 }),
    })
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('updates a deck', () => {
    updateDeck('deck-1', { name: 'Spanish', fields: ['front', 'back'], rate: 40 })

    expect(request).toHaveBeenCalledWith('/api/decks/deck-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Spanish', fields: ['front', 'back'], rate: 40 }),
    })
  })

  it('deletes a deck', () => {
    deleteDeck('deck-1')

    expect(request).toHaveBeenCalledWith('/api/decks/deck-1', {
      method: 'DELETE',
    })
  })
})
