import * as tagApi from '@/api/tag'
import { ServiceResponse } from '@/lib/response'
import type { CreateOrUpdateTagDTO } from '@/modules/tags/tags.schema'

export async function getAllTagsService() {
  try {
    return ServiceResponse.success(await tagApi.getAllTags())
  } catch (e) {
    return ServiceResponse.error('getAllTagsService failed', e)
  }
}

export async function createTagService(data: CreateOrUpdateTagDTO) {
  try {
    return ServiceResponse.success(await tagApi.createTag(data))
  } catch (e) {
    return ServiceResponse.error('createTagService failed', e)
  }
}

export async function updateTagService(tagId: string, data: CreateOrUpdateTagDTO) {
  try {
    return ServiceResponse.success(await tagApi.updateTag(tagId, data))
  } catch (e) {
    return ServiceResponse.error('updateTagService failed', e)
  }
}

export async function deleteTagService(tagId: string) {
  try {
    return ServiceResponse.success(await tagApi.deleteTag(tagId))
  } catch (e) {
    return ServiceResponse.error('deleteTagService failed', e)
  }
}


export async function deleteTagsService(tagIds: string[]) {
  try {
    const results = await Promise.allSettled(tagIds.map((tagsId) => tagApi.deleteTag(tagsId)))
    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length > 0) {
      return ServiceResponse.error(
        `deleteFactsService failed: ${failed.length}/${tagIds.length} deletions failed`,
        failed[0].reason,
      )
    }
    return ServiceResponse.success({ data: {}, meta: { msg: 'deleteFactsService success' } })
  } catch (e) {
    return ServiceResponse.error('deleteFactsService failed', e)
  }
}
