import { beforeEach, describe, expect, it, vi } from 'vitest'

const loginServiceMock = vi.fn()
const registerServiceMock = vi.fn()
const forgotPasswordServiceMock = vi.fn()
const resetPasswordServiceMock = vi.fn()
const verifyEmailServiceMock = vi.fn()
const logoutServiceMock = vi.fn()
const getTranslationsMock = vi.fn(async () => (key: string) => key)

const flattenOverride = vi.hoisted(() => ({
  current: null as null | (() => { formErrors: string[], fieldErrors: Record<string, string[] | undefined> }),
}))

vi.mock('zod', async (importOriginal) => {
  const actual = await importOriginal() as {
    default: {
      flattenError: (error: unknown) => { formErrors: string[], fieldErrors: Record<string, string[] | undefined> }
    }
  }
  return {
    ...actual,
    default: new Proxy(actual.default, {
      get(target, prop, receiver) {
        if (prop === 'flattenError') {
          return (error: unknown) => flattenOverride.current?.() ?? target.flattenError(error)
        }
        return Reflect.get(target, prop, receiver)
      },
    }),
  }
})

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
  forgotPasswordService: (...args: unknown[]) => forgotPasswordServiceMock(...args),
  resetPasswordService: (...args: unknown[]) => resetPasswordServiceMock(...args),
  verifyEmailService: (...args: unknown[]) => verifyEmailServiceMock(...args),
  logoutService: (...args: unknown[]) => logoutServiceMock(...args),
}))

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { LOGIN_PATH } from '@/config'
import {
  forgotPasswordAction,
  loginAction,
  logoutAction,
  registerAction,
  resetPasswordAction,
  verifyEmailAction,
} from '@/modules/auth/auth.action'

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

  it('revalidates and redirects to the requested path after login', async () => {
    vi.mocked(revalidatePath).mockClear()
    vi.mocked(redirect).mockClear()
    loginServiceMock.mockResolvedValue({
      success: true,
      message: null,
      data: { token: 'token' },
      meta: { expires: '2099-01-01', msg: 'login ok' },
    })
    const state = await loginAction(null, formData({
      username: 'alice',
      password: 'secret123',
      redirect: '/home',
    }))
    expect(state).toBeUndefined()
    expect(loginServiceMock).toHaveBeenCalledWith({
      username: 'alice',
      password: 'secret123',
      redirect: '/home',
    })
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(redirect).toHaveBeenCalledWith('/home')
  })

  it('redirects to the home page when login has no redirect', async () => {
    vi.mocked(revalidatePath).mockClear()
    vi.mocked(redirect).mockClear()
    loginServiceMock.mockResolvedValue({
      success: true,
      message: null,
      data: { token: 'token' },
      meta: { expires: '2099-01-01', msg: 'login ok' },
    })
    const state = await loginAction(null, formData({
      username: 'alice',
      password: 'secret123',
    }))
    expect(state).toBeUndefined()
    expect(redirect).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/')
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

  it('localizes a username that is too short', async () => {
    const state = await registerAction(null, formData({
      username: 'a',
      email: 'a@b.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    }))
    expect(state?.validationErrors?.username).toEqual(['usernameLength'])
    expect(state?.data).toEqual({
      username: 'a',
      email: 'a@b.com',
    })
    expect(state?.data).not.toHaveProperty('password')
    expect(state?.data).not.toHaveProperty('confirmPassword')
    expect(registerServiceMock).not.toHaveBeenCalled()
  })

  it('localizes a password that contains whitespace', async () => {
    const state = await registerAction(null, formData({
      username: 'ab',
      email: 'a@b.com',
      password: 'secret 123',
      confirmPassword: 'secret 123',
    }))
    expect(state?.validationErrors?.password).toEqual(['passwordSpaces'])
    expect(state?.data).not.toHaveProperty('password')
    expect(registerServiceMock).not.toHaveBeenCalled()
  })

  it('localizes a password that is too short', async () => {
    const state = await registerAction(null, formData({
      username: 'ab',
      email: 'a@b.com',
      password: 'short',
      confirmPassword: 'short',
    }))
    expect(state?.validationErrors?.password).toEqual(['passwordTooShort'])
    expect(registerServiceMock).not.toHaveBeenCalled()
  })

  it('localizes a password that is too long', async () => {
    const password = 'a'.repeat(65)
    const state = await registerAction(null, formData({
      username: 'ab',
      email: 'a@b.com',
      password,
      confirmPassword: password,
    }))
    expect(state?.validationErrors?.password).toEqual(['passwordTooLong'])
    expect(registerServiceMock).not.toHaveBeenCalled()
  })

  it('localizes a password that exceeds the byte limit', async () => {
    const password = '😀'.repeat(19)
    const state = await registerAction(null, formData({
      username: 'ab',
      email: 'a@b.com',
      password,
      confirmPassword: password,
    }))
    expect(state?.validationErrors?.password).toEqual(['passwordTooManyBytes'])
    expect(registerServiceMock).not.toHaveBeenCalled()
  })

  it('revalidates and redirects to the requested path after register', async () => {
    vi.mocked(revalidatePath).mockClear()
    vi.mocked(redirect).mockClear()
    registerServiceMock.mockResolvedValue({
      success: true,
      message: null,
      data: { email: 'a@b.com', username: 'alice' },
      meta: { created_at: '2099-01-01', msg: 'register ok' },
    })
    const state = await registerAction(null, formData({
      username: 'alice',
      email: 'a@b.com',
      password: 'secret123',
      confirmPassword: 'secret123',
      redirect: '/welcome',
    }))
    expect(state).toBeUndefined()
    expect(registerServiceMock).toHaveBeenCalledWith({
      username: 'alice',
      email: 'a@b.com',
      password: 'secret123',
      confirmPassword: 'secret123',
      redirect: '/welcome',
    })
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(redirect).toHaveBeenCalledWith('/welcome')
  })

  it('redirects to the home page when register has no redirect', async () => {
    vi.mocked(redirect).mockClear()
    registerServiceMock.mockResolvedValue({
      success: true,
      message: null,
      data: { email: 'a@b.com', username: 'alice' },
      meta: { created_at: '2099-01-01', msg: 'register ok' },
    })
    const state = await registerAction(null, formData({
      username: 'alice',
      email: 'a@b.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    }))
    expect(state).toBeUndefined()
    expect(redirect).toHaveBeenCalledWith('/')
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

  it('uses an empty token when the form does not include one', async () => {
    const state = await resetPasswordAction(null, formData({
      password: 'secret123',
      confirmPassword: 'secret123',
    }))
    expect(state?.data).toEqual({ token: '' })
    expect(state?.data).not.toHaveProperty('password')
    expect(state?.data).not.toHaveProperty('confirmPassword')
    expect(state?.validationErrors?.token?.length).toBeGreaterThan(0)
    expect(resetPasswordServiceMock).not.toHaveBeenCalled()
  })

  it('redirects to the login page after a successful reset', async () => {
    vi.mocked(redirect).mockClear()
    resetPasswordServiceMock.mockResolvedValue({
      success: true,
      message: null,
      data: {},
      meta: { msg: 'reset ok' },
    })
    const state = await resetPasswordAction(null, formData({
      token: 'tok',
      password: 'secret123',
      confirmPassword: 'secret123',
    }))
    expect(state).toBeUndefined()
    expect(resetPasswordServiceMock).toHaveBeenCalledWith({
      token: 'tok',
      password: 'secret123',
      confirmPassword: 'secret123',
    })
    expect(redirect).toHaveBeenCalledWith(LOGIN_PATH)
  })
})

describe('forgotPasswordAction', () => {
  beforeEach(() => {
    forgotPasswordServiceMock.mockReset()
  })

  it('returns field errors and does not send mail for an invalid email', async () => {
    const state = await forgotPasswordAction(null, formData({
      email: 'not-an-email',
    }))
    expect(state?.data).toEqual({ email: 'not-an-email' })
    expect(state?.validationErrors?.email?.length).toBeGreaterThan(0)
    expect(state?.success).toBeUndefined()
    expect(forgotPasswordServiceMock).not.toHaveBeenCalled()
  })

  it('returns the service error and keeps the submitted email', async () => {
    forgotPasswordServiceMock.mockResolvedValue({
      success: false,
      message: 'Could not send email',
      data: null,
      meta: { msg: 'forgot failed' },
    })
    const state = await forgotPasswordAction(null, formData({
      email: 'a@b.com',
    }))
    expect(forgotPasswordServiceMock).toHaveBeenCalledWith({ email: 'a@b.com' })
    expect(state).toEqual({
      error: 'Could not send email',
      data: { email: 'a@b.com' },
      success: false,
    })
  })

  it('returns success with the submitted email after the message is sent', async () => {
    forgotPasswordServiceMock.mockResolvedValue({
      success: true,
      message: null,
      data: {},
      meta: { msg: 'forgot ok' },
    })
    const state = await forgotPasswordAction(null, formData({
      email: 'a@b.com',
    }))
    expect(forgotPasswordServiceMock).toHaveBeenCalledWith({ email: 'a@b.com' })
    expect(state).toEqual({
      data: { email: 'a@b.com' },
      success: true,
    })
  })
})

describe('verifyEmailAction', () => {
  beforeEach(() => {
    verifyEmailServiceMock.mockReset()
  })

  it('rejects a missing token before calling the service', async () => {
    const state = await verifyEmailAction('')
    expect(state).toEqual({
      error: 'verifyEmailMissingToken',
      success: false,
    })
    expect(verifyEmailServiceMock).not.toHaveBeenCalled()
  })

  it('returns the service error when verification fails', async () => {
    verifyEmailServiceMock.mockResolvedValue({
      success: false,
      message: 'Token expired',
      data: null,
      meta: { msg: 'verify failed' },
    })
    const state = await verifyEmailAction('tok')
    expect(verifyEmailServiceMock).toHaveBeenCalledWith({ token: 'tok' })
    expect(state).toEqual({
      error: 'Token expired',
      success: false,
    })
  })

  it('returns success when the token is verified', async () => {
    verifyEmailServiceMock.mockResolvedValue({
      success: true,
      message: null,
      data: {},
      meta: { msg: 'verify ok' },
    })
    const state = await verifyEmailAction('tok')
    expect(verifyEmailServiceMock).toHaveBeenCalledWith({ token: 'tok' })
    expect(state).toEqual({ success: true })
  })
})

describe('localizeAuthFieldErrors', () => {
  it('leaves a field unchanged when it has no messages', async () => {
    loginServiceMock.mockReset()
    flattenOverride.current = () => ({
      formErrors: [],
      fieldErrors: { username: undefined },
    })
    const state = await loginAction(null, formData({ username: 'a b', password: 'secret123' }))
    flattenOverride.current = null
    expect(state?.validationErrors).toEqual({ username: undefined })
    expect(state?.data).toEqual({ username: 'a b' })
    expect(loginServiceMock).not.toHaveBeenCalled()
  })
})

describe('logoutAction', () => {
  beforeEach(() => {
    logoutServiceMock.mockReset()
    vi.mocked(revalidatePath).mockClear()
    vi.mocked(redirect).mockClear()
  })

  it('logs out, revalidates the home page, and redirects there', async () => {
    logoutServiceMock.mockResolvedValue(undefined)
    const state = await logoutAction()
    expect(state).toBeUndefined()
    expect(logoutServiceMock).toHaveBeenCalledOnce()
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(redirect).toHaveBeenCalledWith('/')
    expect(logoutServiceMock.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(revalidatePath).mock.invocationCallOrder[0],
    )
    expect(vi.mocked(revalidatePath).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(redirect).mock.invocationCallOrder[0],
    )
  })
})
