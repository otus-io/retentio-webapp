import { request } from '@/utils/request'
import type {
  CreateTagDTO,
  DeleteTagResponseDTO,
  TagFactsResponseDTO,
  TagResponseDTO,
  TagsListResponseDTO,
  TagsResponseDTO,
  UpdateTagDTO,
} from '@/modules/tags/tags.schema'

/**
 * 创建标签
 */
export function createTag(data: CreateTagDTO) {
  return request<TagResponseDTO>('/api/tags', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 列出当前用户的全部标签
 */
export function getAllTags() {
  return request<TagsListResponseDTO>('/api/tags')
}

/**
 * 获取单个标签
 */
export function getTag(tagId: string) {
  return request<TagResponseDTO>(`/api/tags/${tagId}`)
}

/**
 * 更新标签
 */
export function updateTag(tagId: string, data: UpdateTagDTO) {
  return request<TagResponseDTO>(`/api/tags/${tagId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * 删除标签
 */
export function deleteTag(tagId: string) {
  return request<DeleteTagResponseDTO>(`/api/tags/${tagId}`, {
    method: 'DELETE',
  })
}

/**
 * 列出拥有某标签的所有词条（跨卡组）
 */
export function getTagFacts(tagId: string) {
  return request<TagFactsResponseDTO>(`/api/tags/${tagId}/facts`)
}

/**
 * 将标签关联到卡组
 */
export function associateTagToDeck(deckId: string, tagId: string) {
  return request<TagsResponseDTO>(`/api/decks/${deckId}/tags/${tagId}`, {
    method: 'PUT',
  })
}

/**
 * 从卡组移除标签
 */
export function removeTagFromDeck(deckId: string, tagId: string) {
  return request<TagsResponseDTO>(`/api/decks/${deckId}/tags/${tagId}`, {
    method: 'DELETE',
  })
}

/**
 * 列出卡组上的标签
 */
export function getDeckTags(deckId: string) {
  return request<TagsResponseDTO>(`/api/decks/${deckId}/tags`)
}

/**
 * 将标签关联到词条
 */
export function associateTagToFact(deckId: string, factId: string, tagId: string) {
  return request<TagsResponseDTO>(`/api/decks/${deckId}/facts/${factId}/tags/${tagId}`, {
    method: 'PUT',
  })
}

/**
 * 从词条移除标签
 */
export function removeTagFromFact(deckId: string, factId: string, tagId: string) {
  return request<TagsResponseDTO>(`/api/decks/${deckId}/facts/${factId}/tags/${tagId}`, {
    method: 'DELETE',
  })
}

/**
 * 列出词条上的标签
 */
export function getFactTags(deckId: string, factId: string) {
  return request<TagsResponseDTO>(`/api/decks/${deckId}/facts/${factId}/tags`)
}
