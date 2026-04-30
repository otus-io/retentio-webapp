import { useDropzone, FileRejection } from 'react-dropzone'

const MB = 1024 * 1024
const MAX_IMAGE = 5 * MB
const MAX_VIDEO = 200 * MB
const MAX_AUDIO = 200 * MB

// ── 允许的 MIME ───────────────────────────────────────────────
const ACCEPTED_TYPES = {
  // 图片（排除 gif）
  'image/jpeg': [],
  'image/png': [],
  'image/webp': [],
  'image/avif': [],
  'image/svg+xml': [],
  'image/bmp': [],
  'image/tiff': [],
  // 常见音频
  'audio/mpeg': [], // mp3
  'audio/ogg': [],
  'audio/wav': [],
  'audio/flac': [],
  'audio/aac': [],
  'audio/webm': [],
  'audio/mp4': [], // m4a
  // 常见视频
  'video/mp4': [],
  'video/webm': [],
  'video/ogg': [],
  'video/quicktime': [], // mov
  'video/x-msvideo': [], // avi
  'video/x-matroska': [], // mkv
}

// ── 按 MIME 取对应大小上限 ────────────────────────────────────
function maxSizeFor(mime: string): number {
  if (mime.startsWith('image/')) return MAX_IMAGE
  if (mime.startsWith('video/')) return MAX_VIDEO
  if (mime.startsWith('audio/')) return MAX_AUDIO
  return 0
}

// ── 自定义校验器 ──────────────────────────────────────────────
function mediaValidator(file: File) {
  const limit = maxSizeFor(file.type)
  if (limit && file.size > limit) {
    const limitMB = limit / MB
    const actualMB = (file.size / MB).toFixed(1)
    return {
      code: 'file-too-large',
      message: `${file.name} 超出大小限制（${actualMB} MB > ${limitMB} MB）`,
    }
  }
  return null
}

// ── Hook ──────────────────────────────────────────────────────
interface UseMediaUploadOptions {
  onAccepted?: (files: File[]) => void
  onRejected?: (rejections: FileRejection[]) => void
  multiple?: boolean
}

export function useMediaUpload({
  onAccepted,
  onRejected,
  multiple = false,
}: UseMediaUploadOptions = {}) {
  return useDropzone({
    noClick: true,
    noKeyboard: true,
    multiple,
    accept: ACCEPTED_TYPES,
    validator: mediaValidator,
    onDropAccepted: onAccepted,
    onDropRejected: onRejected,
  })
}
