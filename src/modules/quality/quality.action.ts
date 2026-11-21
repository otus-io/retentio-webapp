'use server'

import type { Fact } from '@/modules/facts/facts.schema'
import type { FactQuality, QualityEntries, QualityStats } from '@/modules/quality/quality.schema'
import {
  getQaFactService,
  getQualityStatsService,
  getUnverifiedFactIdsService,
  putFactQualityService,
  submitQaReviewService,
} from '@/modules/quality/quality.service'

export interface QaWalkStart {
  factIds: string[]
  stats: QualityStats | null
}

/** 开始 QA：列出所选列待确认的词条与进度 */
export async function startQaWalkAction(deckId: string, columns: number[]): Promise<ActionState<QaWalkStart>> {
  const [ids, stats] = await Promise.all([
    getUnverifiedFactIdsService(deckId, columns),
    getQualityStatsService(deckId),
  ])
  if (!ids.success) return { success: false, error: ids.message }
  return { success: true, data: { factIds: ids.data.fact_ids ?? [], stats: stats.success ? stats.data : null } }
}

export async function getQualityStatsAction(deckId: string): Promise<ActionState<QualityStats>> {
  const res = await getQualityStatsService(deckId)
  return res.success ? { success: true, data: res.data } : { success: false, error: res.message }
}

export async function getQaFactAction(
  deckId: string,
  factId: string,
): Promise<ActionState<{ fact: Fact, quality: FactQuality | null }>> {
  const res = await getQaFactService(deckId, factId)
  return res.success ? { success: true, data: res.data } : { success: false, error: res.message }
}

export async function putFactQualityAction(deckId: string, factId: string, entries: QualityEntries): Promise<ActionState> {
  const res = await putFactQualityService(deckId, factId, entries)
  return res.success ? { success: true } : { success: false, error: res.message }
}

/** 导入卡组：把 QA 确认分享给作者 */
export async function submitQaReviewAction(importDeckId: string): Promise<ActionState<{ aspects: number }>> {
  const res = await submitQaReviewService(importDeckId)
  return res.success
    ? { success: true, data: { aspects: res.data.qa_review.aspects } }
    : { success: false, error: res.message }
}
