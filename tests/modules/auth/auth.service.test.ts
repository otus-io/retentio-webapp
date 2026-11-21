import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '@/api/auth'
import { changeEmailService, deleteAccountService, registerService, resendVerificationService } from '@/modules/auth/auth.service'
import { removeToken } from '@/lib/token'
import { RequestError } from '@/utils/request'

vi.mock('@/api/auth', () => ({
  resendVerification: vi.fn(),
  changeEmail: vi.fn(),
  deleteAccount: vi.fn(),
  register: vi.fn(),
  login: vi.fn(),
}))

vi.mock('@/lib/token', () => ({
  getToken: vi.fn(),
  setToken: vi.fn(),
  removeToken: vi.fn(),
}))

describe('email verification services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resendVerificationService wraps the API result', async () => {
    vi.mocked(authApi.resendVerification).mockResolvedValue({ data: { msg: 'sent' }, meta: { msg: 'ok' } })
    const res = await resendVerificationService('a@b.com')
    expect(authApi.resendVerification).toHaveBeenCalledWith('a@b.com')
    expect(res).toMatchObject({ success: true, data: { msg: 'sent' } })
  })

  it('resendVerificationService returns the error message on failure', async () => {
    vi.mocked(authApi.resendVerification).mockRejectedValue(new RequestError('Email is required', 400))
    expect(await resendVerificationService('')).toMatchObject({ success: false, message: 'Email is required' })
  })

  it('changeEmailService wraps the API result', async () => {
    const data = { email: 'new@b.com', username: 'alice', email_verified: false }
    vi.mocked(authApi.changeEmail).mockResolvedValue({ data, meta: { msg: 'ok' } })
    const res = await changeEmailService({ email: 'new@b.com', password: 'secret123' })
    expect(authApi.changeEmail).toHaveBeenCalledWith({ email: 'new@b.com', password: 'secret123' })
    expect(res).toMatchObject({ success: true, data })
  })

  it('changeEmailService returns status and message on failure', async () => {
    vi.mocked(authApi.changeEmail).mockRejectedValue(new RequestError('Email already in use', 409))
    expect(await changeEmailService({ email: 'taken@b.com', password: 'x' }))
      .toMatchObject({ success: false, status: 409, message: 'Email already in use' })
  })
})

describe('deleteAccountService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes the account and clears the token', async () => {
    vi.mocked(authApi.deleteAccount).mockResolvedValue({ data: { msg: 'ok', username: 'alice' }, meta: { msg: 'ok' } })
    const res = await deleteAccountService({ password: 'secret' })
    expect(authApi.deleteAccount).toHaveBeenCalledWith({ password: 'secret' })
    expect(removeToken).toHaveBeenCalled()
    expect(res).toMatchObject({ success: true })
  })

  it.each([404, 500])('clears the token when deletion fails with %i', async (status) => {
    vi.mocked(authApi.deleteAccount).mockRejectedValue(new RequestError('Error deleting account', status))
    expect(await deleteAccountService({ password: 'x' })).toMatchObject({ success: false, status })
    expect(removeToken).toHaveBeenCalled()
  })

  it('keeps the token on a non-HTTP failure', async () => {
    vi.mocked(authApi.deleteAccount).mockRejectedValue(new Error('network'))
    expect(await deleteAccountService({ password: 'x' })).toMatchObject({ success: false })
    expect(removeToken).not.toHaveBeenCalled()
  })

  it('keeps the token when deletion fails', async () => {
    vi.mocked(authApi.deleteAccount).mockRejectedValue(new RequestError('Invalid credentials', 401))
    expect(await deleteAccountService({ password: 'x' }))
      .toMatchObject({ success: false, status: 401, message: 'Invalid credentials' })
    expect(removeToken).not.toHaveBeenCalled()
  })
})

describe('registerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const params = { username: 'alice', email: 'a@b.com', password: 'secret123', confirmPassword: 'secret123' }

  it('starts the sign-up without logging in', async () => {
    const data = { username: 'alice', email: 'a@b.com', email_verified: false }
    vi.mocked(authApi.register).mockResolvedValue({ data, meta: { msg: 'ok' } })
    const res = await registerService(params)
    expect(authApi.register).toHaveBeenCalledWith({ username: 'alice', email: 'a@b.com', password: 'secret123' })
    expect(authApi.login).not.toHaveBeenCalled()
    expect(res).toMatchObject({ success: true, data })
  })

  it('returns status and message on failure', async () => {
    vi.mocked(authApi.register).mockRejectedValue(new RequestError('Username already exists', 409))
    expect(await registerService(params))
      .toMatchObject({ success: false, status: 409, message: 'Username already exists' })
  })
})
