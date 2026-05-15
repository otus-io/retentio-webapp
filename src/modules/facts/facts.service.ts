import { request } from '@/utils/request'

import { ServiceResponse } from '@/lib/response'
import type {
  CreateFactsDTO,
  CreateFactsResponseDTO,
  FactResponseDTO,
  FactsListResponseDTO,
  UpdateFactDTO,
  UpdateFactResponseDTO,
  DeleteFactResponseDTO,
} from '@/modules/facts/facts.schema'

/**
 * 获取词条列表
 */
export async function getFactsPageService(deckId: string, params?: { limit?: number; offset?: number }) {
  try {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))
    const qs = query.toString()
    const endpoint = `/api/decks/${deckId}/facts${qs ? `?${qs}` : ''}`
    const res = await request<FactsListResponseDTO>(endpoint)
    return ServiceResponse.success(res)
  } catch (e) {
    return ServiceResponse.error('getAllFactsService failed', e)
  }
}

/**
 * 获取单个词条
 */
export async function getFactService(deckId: string, factId: string) {
  try {
    const res = await request<FactResponseDTO>(`/api/decks/${deckId}/facts/${factId}`)
    return ServiceResponse.success(res)
  } catch (e) {
    return ServiceResponse.error('getFactService failed', e)
  }
}

/**
 * 添加词条
 */
export async function createFactsService(deckId: string, data: CreateFactsDTO) {
  try {
    const res = await request<CreateFactsResponseDTO>(`/api/decks/${deckId}/facts/${data.operation}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return ServiceResponse.success(res)
  } catch (e) {
    return ServiceResponse.error('createFactsService failed', e)
  }
}

/**
 * 更新词条
 */
export async function updateFactService(deckId: string, factId: string, data: UpdateFactDTO) {
  try {
    const res = await request<UpdateFactResponseDTO>(`/api/decks/${deckId}/facts/${factId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    return ServiceResponse.success(res)
  } catch (e) {
    return ServiceResponse.error('updateFactService failed', e)
  }
}

/**
 * 删除词条
 */
export async function deleteFactService(deckId: string, factId: string) {
  try {
    const res = await request<DeleteFactResponseDTO>(`/api/decks/${deckId}/facts/${factId}`, {
      method: 'DELETE',
    })
    return ServiceResponse.success(res)
  } catch (e) {
    return ServiceResponse.error('deleteFactService failed', e)
  }
}

/**
 * 删除词条批量
 */
export async function deleteFactsService(deckId: string, factIds: string[]) {
  try {
    await Promise.allSettled(factIds.map((factId) => request<DeleteFactResponseDTO>(
      `/api/decks/${deckId}/facts/${factId}`,
      { method: 'DELETE' },
    )))
    return ServiceResponse.success({ data: {}, meta: { msg: 'deleteFactsService success' } })
  } catch (e) {
    return ServiceResponse.error('deleteFactService failed', e)
  }
}

