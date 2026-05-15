import { formatErrorMessage } from '@/utils/format'

const BASE_URL = 'https://api.retentio.app:8443'

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

export function createRequest(getToken: GetTokenFn) {
  return async function request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { onDownloadProgress, ...fetchOptions } = options
    const token = await getToken()

    const headers: Record<string, string> = {
      ...((fetchOptions.headers as Record<string, string>) || {}),
    }

    if (!(fetchOptions.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json;charset=UTF-8'
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    })

    const blob = onDownloadProgress && res.body
      ? await readBodyWithProgress(res, onDownloadProgress)
      : await res.blob()

    const mediaTypes = ['image/', 'audio/', 'video/']

    if (mediaTypes.some((e) => blob.type.startsWith(e))) {
      return blob as unknown as T
    }

    const text = await blob.text()

    let json: any = null
    if (blob.type === 'application/json') {
      json = JSON.parse(text)
    }

    if (!res.ok) {
      throw new Error(formatErrorMessage(json ?? text))
    }

    return json
  }
}
