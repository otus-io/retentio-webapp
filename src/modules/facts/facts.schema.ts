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
  /**
   * @deprecated
   */
  fields: string[];
  /** 标签列表 */
  tags: TagInfo[];
  /** Imported deck only: a fact the importer added (local_facts); its edits go to the author as fact_add */
  local?: boolean;
}

/**
 *  - append — 追加到末尾，新内容加在现有内容后面
 *  - prepend — 插入到头部，新内容加在现有内容前面
 *  - shuffle — 打乱顺序，随机重排
 *  - spread — 分散/展开，把内容分布到各个位置（类似数组 spread）
 */
const operationSchema = z.enum(['append', 'prepend', 'shuffle', 'spread'])
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
    // fields: z.array(z.string()).optional(),
  })).min(1, 'At least one fact is required'),
  template: z.array(z.array(z.array(z.number()))).optional(),
  operation: operationSchema,
  /** Owner's human sign-off on every text/audio aspect of facts typed in (ignored on imports) */
  verified: z.boolean().optional(),
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
    /** Kept so a PATCH round-trips entries that carry structured data (a JSON string) */
    json: z.string().optional(),
  })).optional(),
  fields: z.array(z.string()).optional(),
})

export type UpdateFactDTO = z.infer<typeof updateFactSchema>

/**
 * 添加词条响应 DTO
 */
export type CreateFactsResponseDTO = BaseApiResult<{ fact_length: number; fact_ids?: string[] }>

/** GET /facts order: id ascending, or created_at oldest first */
export type FactsSort = 'id' | 'created_at'

export interface FactsPageParams {
  limit?: number
  offset?: number
  sort?: FactsSort
}

/**
 * 获取词条列表响应 DTO
 */
export type FactsListResponseDTO = PaginationResult<{ facts: Fact[] }>

/**
 * 获取单个词条响应 DTO
 */
export type FactResponseDTO = BaseApiResult<{
  fact: Fact
  /** Import decks: media id → published snapshot pin for `GET /api/media/{id}?v=` */
  media_versions?: Record<string, number>
}>

/**
 * 更新词条响应 DTO
 */
export type UpdateFactResponseDTO = BaseApiResult<{ fact_id: string }>

/**
 * 删除词条响应 DTO
 */
export type DeleteFactResponseDTO = BaseApiResult<{ fact_id: string }>
