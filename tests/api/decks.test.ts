import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '@/utils/request'
import { updateImportedDeck } from '@/api/decks'

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
})
