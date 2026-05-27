import * as decksApi from '@/api/decks'
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
    return ServiceResponse.success(await decksApi.updateDeck(deckId, data))
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
