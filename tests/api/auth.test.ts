import { beforeEach, describe, expect, it, vi } from 'vitest'

const requestMock = vi.fn()

vi.mock('@/utils/request', () => ({
  request: (...args: unknown[]) => requestMock(...args),
}))

import { forgotPassword, resetPassword, verifyEmail } from '@/api/auth'

describe('auth API clients', () => {
  beforeEach(() => {
    requestMock.mockReset()
    requestMock.mockResolvedValue({ data: { msg: 'ok' }, meta: null })
  })

  it('forgotPassword posts email to /auth/forgot-password', async () => {
    await forgotPassword({ email: 'a@b.com' })
    expect(requestMock).toHaveBeenCalledWith('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com' }),
    })
  })

  it('resetPassword maps password to new_password', async () => {
    await resetPassword({
      token: 'tok',
      password: 'secret123',
      confirmPassword: 'secret123',
    })
    expect(requestMock).toHaveBeenCalledWith('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'tok', new_password: 'secret123' }),
    })
  })

  it('verifyEmail posts token to /auth/verify-email', async () => {
    await verifyEmail({ token: 'verify-tok' })
    expect(requestMock).toHaveBeenCalledWith('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: 'verify-tok' }),
    })
  })
})
