import { API_BASE_URL } from '@/config'
import { logger } from '@/lib/logger'
import { formatErrorMessage } from '@/utils/format'

export type GetTokenFn = () => Promise<string | null>

export interface ProgressEvent {
  loaded: number
  total: number | null
  progress: number | null
}

export type OnProgress = (event: ProgressEvent) => void

export interface RequestOptions extends RequestInit {
  onDownloadProgress?: OnProgress
}

async function readBodyWithProgress(res: Response, onProgress: OnProgress): Promise<Blob> {
  const contentLength = res.headers.get('content-length')
  const total = contentLength ? Number.parseInt(contentLength, 10) : null
  const reader = res.body!.getReader()
  const chunks: Uint8Array[] = []
  let loaded = 0
  onProgress({ loaded: 0, total, progress: total ? 0 : null })
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.length
    onProgress({ loaded, total, progress: total ? loaded / total : null })
  }
  return new Blob(chunks as BlobPart[], { type: res.headers.get('content-type') ?? '' })
}

function normalizeHeaders(input?: HeadersInit): Record<string, string> {
  if (!input) return {}
  if (input instanceof Headers) {
    const out: Record<string, string> = {}
    input.forEach((v, k) => { out[k] = v })
    return out
  }
  if (Array.isArray(input)) {
    return Object.fromEntries(input) as Record<string, string>
  }
  return { ...(input as Record<string, string>) }
}

export function createRequest(getToken: GetTokenFn) {
  return async function request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { onDownloadProgress, ...fetchOptions } = options
    const token = await getToken()

    const headers: Record<string, string> = normalizeHeaders(fetchOptions.headers)

    if (!(fetchOptions.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json;charset=UTF-8'
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const url = `${API_BASE_URL}${endpoint}`

    const init = {
      ...fetchOptions,
      headers,
    }

    const initForLog = {
      ...init,
      headers: {
        ...(init.headers as Record<string, string>),
        ...(headers.Authorization ? { Authorization: '[REDACTED]' } : {}),
      },
    }

    logger.info({ url, init: initForLog }, '[request]')

    const res = await fetch(url, init)

    const blob = onDownloadProgress && res.body
      ? await readBodyWithProgress(res, onDownloadProgress)
      : await res.blob()

    const mediaTypes = ['image/', 'audio/', 'video/']

    if (mediaTypes.some((e) => blob.type.startsWith(e))) {
      return blob as unknown as T
    }

    const text = await blob.text()

    let json: any = null
    if (blob.type.includes('application/json')) {
      try {
        json = JSON.parse(text)
      } catch {
        // blob.type claimed JSON but body wasn't parseable; fall back to text
      }
    }

    if (!res.ok) {
      const errorMessage = formatErrorMessage(json ?? text)
      logger.error({ url, status: res.status, error: errorMessage }, '[request:error]')
      throw new Error(errorMessage)
    }

    return json
  }
}

const getTokenIsomorphic: GetTokenFn = async () => {
  if (typeof window === 'undefined') {
    return (await import('@/lib/token')).getToken()
  }
  return (await import('@/lib/token.client')).getClientToken()
}

export const request = createRequest(getTokenIsomorphic)
