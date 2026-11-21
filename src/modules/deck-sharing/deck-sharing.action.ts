'use server'

import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import z from 'zod'
import { EMAIL_NOT_VERIFIED_CODE } from '@/modules/auth/auth.schema'
import { getAllDecksService } from '@/modules/decks/decks.service'
import type {
  DeckSharingStatus,
  DeckUpdateFactDetail,
  DeckUpdatesSummaryResponseDTO,
  PublishDeckDTO,
  PublishPreview,
  SyncFactDecision,
} from '@/modules/deck-sharing/deck-sharing.schema'
import {
  createPublishDeckVersionSchema,
  type PublishDeckActionData,
  type PublishDeckActionPayload,
} from '@/modules/deck-sharing/deck-sharing.schema'
import {
  getDeckSharingStatusesService,
  getDeckUpdateFactService,
  getDeckUpdatesSummaryService,
  getPublishPreviewService,
  importDeckService,
  publishDeckService,
  syncImportedDeckService,
} from '@/modules/deck-sharing/deck-sharing.service'

export const importDeckAction: ActionFunctionPayload<string, never> = async (sourceDeckId) => {
  const response = await importDeckService({ source_deck_id: sourceDeckId })

  if (!response.success) {
    return {
      success: false,
      error: response.message,
    }
  }

  revalidatePath('/decks')
  redirect(`/decks/${response.data.id}`)
}

export const publishDeckAction: ActionFunctionPayload<PublishDeckActionPayload, PublishDeckActionData> = async (
  { deckId, currentVersion },
  _,
  formData,
) => {
  let version: number | undefined

  if (currentVersion > 0) {
    const t = await getTranslations('deck-sharing')
    const result = createPublishDeckVersionSchema(
      currentVersion,
      t('version-error', { version: currentVersion + 1 }),
    ).safeParse({ version: formData.get('version') })

    if (!result.success) {
      return {
        success: false,
        validationErrors: z.flattenError(result.error).fieldErrors,
        data: {
          version: currentVersion + 1,
        },
      }
    }
    version = result.data.version
  }

  const payload: PublishDeckDTO = currentVersion === 0
    ? { visibility: 'public' }
    : { published_version: version }

  const response = await publishDeckService(deckId, payload)

  if (!response.success) {
    return {
      success: false,
      error: response.code === EMAIL_NOT_VERIFIED_CODE
        ? (await getTranslations('auth'))('emailNotVerifiedError')
        : response.message,
      data: { version },
    }
  }

  revalidatePath(`/decks/${deckId}`)
  revalidatePath('/decks')
  revalidatePath('/decks/shared')
  revalidatePath(`/decks/shared/${deckId}`)
  revalidatePath('/')

  return {
    success: true,
    data: {
      version,
      publishedVersion: response.data.published_version,
    },
  }
}

export const syncImportedDeckAction: ActionFunctionPayload<string, { sourceVersion: number }> = async (importId) => {
  const response = await syncImportedDeckService(importId)

  if (!response.success) {
    return {
      success: false,
      error: response.message,
    }
  }

  revalidatePath(`/decks/${importId}`)
  revalidatePath(`/decks/${importId}/facts`)
  revalidatePath('/decks')

  return {
    success: true,
    data: {
      sourceVersion: response.data.source_version,
    },
  }
}

/** 发布预览（在卡组菜单的发布弹窗中加载） */
export async function getPublishPreviewAction(deckId: string): Promise<ActionState<PublishPreview>> {
  const res = await getPublishPreviewService(deckId)
  return res.success ? { success: true, data: res.data } : { success: false, error: res.message }
}

/** 导入卡组的更新摘要（在卡组菜单的检查更新弹窗中加载） */
export async function getDeckUpdatesSummaryAction(
  importId: string,
): Promise<ActionState<DeckUpdatesSummaryResponseDTO['data']>> {
  const res = await getDeckUpdatesSummaryService(importId)
  return res.success ? { success: true, data: res.data } : { success: false, error: res.message }
}

/** 某条更新词条的详情（在检查更新弹窗中展开时加载） */
export async function getDeckUpdateFactAction(
  importId: string,
  factId: string,
): Promise<ActionState<DeckUpdateFactDetail>> {
  const res = await getDeckUpdateFactService(importId, factId)
  return res.success ? { success: true, data: res.data } : { success: false, error: res.message }
}

/** 同步到指定版本，并按词条应用“接受 / 保留本地”的选择（同移动端） */
export async function syncDeckWithDecisionsAction(
  importId: string,
  targetVersion: number,
  decisions: SyncFactDecision[],
): Promise<ActionState> {
  const res = await syncImportedDeckService(importId, { target_version: targetVersion, decisions })
  if (!res.success) return { success: false, error: res.message }
  revalidatePath(`/decks/${importId}`)
  revalidatePath(`/decks/${importId}/facts`)
  revalidatePath('/decks')
  return { success: true }
}

/**
 * My Decks 卡片提醒（页面渲染后在浏览器里加载，并定时刷新）。
 * 卡组在服务端按当前用户加载，不信任客户端输入。
 */
export async function getDeckSharingStatusesAction(): Promise<Record<string, DeckSharingStatus>> {
  const decks = await getAllDecksService()
  return decks.success ? getDeckSharingStatusesService(decks.data.decks ?? []) : {}
}
