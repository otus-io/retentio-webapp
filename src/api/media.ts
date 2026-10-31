import { getFact } from '@/api/facts'
import { request, type OnProgress } from '@/utils/request'
import type { UploadMediaResult } from '@/modules/media/media.schema'

/** factKey → media id → snapshot version */
const mediaVersionCache = new Map<string, Record<string, number>>()
/** In-flight getFact by factKey — coalesces concurrent resolveImportedMediaVersion calls. */
const pendingMediaVersionRequests = new Map<string, Promise<Record<string, number>>>()

/**
 * For imported decks, resolve the snapshot pin so `GET /api/media/{id}?v=` succeeds
 * for author-owned media (working-copy download is owner-only → 403).
 */
export async function resolveImportedMediaVersion(
  deckId: string,
  factId: string,
  mediaId: string,
): Promise<number | undefined> {
  const key = `${deckId}:${factId}`
  let map = mediaVersionCache.get(key)
  if (!map) {
    let pending = pendingMediaVersionRequests.get(key)
    if (!pending) {
      pending = getFact(deckId, factId)
        .then((res) => {
          const versions = res.data.media_versions ?? {}
          mediaVersionCache.set(key, versions)
          return versions
        })
        .finally(() => {
          pendingMediaVersionRequests.delete(key)
        })
      pendingMediaVersionRequests.set(key, pending)
    }
    map = await pending
  }
  const v = map[mediaId]
  return typeof v === 'number' && v > 0 ? v : undefined
}

/** @internal test helper */
export function __clearMediaVersionCache() {
  mediaVersionCache.clear()
  pendingMediaVersionRequests.clear()
}

/**
 * 下载媒体文件，返回 object URL 与原始 blob
 */
export async function getMedia(id: string, onDownloadProgress?: OnProgress, version?: number) {
  const qs = version && version > 0 ? `?v=${version}` : ''
  const blob = await request<Blob>(`/api/media/${id}${qs}`, { onDownloadProgress })
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
