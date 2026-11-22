// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'
import { API_BASE_URL } from '@/config'

const getTokenMock = vi.fn()

vi.mock('@/lib/token', () => ({
  getToken: () => getTokenMock(),
}))

import { DELETE, GET, PATCH, POST, PUT } from '@/app/backend/[...path]/route'

function makeReq(method: string, search = '', init: RequestInit = {}) {
  const req = new Request(`http://localhost/backend/x${search}`, { method, ...init })
  return Object.assign(req, { nextUrl: { search } }) as unknown as NextRequest
}

function ctx(path: string[]) {
  return { params: Promise.resolve({ path }) }
}

describe('/backend/[...path] route', () => {
  beforeEach(() => {
    getTokenMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exports one handler for every method', () => {
    expect(new Set([GET, POST, PUT, PATCH, DELETE]).size).toBe(1)
  })

  it('forwards GET with the cookie token and query, streaming status and headers back', async () => {
    getTokenMock.mockResolvedValue('server-token')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('img', { status: 200, headers: { 'Content-Type': 'image/png', 'Content-Length': '3' } }),
    )

    const res = await GET(makeReq('GET', '?v=2'), ctx(['api', 'media', 'a b']))

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe(`${API_BASE_URL}/api/media/a%20b?v=2`)
    expect(init?.method).toBe('GET')
    expect(init?.body).toBeUndefined()
    const headers = init?.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer server-token')
    expect(headers.get('Content-Type')).toBeNull()
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/png')
    expect(res.headers.get('Content-Length')).toBe('3')
    await expect(res.text()).resolves.toBe('img')
  })

  it('forwards the body and content type without a token when logged out', async () => {
    getTokenMock.mockResolvedValue(null)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"msg":"bad"}', {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Content-Length': '13', 'Content-Encoding': 'gzip' },
      }),
    )

    const res = await PATCH(
      makeReq('PATCH', '', { body: '{"rate":1}', headers: { 'Content-Type': 'application/json' } }),
      ctx(['api', 'decks', 'd1']),
    )

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe(`${API_BASE_URL}/api/decks/d1`)
    expect(new TextDecoder().decode(init?.body as ArrayBuffer)).toBe('{"rate":1}')
    const headers = init?.headers as Headers
    expect(headers.get('Authorization')).toBeNull()
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(res.status).toBe(400)
    expect(res.headers.get('Content-Length')).toBeNull()
  })

  it('omits response headers the backend did not send', async () => {
    getTokenMock.mockResolvedValue('t')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

    const res = await DELETE(makeReq('DELETE'), ctx(['api', 'tags', 't1']))

    expect(res.status).toBe(204)
    expect(res.headers.get('Content-Type')).toBeNull()
  })

  it.each([
    [['auth', 'login']],
    [['api', '..', 'auth', 'login']],
    [['api', '.', 'profile']],
  ])('rejects non-/api or traversal paths %j', async (path) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const res = await GET(makeReq('GET'), ctx(path))

    expect(res.status).toBe(404)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(getTokenMock).not.toHaveBeenCalled()
  })
})
