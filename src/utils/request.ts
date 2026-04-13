
'use server'

import { getToken } from '@/lib/token.server'

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
  if (!res.ok) {
    const text = await res.json().catch(() => 'Unknown error')
    throw new Error(text)
  }
  return res.json()
}

