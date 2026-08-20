import { request } from '@/utils/request'
import type {
  ContributionResponseDTO,
  ContributionsListResponseDTO,
  GetContributionsDTO,
  SubmitContributionMessageDTO,
  SubmitContributionResponseDTO,
  SubmitFactEditContributionDTO,
  SubmitFieldRenameContributionDTO,
  SubmitReportContributionDTO,
  SubmitTagContributionDTO,
  SubmitTemplateContributionDTO,
  UpdateContributionStatusDTO,
} from '@/modules/contributions/contributions.schema'

/** 提交词条编辑贡献 */
export function submitFactEditContribution(importDeckId: string, factId: string, data?: SubmitFactEditContributionDTO) {
  return request<SubmitContributionResponseDTO>(`/api/decks/${importDeckId}/contributions/facts/${factId}/edit`, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/** 提交本地新增词条贡献 */
export function submitFactAddContribution(importDeckId: string, factId: string, data?: SubmitContributionMessageDTO) {
  return request<SubmitContributionResponseDTO>(`/api/decks/${importDeckId}/contributions/facts/${factId}/add`, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/** 提交词条标签变更贡献 */
export function submitFactTagContribution(importDeckId: string, factId: string, data: SubmitTagContributionDTO) {
  return request<SubmitContributionResponseDTO>(`/api/decks/${importDeckId}/contributions/facts/${factId}/tags`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** 提交卡片模板贡献 */
export function submitTemplateContribution(importDeckId: string, factId: string, data: SubmitTemplateContributionDTO) {
  return request<SubmitContributionResponseDTO>(`/api/decks/${importDeckId}/contributions/facts/${factId}/templates`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** 提交仅留言举报 */
export function submitReportContribution(importDeckId: string, factId: string, data: SubmitReportContributionDTO) {
  return request<SubmitContributionResponseDTO>(`/api/decks/${importDeckId}/contributions/facts/${factId}/report`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** 提交卡组标签变更贡献 */
export function submitDeckTagContribution(importDeckId: string, data: SubmitTagContributionDTO) {
  return request<SubmitContributionResponseDTO>(`/api/decks/${importDeckId}/contributions/deck-tags`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** 提交字段重命名贡献 */
export function submitFieldRenameContribution(importDeckId: string, data: SubmitFieldRenameContributionDTO) {
  return request<SubmitContributionResponseDTO>(`/api/decks/${importDeckId}/contributions/fields/rename`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** 获取源卡组的贡献收件箱 */
export function getContributions(sourceDeckId: string, params?: GetContributionsDTO) {
  const qs = new URLSearchParams(
    Object.entries(params ?? {}).flatMap(([key, value]) => value === undefined ? [] : [[key, String(value)]]),
  ).toString()
  return request<ContributionsListResponseDTO>(`/api/decks/${sourceDeckId}/contributions${qs ? `?${qs}` : ''}`)
}

/** 更新贡献状态 */
export function updateContributionStatus(sourceDeckId: string, contributionId: string, data: UpdateContributionStatusDTO) {
  return request<ContributionResponseDTO>(`/api/decks/${sourceDeckId}/contributions/${contributionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/** 接受贡献并应用到作者工作副本 */
export function acceptContribution(sourceDeckId: string, contributionId: string) {
  return request<ContributionResponseDTO>(`/api/decks/${sourceDeckId}/contributions/${contributionId}/accept`, {
    method: 'POST',
  })
}

/** 下载贡献中的媒体附件 */
export function getContributionMedia(sourceDeckId: string, contributionId: string, attachmentId: string) {
  return request<Blob>(`/api/decks/${sourceDeckId}/contributions/${contributionId}/media/${attachmentId}`)
}
