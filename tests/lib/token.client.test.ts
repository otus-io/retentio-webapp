import { afterEach, describe, expect, it } from 'vitest'
import { JWT_COOKIE_NAME } from '@/config'
import { getClientToken } from '@/lib/token.client'

describe('getClientToken', () => {
  afterEach(() => {
    document.cookie = `${JWT_COOKIE_NAME}=; Max-Age=0`
  })

  it('returns null when the cookie is absent', async () => {
    document.cookie = `${JWT_COOKIE_NAME}=; Max-Age=0`
    await expect(getClientToken()).resolves.toBeNull()
  })

  it('returns the cookie value', async () => {
    document.cookie = `${JWT_COOKIE_NAME}=client-token`
    await expect(getClientToken()).resolves.toBe('client-token')
  })
})
