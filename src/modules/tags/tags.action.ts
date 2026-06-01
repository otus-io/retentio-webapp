'use server'

import z from 'zod'
import { revalidatePath } from 'next/cache'
import { formatErrorMessage, formDataToObject } from '@/utils/format'
import { createOrUpdateTagSchema } from '@/modules/tags/tags.schema'
import { createTagService, deleteTagService, deleteTagsService, updateTagService } from '@/modules/tags/tags.service'
import { redirect } from 'next/navigation'

export const createTagAction: ActionFunction = async (_, formData) => {
  const data = formDataToObject(formData)
  const result = createOrUpdateTagSchema.safeParse(data)
  if (!result.success) {
    return { validationErrors: z.flattenError(result.error).fieldErrors, data }
  }
  const res = await createTagService(result.data)
  if (!res.success) {
    return { error: res.message, data, success: false }
  }
  return { success: true, data: res.data.tag }
}

export const updateTagAction: ActionFunctionPayload<string> = async (tagId, _, formData) => {
  const data = formDataToObject(formData)
  const result = createOrUpdateTagSchema.safeParse(data)
  if (!result.success) {
    return { validationErrors: z.flattenError(result.error).fieldErrors, data }
  }
  const res = await updateTagService(tagId, result.data)
  if (!res.success) {
    return { error: res.message, data, success: false }
  }
  return { success: true, data: res.data.tag }
}

export const deleteTagAction: ActionFunctionPayload<string> = async (tagId) => {
  try {
    const res = await deleteTagService(tagId)
    if (!res.success) {
      return { error: res.message, success: false }
    }
  }
  catch (error) {
    return { error: formatErrorMessage(error, 'deleteTagAction failed'), success: false }
  }
  revalidatePath('/tags')
  return { success: true }
}


/**
 * 删除词条批量
 */
export async function deleteTagsAction(tagIds: string[]) {
  try {
    const res = await deleteTagsService(tagIds)
    if (!res.success) {
      return {
        error: res.message,
        success: false,
      }
    }
  } catch (error) {
    return {
      error: formatErrorMessage(error, 'delete failed'),
      success: false,
    }
  }
  revalidatePath('/tags')
  redirect('/tags')
}
