
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import z from 'zod'
import { formatErrorMessage, formDataToObject } from '@/utils/format'
import { createFactsSchema, updateFactSchema } from '@/modules/facts/facts.schema'
import { createFactsService, deleteFactService, deleteFactsService, updateFactService } from '@/modules/facts/facts.service'

/**
 * 添加词条的 Action
 */
export const createFactsAction: ActionFunctionPayload<string> = async (deckId, _, formData) => {
  try {
    const _data = formDataToObject(formData)
    const data: Record<string, any> = {
      submissionId: crypto.randomUUID(),
      ..._data,
    }

    if(_data.facts && typeof _data.facts === 'string'){
      data['facts'] = JSON.parse(_data.facts)
    }

    if(_data.template && typeof _data.template === 'string'){
      data['template'] = JSON.parse(_data.template)
    }

    const result = createFactsSchema.safeParse(data)


    if (!result.success) {
      return {
        validationErrors: z.flattenError(result.error).fieldErrors,
        data,
        success: false,
      }
    }
    const res = await createFactsService(deckId, result.data)
    if (!res.success) {
      return {
        error: res.message,
        data,
        success: false,
      }
    }
  } catch (error) {
    return {
      error: formatErrorMessage(error, 'createFactsAction failed'),
      success: false,
    }
  }
  revalidatePath(`/decks/${deckId}/facts`)
  redirect(`/decks/${deckId}/facts`)
}

/**
 * 更新词条的 Action
 */
export const updateFactAction: ActionFunctionPayload<{ deckId: string; factId: string }> = async ({ deckId, factId }, _, formData) => {
  const _data = formDataToObject(formData)

  const data: Record<string, any> = {
    submissionId: crypto.randomUUID(),
    ..._data,
  }

  if(_data.facts && typeof _data.facts === 'string'){
    data['facts'] = JSON.parse(_data.facts)
  }

  if(_data.template && typeof _data.template === 'string'){
    data['template'] = JSON.parse(_data.template)
  }

  const result = updateFactSchema.safeParse(data['facts'][0])
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
  revalidatePath(`/decks/${deckId}/facts`)
  redirect(`/decks/${deckId}/facts`)
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
  revalidatePath(`/decks/${deckId}/facts`)
  redirect(`/decks/${deckId}/facts`)
}


/**
 * 批量删除词条的 Action
 */
export const deleteFactsAction: ActionFunctionPayload<{ deckId: string; factIds: string[] }> = async ({ deckId, factIds }) => {
  try {
    const res = await deleteFactsService(deckId, factIds)
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
  revalidatePath(`/decks/${deckId}/facts`)
  redirect(`/decks/${deckId}/facts`)
}
