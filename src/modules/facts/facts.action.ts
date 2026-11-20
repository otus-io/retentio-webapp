
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import z from 'zod'
import { formatErrorMessage, formDataToObject } from '@/utils/format'
import { createFactsSchema, type Entry, type Fact, updateFactSchema } from '@/modules/facts/facts.schema'
import {
  createFactsService,
  deleteFactService,
  deleteFactsService,
  getFactIdsService,
  getFactService,
  updateFactService,
} from '@/modules/facts/facts.service'

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

/** 获取单个词条（学习时编辑用） */
export async function getFactAction(deckId: string, factId: string): Promise<ActionState<Fact>> {
  const res = await getFactService(deckId, factId)
  return res.success ? { success: true, data: res.data.fact } : { success: false, error: res.message }
}

/** 整体替换词条的 entries，不跳转（学习时编辑用） */
export async function updateFactEntriesAction(deckId: string, factId: string, entries: Entry[]): Promise<ActionState> {
  const result = updateFactSchema.safeParse({ entries })
  if (!result.success) return { success: false, error: z.prettifyError(result.error) }
  const res = await updateFactService(deckId, factId, result.data)
  if (!res.success) return { success: false, error: res.message }
  revalidatePath(`/decks/${deckId}/facts`)
  return { success: true }
}

/**
 * 逐条添加一个词条（卡组菜单的“添加词条”，同移动端）；verified 记录作者已核验。
 * 导入卡组返回新词条的 ID，供浏览器立即作为贡献发送给作者。
 */
export async function addFactAction(
  deckId: string,
  entries: Entry[],
  verified: boolean,
  imported = false,
): Promise<ActionState<{ newFactIds: string[], idsUnknown?: boolean }>> {
  const result = createFactsSchema.safeParse({
    facts: [{ entries }],
    operation: 'append',
    verified: verified || undefined,
  })
  if (!result.success) return { success: false, error: z.prettifyError(result.error) }
  const before = imported ? await getFactIdsService(deckId) : null
  const res = await createFactsService(deckId, result.data)
  if (!res.success) return { success: false, error: res.message }
  revalidatePath(`/decks/${deckId}/facts`)
  revalidatePath(`/decks/${deckId}`)
  if (!imported) return { success: true, data: { newFactIds: [] } }
  if (!before?.success) return { success: true, data: { newFactIds: [], idsUnknown: true } }
  // The add response has no ids, so the new fact is the one that was not there before (as on mobile).
  const after = await getFactIdsService(deckId)
  const known = new Set(before.data.fact_ids)
  if (!after.success) return { success: true, data: { newFactIds: [], idsUnknown: true } }
  return { success: true, data: { newFactIds: after.data.fact_ids.filter((id) => !known.has(id)) } }
}
