'use server'

import { revalidatePath } from 'next/cache'
import type {
  Contribution,
  ContributionSubmission,
  SubmitDeckContributionsBatchDTO,
  SubmitDeckContributionsBatchResult,
  SubmitContributionMessageDTO,
  SubmitFactEditContributionDTO,
  SubmitFieldRenameContributionDTO,
  SubmitReportContributionDTO,
  SubmitTagContributionDTO,
  SubmitTemplateContributionDTO,
  UpdateContributionStatusDTO,
} from '@/modules/contributions/contributions.schema'
import {
  acceptContributionService,
  getContributionsService,
  submitDeckContributionsBatchService,
  submitDeckTagContributionService,
  submitFactAddContributionService,
  submitFactEditContributionService,
  submitFactTagContributionService,
  submitFieldRenameContributionService,
  submitReportContributionService,
  submitTemplateContributionService,
  updateContributionStatusService,
} from '@/modules/contributions/contributions.service'

interface FactContributionPayload<Data> {
  importDeckId: string
  factId: string
  data: Data
}

interface DeckContributionPayload<Data> {
  importDeckId: string
  data: Data
}

interface ContributionMutationPayload<Data> {
  sourceDeckId: string
  contributionId: string
  data: Data
}

/** 批量提交本地缓存的卡组贡献 */
export const submitDeckContributionsBatchAction: ActionFunctionPayload<
  SubmitDeckContributionsBatchDTO,
  SubmitDeckContributionsBatchResult
> = async ({ importDeckId, contributions }) => {
  const response = await submitDeckContributionsBatchService(importDeckId, contributions)
  return response.success ? { success: true, data: response.data } : { success: false, error: response.message }
}

/** 提交词条编辑贡献 */
export const submitFactEditContributionAction: ActionFunctionPayload<
  FactContributionPayload<SubmitFactEditContributionDTO | undefined>,
  ContributionSubmission
> = async ({ importDeckId, factId, data }) => {
  const response = await submitFactEditContributionService(importDeckId, factId, data)
  return response.success ? { success: true, data: response.data } : { success: false, error: response.message }
}

/** 提交本地新增词条贡献 */
export const submitFactAddContributionAction: ActionFunctionPayload<
  FactContributionPayload<SubmitContributionMessageDTO | undefined>,
  ContributionSubmission
> = async ({ importDeckId, factId, data }) => {
  const response = await submitFactAddContributionService(importDeckId, factId, data)
  return response.success ? { success: true, data: response.data } : { success: false, error: response.message }
}

/** 提交词条标签变更贡献 */
export const submitFactTagContributionAction: ActionFunctionPayload<
  FactContributionPayload<SubmitTagContributionDTO>,
  ContributionSubmission
> = async ({ importDeckId, factId, data }) => {
  const response = await submitFactTagContributionService(importDeckId, factId, data)
  return response.success ? { success: true, data: response.data } : { success: false, error: response.message }
}

/** 提交卡片模板贡献 */
export const submitTemplateContributionAction: ActionFunctionPayload<
  FactContributionPayload<SubmitTemplateContributionDTO>,
  ContributionSubmission
> = async ({ importDeckId, factId, data }) => {
  const response = await submitTemplateContributionService(importDeckId, factId, data)
  return response.success ? { success: true, data: response.data } : { success: false, error: response.message }
}

/** 提交仅留言举报 */
export const submitReportContributionAction: ActionFunctionPayload<
  FactContributionPayload<SubmitReportContributionDTO>,
  ContributionSubmission
> = async ({ importDeckId, factId, data }) => {
  const response = await submitReportContributionService(importDeckId, factId, data)
  return response.success ? { success: true, data: response.data } : { success: false, error: response.message }
}

/** 提交卡组标签变更贡献 */
export const submitDeckTagContributionAction: ActionFunctionPayload<
  DeckContributionPayload<SubmitTagContributionDTO>,
  ContributionSubmission
> = async ({ importDeckId, data }) => {
  const response = await submitDeckTagContributionService(importDeckId, data)
  return response.success ? { success: true, data: response.data } : { success: false, error: response.message }
}

/** 提交字段重命名贡献 */
export const submitFieldRenameContributionAction: ActionFunctionPayload<
  DeckContributionPayload<SubmitFieldRenameContributionDTO>,
  ContributionSubmission
> = async ({ importDeckId, data }) => {
  const response = await submitFieldRenameContributionService(importDeckId, data)
  return response.success ? { success: true, data: response.data } : { success: false, error: response.message }
}

/** 更新贡献状态 */
export const updateContributionStatusAction: ActionFunctionPayload<
  ContributionMutationPayload<UpdateContributionStatusDTO>,
  Contribution
> = async ({ sourceDeckId, contributionId, data }) => {
  const response = await updateContributionStatusService(sourceDeckId, contributionId, data)
  if (!response.success) return { success: false, error: response.message }

  revalidatePath(`/decks/${sourceDeckId}`)
  return { success: true, data: response.data }
}

/** 接受贡献并应用到作者工作副本 */
export const acceptContributionAction: ActionFunctionPayload<
  Omit<ContributionMutationPayload<never>, 'data'>,
  Contribution
> = async ({ sourceDeckId, contributionId }) => {
  const response = await acceptContributionService(sourceDeckId, contributionId)
  if (!response.success) return { success: false, error: response.message }

  revalidatePath(`/decks/${sourceDeckId}`)
  revalidatePath(`/decks/${sourceDeckId}/facts`)
  revalidatePath('/decks')
  return { success: true, data: response.data }
}

/** 作者收件箱：一页待处理贡献（卡组菜单的贡献弹窗，同移动端每页 50 条） */
export async function getOpenContributionsAction(
  sourceDeckId: string,
  offset = 0,
): Promise<ActionState<{ contributions: Contribution[], hasMore: boolean }>> {
  const res = await getContributionsService(sourceDeckId, { status: 'open', limit: 50, offset })
  return res.success
    ? { success: true, data: { contributions: res.data.contributions, hasMore: res.meta.has_more } }
    : { success: false, error: res.message }
}
