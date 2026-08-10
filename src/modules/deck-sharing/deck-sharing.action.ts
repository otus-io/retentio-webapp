'use server'

import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import z from 'zod'
import type { PublishDeckDTO } from '@/modules/deck-sharing/deck-sharing.schema'
import {
  createPublishDeckVersionSchema,
  type PublishDeckActionData,
  type PublishDeckActionPayload,
} from '@/modules/deck-sharing/deck-sharing.schema'
import { importDeckService, publishDeckService, syncImportedDeckService } from '@/modules/deck-sharing/deck-sharing.service'

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
      error: response.message,
      data: { version },
    }
  }

  revalidatePath(`/decks/${deckId}`)
  revalidatePath('/decks')
  revalidatePath(`/decks/${deckId}`)
  revalidatePath('/decks')
  revalidatePath('/decks/shared')
  revalidatePath(`/decks/shared/${deckId}`)
  revalidatePath('/')
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
