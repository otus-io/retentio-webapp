import { describe, expect, it } from 'vitest'
import {
  PASSWORD_TOO_LONG,
  PASSWORD_TOO_MANY_BYTES,
  PASSWORD_TOO_SHORT,
  PASSWORDS_MISMATCH,
  USERNAME_INVALID,
  USERNAME_LENGTH,
  forgotPasswordSchema,
  loginSchema,
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

  it('rejects usernames outside 2 to 32 characters', () => {
    const short = registerSchema.safeParse({ ...valid, username: 'a' })
    const long = registerSchema.safeParse({ ...valid, username: 'a'.repeat(33) })
    expect(short.success).toBe(false)
    expect(long.success).toBe(false)
    if (!short.success) {
      expect(short.error.flatten().fieldErrors.username).toContain(USERNAME_LENGTH)
    }
    if (!long.success) {
      expect(long.error.flatten().fieldErrors.username).toContain(USERNAME_LENGTH)
    }
  })

  it('accepts a 2-character and a 32-character username', () => {
    expect(registerSchema.safeParse({ ...valid, username: 'ab' }).success).toBe(true)
    expect(registerSchema.safeParse({ ...valid, username: `a${'b'.repeat(31)}` }).success).toBe(true)
  })

  it('rejects passwords outside 8 to 64 characters', () => {
    const short = registerSchema.safeParse({
      ...valid,
      password: 'short',
      confirmPassword: 'short',
    })
    const longPassword = 'a'.repeat(65)
    const long = registerSchema.safeParse({
      ...valid,
      password: longPassword,
      confirmPassword: longPassword,
    })
    expect(short.success).toBe(false)
    expect(long.success).toBe(false)
    if (!short.success) {
      expect(short.error.flatten().fieldErrors.password).toContain(PASSWORD_TOO_SHORT)
    }
    if (!long.success) {
      expect(long.error.flatten().fieldErrors.password).toContain(PASSWORD_TOO_LONG)
    }
  })

  it('rejects a password that exceeds 72 bytes', () => {
    const password = '😀'.repeat(19)
    const result = registerSchema.safeParse({
      ...valid,
      password,
      confirmPassword: password,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(PASSWORD_TOO_MANY_BYTES)
    }
  })

  it('accepts 18 emoji because they are 72 bytes', () => {
    const password = '😀'.repeat(18)
    expect(registerSchema.safeParse({
      ...valid,
      password,
      confirmPassword: password,
    }).success).toBe(true)
  })
})

describe('loginSchema', () => {
  it('accepts a 2-character username and an 8-character password', () => {
    expect(loginSchema.safeParse({ username: 'ab', password: 'password' }).success).toBe(true)
  })

  it('counts a trimmed username', () => {
    expect(loginSchema.safeParse({ username: '  ab  ', password: 'password' }).success).toBe(true)
    const result = loginSchema.safeParse({ username: ' a ', password: 'password' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.username).toContain(USERNAME_LENGTH)
    }
  })

  it('rejects a password longer than 64 characters', () => {
    const result = loginSchema.safeParse({ username: 'ab', password: 'a'.repeat(65) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(PASSWORD_TOO_LONG)
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
