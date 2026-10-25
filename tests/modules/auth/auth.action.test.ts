import { beforeEach, describe, expect, it, vi } from 'vitest'

const loginServiceMock = vi.fn()
const registerServiceMock = vi.fn()
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
  loginService: (...args: unknown[]) => loginServiceMock(...args),
  registerService: (...args: unknown[]) => registerServiceMock(...args),
  forgotPasswordService: vi.fn(),
  resetPasswordService: (...args: unknown[]) => resetPasswordServiceMock(...args),
  verifyEmailService: vi.fn(),
  logoutService: vi.fn(),
}))

import { loginAction, registerAction, resetPasswordAction } from '@/modules/auth/auth.action'

function formData(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

describe('loginAction', () => {
  beforeEach(() => {
    loginServiceMock.mockReset()
  })

  it('does not echo passwords on validation failure', async () => {
    const state = await loginAction(null, formData({
      username: 'a b',
      password: 'secret123',
    }))
    expect(state?.data).toEqual({ username: 'a b' })
    expect(state?.data).not.toHaveProperty('password')
    expect(state?.validationErrors?.username).toEqual(['usernameSpaces'])
    expect(loginServiceMock).not.toHaveBeenCalled()
  })

  it('trims the username before login and when repopulating the form', async () => {
    loginServiceMock.mockResolvedValue({
      success: false,
      message: 'Invalid credentials',
      data: null,
      meta: { msg: 'login failed' },
    })
    const state = await loginAction(null, formData({
      username: '  ab  ',
      password: 'secret123',
      redirect: '/',
    }))
    expect(loginServiceMock).toHaveBeenCalledWith({
      username: 'ab',
      password: 'secret123',
      redirect: '/',
    })
    expect(state?.data?.username).toBe('ab')
    expect(state?.data).not.toHaveProperty('password')
  })

  it('submits a short, long, or multi-byte password', async () => {
    loginServiceMock.mockResolvedValue({
      success: false,
      message: 'Invalid credentials',
      data: null,
      meta: { msg: 'login failed' },
    })
    for (const password of ['short', 'a'.repeat(65), '😀'.repeat(19)]) {
      loginServiceMock.mockClear()
      const state = await loginAction(null, formData({
        username: 'a',
        password,
      }))
      expect(loginServiceMock).toHaveBeenCalledWith({
        username: 'a',
        password,
      })
      expect(state?.validationErrors).toBeUndefined()
    }
  })

  it('localizes whitespace inside the username', async () => {
    const username = await loginAction(null, formData({
      username: 'a b',
      password: 'secret123',
    }))
    expect(username?.validationErrors?.username).toEqual(['usernameSpaces'])
  })

  it('submits a password that contains whitespace', async () => {
    loginServiceMock.mockResolvedValue({
      success: false,
      message: 'Invalid credentials',
      data: null,
      meta: { msg: 'login failed' },
    })
    const state = await loginAction(null, formData({
      username: 'ab',
      password: 'secret 123',
    }))
    expect(loginServiceMock).toHaveBeenCalledWith({
      username: 'ab',
      password: 'secret 123',
    })
    expect(state?.error).toBe('Invalid credentials')
    expect(state?.validationErrors).toBeUndefined()
  })

  it('does not echo passwords on service failure', async () => {
    loginServiceMock.mockResolvedValue({
      success: false,
      message: 'Invalid credentials',
      data: null,
      meta: { msg: 'login failed' },
    })
    const state = await loginAction(null, formData({
      username: 'alice',
      password: 'secret123',
      redirect: '/',
    }))
    expect(state?.success).toBe(false)
    expect(state?.data).toEqual({ username: 'alice', redirect: '/' })
    expect(state?.data).not.toHaveProperty('password')
  })
})

describe('registerAction', () => {
  beforeEach(() => {
    registerServiceMock.mockReset()
  })

  it('does not echo passwords on validation failure', async () => {
    const state = await registerAction(null, formData({
      username: 'alice',
      email: 'a@b.com',
      password: 'secret123',
      confirmPassword: 'different1',
    }))
    expect(state?.data).toEqual({
      username: 'alice',
      email: 'a@b.com',
    })
    expect(state?.data).not.toHaveProperty('password')
    expect(state?.data).not.toHaveProperty('confirmPassword')
    expect(state?.validationErrors?.confirmPassword).toBeDefined()
  })

  it('trims the username before register', async () => {
    registerServiceMock.mockResolvedValue({
      success: false,
      message: 'Username taken',
      data: null,
      meta: { msg: 'register failed' },
    })
    const state = await registerAction(null, formData({
      username: '  ab  ',
      email: 'a@b.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    }))
    expect(registerServiceMock).toHaveBeenCalledWith(expect.objectContaining({
      username: 'ab',
    }))
    expect(state?.data?.username).toBe('ab')
    expect(state?.data).not.toHaveProperty('password')
  })

  it('localizes an invalid username and leaves other messages unchanged', async () => {
    const username = await registerAction(null, formData({
      username: 'Alice',
      email: 'a@b.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    }))
    const email = await registerAction(null, formData({
      username: 'alice',
      email: 'not-an-email',
      password: 'secret123',
      confirmPassword: 'secret123',
    }))
    expect(username?.validationErrors?.username).toEqual(['usernameInvalid'])
    const emailErrors = email?.validationErrors?.email
    expect(emailErrors?.[0]).toBeTruthy()
    expect(emailErrors).not.toContain('usernameInvalid')
  })

  it('does not echo passwords on service failure', async () => {
    registerServiceMock.mockResolvedValue({
      success: false,
      message: 'Username taken',
      data: null,
      meta: { msg: 'register failed' },
    })
    const state = await registerAction(null, formData({
      username: 'alice',
      email: 'a@b.com',
      password: 'secret123',
      confirmPassword: 'secret123',
      redirect: '/',
    }))
    expect(state?.success).toBe(false)
    expect(state?.data).toEqual({
      username: 'alice',
      email: 'a@b.com',
      redirect: '/',
    })
    expect(state?.data).not.toHaveProperty('password')
    expect(state?.data).not.toHaveProperty('confirmPassword')
  })
})

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
