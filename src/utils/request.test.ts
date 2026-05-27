import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config'
import { createRequest } from './request'

describe('createRequest', () => {
  afterEach(() => {
    vi.restoreAllMocks()
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
})
