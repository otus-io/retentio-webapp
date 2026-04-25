import z from 'zod'

/**
 * 词条条目
 */
export interface Entry {
  /** 文本内容 */
  text?: string;
  /** 音频 ID */
  audio?: string;
  /** 图片 ID */
  image?: string;
  /** 视频 ID */
  video?: string;
}

/**
 * 标签信息
 */
export interface TagInfo {
  /** 标签 ID */
  id: string;
  /** 标签名称 */
  name: string;
  /** 标签描述 */
  description: string;
}

/**
 * 词条
 */
export interface Fact {
  /** 词条 ID */
  id: string;
  /** 条目列表 */
  entries: Entry[];
  /** 字段名列表 */
  fields: string[];
  /** 标签列表 */
  tags: TagInfo[];
}



/**
 * 添加词条请求 DTO
 */
export const createFactsSchema = z.object({
  facts: z.array(z.object({
    entries: z.array(z.object({
      text: z.string().optional(),
      audio: z.string().optional(),
      image: z.string().optional(),
      video: z.string().optional(),
    })).min(1, 'At least one entry is required'),
    fields: z.array(z.string()).optional(),
  })).min(1, 'At least one fact is required'),
  template: z.array(z.array(z.array(z.number()))).optional(),
})

export type CreateFactsDTO = z.infer<typeof createFactsSchema>

/**
 * 更新词条请求 DTO
 */
export const updateFactSchema = z.object({
  entries: z.array(z.object({
    text: z.string().optional(),
    audio: z.string().optional(),
    image: z.string().optional(),
    video: z.string().optional(),
  })).optional(),
  fields: z.array(z.string()).optional(),
})

export type UpdateFactDTO = z.infer<typeof updateFactSchema>

/**
 * 添加词条响应 DTO
 */
export type CreateFactsResponseDTO = BaseApiResult<{ fact_length: number }>

/**
 * 获取词条列表响应 DTO
 */
export type FactsListResponseDTO = PaginationResult<{ facts: Fact[] }>

/**
 * 获取单个词条响应 DTO
 */
export type FactResponseDTO = BaseApiResult<{ fact: Fact }>

/**
 * 更新词条响应 DTO
 */
export type UpdateFactResponseDTO = BaseApiResult<{ fact_id: string }>

/**
 * 删除词条响应 DTO
 */
export type DeleteFactResponseDTO = BaseApiResult<{ fact_id: string }>
