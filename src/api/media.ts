import { ServiceResponse } from '@/lib/response'
import { request } from '@/utils/request'

/**
 * 获取
 */
export async function getMedia(id: string) {
  try {
    const res = await request<Blob>(`/api/media/${id}`)
    const url = URL.createObjectURL(res)
    return ServiceResponse.success({
      data: {
        url,
      },
      meta: {
        msg: 'Media fetched successfully',
      },
    })
  } catch (e) {
    return ServiceResponse.error('getMedia failed', e)
  }
}

/**
 * 上传
 */
export async function uploadMedia(formData: FormData) {
  try {
    const res = await request('/api/media', {
      method: 'POST',
      body: formData,
    })
    return res
  } catch (e) {
    return ServiceResponse.error('uploadMedia failed', e)
  }
}
