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
  const req = new Request(`http://localhost/backend/x${search}`, {
    method,
    ...init,
    headers: { 'Sec-Fetch-Site': 'same-origin', ...(init.headers as Record<string, string>) },
  })
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
    expect(init?.body).toBeInstanceOf(ReadableStream)
    expect((init as { duplex?: string }).duplex).toBe('half')
    await expect(new Response(init?.body).text()).resolves.toBe('{"rate":1}')
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
    [['api', '../../auth', 'login']],
    [['api', '..\\auth']],
  ])('rejects non-/api or traversal paths %j', async (path) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const res = await GET(makeReq('GET'), ctx(path))

    expect(res.status).toBe(404)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(getTokenMock).not.toHaveBeenCalled()
  })

  it('passes the request abort signal upstream', async () => {
    getTokenMock.mockResolvedValue('t')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
    const req = makeReq('GET')

    await GET(req, ctx(['api', 'profile']))

    expect(vi.mocked(fetch).mock.calls[0][1]?.signal).toBe(req.signal)
  })

  it('returns a JSON 502 when the backend is unreachable', async () => {
    getTokenMock.mockResolvedValue('t')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'))

    const res = await POST(makeReq('POST', '', { body: '{}' }), ctx(['api', 'decks']))

    expect(res.status).toBe(502)
    await expect(res.json()).resolves.toEqual({ msg: 'Bad Gateway' })
  })

  it.each([
    ['cross-site Sec-Fetch-Site', { 'Sec-Fetch-Site': 'cross-site' }],
    ['same-site Sec-Fetch-Site', { 'Sec-Fetch-Site': 'same-site' }],
    ['foreign Origin', { Origin: 'https://evil.example', Host: 'web.retentio.app' }],
    ['unparseable Origin', { Origin: 'null', Host: 'web.retentio.app' }],
    ['Origin not matching the forwarded host', {
      'Origin': 'https://web.retentio.app',
      'Host': 'web.retentio.app',
      'X-Forwarded-Host': 'other.example',
    }],
  ])('rejects %s with 403 before touching the token', async (_, headers) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const req = makeReq('POST', '', { body: '{}' })
    req.headers.delete('Sec-Fetch-Site')
    for (const [k, v] of Object.entries(headers)) req.headers.set(k, v)

    const res = await POST(req, ctx(['api', 'decks']))

    expect(res.status).toBe(403)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(getTokenMock).not.toHaveBeenCalled()
  })

  it.each([
    ['matching Origin', { Origin: 'https://web.retentio.app', Host: 'web.retentio.app' }],
    ['matching forwarded host', { 'Origin': 'https://web.retentio.app', 'X-Forwarded-Host': 'web.retentio.app' }],
    ['no Origin or Sec-Fetch-Site', {}],
  ])('allows requests without Sec-Fetch-Site given %s', async (_, headers) => {
    getTokenMock.mockResolvedValue('t')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
    const req = makeReq('GET')
    req.headers.delete('Sec-Fetch-Site')
    for (const [k, v] of Object.entries(headers)) req.headers.set(k, v)

    const res = await GET(req, ctx(['api', 'profile']))

    expect(res.status).toBe(204)
  })
})
