import { formatErrorMessage } from '@/utils/format'

const BASE_URL = 'https://api.retentio.app:8443'

export type GetTokenFn = () => Promise<string | null>

export function createRequest(getToken: GetTokenFn) {
  return async function request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await getToken()

    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json;charset=UTF-8'
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const blob = await res.blob()

    const mediaTypes = [
      'image/png',
      'audio/mpeg',
      'video/webm',
    ]

    if (mediaTypes.includes(blob.type)) {
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
