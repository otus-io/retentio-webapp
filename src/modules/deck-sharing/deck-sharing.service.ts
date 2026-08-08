import * as deckSharingApi from '@/api/deck-sharing'
import { ServiceResponse } from '@/lib/response'
import type {
  CreateDeckFeedbackDTO,
  GetDeckCatalogDTO,
  GetDeckFeedbackDTO,
  ImportDeckDTO,
  PublishDeckDTO,
  SyncImportedDeckDTO,
  UpdateDeckFeedbackStatusDTO,
} from '@/modules/deck-sharing/deck-sharing.schema'

/**
 * 获取卡组目录（可导入的已发布公开卡组）
 */
export async function getDeckCatalogService(params?: GetDeckCatalogDTO) {
  try {
    return ServiceResponse.success(await deckSharingApi.getDeckCatalog(params))
  } catch (e) {
    return ServiceResponse.error('getDeckCatalogService failed', e)
  }
}

/**
 * 获取单条卡组目录记录
 */
export async function getDeckCatalogItemService(sourceDeckId: string) {
  try {
    return ServiceResponse.success(await deckSharingApi.getDeckCatalogItem(sourceDeckId))
  } catch (e) {
    return ServiceResponse.error('getDeckCatalogItemService failed', e)
  }
}

/**
 * 发布卡组
 */
export async function publishDeckService(deckId: string, data?: PublishDeckDTO) {
  try {
    return ServiceResponse.success(await deckSharingApi.publishDeck(deckId, data))
  } catch (e) {
    return ServiceResponse.error('publishDeckService failed', e)
  }
}

/**
 * 导入已发布卡组
 */
export async function importDeckService(data: ImportDeckDTO) {
  try {
    return ServiceResponse.success(await deckSharingApi.importDeck(data))
  } catch (e) {
    return ServiceResponse.error('importDeckService failed', e)
  }
}

/**
 * 获取导入卡组的更新差异
 */
export async function getDeckImportUpdatesService(importId: string) {
  try {
    return ServiceResponse.success(await deckSharingApi.getDeckImportUpdates(importId))
  } catch (e) {
    return ServiceResponse.error('getDeckImportUpdatesService failed', e)
  }
}

/**
 * 同步导入卡组到最新（或指定）发布版本
 */
export async function syncImportedDeckService(importId: string, data?: SyncImportedDeckDTO) {
  try {
    return ServiceResponse.success(await deckSharingApi.syncImportedDeck(importId, data))
  } catch (e) {
    return ServiceResponse.error('syncImportedDeckService failed', e)
  }
}

/**
 * 提交反馈（导入者 → 作者）
 */
export async function createDeckFeedbackService(importDeckId: string, data: CreateDeckFeedbackDTO) {
  try {
    return ServiceResponse.success(await deckSharingApi.createDeckFeedback(importDeckId, data))
  } catch (e) {
    return ServiceResponse.error('createDeckFeedbackService failed', e)
  }
}

/**
 * 获取源卡组的反馈列表
 */
export async function getDeckFeedbackService(sourceDeckId: string, params?: GetDeckFeedbackDTO) {
  try {
    return ServiceResponse.success(await deckSharingApi.getDeckFeedback(sourceDeckId, params))
  } catch (e) {
    return ServiceResponse.error('getDeckFeedbackService failed', e)
  }
}

/**
 * 更新反馈状态
 */
export async function updateDeckFeedbackStatusService(sourceDeckId: string, feedbackId: string, data: UpdateDeckFeedbackStatusDTO) {
  try {
    return ServiceResponse.success(await deckSharingApi.updateDeckFeedbackStatus(sourceDeckId, feedbackId, data))
  } catch (e) {
    return ServiceResponse.error('updateDeckFeedbackStatusService failed', e)
  }
}

/**
 * 接受反馈（将建议内容应用到作者工作副本）
 */
export async function acceptDeckFeedbackService(sourceDeckId: string, feedbackId: string) {
  try {
    return ServiceResponse.success(await deckSharingApi.acceptDeckFeedback(sourceDeckId, feedbackId))
  } catch (e) {
    return ServiceResponse.error('acceptDeckFeedbackService failed', e)
  }
}
