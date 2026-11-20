import type { Entry } from '@/modules/facts/facts.schema'

export type QualityAspectName = 'text' | 'audio'

export interface QualityAspect {
  score: number
  model: string
  /** 人工确认者（服务器写入） */
  by?: string
  fingerprint?: string
}

export type QualityEntries = Record<string, Partial<Record<QualityAspectName, QualityAspect>>>

export interface FactQuality {
  fact_id: string
  entries: QualityEntries
  updated_at: string
}

export interface QualityStats {
  verified_aspects: number
  total_aspects: number
  verified_facts: number
  total_facts: number
}

export type FactIdsResponseDTO = BaseApiResult<{ fact_ids: string[] }>
export type QualityStatsResponseDTO = BaseApiResult<QualityStats>
export type FactQualityResponseDTO = BaseApiResult<{ quality: FactQuality }>

export interface PutFactQualityDTO {
  entries: QualityEntries
}

export type QaReviewSubmissionResponseDTO = BaseApiResult<{
  contribution_id: string
  qa_review: { facts: number, aspects: number }
}>

export const HUMAN_MODEL = 'human'
export const HUMAN_SCORE = 10

/** 条目中可评分的方面（非空 text / audio） */
export function scoreableAspects(entry: Entry | undefined): QualityAspectName[] {
  const aspects: QualityAspectName[] = []
  if (entry?.text?.trim()) aspects.push('text')
  if (entry?.audio?.trim()) aspects.push('audio')
  return aspects
}

/**
 * PUT 用的 entries（整体替换）：勾选列的可评分方面写入 human/10，
 * 已有的 human 确认原样回传（保留 `by`，不改签名人）；
 * 未勾选的活动列撤回 human 确认但保留其它评分；非活动列原样保留。
 */
export function mergeQualityEntries(
  quality: FactQuality | null,
  entries: Entry[],
  checked: Set<number>,
  active: Set<number>,
): QualityEntries {
  const merged: QualityEntries = {}
  entries.forEach((entry, i) => {
    const prior = quality?.entries[String(i)] ?? {}
    if (!active.has(i)) {
      if (Object.keys(prior).length) merged[String(i)] = prior
      return
    }
    const aspects: Partial<Record<QualityAspectName, QualityAspect>> = {}
    if (checked.has(i)) {
      for (const aspect of scoreableAspects(entry)) {
        const stored = prior[aspect]
        aspects[aspect] = stored?.model === HUMAN_MODEL ? stored : { score: HUMAN_SCORE, model: HUMAN_MODEL }
      }
    }
    for (const [aspect, score] of Object.entries(prior) as [QualityAspectName, QualityAspect][]) {
      if (aspects[aspect] || score.model === HUMAN_MODEL) continue
      aspects[aspect] = score
    }
    if (Object.keys(aspects).length) merged[String(i)] = aspects
  })
  return merged
}
