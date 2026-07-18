import type { Entry } from '@/modules/facts/facts.schema'
import z from 'zod'

/**
 * 再次发布时用于确认目标版本的表单校验。
 */
export function createPublishDeckVersionSchema(currentVersion: number, errorMessage: string) {
  return z.object({
    version: z.coerce.number().int(errorMessage).min(currentVersion + 1, errorMessage),
  })
}

export interface PublishDeckActionPayload {
  deckId: string
  currentVersion: number
}

export interface PublishDeckActionData {
  version?: number
  publishedVersion?: number
}

/**
 * 卡组目录条目（可导入的已发布公开卡组）
 */
export interface DeckCatalogItem {
  /** 源卡组 ID，作为 source_deck_id 传给导入接口 */
  id: string
  /** 卡组名称（来自最新已发布快照清单） */
  name: string
  /** 卡组描述（快照中为空时省略） */
  description?: string
  /** 作者用户名 */
  owner: string
  /** 字段列表（来自最新已发布快照清单） */
  fields: string[]
  /** 源卡组上的最新发布版本号 */
  published_version: number
  /** 该快照中的词条数 */
  fact_count: number
  /** 快照中的卡组标签名（无标签时省略） */
  deck_tag_names?: string[]
  /** 该快照创建的 UTC 时间 */
  published_at: string
}

/**
 * 获取卡组目录的查询参数
 */
export interface GetDeckCatalogDTO {
  /** 每页条数，默认 50，最大 200 */
  limit?: number
  /** 跳过条数，默认 0 */
  offset?: number
  /** 对卡组名、描述、所有者用户名、卡组标签名做不区分大小写的子串匹配 */
  query?: string
}

/**
 * 卡组目录列表响应 DTO
 */
export type DeckCatalogListResponseDTO = PaginationResult<{ decks: DeckCatalogItem[] }>

/**
 * 单条卡组目录记录响应 DTO
 */
export type DeckCatalogItemResponseDTO = BaseApiResult<DeckCatalogItem>

/**
 * 发布卡组请求 DTO
 */
export interface PublishDeckDTO {
  /** 首次发布必填，须为 "public" */
  visibility?: 'public'
  /** 再次发布的版本号，必须大于当前版本 */
  published_version?: number
}

/**
 * 发布卡组响应 DTO
 */
export type PublishDeckResponseDTO = BaseApiResult<{
  /** 发布后的版本号 */
  published_version: number
  /** 可见性 */
  visibility: 'public'
}>

/**
 * 导入已发布卡组请求 DTO
 */
export interface ImportDeckDTO {
  /** 源卡组 ID */
  source_deck_id: string
}

/**
 * 导入已发布卡组响应 DTO
 */
export type ImportDeckResponseDTO = BaseApiResult<{
  /** 导入卡组 ID */
  id: string
  /** 源卡组 ID */
  source_deck_id: string
  /** 钉住的源卡组版本号 */
  source_version: number
  /** 导入时间 */
  imported_at: string
}>

/**
 * 词条摘要（新增 / 移除的词条）
 */
export interface DeckUpdateFactSummary {
  /** 词条 ID */
  fact_id: string
}

/**
 * 变更前后的词条内容
 */
export interface DeckUpdateFactSnapshot {
  /** 词条 ID */
  id: string
  /** 条目列表 */
  entries: Entry[]
}

/**
 * 内容有变更的词条
 */
export interface DeckUpdateEditedFact {
  /** 词条 ID */
  fact_id: string
  /** 变更前内容 */
  before: DeckUpdateFactSnapshot
  /** 变更后内容 */
  after: DeckUpdateFactSnapshot
}

/**
 * 媒体变更
 */
export interface DeckUpdateMediaChange {
  /** 媒体 ID */
  media_id: string
  /** 变更前哈希 */
  before_hash: string
  /** 变更后哈希 */
  after_hash: string
  /** 变更前字节数 */
  before_bytes: number
  /** 变更后字节数 */
  after_bytes: number
}

