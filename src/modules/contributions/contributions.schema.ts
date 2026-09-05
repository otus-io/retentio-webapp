import type { Entry } from '@/modules/facts/facts.schema'

/** 贡献类型 */
export type ContributionType = 'fact_edit' | 'fact_add' | 'fact_tag_update' | 'deck_tag_update' | 'template_add' | 'field_rename' | 'report'

/** 贡献状态 */
export type ContributionStatus = 'open' | 'resolved' | 'dismissed' | 'accepted'

/** 贡献中的原始词条 */
export interface ReportedFact {
  /** 词条 ID */
  id: string
  /** 词条内容 */
  entries: Entry[]
}

/** 媒体变更 */
export interface ContributionMediaChange {
  /** 媒体类型 */
  type: string
  /** 变更动作 */
  action: string
  /** 条目索引 */
  entry_index: number
}

/** 媒体引用 */
export interface ContributionMediaReference {
  /** 条目索引 */
  entry_index: number
  /** 媒体字段 */
  field: string
}

/** 贡献媒体附件 */
export interface ContributionMediaAttachment {
  /** 附件 ID */
  attachment_id: string
  /** 导入卡组中的媒体 ID */
  source_media_id: string
  /** 附件引用位置 */
  references: ContributionMediaReference[]
  /** 文件名 */
  filename: string
  /** MIME 类型 */
  mime: string
  /** 文件大小（字节） */
  size: number
  /** 文件校验和 */
  checksum: string
  /** 媒体预览路径 */
  preview_path?: string
  /** 附件是否仍可下载 */
  available?: boolean
}

/** 接受后的作者媒体信息 */
export interface AcceptedMedia {
  /** 作者工作副本中的媒体 ID */
  author_media_id: string
  /** 文件校验和 */
  checksum: string
}

/** 贡献对应的作者编辑路径 */
export interface ContributionEditTarget {
  /** 源卡组 ID */
  deck_id: string
  /** 词条 ID */
  fact_id: string
  /** 获取词条的路径 */
  get_fact_path: string
  /** 更新词条的路径 */
  patch_fact_path: string
}

/** 贡献 */
export interface Contribution {
  /** 贡献 ID */
  id: string
  /** 源卡组 ID */
  source_deck_id: string
  /** 导入卡组 ID */
  import_deck_id: string
  /** 相关词条 ID */
  fact_id?: string
  /** 提交者用户名 */
  reporter: string
  /** 提交时基于的源版本 */
  source_version: number
  /** 贡献类型 */
  type: ContributionType
  /** 留言 */
  message?: string
  /** 目标条目索引 */
  entry_index?: number
  /** 被报告的原始词条 */
  reported_fact?: ReportedFact
  /** 建议的词条内容 */
  proposed_entries?: Entry[]
  /** 建议新增的标签 */
  add_tags?: string[]
  /** 建议移除的标签 */
  remove_tags?: string[]
  /** 提交时的原始标签 */
  reported_tags?: string[]
  /** 建议的字段名称 */
  proposed_fields?: string[]
  /** 提交时的原始字段名称 */
  reported_fields?: string[]
  /** 建议新增的卡片模板 */
  template?: number[][]
  /** 媒体变更列表 */
  media_changes?: ContributionMediaChange[]
  /** 媒体附件列表 */
  media_attachments?: ContributionMediaAttachment[]
  /** 接受后导入媒体 ID 到作者媒体信息的映射 */
  accepted_media_mapping?: Record<string, AcceptedMedia>
  /** 作者工作副本是否已更新 */
  working_copy_updated?: boolean
  /** 贡献状态 */
  status: ContributionStatus
  /** 创建时间 */
  created_at: string
  /** 更新时间 */
  updated_at: string
  /** 接受时间 */
  accepted_at?: string
  /** 解决或驳回时间 */
  resolved_at?: string
  /** 作者编辑目标 */
  edit?: ContributionEditTarget
}

