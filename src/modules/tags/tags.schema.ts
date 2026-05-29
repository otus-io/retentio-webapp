import z from 'zod'

export const createOrUpdateTagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
})

export type CreateOrUpdateTagDTO = z.infer<typeof createOrUpdateTagSchema>

/**
 * 标签
 */
export interface Tag {
  /**
   * 标签ID
   */
  id: string
  /**
   * 标签名称
   */
  name: string
  /**
   * 标签描述
   */
  description: string
}

/**
 * 创建标签请求 DTO
 */
export interface CreateTagDTO {
  name: string
  description?: string
}

/**
 * 更新标签请求 DTO
 */
export interface UpdateTagDTO {
  name?: string
  description?: string
}

/**
 * 标签响应 DTO
 */
export type TagResponseDTO = BaseApiResult<{ tag: Tag }>

/**
 * 标签列表响应 DTO
 */
export type TagsListResponseDTO = BaseApiResult<{ tags: Tag[] }>

/**
 * 标签集合响应 DTO（用于卡组/词条上的标签列表）
 */
export type TagsResponseDTO = BaseApiResult<{ tags: Tag[] }>

/**
 * 标签删除响应 DTO
 */
export type DeleteTagResponseDTO = BaseApiResult<{ decks_untagged: number }>

/**
 * 词条基本信息
 */
export interface FactBasic {
  deck_id: string
  fact_id: string
}

/**
 * 标签词条列表响应 DTO
 */
export type TagFactsResponseDTO = BaseApiResult<{ facts: FactBasic[] }>
