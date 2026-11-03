import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as decksApi from '@/api/decks'
import * as tagApi from '@/api/tag'
import {
  createDeckService,
  deleteDeckService,
  getAllDecksService,
  getDeckService,
  getDeckTagsService,
  updateDeckService,
  updateImportedDeckService,
} from '@/modules/decks/decks.service'

vi.mock('@/api/decks', () => ({
  getAllDecks: vi.fn(),
  getDeck: vi.fn(),
  createDeck: vi.fn(),
  updateDeck: vi.fn(),
  updateImportedDeck: vi.fn(),
  deleteDeck: vi.fn(),
}))

vi.mock('@/api/tag', () => ({
  associateTagToDeck: vi.fn(),
  removeTagFromDeck: vi.fn(),
  getDeckTags: vi.fn(),
}))

describe('decks service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(decksApi.getAllDecks).mockResolvedValue({
      data: { decks: [] },
      meta: { total: '0', msg: 'ok' },
    } as never)
    vi.mocked(decksApi.getDeck).mockResolvedValue({
      data: { id: 'deck-1', name: 'Spanish' },
      meta: { msg: 'deck ok' },
    } as never)
    vi.mocked(decksApi.createDeck).mockResolvedValue({
      data: { deck_id: 'deck-1' },
      meta: { msg: 'created' },
    } as never)
    vi.mocked(decksApi.updateDeck).mockResolvedValue({
      data: { deck_id: 'deck-1' },
      meta: { msg: 'updated' },
    } as never)
    vi.mocked(decksApi.updateImportedDeck).mockResolvedValue({} as never)
    vi.mocked(decksApi.deleteDeck).mockResolvedValue({
      data: { deck_id: 'deck-1' },
      meta: { msg: 'deleted' },
    } as never)
    vi.mocked(tagApi.associateTagToDeck).mockResolvedValue({} as never)
    vi.mocked(tagApi.removeTagFromDeck).mockResolvedValue({} as never)
    vi.mocked(tagApi.getDeckTags).mockResolvedValue({
      data: { tags: [] },
      meta: { msg: 'tags ok' },
    } as never)
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

  it('updates an imported deck when tag lists are omitted', async () => {
    const res = await updateImportedDeckService('import-deck-id', { rate: 10 })

    expect(decksApi.updateImportedDeck).toHaveBeenCalledWith('import-deck-id', { rate: 10 })
    expect(tagApi.associateTagToDeck).not.toHaveBeenCalled()
    expect(tagApi.removeTagFromDeck).not.toHaveBeenCalled()
    expect(res).toEqual({
      success: true,
      data: {},
      message: null,
      status: null,
      meta: { msg: 'updateImportedDeckService success' },
    })
  })

  it('returns the first rejection when an imported deck update fails', async () => {
    vi.mocked(tagApi.associateTagToDeck).mockResolvedValue({} as never)
    vi.mocked(decksApi.updateImportedDeck).mockRejectedValue(new Error('rate rejected'))

    const res = await updateImportedDeckService('import-deck-id', {
      rate: 30,
      default_tag_ids: ['removed-tag', 'kept-tag'],
      tag_ids: ['kept-tag', 'added-tag'],
    })

    expect(tagApi.associateTagToDeck).toHaveBeenCalledWith('import-deck-id', 'added-tag')
    expect(tagApi.removeTagFromDeck).toHaveBeenCalledWith('import-deck-id', 'removed-tag')
    expect(res).toEqual({
      success: false,
      data: null,
      message: 'rate rejected',
      status: null,
      meta: { msg: 'updateImportedDeckService error' },
    })
  })

  it('returns a failure when updating an imported deck throws', async () => {
    vi.mocked(decksApi.updateImportedDeck).mockImplementation(() => {
      throw new Error('sync import')
    })

    const res = await updateImportedDeckService('import-deck-id', { rate: 10 })

    expect(res).toEqual({
      success: false,
      data: null,
      message: 'sync import',
      status: null,
      meta: { msg: 'updateImportedDeckService failed' },
    })
  })

  it('returns every deck from the api', async () => {
    vi.mocked(decksApi.getAllDecks).mockResolvedValue({
      data: { decks: [{ id: 'd1' }] },
      meta: { total: '1', msg: 'listed' },
    } as never)

    const res = await getAllDecksService()

    expect(decksApi.getAllDecks).toHaveBeenCalledOnce()
    expect(res).toEqual({
      success: true,
      data: { decks: [{ id: 'd1' }] },
      message: null,
      status: null,
      meta: { total: '1', msg: 'listed' },
    })
  })

  it('returns a failure when listing decks rejects', async () => {
    vi.mocked(decksApi.getAllDecks).mockRejectedValue(new Error('list failed'))

    const res = await getAllDecksService()

    expect(res).toEqual({
      success: false,
      data: null,
      message: 'list failed',
      status: null,
      meta: { msg: 'getAllDecksService failed' },
    })
  })

  it('merges deck tags into the deck response', async () => {
    vi.mocked(decksApi.getDeck).mockResolvedValue({
      data: {
        id: 'deck-1',
        name: 'Spanish',
        tags: [{ id: 'old', name: 'old', description: '' }],
      },
      meta: { msg: 'deck ok' },
    } as never)
    vi.mocked(tagApi.getDeckTags).mockResolvedValue({
      data: { tags: [{ id: 't1', name: 'verb', description: 'verbs' }] },
      meta: { msg: 'tags ok' },
    } as never)

    const res = await getDeckService('deck-1')

    expect(decksApi.getDeck).toHaveBeenCalledWith('deck-1')
    expect(tagApi.getDeckTags).toHaveBeenCalledWith('deck-1')
    expect(res).toEqual({
      success: true,
      data: {
        id: 'deck-1',
        name: 'Spanish',
        tags: [{ id: 't1', name: 'verb', description: 'verbs' }],
      },
      message: null,
      status: null,
      meta: { msg: 'deck ok' },
    })
  })

  it('returns the first rejected reason when loading a deck fails', async () => {
    vi.mocked(decksApi.getDeck).mockRejectedValue(new Error('missing deck'))
    vi.mocked(tagApi.getDeckTags).mockResolvedValue({
      data: { tags: [] },
      meta: { msg: 'tags ok' },
    } as never)

    const res = await getDeckService('deck-1')

    expect(res).toEqual({
      success: false,
      data: null,
      message: 'missing deck',
      status: null,
      meta: { msg: 'getDeckService error' },
    })
  })

  it('returns the tag error when the deck loads but its tags do not', async () => {
    vi.mocked(decksApi.getDeck).mockResolvedValue({
      data: { id: 'deck-1', name: 'Spanish' },
      meta: { msg: 'deck ok' },
    } as never)
    vi.mocked(tagApi.getDeckTags).mockRejectedValue(new Error('missing tags'))

    const res = await getDeckService('deck-1')

    expect(res).toEqual({
      success: false,
      data: null,
      message: 'missing tags',
      status: null,
      meta: { msg: 'getDeckService error' },
    })
  })

  it('returns a failure when loading a deck throws', async () => {
    vi.mocked(decksApi.getDeck).mockImplementation(() => {
      throw new Error('sync deck')
    })

    const res = await getDeckService('deck-1')

    expect(res).toEqual({
      success: false,
      data: null,
      message: 'sync deck',
      status: null,
      meta: { msg: 'getDeckService failed' },
    })
  })

  it('creates a deck and returns the api payload', async () => {
    const data = { name: 'Spanish', fields: ['front', 'back'], rate: 20 }
    vi.mocked(decksApi.createDeck).mockResolvedValue({
      data: { deck_id: 'deck-9' },
      meta: { msg: 'created' },
    } as never)

    const res = await createDeckService(data)

    expect(decksApi.createDeck).toHaveBeenCalledWith(data)
    expect(res).toEqual({
      success: true,
      data: { deck_id: 'deck-9' },
      message: null,
      status: null,
      meta: { msg: 'created' },
    })
  })

  it('returns a failure when creating a deck rejects', async () => {
    vi.mocked(decksApi.createDeck).mockRejectedValue(new Error('create failed'))

    const res = await createDeckService({
      name: 'Spanish',
      fields: ['front', 'back'],
      rate: 20,
    })

    expect(res).toEqual({
      success: false,
      data: null,
      message: 'create failed',
      status: null,
      meta: { msg: 'createDeckService failed' },
    })
  })

  it('updates a deck without tag changes when tag lists are omitted', async () => {
    const data = { name: 'Spanish', fields: ['front', 'back'], rate: 5 }

    const res = await updateDeckService('deck-1', data)

    expect(decksApi.updateDeck).toHaveBeenCalledWith('deck-1', data)
    expect(tagApi.associateTagToDeck).not.toHaveBeenCalled()
    expect(tagApi.removeTagFromDeck).not.toHaveBeenCalled()
    expect(res).toEqual({
      success: true,
      data: {},
      message: null,
      status: null,
      meta: { msg: 'deleteFactsService success' },
    })
  })

  it('adds and removes each tag once, then updates the deck', async () => {
    const data = {
      name: 'Spanish',
      fields: ['front', 'back'],
      rate: 20,
      default_tag_ids: ['removed', 'kept', 'removed'],
      tag_ids: ['kept', 'added', 'added'],
    }

    const res = await updateDeckService('deck-1', data)

    expect(tagApi.associateTagToDeck).toHaveBeenCalledTimes(1)
    expect(tagApi.associateTagToDeck).toHaveBeenCalledWith('deck-1', 'added')
    expect(tagApi.removeTagFromDeck).toHaveBeenCalledTimes(1)
    expect(tagApi.removeTagFromDeck).toHaveBeenCalledWith('deck-1', 'removed')
    expect(decksApi.updateDeck).toHaveBeenCalledWith('deck-1', data)
    expect(res).toEqual({
      success: true,
      data: {},
      message: null,
      status: null,
      meta: { msg: 'deleteFactsService success' },
    })
  })

  it('returns the first tag failure and still attempts the deck update', async () => {
    vi.mocked(tagApi.associateTagToDeck).mockRejectedValue(new Error('associate failed'))
    vi.mocked(decksApi.updateDeck).mockRejectedValue(new Error('update failed'))
    const data = {
      name: 'Spanish',
      fields: ['front', 'back'],
      rate: 20,
      default_tag_ids: ['removed'],
      tag_ids: ['added'],
    }

    const res = await updateDeckService('deck-1', data)

    expect(tagApi.removeTagFromDeck).toHaveBeenCalledWith('deck-1', 'removed')
    expect(decksApi.updateDeck).toHaveBeenCalledWith('deck-1', data)
    expect(res).toEqual({
      success: false,
      data: null,
      message: 'associate failed',
      status: null,
      meta: { msg: 'updateDeckService error' },
    })
  })

  it('returns a failure when updating a deck throws', async () => {
    vi.mocked(decksApi.updateDeck).mockImplementation(() => {
      throw new Error('sync update')
    })

    const res = await updateDeckService('deck-1', {
      name: 'Spanish',
      fields: ['front', 'back'],
      rate: 5,
    })

    expect(res).toEqual({
      success: false,
      data: null,
      message: 'sync update',
      status: null,
      meta: { msg: 'updateDeckService failed' },
    })
  })

  it('deletes a deck and returns the api payload', async () => {
    vi.mocked(decksApi.deleteDeck).mockResolvedValue({
      data: { deck_id: 'deck-1' },
      meta: { msg: 'deleted' },
    } as never)

    const res = await deleteDeckService('deck-1')

    expect(decksApi.deleteDeck).toHaveBeenCalledWith('deck-1')
    expect(res).toEqual({
      success: true,
      data: { deck_id: 'deck-1' },
      message: null,
      status: null,
      meta: { msg: 'deleted' },
    })
  })

  it('returns a failure when deleting a deck rejects', async () => {
    vi.mocked(decksApi.deleteDeck).mockRejectedValue(new Error('delete failed'))

    const res = await deleteDeckService('deck-1')

    expect(res).toEqual({
      success: false,
      data: null,
      message: 'delete failed',
      status: null,
      meta: { msg: 'deleteDeckService failed' },
    })
  })

  it('returns the tags attached to a deck', async () => {
    vi.mocked(tagApi.getDeckTags).mockResolvedValue({
      data: { tags: [{ id: 't1', name: 'verb', description: '' }] },
      meta: { msg: 'tags ok' },
    } as never)

    const res = await getDeckTagsService('deck-1')

    expect(tagApi.getDeckTags).toHaveBeenCalledWith('deck-1')
    expect(res).toEqual({
      success: true,
      data: { tags: [{ id: 't1', name: 'verb', description: '' }] },
      message: null,
      status: null,
      meta: { msg: 'tags ok' },
    })
  })

  it('returns a failure when loading deck tags rejects', async () => {
    vi.mocked(tagApi.getDeckTags).mockRejectedValue(new Error('tags failed'))

    const res = await getDeckTagsService('deck-1')

    expect(res).toEqual({
      success: false,
      data: null,
      message: 'tags failed',
      status: null,
      meta: { msg: 'getDeckTagsService failed' },
    })
  })
})
