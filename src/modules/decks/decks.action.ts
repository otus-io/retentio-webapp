'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import z from 'zod'
import { formatErrorMessage, formDataToObject } from '@/utils/format'
import { crateOrUpdateDeckSchema } from '@/modules/decks/decks.schema'
import { createDeckService, deleteDeckService, updateDeckService } from '@/modules/decks/decks.service'

/**
 * 创建卡组的action
 */
export const createDeckAction: ActionFunction = async (_, formData) => {
  const data = formDataToObject(formData)
  data['submissionId'] = crypto.randomUUID()
  const result = crateOrUpdateDeckSchema.safeParse(data)
  if (!result.success) {
    return {
      validationErrors: z.flattenError(result.error).fieldErrors,
      data,
    }
  }
  const res = await createDeckService(result.data)
  if (!res.success) {
    return {
      error: res.message,
      data,
      success: false,
    }
  }
  revalidatePath('/decks')
  redirect('/decks')
}

/**
 * 更新卡组
 */
export const updateDeckAction: ActionFunctionPayload<string> = async (deckId, _, formData) => {
  const data = formDataToObject(formData)
  data['submissionId'] = crypto.randomUUID()
  const result = crateOrUpdateDeckSchema.safeParse(data)
  if (!result.success) {
    return {
      validationErrors: z.flattenError(result.error).fieldErrors,
      data,
    }
  }
  const res = await updateDeckService(deckId, result.data)
  if (!res.success) {
    return {
      error: res.message,
      data,
      success: false,
    }
  }
  revalidatePath('/decks')
  redirect(`/decks/${deckId}`)
}

/**
 * 删除卡组的 Action
 */
export const deleteDeckAction: ActionFunctionPayload<string> = async (deckId) => {
  try {
    const res = await deleteDeckService(deckId)
    if (!res.success) {
      return {
        error: res.message,
        success: false,
      }
    }
  } catch (error) {
    return {
      error: formatErrorMessage(error, 'deleteDeckAction failed'),
      success: false,
    }
  }
  revalidatePath('/decks')
  redirect('/decks')
}

