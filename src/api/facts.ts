import { request } from '@/utils/request'
import type {
  CreateFactsDTO,
  CreateFactsResponseDTO,
  DeleteFactResponseDTO,
  FactResponseDTO,
  FactsListResponseDTO,
  UpdateFactDTO,
  UpdateFactResponseDTO,
} from '@/modules/facts/facts.schema'

/**
 * 分页获取词条列表
 */
export function getFactsPage(deckId: string, params?: { limit?: number; offset?: number }) {
  const query = new URLSearchParams()
  if (params?.limit !== undefined) query.set('limit', String(params.limit))
  if (params?.offset !== undefined) query.set('offset', String(params.offset))
  const qs = query.toString()
  return request<FactsListResponseDTO>(`/api/decks/${deckId}/facts${qs ? `?${qs}` : ''}`)
}

/**
 * 获取单个词条
 */
export function getFact(deckId: string, factId: string) {
  return request<FactResponseDTO>(`/api/decks/${deckId}/facts/${factId}`)
}

/**
 * 批量添加词条
 */
export function createFacts(deckId: string, data: CreateFactsDTO) {
  return request<CreateFactsResponseDTO>(`/api/decks/${deckId}/facts/${data.operation}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 更新词条
 */
export function updateFact(deckId: string, factId: string, data: UpdateFactDTO) {
  return request<UpdateFactResponseDTO>(`/api/decks/${deckId}/facts/${factId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * 删除词条
 */
export function deleteFact(deckId: string, factId: string) {
  return request<DeleteFactResponseDTO>(`/api/decks/${deckId}/facts/${factId}`, {
    method: 'DELETE',
  })
}
