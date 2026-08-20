import * as contributionsApi from '@/api/contributions'
import { ServiceResponse } from '@/lib/response'
import type {
  GetContributionsDTO,
  SubmitContributionMessageDTO,
  SubmitFactEditContributionDTO,
  SubmitFieldRenameContributionDTO,
  SubmitReportContributionDTO,
  SubmitTagContributionDTO,
  SubmitTemplateContributionDTO,
  UpdateContributionStatusDTO,
} from '@/modules/contributions/contributions.schema'

/** 提交词条编辑贡献 */
export async function submitFactEditContributionService(importDeckId: string, factId: string, data?: SubmitFactEditContributionDTO) {
  try {
    return ServiceResponse.success(await contributionsApi.submitFactEditContribution(importDeckId, factId, data))
  } catch (e) {
    return ServiceResponse.error('submitFactEditContributionService failed', e)
  }
}

/** 提交本地新增词条贡献 */
export async function submitFactAddContributionService(importDeckId: string, factId: string, data?: SubmitContributionMessageDTO) {
  try {
    return ServiceResponse.success(await contributionsApi.submitFactAddContribution(importDeckId, factId, data))
  } catch (e) {
    return ServiceResponse.error('submitFactAddContributionService failed', e)
  }
}

/** 提交词条标签变更贡献 */
export async function submitFactTagContributionService(importDeckId: string, factId: string, data: SubmitTagContributionDTO) {
  try {
    return ServiceResponse.success(await contributionsApi.submitFactTagContribution(importDeckId, factId, data))
  } catch (e) {
    return ServiceResponse.error('submitFactTagContributionService failed', e)
  }
}

/** 提交卡片模板贡献 */
export async function submitTemplateContributionService(importDeckId: string, factId: string, data: SubmitTemplateContributionDTO) {
  try {
    return ServiceResponse.success(await contributionsApi.submitTemplateContribution(importDeckId, factId, data))
  } catch (e) {
    return ServiceResponse.error('submitTemplateContributionService failed', e)
  }
}

/** 提交仅留言举报 */
export async function submitReportContributionService(importDeckId: string, factId: string, data: SubmitReportContributionDTO) {
  try {
    return ServiceResponse.success(await contributionsApi.submitReportContribution(importDeckId, factId, data))
  } catch (e) {
    return ServiceResponse.error('submitReportContributionService failed', e)
  }
}

/** 提交卡组标签变更贡献 */
export async function submitDeckTagContributionService(importDeckId: string, data: SubmitTagContributionDTO) {
  try {
    return ServiceResponse.success(await contributionsApi.submitDeckTagContribution(importDeckId, data))
  } catch (e) {
    return ServiceResponse.error('submitDeckTagContributionService failed', e)
  }
}

/** 提交字段重命名贡献 */
export async function submitFieldRenameContributionService(importDeckId: string, data: SubmitFieldRenameContributionDTO) {
  try {
    return ServiceResponse.success(await contributionsApi.submitFieldRenameContribution(importDeckId, data))
  } catch (e) {
    return ServiceResponse.error('submitFieldRenameContributionService failed', e)
  }
}

/** 获取源卡组的贡献收件箱 */
export async function getContributionsService(sourceDeckId: string, params?: GetContributionsDTO) {
  try {
    return ServiceResponse.success(await contributionsApi.getContributions(sourceDeckId, params))
  } catch (e) {
    return ServiceResponse.error('getContributionsService failed', e)
  }
}

/** 更新贡献状态 */
export async function updateContributionStatusService(sourceDeckId: string, contributionId: string, data: UpdateContributionStatusDTO) {
  try {
    return ServiceResponse.success(await contributionsApi.updateContributionStatus(sourceDeckId, contributionId, data))
  } catch (e) {
    return ServiceResponse.error('updateContributionStatusService failed', e)
  }
}

/** 接受贡献并应用到作者工作副本 */
export async function acceptContributionService(sourceDeckId: string, contributionId: string) {
  try {
    return ServiceResponse.success(await contributionsApi.acceptContribution(sourceDeckId, contributionId))
  } catch (e) {
    return ServiceResponse.error('acceptContributionService failed', e)
  }
}

/** 下载贡献中的媒体附件 */
export async function getContributionMediaService(sourceDeckId: string, contributionId: string, attachmentId: string) {
  try {
    const data = await contributionsApi.getContributionMedia(sourceDeckId, contributionId, attachmentId)
    return ServiceResponse.success({ data, meta: { msg: 'success' } })
  } catch (e) {
    return ServiceResponse.error('getContributionMediaService failed', e)
  }
}
