import { API_BASE_URL } from '@/config'
import { logger } from '@/lib/logger'
import { formatErrorMessage } from '@/utils/format'
// Resolves to the real cookie reader only in the react-server layer; client bundles get a null stub.
import { getToken as getServerToken } from '#server-token'

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

export class RequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    /** Stable backend error code (e.g. `email_not_verified`), when the body has one. */
    public readonly code: string | null = null,
  ) {
    super(message)
    this.name = 'RequestError'
  }
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

export function createRequest(getToken: GetTokenFn, baseUrl: string = API_BASE_URL) {
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

    const url = `${baseUrl}${endpoint}`

    const init = {
      ...fetchOptions,
      headers,
    }

    const initForLog = {
      ...init,
      // Bodies carry passwords (login, register, change email); never log them.
      ...(init.body !== undefined ? { body: '[REDACTED]' } : {}),
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
      const code = typeof json?.code === 'string' ? json.code : null
      throw new RequestError(errorMessage, res.status, code)
    }

    return json
  }
}

const serverRequest = createRequest(getServerToken)
/** Browser calls go through the same-origin `/backend` route, which attaches the httpOnly JWT. */
const browserRequest = createRequest(async () => null, '/backend')

export function request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return (typeof window === 'undefined' ? serverRequest : browserRequest)<T>(endpoint, options)
}
