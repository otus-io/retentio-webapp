import { request } from '@/utils/request'
import type {
  FactIdsResponseDTO,
  FactQualityResponseDTO,
  PutFactQualityDTO,
  QaReviewSubmissionResponseDTO,
  QualityStatsResponseDTO,
} from '@/modules/quality/quality.schema'

/**
 * 词条 ID 列表；传 unverifiedColumns 时只返回这些列仍待人工确认的词条
 */
export function getFactIds(deckId: string, unverifiedColumns?: number[]) {
  const qs = unverifiedColumns?.length
    ? `?${new URLSearchParams({ unverified_columns: unverifiedColumns.join(',') })}`
    : ''
  return request<FactIdsResponseDTO>(`/api/decks/${deckId}/facts/ids${qs}`)
}

/**
 * 卡组 QA 进度
 */
export function getQualityStats(deckId: string) {
  return request<QualityStatsResponseDTO>(`/api/decks/${deckId}/quality/stats`)
}

/**
 * 单个词条的质量记录（无记录时 404）
 */
export function getFactQuality(deckId: string, factId: string) {
  return request<FactQualityResponseDTO>(`/api/decks/${deckId}/facts/${factId}/quality`)
}

/**
 * 整体替换词条质量记录
 */
export function putFactQuality(deckId: string, factId: string, data: PutFactQualityDTO) {
  return request<FactQualityResponseDTO>(`/api/decks/${deckId}/facts/${factId}/quality`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * 导入者请求作者采纳自己的 QA 确认
 */
export function submitQaReview(importDeckId: string) {
  return request<QaReviewSubmissionResponseDTO>(`/api/decks/${importDeckId}/contributions/qa-review`, {
    method: 'POST',
  })
}
