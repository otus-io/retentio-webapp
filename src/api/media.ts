import { request, type OnProgress } from '@/utils/request'
import type { UploadMediaResult } from '@/modules/media/media.schema'

/**
 * 下载媒体文件，返回 object URL 与原始 blob
 */
export async function getMedia(id: string, onDownloadProgress?: OnProgress) {
  const blob = await request<Blob>(`/api/media/${id}`, { onDownloadProgress })
  return {
    url: URL.createObjectURL(blob),
    blob,
  }
}

/**
 * 上传媒体文件
 */
export function uploadMedia(formData: FormData) {
  return request<UploadMediaResult>('/api/media', {
    method: 'POST',
    body: formData,
  })
}
