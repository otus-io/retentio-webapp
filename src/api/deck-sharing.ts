import { request } from '@/utils/request'
import type {
  CreateDeckFeedbackDTO,
  CreateDeckFeedbackResponseDTO,
  DeckCatalogItemResponseDTO,
  DeckCatalogListResponseDTO,
  DeckFeedbackListResponseDTO,
  DeckFeedbackResponseDTO,
  DeckImportUpdatesResponseDTO,
  GetDeckCatalogDTO,
  GetDeckFeedbackDTO,
  ImportDeckDTO,
  ImportDeckResponseDTO,
  PublishDeckDTO,
  PublishDeckResponseDTO,
  SyncImportedDeckDTO,
  SyncImportedDeckResponseDTO,
  UpdateDeckFeedbackStatusDTO,
} from '@/modules/deck-sharing/deck-sharing.schema'

/**
 * 获取卡组目录（可导入的已发布公开卡组），无需登录
 */
export function getDeckCatalog(params?: GetDeckCatalogDTO) {
  const search = new URLSearchParams()
  if (params?.limit !== undefined) search.set('limit', String(params.limit))
  if (params?.offset !== undefined) search.set('offset', String(params.offset))
  if (params?.query) search.set('query', params.query)
  const qs = search.toString()
  return request<DeckCatalogListResponseDTO>(`/api/decks/catalog${qs ? `?${qs}` : ''}`)
}

/**
 * 获取单条卡组目录记录，无需登录
 */
export function getDeckCatalogItem(sourceDeckId: string) {
  return request<DeckCatalogItemResponseDTO>(`/api/decks/catalog/${sourceDeckId}`)
}

/**
 * 发布卡组
 */
export function publishDeck(deckId: string, data?: PublishDeckDTO) {
  return request<PublishDeckResponseDTO>(`/api/decks/${deckId}/publish`, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * 导入已发布卡组
 */
export function importDeck(data: ImportDeckDTO) {
  return request<ImportDeckResponseDTO>('/api/decks/import', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 获取导入卡组的更新差异
 */
export function getDeckImportUpdates(importId: string) {
  return request<DeckImportUpdatesResponseDTO>(`/api/decks/${importId}/updates`)
}

/**
 * 同步导入卡组到最新（或指定）发布版本
 */
export function syncImportedDeck(importId: string, data?: SyncImportedDeckDTO) {
  return request<SyncImportedDeckResponseDTO>(`/api/decks/${importId}/sync`, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * 提交反馈（导入者 → 作者）
 */
export function createDeckFeedback(importDeckId: string, data: CreateDeckFeedbackDTO) {
  return request<CreateDeckFeedbackResponseDTO>(`/api/decks/${importDeckId}/feedback`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 获取源卡组的反馈列表
 */
export function getDeckFeedback(sourceDeckId: string, params?: GetDeckFeedbackDTO) {
  const search = new URLSearchParams()
  if (params?.status) search.set('status', params.status)
  if (params?.fact_id) search.set('fact_id', params.fact_id)
  if (params?.limit !== undefined) search.set('limit', String(params.limit))
  if (params?.offset !== undefined) search.set('offset', String(params.offset))
  const qs = search.toString()
  return request<DeckFeedbackListResponseDTO>(`/api/decks/${sourceDeckId}/feedback${qs ? `?${qs}` : ''}`)
}

/**
 * 更新反馈状态
 */
export function updateDeckFeedbackStatus(sourceDeckId: string, feedbackId: string, data: UpdateDeckFeedbackStatusDTO) {
  return request<DeckFeedbackResponseDTO>(`/api/decks/${sourceDeckId}/feedback/${feedbackId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * 接受反馈（将建议内容应用到作者工作副本）
 */
export function acceptDeckFeedback(sourceDeckId: string, feedbackId: string) {
  return request<DeckFeedbackResponseDTO>(`/api/decks/${sourceDeckId}/feedback/${feedbackId}/accept`, {
    method: 'POST',
  })
}
