import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '@/api/auth'
import { changeEmailService, resendVerificationService } from '@/modules/auth/auth.service'
import { RequestError } from '@/utils/request'

vi.mock('@/api/auth', () => ({
  resendVerification: vi.fn(),
  changeEmail: vi.fn(),
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
