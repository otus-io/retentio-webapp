import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'
import {
  FORGOT_PASSWORD_PATH,
  JWT_COOKIE_NAME,
  LOGIN_PATH,
  REGISTER_PATH,
  RESET_PASSWORD_PATH,
  VERIFY_EMAIL_PATH,
} from '@/config'

const cookieDeleteMock = vi.fn()
const nextMock = vi.fn(() => ({ type: 'next' as const, cookies: { delete: cookieDeleteMock } }))
const profileRequestMock = vi.fn()
const redirectMock = vi.fn((url: URL) => ({ type: 'redirect' as const, url: url.toString() }))

vi.mock('next/server', () => ({
  NextResponse: {
    next: (...args: unknown[]) => nextMock(...args),
    redirect: (...args: unknown[]) => redirectMock(...(args as [URL])),
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    fatal: vi.fn(),
  },
}))

vi.mock('@/utils/request', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createRequest: (getToken: () => Promise<string | null>) =>
    async (endpoint: string) => profileRequestMock(endpoint, await getToken()),
}))

import { proxy } from '@/proxy'
import { RequestError } from '@/utils/request'

function makeRequest(pathname: string, token?: string): NextRequest {
  return {
    nextUrl: { pathname },
    url: `https://web.retentio.app${pathname}`,
    cookies: {
      get: (name: string) =>
        token && name === JWT_COOKIE_NAME ? { name, value: token } : undefined,
    },
  } as unknown as NextRequest
}

describe('proxy auth guest paths', () => {
  beforeEach(() => {
    nextMock.mockClear()
    redirectMock.mockClear()
    cookieDeleteMock.mockClear()
    profileRequestMock.mockReset()
    profileRequestMock.mockResolvedValue({ data: {} })
  })

  it('allows authenticated users through /reset-password and /verify-email', async () => {
    await proxy(makeRequest(RESET_PASSWORD_PATH, 'jwt'))
    expect(nextMock).toHaveBeenCalledOnce()
    expect(redirectMock).not.toHaveBeenCalled()

    nextMock.mockClear()
    await proxy(makeRequest(VERIFY_EMAIL_PATH, 'jwt'))
    expect(nextMock).toHaveBeenCalledOnce()
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('redirects authenticated users away from login/register/forgot-password', async () => {
    for (const path of [LOGIN_PATH, REGISTER_PATH, FORGOT_PASSWORD_PATH]) {
      redirectMock.mockClear()
      nextMock.mockClear()
      await proxy(makeRequest(path, 'jwt'))
      expect(redirectMock).toHaveBeenCalledOnce()
      expect(String(redirectMock.mock.calls[0]![0])).toBe('https://web.retentio.app/')
      expect(nextMock).not.toHaveBeenCalled()
    }
  })

  it('allows anonymous users through email-link auth pages', async () => {
    for (const path of [RESET_PASSWORD_PATH, VERIFY_EMAIL_PATH, FORGOT_PASSWORD_PATH]) {
      nextMock.mockClear()
      redirectMock.mockClear()
      await proxy(makeRequest(path))
      expect(nextMock).toHaveBeenCalledOnce()
      expect(redirectMock).not.toHaveBeenCalled()
    }
  })

  it('redirects anonymous users from protected paths to login', async () => {
    await proxy(makeRequest('/dashboard'))
    expect(redirectMock).toHaveBeenCalledOnce()
    const url = String(redirectMock.mock.calls[0]![0])
    expect(url).toContain(LOGIN_PATH)
    expect(url).toContain('redirect=%2Fdashboard')
  })

  it('validates the token against the profile endpoint', async () => {
    await proxy(makeRequest(LOGIN_PATH, 'jwt'))
    expect(profileRequestMock).toHaveBeenCalledWith('/api/profile', 'jwt')
  })

  it('clears a rejected token and lets the user reach login', async () => {
    profileRequestMock.mockRejectedValue(new RequestError('Invalid or expired token', 401))
    await proxy(makeRequest(LOGIN_PATH, 'stale'))
    expect(nextMock).toHaveBeenCalledOnce()
    expect(cookieDeleteMock).toHaveBeenCalledWith(JWT_COOKIE_NAME)
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('keeps the token when the profile check fails for another reason', async () => {
    for (const err of [new RequestError('boom', 500), new Error('network')]) {
      redirectMock.mockClear()
      profileRequestMock.mockRejectedValue(err)
      await proxy(makeRequest(LOGIN_PATH, 'jwt'))
      expect(redirectMock).toHaveBeenCalledOnce()
      expect(cookieDeleteMock).not.toHaveBeenCalled()
    }
  })
})
