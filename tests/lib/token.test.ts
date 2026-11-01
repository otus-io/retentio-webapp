import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JWT_COOKIE_NAME } from '@/config'

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: () => cookieStore,
}))

import { getToken, removeToken, setToken } from '@/lib/token'

describe('token', () => {
  beforeEach(() => {
    cookieStore.get.mockReset()
    cookieStore.set.mockReset()
    cookieStore.delete.mockReset()
  })

  it('returns the cookie value', async () => {
    cookieStore.get.mockReturnValue({ value: 'server-token' })
    await expect(getToken()).resolves.toBe('server-token')
    expect(cookieStore.get).toHaveBeenCalledWith(JWT_COOKIE_NAME)
  })

  it('returns null when the cookie is missing', async () => {
    cookieStore.get.mockReturnValue(undefined)
    await expect(getToken()).resolves.toBeNull()
  })

  it('returns null when the cookie value is empty', async () => {
    cookieStore.get.mockReturnValue({ value: '' })
    await expect(getToken()).resolves.toBeNull()
  })

  it('writes the token cookie', async () => {
    await setToken('new-token')
    expect(cookieStore.set).toHaveBeenCalledWith(JWT_COOKIE_NAME, 'new-token', { path: '/' })
  })

  it('deletes the token cookie', async () => {
    await removeToken()
    expect(cookieStore.delete).toHaveBeenCalledWith(JWT_COOKIE_NAME)
  })
})
