import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMediaUpload } from './useMediaUpload'

const { useDropzone } = vi.hoisted(() => ({
  useDropzone: vi.fn(),
}))

vi.mock('react-dropzone', () => ({
  useDropzone,
}))

function lastConfig() {
  const calls = useDropzone.mock.calls
  return calls[calls.length - 1][0]
}

describe('useMediaUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('传递正确的 accept 配置给 useDropzone', () => {
    useMediaUpload()
    const config = lastConfig()

    expect(config.noClick).toBe(true)
    expect(config.noKeyboard).toBe(true)
    expect(config.multiple).toBe(false)

    const accept = config.accept as Record<string, string[]>
    expect(accept['image/jpeg']).toBeDefined()
    expect(accept['audio/mpeg']).toBeDefined()
    expect(accept['video/mp4']).toBeDefined()
  })

  it('multiple 参数透传给 useDropzone', () => {
    useMediaUpload({ multiple: true })
    expect(lastConfig().multiple).toBe(true)
  })

  it('validator 允许符合大小限制的图片', () => {
    useMediaUpload()
    const smallFile = new File(['x'.repeat(100)], 'test.jpg', { type: 'image/jpeg' })
    expect(lastConfig().validator!(smallFile)).toBeNull()
  })

  it('validator 拒绝超过 5MB 的图片', () => {
    useMediaUpload()
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    expect(lastConfig().validator!(largeFile)).toMatchObject({ code: 'file-too-large' })
  })

  it('validator 拒绝超过 200MB 的音频', () => {
    useMediaUpload()
    const largeFile = new File(['x'.repeat(201 * 1024 * 1024)], 'big.mp3', { type: 'audio/mpeg' })
    expect(lastConfig().validator!(largeFile)).toMatchObject({ code: 'file-too-large' })
  })

  it('validator 拒绝超过 200MB 的视频', () => {
    useMediaUpload()
    const largeFile = new File(['x'.repeat(201 * 1024 * 1024)], 'big.mp4', { type: 'video/mp4' })
    expect(lastConfig().validator!(largeFile)).toMatchObject({ code: 'file-too-large' })
  })

  it('validator 对未知 MIME 类型返回 null（无大小限制则通过）', () => {
    useMediaUpload()
    const unknownFile = new File(['x'], 'test.xyz', { type: 'application/octet-stream' })
    expect(lastConfig().validator!(unknownFile)).toBeNull()
  })

  it('onAccepted 回调透传', () => {
    const onAccepted = vi.fn()
    useMediaUpload({ onAccepted })
    expect(lastConfig().onDropAccepted).toBe(onAccepted)
  })
})
