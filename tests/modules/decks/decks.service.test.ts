import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as decksApi from '@/api/decks'
import * as tagApi from '@/api/tag'
import { updateImportedDeckService } from '@/modules/decks/decks.service'

vi.mock('@/api/decks', () => ({
  updateImportedDeck: vi.fn(),
}))

vi.mock('@/api/tag', () => ({
  associateTagToDeck: vi.fn(),
  removeTagFromDeck: vi.fn(),
}))

describe('decks service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(decksApi.updateImportedDeck).mockResolvedValue({} as never)
    vi.mocked(tagApi.associateTagToDeck).mockResolvedValue({} as never)
    vi.mocked(tagApi.removeTagFromDeck).mockResolvedValue({} as never)
  })

  it('updates imported deck rate and manages tags through separate endpoints', async () => {
    await updateImportedDeckService('import-deck-id', {
      rate: 30,
      default_tag_ids: ['removed-tag', 'kept-tag'],
      tag_ids: ['kept-tag', 'added-tag'],
    })

    expect(decksApi.updateImportedDeck).toHaveBeenCalledWith('import-deck-id', { rate: 30 })
    expect(tagApi.associateTagToDeck).toHaveBeenCalledWith('import-deck-id', 'added-tag')
    expect(tagApi.removeTagFromDeck).toHaveBeenCalledWith('import-deck-id', 'removed-tag')
  })
})
