import * as factsApi from '@/api/facts'
import { ServiceResponse } from '@/lib/response'
import type { CreateFactsDTO, UpdateFactDTO } from '@/modules/facts/facts.schema'

/**
 * 获取词条列表
 */
export async function getFactsPageService(deckId: string, params?: { limit?: number; offset?: number }) {
  try {
    return ServiceResponse.success(await factsApi.getFactsPage(deckId, params))
  } catch (e) {
    return ServiceResponse.error('getFactsPageService failed', e)
  }
}

/**
 * 获取单个词条
 */
export async function getFactService(deckId: string, factId: string) {
  try {
    return ServiceResponse.success(await factsApi.getFact(deckId, factId))
  } catch (e) {
    return ServiceResponse.error('getFactService failed', e)
  }
}

/**
 * 添加词条
 */
export async function createFactsService(deckId: string, data: CreateFactsDTO) {
  try {
    return ServiceResponse.success(await factsApi.createFacts(deckId, data))
  } catch (e) {
    return ServiceResponse.error('createFactsService failed', e)
  }
}

/**
 * 更新词条
 */
export async function updateFactService(deckId: string, factId: string, data: UpdateFactDTO) {
  try {
    return ServiceResponse.success(await factsApi.updateFact(deckId, factId, data))
  } catch (e) {
    return ServiceResponse.error('updateFactService failed', e)
  }
}

/**
 * 删除词条
 */
export async function deleteFactService(deckId: string, factId: string) {
  try {
    return ServiceResponse.success(await factsApi.deleteFact(deckId, factId))
  } catch (e) {
    return ServiceResponse.error('deleteFactService failed', e)
  }
}

/**
 * 删除词条批量
 */
export async function deleteFactsService(deckId: string, factIds: string[]) {
  try {
    await Promise.allSettled(factIds.map((factId) => factsApi.deleteFact(deckId, factId)))
    return ServiceResponse.success({ data: {}, meta: { msg: 'deleteFactsService success' } })
  } catch (e) {
    return ServiceResponse.error('deleteFactsService failed', e)
  }
}
