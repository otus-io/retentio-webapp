import * as decksApi from '@/api/decks'
import * as tagApi from '@/api/tag'
import { ServiceResponse } from '@/lib/response'
import type { CreateOrUpdateDeckDTO } from '@/modules/decks/decks.schema'

/**
 * 获取所有卡组的服务函数
 */
export async function getAllDecksService() {
  try {
    return ServiceResponse.success(await decksApi.getAllDecks())
  } catch (e) {
    return ServiceResponse.error('getAllDecksService failed', e)
  }
}

/**
 * 获取卡组
 */
export async function getDeckService(deckId: string) {
  try {
    return ServiceResponse.success(await decksApi.getDeck(deckId))
  } catch (e) {
    return ServiceResponse.error('getDeckService failed', e)
  }
}

/**
 * 创建卡组
 */
export async function createDeckService(data: CreateOrUpdateDeckDTO) {
  try {
    return ServiceResponse.success(await decksApi.createDeck(data))
  } catch (e) {
    return ServiceResponse.error('createDeckService failed', e)
  }
}

export async function updateDeckService(deckId: string, data: CreateOrUpdateDeckDTO) {
  try {
    const {
      default_tag_ids = [],
      tag_ids = [],
    } = data
    const addTags = Array.from(new Set(tag_ids.filter((t) => !default_tag_ids.includes(t))))
    const deleteTags = Array.from(new Set(default_tag_ids.filter((t) => !tag_ids.includes(t))))
    const results = await Promise.allSettled([
      ...addTags.map((e) => tagApi.associateTagToDeck(deckId, e)),
      ...deleteTags.map((e) => tagApi.removeTagFromDeck(deckId, e)),
      decksApi.updateDeck(deckId, data),
    ])
    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length > 0) {
      return ServiceResponse.error('updateDeckService error', failed[0].reason)
    }
    return ServiceResponse.success({ data: {}, meta: { msg: 'deleteFactsService success' } })
  } catch (e) {
    return ServiceResponse.error('updateDeckService failed', e)
  }
}

/**
 * 删除卡组
 */
export async function deleteDeckService(deckId: string) {
  try {
    return ServiceResponse.success(await decksApi.deleteDeck(deckId))
  } catch (e) {
    return ServiceResponse.error('deleteDeckService failed', e)
  }
}



/**
 * 获取 tags
 */
export async function getDeckTagsService(deckId: string) {
  try {
    return ServiceResponse.success(await tagApi.getDeckTags(deckId))
  } catch (e) {
    return ServiceResponse.error('getDeckTagsService failed', e)
  }
}
