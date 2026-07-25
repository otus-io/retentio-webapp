import { describe, expect, it } from 'vitest'
import {
  PASSWORDS_MISMATCH,
  USERNAME_INVALID,
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@/modules/auth/auth.schema'

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'not-an-email' })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  const valid = {
    username: 'alice',
    email: 'a@b.com',
    password: 'password1',
    confirmPassword: 'password1',
  }

  it('accepts a valid registration payload', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects invalid usernames with the locale-neutral sentinel', () => {
    const result = registerSchema.safeParse({ ...valid, username: 'Alice' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.username).toContain(USERNAME_INVALID)
    }
  })
})

describe('resetPasswordSchema', () => {
  it('accepts matching passwords with a token', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc',
      password: 'password1',
      confirmPassword: 'password1',
    })
    expect(result.success).toBe(true)
  })

  it('rejects mismatched passwords with the locale-neutral sentinel', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc',
      password: 'password1',
      confirmPassword: 'password2',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const confirmErrors = result.error.flatten().fieldErrors.confirmPassword
      expect(confirmErrors).toContain(PASSWORDS_MISMATCH)
    }
  })

  it('rejects an empty token', () => {
    const result = resetPasswordSchema.safeParse({
      token: '',
      password: 'password1',
      confirmPassword: 'password1',
    })
    expect(result.success).toBe(false)
  })
})

describe('verifyEmailSchema', () => {
  it('accepts a non-empty token', () => {
    expect(verifyEmailSchema.safeParse({ token: 'tok' }).success).toBe(true)
  })

  it('rejects an empty token', () => {
    expect(verifyEmailSchema.safeParse({ token: '' }).success).toBe(false)
  })
})
