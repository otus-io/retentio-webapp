import { request } from '@/utils/request'

import { ServiceResponse } from '@/lib/response'
import { CreateOrUpdateDeckDTO, CreateOrUpdateDeckResponseDTO, DeckResponseDTO, DecksListResponseDTO, DeleteDeckResponseDTO } from '@/modules/decks/decks.schema'

/**
 * 获取所有卡组的服务函数
 */
export async function getAllDecksService(){
  try {
    const decks = await request<DecksListResponseDTO>('/api/decks')
    return ServiceResponse.success(decks)
  } catch (e){
    return ServiceResponse.error('getAllDecksService failed', e)
  }
}


/**
 * 获取卡组
 */
export async function getDeckService(deckId: string){
  try {
    const res = await request<DeckResponseDTO>(`/api/decks/${deckId}`)
    return ServiceResponse.success(res)
  } catch (e){
    return ServiceResponse.error('getDeckService failed', e)
  }
}


/**
 * 创建卡组
 */
export async function createDeckService(data: CreateOrUpdateDeckDTO){
  try {
    const deck = await request<CreateOrUpdateDeckResponseDTO>('/api/decks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return ServiceResponse.success(deck)
  } catch (e){
    return ServiceResponse.error('createDeckService failed', e)
  }
}

export async function updateDeckService(deckId: string, data: CreateOrUpdateDeckDTO){
  try {
    const deck = await request<CreateOrUpdateDeckResponseDTO>(`/api/decks/${deckId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    return ServiceResponse.success(deck)
  } catch (e){
    return ServiceResponse.error('updateDeckService failed', e)
  }
}


/**
 * 删除卡组
 */
export async function deleteDeckService(deckId: string){
  try {
    const res = await request<DeleteDeckResponseDTO>(`/api/decks/${deckId}`, {
      method: 'DELETE',
    })
    return ServiceResponse.success(res)
  } catch (e){
    return ServiceResponse.error('deleteDeckService failed', e)
  }
}
