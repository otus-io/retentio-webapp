import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useFactsCellAttachments } from '@/hooks/useFactsCellAttachments'
import type { Entry } from '@/modules/facts/facts.schema'
import { getMedia, resolveImportedMediaVersion, uploadMedia } from '@/api/media'
import type { OnProgress } from '@/utils/request'

const { cacheGet, cacheSet } = vi.hoisted(() => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/api/media', () => ({
  getMedia: vi.fn(),
  uploadMedia: vi.fn(),
  resolveImportedMediaVersion: vi.fn(),
}))

vi.mock('@/lib/idb-cache', () => ({
  createBlobCache: () => ({
    get: cacheGet,
    set: cacheSet,
  }),
}))

let onAccepted: ((files: File[]) => void | Promise<void>) | undefined

vi.mock('@/hooks/useMediaUpload', () => ({
  useMediaUpload: (opts: { onAccepted: (files: File[]) => void | Promise<void> }) => {
    onAccepted = opts.onAccepted
    return {
      getInputProps: vi.fn(),
      open: vi.fn(),
    }
  },
}))

const mockEntry: Entry = {
  text: 'test text',
  audio: 'audio-1',
  image: 'img-1',
  video: 'vid-1',
}

describe('useFactsCellAttachments', () => {
  beforeEach(() => {
    onAccepted = undefined
    vi.mocked(uploadMedia).mockReset()
    vi.mocked(getMedia).mockReset()
    vi.mocked(resolveImportedMediaVersion).mockReset()
    cacheGet.mockReset()
    cacheSet.mockReset()
    cacheGet.mockResolvedValue(undefined)
    cacheSet.mockResolvedValue(undefined)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:cached-preview')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('无 entry 时返回空 mediaList', () => {
    const { result } = renderHook(() => useFactsCellAttachments())
    expect(result.current.mediaList).toHaveLength(0)
  })

  it('有 entry 时返回 3 个媒体条目', () => {
    const { result } = renderHook(() => useFactsCellAttachments(mockEntry))
    const list = result.current.mediaList
    expect(list).toHaveLength(3)

    expect(list[0]).toMatchObject({ key: 'audio', label: 'term.audio' })
    expect(list[1]).toMatchObject({ key: 'image', label: 'term.image' })
    expect(list[2]).toMatchObject({ key: 'video', label: 'term.video' })
  })

  it('有 entry 时 mediaList 包含对应的 value', () => {
    const { result } = renderHook(() => useFactsCellAttachments(mockEntry))
    expect(result.current.mediaList[0].value).toBe('audio-1')
    expect(result.current.mediaList[1].value).toBe('img-1')
    expect(result.current.mediaList[2].value).toBe('vid-1')
  })

  it('初始状态 isOpen 为 false', () => {
    const { result } = renderHook(() => useFactsCellAttachments(mockEntry))
    expect(result.current.isOpen).toBe(false)
  })

  it('返回 upload 和 preview 方法', () => {
    const { result } = renderHook(() => useFactsCellAttachments(mockEntry))
    expect(typeof result.current.upload).toBe('function')
    expect(typeof result.current.preview).toBe('function')
    expect(typeof result.current.getInputProps).toBe('function')
  })

  it('clears loading after a successful upload', async () => {
    vi.mocked(uploadMedia).mockResolvedValueOnce({
      data: { id: 'new-image', mime: 'image/png' },
    } as Awaited<ReturnType<typeof uploadMedia>>)
    const onUpload = vi.fn()
    const { result } = renderHook(() => useFactsCellAttachments(mockEntry, onUpload))

    await act(async () => {
      await onAccepted?.([new File(['x'], 'a.png', { type: 'image/png' })])
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.mediaList[1].value).toBe('new-image')
    expect(onUpload).toHaveBeenCalledWith('new-image', 'image')
  })

  it('clears loading when uploadMedia rejects', async () => {
    vi.mocked(uploadMedia).mockRejectedValueOnce(new Error('upload failed'))
    const { result } = renderHook(() => useFactsCellAttachments(mockEntry))

    await act(async () => {
      await expect(
        onAccepted?.([new File(['x'], 'a.png', { type: 'image/png' })]),
      ).rejects.toThrow('upload failed')
    })

    expect(result.current.loading).toBe(false)
  })

  it('skips upload while already loading', async () => {
    let resolveUpload!: (value: Awaited<ReturnType<typeof uploadMedia>>) => void
    vi.mocked(uploadMedia).mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveUpload = resolve
      }),
    )
    const { result } = renderHook(() => useFactsCellAttachments(mockEntry))

    let firstUpload!: Promise<void | undefined>
    act(() => {
      firstUpload = Promise.resolve(
        onAccepted?.([new File(['x'], 'a.png', { type: 'image/png' })]),
      )
    })

    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.loading).toBe(true)

    await act(async () => {
      await onAccepted?.([new File(['y'], 'b.png', { type: 'image/png' })])
    })
    expect(uploadMedia).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveUpload({
        data: { id: 'new-image', mime: 'image/png' },
      } as Awaited<ReturnType<typeof uploadMedia>>)
      await firstUpload
    })
    expect(result.current.loading).toBe(false)
  })

  it('stores audio and video uploads on the matching row', async () => {
    const cases = [
      { mime: 'audio/mpeg', id: 'new-audio', index: 0, type: 'audio' },
      { mime: 'video/mp4', id: 'new-video', index: 2, type: 'video' },
    ] as const

    for (const item of cases) {
      vi.mocked(uploadMedia).mockResolvedValueOnce({
        data: { id: item.id, mime: item.mime },
      } as Awaited<ReturnType<typeof uploadMedia>>)
      const onUpload = vi.fn()
      const { result, unmount } = renderHook(() => useFactsCellAttachments(mockEntry, onUpload))

      await act(async () => {
        await onAccepted?.([new File(['x'], 'file', { type: item.mime })])
      })

      expect(result.current.mediaList[item.index].value).toBe(item.id)
      expect(onUpload).toHaveBeenCalledWith(item.id, item.type)
      expect(result.current.loading).toBe(false)
      unmount()
    }
  })

  it('rejects an unknown upload mime and keeps the current values', async () => {
    vi.mocked(uploadMedia).mockResolvedValueOnce({
      data: { id: 'bad', mime: 'application/pdf' },
    } as Awaited<ReturnType<typeof uploadMedia>>)
    const onUpload = vi.fn()
    const { result } = renderHook(() => useFactsCellAttachments(mockEntry, onUpload))

    await act(async () => {
      await expect(
        onAccepted?.([new File(['x'], 'a.pdf', { type: 'application/pdf' })]),
      ).rejects.toThrow('unknown Media Type')
    })

    expect(onUpload).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
    expect(result.current.mediaList.map((item) => item.value)).toEqual(['audio-1', 'img-1', 'vid-1'])
  })

  it('does not open a preview when the media id is missing', async () => {
    const { result } = renderHook(() => useFactsCellAttachments(mockEntry))
    const item = { ...result.current.mediaList[2], value: undefined }

    await act(async () => {
      await result.current.preview(item)
    })

    expect(result.current.isOpen).toBe(false)
    expect(result.current.file).toBeUndefined()
    expect(cacheGet).not.toHaveBeenCalled()
    expect(getMedia).not.toHaveBeenCalled()
  })

  it('opens a cached preview without downloading', async () => {
    const blob = new Blob(['cached'])
    cacheGet.mockResolvedValue(blob)
    const { result } = renderHook(() => useFactsCellAttachments(mockEntry))

    await act(async () => {
      await result.current.preview(result.current.mediaList[1])
    })

    expect(getMedia).not.toHaveBeenCalled()
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
    expect(result.current.file).toBe('blob:cached-preview')
    expect(result.current.fileType).toBe('image')
    expect(result.current.isOpen).toBe(true)
    expect(result.current.mediaList[1].loading).toBe(false)
    expect(result.current.mediaList[1].progress).toBeNull()
    expect(result.current.mediaList[0].loading).toBe(false)
  })

  it('downloads a preview and reports progress for the matching row', async () => {
    let onProgress: OnProgress | undefined
    let release!: (value: { url: string, blob: Blob }) => void
    const blob = new Blob(['img'])
    vi.mocked(getMedia).mockImplementation((_id, progress) => {
      onProgress = progress
      return new Promise((resolve) => {
        release = resolve
      })
    })
    const { result } = renderHook(() => useFactsCellAttachments(mockEntry))
    const image = result.current.mediaList[1]

    let pending!: Promise<void>
    act(() => {
      pending = result.current.preview(image)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(onProgress).toBeTypeOf('function')
    expect(result.current.mediaList[1].loading).toBe(true)
    expect(result.current.mediaList[1].progress).toBe('0')
    expect(result.current.mediaList[0].progress).toBeNull()

    await act(async () => {
      onProgress?.({ progress: 0.5 } as ProgressEvent)
    })
    expect(result.current.mediaList[1].progress).toBe('50')

    await act(async () => {
      onProgress?.({ progress: null } as unknown as ProgressEvent)
    })
    expect(result.current.mediaList[1].progress).toBe('0')

    await act(async () => {
      release({ url: 'blob:fetched', blob })
      await pending
    })
    expect(getMedia).toHaveBeenCalledWith('img-1', expect.any(Function), undefined)
    expect(cacheSet).toHaveBeenCalledWith('img-1', blob)
    expect(result.current.file).toBe('blob:fetched')
    expect(result.current.fileType).toBe('image')
    expect(result.current.isOpen).toBe(true)
    expect(result.current.mediaList[1].loading).toBe(false)
    expect(result.current.mediaList[1].progress).toBeNull()
  })

  it('previews imported media with the published snapshot version', async () => {
    const blob = new Blob(['a'])
    vi.mocked(resolveImportedMediaVersion).mockResolvedValue(4)
    vi.mocked(getMedia).mockResolvedValue({ url: 'blob:ver', blob })
    const { result } = renderHook(() => useFactsCellAttachments(mockEntry, undefined, {
      imported: true,
      deckId: 'deck-1',
      factId: 'fact-1',
    }))

    await act(async () => {
      await result.current.preview(result.current.mediaList[0])
    })

    expect(resolveImportedMediaVersion).toHaveBeenCalledWith('deck-1', 'fact-1', 'audio-1')
    expect(cacheGet).toHaveBeenCalledWith('audio-1:v4')
    expect(getMedia).toHaveBeenCalledWith('audio-1', expect.any(Function), 4)
    expect(cacheSet).toHaveBeenCalledWith('audio-1:v4', blob)
    expect(result.current.file).toBe('blob:ver')
    expect(result.current.fileType).toBe('audio')
    expect(result.current.isOpen).toBe(true)
  })

  it('ignores a zero published version when previewing imported media', async () => {
    vi.mocked(resolveImportedMediaVersion).mockResolvedValue(0)
    vi.mocked(getMedia).mockResolvedValue({ url: 'blob:plain', blob: new Blob(['a']) })
    const { result } = renderHook(() => useFactsCellAttachments(mockEntry, undefined, {
      imported: true,
      deckId: 'deck-1',
      factId: 'fact-1',
    }))

    await act(async () => {
      await result.current.preview(result.current.mediaList[0])
    })

    expect(cacheGet).toHaveBeenCalledWith('audio-1')
    expect(getMedia).toHaveBeenCalledWith('audio-1', expect.any(Function), 0)
  })

  it('does not resolve a version unless the cell is an imported fact', async () => {
    const cases = [
      undefined,
      { imported: false, deckId: 'deck-1', factId: 'fact-1' },
      { imported: true, factId: 'fact-1' },
      { imported: true, deckId: 'deck-1' },
    ] as const

    for (const opts of cases) {
      cacheGet.mockClear()
      vi.mocked(getMedia).mockClear()
      vi.mocked(resolveImportedMediaVersion).mockClear()
      vi.mocked(getMedia).mockResolvedValue({ url: 'blob:plain', blob: new Blob(['a']) })
      const { result, unmount } = renderHook(() => useFactsCellAttachments(mockEntry, undefined, opts))

      await act(async () => {
        await result.current.preview(result.current.mediaList[0])
      })

      expect(resolveImportedMediaVersion).not.toHaveBeenCalled()
      expect(cacheGet).toHaveBeenCalledWith('audio-1')
      expect(getMedia).toHaveBeenCalledWith('audio-1', expect.any(Function), undefined)
      unmount()
    }
  })
})