/** 提交贡献后的摘要 */
export interface ContributionSubmission {
  /** 贡献 ID */
  contribution_id: string
  /** 源卡组 ID */
  source_deck_id: string
  /** 相关词条 ID */
  fact_id?: string
  /** 贡献类型 */
  type: ContributionType
  /** 贡献状态 */
  status: ContributionStatus
}

/** 提交词条编辑请求 DTO */
export interface SubmitFactEditContributionDTO {
  /** 目标条目索引 */
  entry_index?: number
  /** 留言 */
  message?: string
}

/** 提交可选留言请求 DTO */
export interface SubmitContributionMessageDTO {
  /** 留言 */
  message?: string
}

/** 提交标签变更请求 DTO */
export interface SubmitTagContributionDTO {
  /** 建议新增的标签 */
  add_tags?: string[]
  /** 建议移除的标签 */
  remove_tags?: string[]
  /** 留言 */
  message?: string
}

/** 提交卡片模板请求 DTO */
export interface SubmitTemplateContributionDTO {
  /** 卡片模板 */
  template: number[][]
  /** 留言 */
  message?: string
}

/** 提交字段重命名请求 DTO */
export interface SubmitFieldRenameContributionDTO {
  /** 建议的字段名称 */
  proposed_fields: string[]
  /** 留言 */
  message?: string
}

/** 本地待提交的卡组贡献 */
export type PendingDeckContribution = {
  id: 'deck_tags'
  kind: 'deck_tags'
  preview: string
  addTags: string[]
  removeTags: string[]
  savedAt: string
} | {
  id: 'field_rename'
  kind: 'field_rename'
  preview: string
  proposedFields: string[]
  savedAt: string
}

/** 已发送的本地贡献记录 */
export interface SentDeckContribution {
  id: string
  kind: PendingDeckContribution['kind']
  preview: string
  contributionId: string
  sentAt: string
}

/** 批量提交卡组贡献的请求 */
export interface SubmitDeckContributionsBatchDTO {
  importDeckId: string
  contributions: PendingDeckContribution[]
}

/** 批量提交卡组贡献的结果 */
export interface SubmitDeckContributionsBatchResult {
  submitted: Array<{
    localId: PendingDeckContribution['id']
    kind: PendingDeckContribution['kind']
    contributionId: string
  }>
  failed: Array<{
    localId: PendingDeckContribution['id']
    error: string
  }>
}

/** 提交举报请求 DTO */
export interface SubmitReportContributionDTO {
  /** 举报留言 */
  message: string
}

/** 查询贡献列表请求 DTO */
export interface GetContributionsDTO {
  /** 贡献状态 */
  status?: ContributionStatus
  /** 贡献类型 */
  type?: ContributionType
  /** 提交者用户名 */
  reporter?: string
  /** 词条 ID */
  fact_id?: string
  /** 媒体类型 */
  media_type?: string
  /** 返回数量 */
  limit?: number
  /** 分页偏移量 */
  offset?: number
}

/** 更新贡献状态请求 DTO */
export interface UpdateContributionStatusDTO {
  /** 新状态 */
  status: Exclude<ContributionStatus, 'accepted'>
}

/** 贡献列表分页信息 */
export interface ContributionsMeta {
  /** 状态信息 */
  msg: string
  /** 当前页数量 */
  count: number
  /** 总数量 */
  total: number
  /** 返回数量 */
  limit: number
  /** 分页偏移量 */
  offset: number
  /** 是否还有更多数据 */
  has_more: boolean
}

/** 提交贡献响应 DTO */
export type SubmitContributionResponseDTO = BaseApiResult<ContributionSubmission>

/** 贡献列表响应 DTO */
export type ContributionsListResponseDTO = BaseApiResult<{ contributions: Contribution[] }, ContributionsMeta>

/** 更新或接受贡献响应 DTO */
export type ContributionResponseDTO = BaseApiResult<Contribution>
