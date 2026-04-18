import { request } from '@/utils/request'

import { ServiceResponse } from '@/lib/response'
import { DecksListResponseDTO } from '@/modules/decks/decks.schema'

/**
 * 获取所有卡组的服务函数
 */
export async function getAllDecksService(){
  try {
    const decks = await request<DecksListResponseDTO>('/api/decks')
    return ServiceResponse.success(decks)
  } catch (e){
    return ServiceResponse.error('getAllDecksService failed', e)
  }
}