/**
 * 获取导入更新（差异）响应 DTO
 */
export type DeckImportUpdatesResponseDTO = BaseApiResult<{
  /** 导入卡组钉住的源版本号 */
  source_version: number
  /** 源卡组最新发布版本号 */
  latest_version: number
  /** 新增的词条 */
  added_facts: DeckUpdateFactSummary[]
  /** 移除的词条 */
  removed_facts: DeckUpdateFactSummary[]
  /** 内容变更的词条 */
  edited_facts: DeckUpdateEditedFact[]
  /** 媒体变更 */
  media_changes: DeckUpdateMediaChange[]
  /** 变更摘要 */
  change_summary: string
}>

/**
 * 同步导入卡组请求 DTO
 */
export interface SyncImportedDeckDTO {
  /** 目标发布版本；省略或为 0 时推进到源卡组当前最新发布版本 */
  target_version?: number
}

/**
 * 同步导入卡组响应 DTO
 */
export type SyncImportedDeckResponseDTO = BaseApiResult<{
  /** 同步后钉住的源版本号 */
  source_version: number
}>

/**
 * 反馈分类
 */
export type DeckFeedbackCategory = 'translation' | 'audio' | 'typo' | 'other'

/**
 * 反馈状态
 */
export type DeckFeedbackStatus = 'open' | 'resolved' | 'dismissed'

/**
 * 反馈（导入者对作者词条提出的反馈）
 */
export interface DeckFeedback {
  /** 反馈 ID */
  feedback_id: string
  /** 源卡组 ID */
  source_deck_id: string
  /** 词条 ID */
  fact_id: string
  /** 反馈分类 */
  category: DeckFeedbackCategory
  /** 反馈信息（未提供 proposed_entries 时必填，1-2000 字符） */
  message?: string
  /** 条目索引 */
  entry_index?: number
  /** 建议的条目内容（与词条 PATCH 的 entries 同形，须与快照不同） */
  proposed_entries?: Entry[]
  /** 反馈状态 */
  status: DeckFeedbackStatus
}

/**
 * 提交反馈请求 DTO
 */
export interface CreateDeckFeedbackDTO {
  /** 词条 ID */
  fact_id: string
  /** 反馈分类，默认 other */
  category?: DeckFeedbackCategory
  /** 反馈信息（未提供 proposed_entries 时必填，1-2000 字符） */
  message?: string
  /** 条目索引 */
  entry_index?: number
  /** 建议的条目内容（与词条 PATCH 的 entries 同形，须与快照不同） */
  proposed_entries?: Entry[]
}

/**
 * 提交反馈响应 DTO
 */
export type CreateDeckFeedbackResponseDTO = BaseApiResult<{
  /** 反馈 ID */
  feedback_id: string
  /** 源卡组 ID */
  source_deck_id: string
  /** 词条 ID */
  fact_id: string
  /** 反馈状态 */
  status: DeckFeedbackStatus
}>

/**
 * 获取反馈列表的查询参数
 */
export interface GetDeckFeedbackDTO {
  /** 按状态筛选 */
  status?: DeckFeedbackStatus
  /** 按词条 ID 筛选 */
  fact_id?: string
  /** 每页条数 */
  limit?: number
  /** 跳过条数 */
  offset?: number
}

/**
 * 反馈列表响应 DTO
 */
export type DeckFeedbackListResponseDTO = PaginationResult<{ feedback: DeckFeedback[] }>

/**
 * 更新反馈状态请求 DTO
 */
export interface UpdateDeckFeedbackStatusDTO {
  /** 新状态 */
  status: DeckFeedbackStatus
}

/**
 * 单条反馈响应 DTO
 */
export type DeckFeedbackResponseDTO = BaseApiResult<{ feedback: DeckFeedback }>
