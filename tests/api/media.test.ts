import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __clearMediaVersionCache,
  getMedia,
  resolveImportedMediaVersion,
  uploadMedia,
} from '@/api/media'
import { getFact } from '@/api/facts'
import { request } from '@/utils/request'

const versionMaps = new Map<string, Record<string, number>>()

vi.mock('idb-keyval', () => ({
  createStore: (db: string, store: string) => `${db}:${store}`,
  get: async (key: string) => versionMaps.get(key),
  set: async (key: string, value: Record<string, number>) => {
    versionMaps.set(key, value)
  },
  del: async (key: string) => {
    versionMaps.delete(key)
  },
}))

vi.mock('@/api/facts', () => ({
  getFact: vi.fn(),
}))

vi.mock('@/utils/request', () => ({
  request: vi.fn(),
}))

describe('resolveImportedMediaVersion', () => {
  beforeEach(() => {
    __clearMediaVersionCache()
    versionMaps.clear()
    vi.mocked(getFact).mockReset()
  })

  it('loads media_versions from getFact and returns a positive pin', async () => {
    vi.mocked(getFact).mockResolvedValue({
      data: { media_versions: { 'audio-1': 3, 'img-1': 0 } },
    } as Awaited<ReturnType<typeof getFact>>)

    await expect(
      resolveImportedMediaVersion('deck-1', 'fact-1', 'audio-1'),
    ).resolves.toBe(3)
    await expect(
      resolveImportedMediaVersion('deck-1', 'fact-1', 'img-1'),
    ).resolves.toBeUndefined()
    // No session cache: each settled call refreshes from getFact.
    expect(getFact).toHaveBeenCalledTimes(2)
  })

  it('persists media_versions and refreshes the pin on later getFact', async () => {
    vi.mocked(getFact)
      .mockResolvedValueOnce({
        data: { media_versions: { 'audio-1': 3 } },
      } as Awaited<ReturnType<typeof getFact>>)
      .mockResolvedValueOnce({
        data: { media_versions: { 'audio-1': 5 } },
      } as Awaited<ReturnType<typeof getFact>>)

    await expect(
      resolveImportedMediaVersion('deck-1', 'fact-1', 'audio-1'),
    ).resolves.toBe(3)
    await expect(
      resolveImportedMediaVersion('deck-1', 'fact-1', 'audio-1'),
    ).resolves.toBe(5)
    expect(versionMaps.get('deck-1:fact-1')).toEqual({ 'audio-1': 5 })
  })

  it('coalesces concurrent misses into one getFact call', async () => {
    let resolveFact!: (value: Awaited<ReturnType<typeof getFact>>) => void
    vi.mocked(getFact).mockImplementation(
      () => new Promise((resolve) => {
        resolveFact = resolve
      }),
    )

    const first = resolveImportedMediaVersion('deck-1', 'fact-1', 'audio-1')
    const second = resolveImportedMediaVersion('deck-1', 'fact-1', 'audio-2')

    expect(getFact).toHaveBeenCalledTimes(1)

    resolveFact({
      data: { media_versions: { 'audio-1': 2, 'audio-2': 5 } },
    } as Awaited<ReturnType<typeof getFact>>)

    await expect(first).resolves.toBe(2)
    await expect(second).resolves.toBe(5)
    expect(getFact).toHaveBeenCalledTimes(1)
  })

  it('treats missing media_versions as an empty map', async () => {
    vi.mocked(getFact).mockResolvedValue({
      data: {},
    } as Awaited<ReturnType<typeof getFact>>)

    await expect(
      resolveImportedMediaVersion('deck-1', 'fact-1', 'audio-1'),
    ).resolves.toBeUndefined()
  })

  it('allows a retry after getFact fails with no cache', async () => {
    vi.mocked(getFact)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({
        data: { media_versions: { 'audio-1': 4 } },
      } as Awaited<ReturnType<typeof getFact>>)

    await expect(
      resolveImportedMediaVersion('deck-1', 'fact-1', 'audio-1'),
    ).rejects.toThrow('network')
    await expect(
      resolveImportedMediaVersion('deck-1', 'fact-1', 'audio-1'),
    ).resolves.toBe(4)
    expect(getFact).toHaveBeenCalledTimes(2)
  })

  it('falls back to persisted media_versions when getFact fails', async () => {
    vi.mocked(getFact)
      .mockResolvedValueOnce({
        data: { media_versions: { 'audio-1': 7 } },
      } as Awaited<ReturnType<typeof getFact>>)
      .mockRejectedValueOnce(new Error('offline'))

    await expect(
      resolveImportedMediaVersion('deck-1', 'fact-1', 'audio-1'),
    ).resolves.toBe(7)

    await expect(
      resolveImportedMediaVersion('deck-1', 'fact-1', 'audio-1'),
    ).resolves.toBe(7)
    expect(getFact).toHaveBeenCalledTimes(2)
  })
})

describe('getMedia / uploadMedia', () => {
  beforeEach(() => {
    vi.mocked(request).mockReset()
  })

  it('returns an object URL for the downloaded blob', async () => {
    const blob = new Blob(['audio'], { type: 'audio/mpeg' })
    const onDownloadProgress = vi.fn()
    vi.mocked(request).mockResolvedValue(blob)

    const result = await getMedia('media-1', onDownloadProgress)

    expect(result.blob).toBe(blob)
    expect(result.url.startsWith('blob:')).toBe(true)
    expect(request).toHaveBeenCalledWith('/api/media/media-1', { onDownloadProgress })
    URL.revokeObjectURL(result.url)
  })

  it('appends a positive snapshot version to the media URL', async () => {
    const blob = new Blob(['img'], { type: 'image/png' })
    const onDownloadProgress = vi.fn()
    vi.mocked(request).mockResolvedValue(blob)

    const result = await getMedia('media-2', onDownloadProgress, 2)

    expect(result.blob).toBe(blob)
    expect(request).toHaveBeenCalledWith('/api/media/media-2?v=2', { onDownloadProgress })
    URL.revokeObjectURL(result.url)
  })

  it('omits the version query when version is missing, zero, or negative', async () => {
    const blob = new Blob(['x'])
    vi.mocked(request).mockResolvedValue(blob)

    await getMedia('media-3')
    await getMedia('media-3', undefined, 0)
    await getMedia('media-3', undefined, -1)

    expect(request).toHaveBeenNthCalledWith(1, '/api/media/media-3', {
      onDownloadProgress: undefined,
    })
    expect(request).toHaveBeenNthCalledWith(2, '/api/media/media-3', {
      onDownloadProgress: undefined,
    })
    expect(request).toHaveBeenNthCalledWith(3, '/api/media/media-3', {
      onDownloadProgress: undefined,
    })
  })

  it('posts form data to /api/media and returns the upload result', async () => {
    const formData = new FormData()
    formData.append('file', new Blob(['a']), 'a.txt')
    const uploaded = { data: { id: 'media-9' }, meta: { msg: 'ok' } }
    vi.mocked(request).mockResolvedValue(uploaded)

    await expect(uploadMedia(formData)).resolves.toBe(uploaded)
    expect(request).toHaveBeenCalledWith('/api/media', {
      method: 'POST',
      body: formData,
    })
  })
})
