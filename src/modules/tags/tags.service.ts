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
