import * as factsApi from '@/api/facts'
import * as qualityApi from '@/api/quality'
import { ServiceResponse } from '@/lib/response'
import type { QualityEntries } from '@/modules/quality/quality.schema'
import { RequestError } from '@/utils/request'

export async function getUnverifiedFactIdsService(deckId: string, columns: number[]) {
  try {
    return ServiceResponse.success(await qualityApi.getFactIds(deckId, columns))
  } catch (e) {
    return ServiceResponse.error('getUnverifiedFactIdsService failed', e)
  }
}

export async function getQualityStatsService(deckId: string) {
  try {
    return ServiceResponse.success(await qualityApi.getQualityStats(deckId))
  } catch (e) {
    return ServiceResponse.error('getQualityStatsService failed', e)
  }
}

/**
 * 词条 + 质量记录。质量 404 视为「无记录」；其它失败必须报错，
 * 否则后续整体替换的 PUT 会抹掉读不到的记录。
 */
export async function getQaFactService(deckId: string, factId: string) {
  try {
    const [fact, quality] = await Promise.all([
      factsApi.getFact(deckId, factId),
      qualityApi.getFactQuality(deckId, factId).catch((e: unknown) => {
        if (e instanceof RequestError && e.status === 404) return null
        throw e
      }),
    ])
    return ServiceResponse.success({
      data: { fact: fact.data.fact, quality: quality?.data.quality ?? null },
      meta: { msg: 'ok' },
    })
  } catch (e) {
    return ServiceResponse.error('getQaFactService failed', e)
  }
}

export async function putFactQualityService(deckId: string, factId: string, entries: QualityEntries) {
  try {
    return ServiceResponse.success(await qualityApi.putFactQuality(deckId, factId, { entries }))
  } catch (e) {
    return ServiceResponse.error('putFactQualityService failed', e)
  }
}

export async function submitQaReviewService(importDeckId: string) {
  try {
    return ServiceResponse.success(await qualityApi.submitQaReview(importDeckId))
  } catch (e) {
    return ServiceResponse.error('submitQaReviewService failed', e)
  }
}
