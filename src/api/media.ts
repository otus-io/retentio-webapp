import { getFact } from '@/api/facts'
import { request, type OnProgress } from '@/utils/request'
import type { UploadMediaResult } from '@/modules/media/media.schema'
import { createStore, get, set } from 'idb-keyval'

/** Persisted factKey → media id → snapshot version (offline fallback). */
const mediaVersionsStore = createStore('retentio', 'media-versions')
/** In-flight getFact by factKey — coalesces concurrent resolveImportedMediaVersion calls. */
const pendingMediaVersionRequests = new Map<string, Promise<Record<string, number>>>()

function pickVersion(
  map: Record<string, number> | undefined,
  mediaId: string,
): number | undefined {
  const v = map?.[mediaId]
  return typeof v === 'number' && v > 0 ? v : undefined
}

/**
 * For imported decks, resolve the snapshot pin so `GET /api/media/{id}?v=` succeeds
 * for author-owned media (working-copy download is owner-only → 403).
 *
 * Always refreshes from getFact when online (no session-wide map) so import sync
 * updates are visible. On network failure, falls back to the last persisted map
 * so callers can still hit the local blob cache offline.
 */
export async function resolveImportedMediaVersion(
  deckId: string,
  factId: string,
  mediaId: string,
): Promise<number | undefined> {
  const key = `${deckId}:${factId}`
  let pending = pendingMediaVersionRequests.get(key)
  if (!pending) {
    pending = (async () => {
      try {
        const res = await getFact(deckId, factId)
        const versions = res.data.media_versions ?? {}
        await set(key, versions, mediaVersionsStore)
        return versions
      }
      catch (error) {
        const cached = await get<Record<string, number>>(key, mediaVersionsStore)
        if (cached) {
          return cached
        }
        throw error
      }
    })().finally(() => {
      pendingMediaVersionRequests.delete(key)
    })
    pendingMediaVersionRequests.set(key, pending)
  }
  return pickVersion(await pending, mediaId)
}

/** @internal test helper */
export function __clearMediaVersionCache() {
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
