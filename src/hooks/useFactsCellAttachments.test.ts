import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFactsCellAttachments } from './useFactsCellAttachments'
import type { Entry } from '@/modules/facts/facts.schema'

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

vi.mock('./useMediaUpload', () => ({
  useMediaUpload: () => ({
    getInputProps: vi.fn(),
    open: vi.fn(),
  }),
}))

const mockEntry: Entry = {
  text: 'test text',
  audio: 'audio-1',
  image: 'img-1',
  video: 'vid-1',
}

describe('useFactsCellAttachments', () => {
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
})
