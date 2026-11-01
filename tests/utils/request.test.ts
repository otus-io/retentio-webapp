import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL, JWT_COOKIE_NAME } from '@/config'
import { createRequest, request } from '@/utils/request'

const cookiesMock = vi.fn()

vi.mock('next/headers', () => ({
  cookies: (...args: unknown[]) => cookiesMock(...args),
}))

describe('createRequest', () => {
  beforeEach(() => {
    cookiesMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    document.cookie = `${JWT_COOKIE_NAME}=; Max-Age=0`
  })

  it('成功请求返回 JSON', async () => {
    const getToken = vi.fn().mockResolvedValue('token123')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 1, name: 'test' }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const request = createRequest(getToken)
    const data = await request<{ id: number, name: string }>('/api/users')

    expect(data).toEqual({ id: 1, name: 'test' })
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/users`,
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'Authorization': 'Bearer token123',
        },
      }),
    )
  })

  it('错误响应抛出带信息的 Error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: '用户不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const request = createRequest(vi.fn().mockResolvedValue(null))
    await expect(request('/api/users/999')).rejects.toThrow('用户不存在')
  })

  it('错误响应无 JSON 时使用文本', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Internal Server Error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      }),
    )

    const request = createRequest(vi.fn().mockResolvedValue(null))
    await expect(request('/api/users')).rejects.toThrow('Internal Server Error')
  })

  it('FormData 请求不设置 Content-Type', async () => {
    const getToken = vi.fn().mockResolvedValue('token')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { headers: { 'Content-Type': 'application/json' } }),
    )

    const request = createRequest(getToken)
    const fd = new FormData()
    fd.append('file', new Blob(['content']), 'test.txt')
    await request('/api/upload', { method: 'POST', body: fd })

    const headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers
    expect(headers['Content-Type']).toBeUndefined()
  })

  it('无 token 时不设置 Authorization', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { headers: { 'Content-Type': 'application/json' } }),
    )

    const request = createRequest(vi.fn().mockResolvedValue(null))
    await request('/api/public')

    const headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers
    expect(headers.Authorization).toBeUndefined()
  })

  it('媒体类型响应直接返回 blob', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('fake-image-data', { headers: { 'Content-Type': 'image/png' } }),
    )

    const request = createRequest(vi.fn().mockResolvedValue(null))
    const result: Blob = await request('/api/image/1')

    expect(result.constructor.name).toBe('Blob')
    expect((result as Blob).type).toBe('image/png')
  })

  it('下载进度回调被调用', async () => {
    const body = JSON.stringify({ data: 'x'.repeat(100) })
    const contentLength = new TextEncoder().encode(body).length
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(body, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': String(contentLength),
        },
      }),
    )

    const progressEvents: { loaded: number, total: number | null }[] = []
    const onProgress = (e: { loaded: number, total: number | null }) => progressEvents.push(e)

    const request = createRequest(vi.fn().mockResolvedValue(null))
    await request('/api/data', { onDownloadProgress: onProgress })

    expect(progressEvents.length).toBeGreaterThanOrEqual(1)
    expect(progressEvents[0].total).toBe(contentLength)
    expect(progressEvents[progressEvents.length - 1].loaded).toBe(contentLength)
  })

  it('缺少 Content-Length 与 Content-Type 时进度为 null 且不解析正文', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3])),
    )

    const progressEvents: { loaded: number, total: number | null, progress: number | null }[] = []
    const requestWithProgress = createRequest(vi.fn().mockResolvedValue(null))
    const result = await requestWithProgress('/api/data', {
      onDownloadProgress: (event) => progressEvents.push(event),
    })

    expect(result).toBeNull()
    expect(progressEvents[0]).toEqual({ loaded: 0, total: null, progress: null })
    expect(progressEvents.some((event) => event.loaded === 3 && event.total === null && event.progress === null)).toBe(true)
  })

  it('将 Headers 实例规范为普通对象', async () => {
    const getToken = vi.fn().mockResolvedValue('token')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { headers: { 'Content-Type': 'application/json' } }),
    )

    const req = createRequest(getToken)
    await req('/api/users', { headers: new Headers({ 'X-Custom': 'abc' }) })

    const headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers
    expect(headers['x-custom']).toBe('abc')
    expect(headers['Content-Type']).toBe('application/json;charset=UTF-8')
    expect(headers.Authorization).toBe('Bearer token')
  })

  it('将头元组数组规范为普通对象', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { headers: { 'Content-Type': 'application/json' } }),
    )

    const req = createRequest(vi.fn().mockResolvedValue(null))
    await req('/api/users', { headers: [['X-Request-Id', 'req-1']] })

    const headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers
    expect(headers['X-Request-Id']).toBe('req-1')
    expect(headers['Content-Type']).toBe('application/json;charset=UTF-8')
  })

  it('复制普通对象请求头', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { headers: { 'Content-Type': 'application/json' } }),
    )

    const req = createRequest(vi.fn().mockResolvedValue(null))
    await req('/api/users', { headers: { 'X-Plain': 'yes' } })

    const headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers
    expect(headers['X-Plain']).toBe('yes')
    expect(headers['Content-Type']).toBe('application/json;charset=UTF-8')
  })

  it('浏览器环境从客户端 cookie 读取 token', async () => {
    document.cookie = `${JWT_COOKIE_NAME}=client-token`
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { headers: { 'Content-Type': 'application/json' } }),
    )

    await request('/api/profile')

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/profile`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer client-token',
        }),
      }),
    )
    expect(cookiesMock).not.toHaveBeenCalled()
  })

  it('服务端环境从 cookie store 读取 token', async () => {
    cookiesMock.mockResolvedValue({
      get: (name: string) => (name === JWT_COOKIE_NAME ? { value: 'server-token' } : undefined),
    })
    vi.stubGlobal('window', undefined)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { headers: { 'Content-Type': 'application/json' } }),
    )

    await request('/api/profile')

    expect(cookiesMock).toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/profile`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer server-token',
        }),
      }),
    )
  })
})
