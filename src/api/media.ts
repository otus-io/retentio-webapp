import { ServiceResponse } from '@/lib/response'
import { OnProgress } from '@/utils/createRequest'
import { requestClient } from '@/utils/request.client'

/**
 * 获取
 */
export async function getMedia(id: string, onDownloadProgress?: OnProgress) {
  try {
    const blob = await requestClient<Blob>(`/api/media/${id}`, { onDownloadProgress })
    const url = URL.createObjectURL(blob)
    return ServiceResponse.success({
      data: {
        url,
        blob,
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
    const res = await requestClient('/api/media', {
      method: 'POST',
      body: formData,
    })
    return res
  } catch (e) {
    return ServiceResponse.error('uploadMedia failed', e)
  }
}
