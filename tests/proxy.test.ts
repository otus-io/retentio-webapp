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

const nextMock = vi.fn(() => ({ type: 'next' as const }))
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

import { proxy } from '@/proxy'

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
})
