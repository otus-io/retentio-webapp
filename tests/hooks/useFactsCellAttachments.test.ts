import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useFactsCellAttachments } from '@/hooks/useFactsCellAttachments'
import type { Entry } from '@/modules/facts/facts.schema'
import { uploadMedia } from '@/api/media'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/api/media', () => ({
  getMedia: vi.fn(),
  uploadMedia: vi.fn(),
}))

vi.mock('@/lib/idb-cache', () => ({
  createBlobCache: () => ({
    get: vi.fn(),
    set: vi.fn(),
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
})
