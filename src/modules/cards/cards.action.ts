'use server'

import type { CardStats, NextCardResponseDTO } from '@/modules/cards/cards.schema'
import {
  deleteCardService,
  getCardStatsService,
  getNextCardService,
  hideCardService,
  reviewCardService,
} from '@/modules/cards/cards.service'

interface CardPayload {
  deckId: string
  cardId: string
}

export interface NextCardResult {
  card: NextCardResponseDTO['data'] | null
  stats: CardStats | null
}

/** 获取下一张卡片与（同一过滤条件下的）统计 */
export async function getNextCardAction(deckId: string, tagId?: string): Promise<ActionState<NextCardResult>> {
  const [card, stats] = await Promise.all([
    getNextCardService(deckId, tagId),
    getCardStatsService(deckId, tagId),
  ])
  if (!card.success) return { success: false, error: card.message }
  return { success: true, data: { card: card.data, stats: stats.success ? stats.data.stats : null } }
}

/** 提交复习 */
export async function reviewCardAction({ deckId, cardId, interval }: CardPayload & { interval: number }): Promise<ActionState> {
  const res = await reviewCardService(deckId, cardId, interval)
  if (!res.success) return { success: false, error: res.message }
  return { success: true }
}

/** 隐藏卡片 */
export async function hideCardAction({ deckId, cardId }: CardPayload): Promise<ActionState> {
  const res = await hideCardService(deckId, cardId)
  if (!res.success) return { success: false, error: res.message }
  return { success: true }
}

/** 删除卡片 */
export async function deleteCardAction({ deckId, cardId }: CardPayload): Promise<ActionState> {
  const res = await deleteCardService(deckId, cardId)
  if (!res.success) return { success: false, error: res.message }
  return { success: true }
}
