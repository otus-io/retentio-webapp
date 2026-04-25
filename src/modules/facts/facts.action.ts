'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import z from 'zod'
import { formatErrorMessage, formDataToObject } from '@/utils/format'
import { createFactsSchema, updateFactSchema } from '@/modules/facts/facts.schema'
import { createFactsService, deleteFactService, updateFactService } from '@/modules/facts/facts.service'

/**
 * 添加词条的 Action
 */
export const createFactsAction: ActionFunctionPayload<{ deckId: string; operation: string }> = async ({ deckId, operation }, _, formData) => {
  const data = formDataToObject(formData)
  data['submissionId'] = crypto.randomUUID()

  const result = createFactsSchema.safeParse(data)
  if (!result.success) {
    return {
      validationErrors: z.flattenError(result.error).fieldErrors,
      data,
    }
  }
  const res = await createFactsService(deckId, operation, result.data)
  if (!res.success) {
    return {
      error: res.message,
      data,
      success: false,
    }
  }
  revalidatePath(`/decks/${deckId}`)
  redirect(`/decks/${deckId}`)
}

/**
 * 更新词条的 Action
 */
export const updateFactAction: ActionFunctionPayload<{ deckId: string; factId: string }> = async ({ deckId, factId }, _, formData) => {
  const data = formDataToObject(formData)
  data['submissionId'] = crypto.randomUUID()

  const result = updateFactSchema.safeParse(data)
  if (!result.success) {
    return {
      validationErrors: z.flattenError(result.error).fieldErrors,
      data,
    }
  }
  const res = await updateFactService(deckId, factId, result.data)
  if (!res.success) {
    return {
      error: res.message,
      data,
      success: false,
    }
  }
  revalidatePath(`/decks/${deckId}`)
  redirect(`/decks/${deckId}`)
}

/**
 * 删除词条的 Action
 */
export const deleteFactAction: ActionFunctionPayload<{ deckId: string; factId: string }> = async ({ deckId, factId }) => {
  try {
    const res = await deleteFactService(deckId, factId)
    if (!res.success) {
      return {
        error: res.message,
        success: false,
      }
    }
  } catch (error) {
    return {
      error: formatErrorMessage(error, 'deleteFactAction failed'),
      success: false,
    }
  }
  revalidatePath(`/decks/${deckId}`)
  redirect(`/decks/${deckId}`)
}
