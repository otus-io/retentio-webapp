import { beforeEach, describe, expect, it, vi } from 'vitest'

const resetPasswordServiceMock = vi.fn()
const getTranslationsMock = vi.fn(async () => (key: string) => key)

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('next-intl/server', () => ({
  getTranslations: (...args: unknown[]) => getTranslationsMock(...args),
}))

vi.mock('@/modules/auth/auth.service', () => ({
  loginService: vi.fn(),
  registerService: vi.fn(),
  forgotPasswordService: vi.fn(),
  resetPasswordService: (...args: unknown[]) => resetPasswordServiceMock(...args),
  verifyEmailService: vi.fn(),
  logoutService: vi.fn(),
}))

import { resetPasswordAction } from '@/modules/auth/auth.action'

function formData(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

describe('resetPasswordAction', () => {
  beforeEach(() => {
    resetPasswordServiceMock.mockReset()
  })

  it('does not echo passwords on validation failure', async () => {
    const state = await resetPasswordAction(null, formData({
      token: 'tok',
      password: 'secret123',
      confirmPassword: 'different1',
    }))
    expect(state?.data).toEqual({ token: 'tok' })
    expect(state?.data).not.toHaveProperty('password')
    expect(state?.data).not.toHaveProperty('confirmPassword')
    expect(state?.validationErrors?.confirmPassword).toBeDefined()
  })

  it('does not echo passwords on service failure', async () => {
    resetPasswordServiceMock.mockResolvedValue({
      success: false,
      message: 'Invalid or expired reset token',
      data: null,
      meta: { msg: 'reset failed' },
    })
    const state = await resetPasswordAction(null, formData({
      token: 'tok',
      password: 'secret123',
      confirmPassword: 'secret123',
    }))
    expect(state?.success).toBe(false)
    expect(state?.data).toEqual({ token: 'tok' })
    expect(state?.data).not.toHaveProperty('password')
    expect(state?.data).not.toHaveProperty('confirmPassword')
  })
})
