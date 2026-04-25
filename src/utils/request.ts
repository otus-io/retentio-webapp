'use server'

import { getToken } from '@/lib/token.server'
import { formatErrorMessage } from '@/utils/format'

const BASE_URL = 'https://api.retentio.app:8443'

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })
  const blob = await res.blob()
  const text = await blob.text()
  let json = null
  if (blob.type === 'application/json') {
    json = JSON.parse(text)
  }
  if (!res.ok) {
    // 如果有 json 错误信息，优先使用它，否则使用纯文本错误信息，最后使用默认错误信息
    throw new Error(formatErrorMessage(json ?? text))
  }
  return json
}

