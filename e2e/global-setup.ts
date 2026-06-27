import fs from 'node:fs'
import path from 'node:path'
import type { FullConfig } from '@playwright/test'
import { API_BASE_URL, JWT_COOKIE_NAME } from '../src/config/index'

const authStatePath = path.join('e2e', '.auth-state.json')

async function fetchAuthToken(username: string, password: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new Error(`E2E login failed (${res.status}): ${await res.text()}`)
    }
    const body = await res.json() as { data?: { token?: string } }
    const token = body.data?.token
    if (!token) {
      throw new Error('E2E login response missing token')
    }
    return token
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`E2E login timed out after 10s (${API_BASE_URL}/auth/login)`)
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

async function apiRequest(token: string, path: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...authHeaders(token),
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new Error(`E2E API ${init.method ?? 'GET'} ${path} failed (${res.status}): ${await res.text()}`)
    }
    return res
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`E2E API ${init.method ?? 'GET'} ${path} timed out after 10s (${API_BASE_URL}${path})`)
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

async function deleteAllDecks(token: string) {
  const res = await apiRequest(token, '/api/decks')
  const body = await res.json() as { data?: { decks?: { id: string }[] | null } }
  const decks = body.data?.decks ?? []
  for (const deck of decks) {
    await apiRequest(token, `/api/decks/${deck.id}`, { method: 'DELETE' })
  }
}

async function deleteAllTags(token: string) {
  const res = await apiRequest(token, '/api/tags')
  const body = await res.json() as { data?: { tags?: { id: string }[] | null } }
  const tags = body.data?.tags ?? []
  for (const tag of tags) {
    await apiRequest(token, `/api/tags/${tag.id}`, { method: 'DELETE' })
  }
}

async function resetE2EUserData(token: string) {
  await deleteAllDecks(token)
  await deleteAllTags(token)
}

export default async function globalSetup(config: FullConfig) {
  const username = process.env.E2E_USERNAME
  const password = process.env.E2E_PASSWORD
  if (!username || !password) {
    if (process.env.CI) {
      throw new Error('E2E_USERNAME and E2E_PASSWORD must be set for e2e tests in CI')
    }
    console.warn('E2E_USERNAME or E2E_PASSWORD not set, skipping global auth setup')
    return
  }

  const baseURL =
    config.projects[0]?.use?.baseURL ??
    process.env.PLAYWRIGHT_TEST_BASE_URL ??
    'http://localhost:3000'

  const token = await fetchAuthToken(username, password)
  await resetE2EUserData(token)
  const { hostname } = new URL(baseURL)

  fs.mkdirSync(path.dirname(authStatePath), { recursive: true })
  fs.writeFileSync(
    authStatePath,
    JSON.stringify(
      {
        cookies: [
          {
            name: JWT_COOKIE_NAME,
            value: token,
            domain: hostname,
            path: '/',
          },
        ],
        origins: [],
      },
      null,
      2,
    ),
  )
}
