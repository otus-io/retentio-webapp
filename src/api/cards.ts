import { request } from '@/utils/request'
import type { TagsListResponseDTO } from '@/modules/tags/tags.schema'
import type {
  CardStatsResponseDTO,
  DeleteCardResponseDTO,
  HideCardResponseDTO,
  NextCardResponseDTO,
  ReviewCardDTO,
  ReviewCardResponseDTO,
  ReviewsByDayResponseDTO,
} from '@/modules/cards/cards.schema'

/**
 * 获取下一张最紧急的卡片（可按标签过滤）
 */
export function getNextCard(deckId: string, tagId?: string) {
  const qs = tagId ? `?${new URLSearchParams({ tag_id: tagId })}` : ''
  return request<NextCardResponseDTO>(`/api/decks/${deckId}/card${qs}`)
}

/**
 * 提交复习结果（新的间隔秒数）
 */
export function reviewCard(deckId: string, data: ReviewCardDTO) {
  return request<ReviewCardResponseDTO>(`/api/decks/${deckId}/card`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * 隐藏 / 取消隐藏卡片
 */
export function hideCard(deckId: string, cardId: string, hidden = true) {
  return request<HideCardResponseDTO>(`/api/decks/${deckId}/card`, {
    method: 'PATCH',
    body: JSON.stringify({ card_id: cardId, hidden }),
  })
}

/**
 * 删除单张卡片（词条保留）
 */
export function deleteCard(deckId: string, cardId: string) {
  return request<DeleteCardResponseDTO>(`/api/decks/${deckId}/cards/${cardId}`, {
    method: 'DELETE',
  })
}

/**
 * 卡片统计
 */
export function getCardStats(deckId: string, tagId?: string) {
  const search = new URLSearchParams({ stats_only: 'true' })
  if (tagId) search.set('tag_id', tagId)
  return request<CardStatsResponseDTO>(`/api/decks/${deckId}/cards?${search}`)
}

/**
 * 按天统计复习次数（UTC）
 */
export function getReviewsByDay(deckId: string, days: number) {
  return request<ReviewsByDayResponseDTO>(`/api/decks/${deckId}/reviews/by-day?days=${days}`)
}

/**
 * 本卡组词条上实际使用的标签（学习时按 tag_id 过滤）
 */
export function getStudyTags(deckId: string) {
  return request<TagsListResponseDTO>(
    `/api/tags?${new URLSearchParams({ used_on: 'fact', deck_id: deckId, unused: 'exclude' })}`,
  )
}
