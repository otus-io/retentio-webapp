import { request } from '@/utils/request'
import type {
  CreateOrUpdateDeckDTO,
  CreateOrUpdateDeckResponseDTO,
  DeckResponseDTO,
  DecksListResponseDTO,
  DeleteDeckResponseDTO,
} from '@/modules/decks/decks.schema'

/**
 * 获取所有卡组
 */
export function getAllDecks() {
  return request<DecksListResponseDTO>('/api/decks')
}

/**
 * 获取单个卡组
 */
export function getDeck(deckId: string) {
  return request<DeckResponseDTO>(`/api/decks/${deckId}`)
}

/**
 * 创建卡组
 */
export function createDeck(data: CreateOrUpdateDeckDTO) {
  return request<CreateOrUpdateDeckResponseDTO>('/api/decks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 更新卡组
 */
export function updateDeck(deckId: string, data: CreateOrUpdateDeckDTO) {
  return request<CreateOrUpdateDeckResponseDTO>(`/api/decks/${deckId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * 删除卡组
 */
export function deleteDeck(deckId: string) {
  return request<DeleteDeckResponseDTO>(`/api/decks/${deckId}`, {
    method: 'DELETE',
  })
}
