import * as cardsApi from '@/api/cards'
import { ServiceResponse } from '@/lib/response'

export async function getNextCardService(deckId: string, tagId?: string) {
  try {
    return ServiceResponse.success(await cardsApi.getNextCard(deckId, tagId))
  } catch (e) {
    return ServiceResponse.error('getNextCardService failed', e)
  }
}

export async function reviewCardService(deckId: string, cardId: string, interval: number) {
  try {
    return ServiceResponse.success(await cardsApi.reviewCard(deckId, {
      card_id: cardId,
      interval: Math.round(interval),
      last_review: Math.floor(Date.now() / 1000),
    }))
  } catch (e) {
    return ServiceResponse.error('reviewCardService failed', e)
  }
}

export async function hideCardService(deckId: string, cardId: string) {
  try {
    return ServiceResponse.success(await cardsApi.hideCard(deckId, cardId))
  } catch (e) {
    return ServiceResponse.error('hideCardService failed', e)
  }
}

export async function deleteCardService(deckId: string, cardId: string) {
  try {
    return ServiceResponse.success(await cardsApi.deleteCard(deckId, cardId))
  } catch (e) {
    return ServiceResponse.error('deleteCardService failed', e)
  }
}

export async function getCardStatsService(deckId: string, tagId?: string) {
  try {
    return ServiceResponse.success(await cardsApi.getCardStats(deckId, tagId))
  } catch (e) {
    return ServiceResponse.error('getCardStatsService failed', e)
  }
}

export async function getReviewsByDayService(deckId: string, days: number) {
  try {
    return ServiceResponse.success(await cardsApi.getReviewsByDay(deckId, days))
  } catch (e) {
    return ServiceResponse.error('getReviewsByDayService failed', e)
  }
}
