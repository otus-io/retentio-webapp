import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getMedia = vi.fn()

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('@/api/media', () => ({ getMedia: (...a: unknown[]) => getMedia(...a) }))

import StudyCardMedia from '@/components/study/StudyCardMedia'

describe('StudyCardMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    URL.revokeObjectURL = vi.fn()
  })

  it('downloads with the snapshot version and shows an image', async () => {
    getMedia.mockResolvedValue({ url: 'blob:img' })
    const { unmount } = render(<StudyCardMedia url="https://x/api/media/m1?v=4" kind="image" alt="pic" />)
    expect(screen.getByRole('status')).toBeTruthy()
    expect(((await screen.findByAltText('pic')) as HTMLImageElement).src).toBe('blob:img')
    expect(getMedia).toHaveBeenCalledWith('m1', undefined, 4)
    unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:img')
  })

  it('shows a video', async () => {
    getMedia.mockResolvedValue({ url: 'blob:vid' })
    const { container } = render(<StudyCardMedia url="https://x/api/media/m2" kind="video" alt="" />)
    await waitFor(() => expect(container.querySelector('video')?.getAttribute('src')).toBe('blob:vid'))
    expect(getMedia).toHaveBeenCalledWith('m2', undefined, undefined)
  })

  it('renders nothing when the download fails', async () => {
    getMedia.mockRejectedValue(new Error('403'))
    const { container } = render(<StudyCardMedia url="https://x/api/media/m3" kind="image" alt="" />)
    await waitFor(() => expect(container.innerHTML).toBe(''))
  })

  it('drops a download that finishes after unmount', async () => {
    let resolve!: (v: { url: string }) => void
    let reject!: (e: Error) => void
    getMedia.mockReturnValueOnce(new Promise((r) => { resolve = r }))
      .mockReturnValueOnce(new Promise((_, r) => { reject = r }))
    const first = render(<StudyCardMedia url="https://x/api/media/m4" kind="image" alt="" />)
    first.unmount()
    resolve({ url: 'blob:late' })
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:late'))
    const second = render(<StudyCardMedia url="https://x/api/media/m5" kind="image" alt="" />)
    second.unmount()
    reject(new Error('late'))
    await Promise.resolve()
  })
})
