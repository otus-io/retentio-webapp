import { describe, expect, it } from 'vitest'
import {
  PASSWORD_SPACES,
  PASSWORD_TOO_LONG,
  PASSWORD_TOO_MANY_BYTES,
  PASSWORD_TOO_SHORT,
  PASSWORDS_MISMATCH,
  USERNAME_INVALID,
  USERNAME_LENGTH,
  USERNAME_SPACES,
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

  it('rejects a username or password with whitespace inside', () => {
    const username = registerSchema.safeParse({ ...valid, username: 'a b' })
    const password = registerSchema.safeParse({
      ...valid,
      password: 'pass word1',
      confirmPassword: 'pass word1',
    })
    expect(username.success).toBe(false)
    expect(password.success).toBe(false)
    if (!username.success) {
      expect(username.error.flatten().fieldErrors.username).toEqual([USERNAME_SPACES])
    }
    if (!password.success) {
      const errors = password.error.flatten().fieldErrors
      expect(errors.password).toEqual([PASSWORD_SPACES])
      expect(errors.confirmPassword).toBeUndefined()
    }
  })

  it('trims the username and keeps it', () => {
    const result = registerSchema.safeParse({ ...valid, username: '  ab  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.username).toBe('ab')
    }
  })

  it('rejects usernames outside 2 to 32 characters', () => {
    const short = registerSchema.safeParse({ ...valid, username: 'a' })
    const long = registerSchema.safeParse({ ...valid, username: 'a'.repeat(33) })
    expect(short.success).toBe(false)
    expect(long.success).toBe(false)
    if (!short.success) {
      expect(short.error.flatten().fieldErrors.username).toEqual([USERNAME_LENGTH])
    }
    if (!long.success) {
      expect(long.error.flatten().fieldErrors.username).toEqual([USERNAME_LENGTH])
    }
  })

  it('accepts a 2-character and a 32-character username', () => {
    expect(registerSchema.safeParse({ ...valid, username: 'ab' }).success).toBe(true)
    expect(registerSchema.safeParse({ ...valid, username: `a${'b'.repeat(31)}` }).success).toBe(true)
  })

  it('reports a too-short password only once, and only on the password field', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: 'a',
      confirmPassword: 'a',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      expect(errors.password).toEqual([PASSWORD_TOO_SHORT])
      expect(errors.confirmPassword).toBeUndefined()
    }
  })

  it('reports a too-long password only on the password field', () => {
    const password = 'a'.repeat(65)
    const result = registerSchema.safeParse({
      ...valid,
      password,
      confirmPassword: password,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      expect(errors.password).toEqual([PASSWORD_TOO_LONG])
      expect(errors.confirmPassword).toBeUndefined()
    }
  })

  it('stops after the character limit when a password is also over 72 bytes', () => {
    const password = '😀'.repeat(65)
    const result = registerSchema.safeParse({
      ...valid,
      password,
      confirmPassword: password,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toEqual([PASSWORD_TOO_LONG])
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
      const errors = result.error.flatten().fieldErrors
      expect(errors.password).toEqual([PASSWORD_TOO_MANY_BYTES])
      expect(errors.confirmPassword).toBeUndefined()
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
  it('trims the username before checking length', () => {
    const result = loginSchema.safeParse({ username: '  ab  ', password: 'password' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.username).toBe('ab')
    }
    const padded = loginSchema.safeParse({ username: '  小明  ', password: 'password' })
    expect(padded.success).toBe(true)
    if (padded.success) {
      expect(padded.data.username).toBe('小明')
    }
  })

  it('rejects whitespace inside the username or password', () => {
    const username = loginSchema.safeParse({ username: '  a b  ', password: 'password' })
    const password = loginSchema.safeParse({ username: 'ab', password: 'pass word' })
    expect(username.success).toBe(false)
    expect(password.success).toBe(false)
    if (!username.success) {
      expect(username.error.flatten().fieldErrors.username).toEqual([USERNAME_SPACES])
    }
    if (!password.success) {
      expect(password.error.flatten().fieldErrors.password).toEqual([PASSWORD_SPACES])
    }
  })

  it('rejects a username that is still too short after trim', () => {
    const result = loginSchema.safeParse({ username: ' a ', password: 'password' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.username).toEqual([USERNAME_LENGTH])
    }
  })

  it('rejects a password longer than 64 characters', () => {
    const result = loginSchema.safeParse({ username: 'ab', password: 'a'.repeat(65) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toEqual([PASSWORD_TOO_LONG])
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

  it('reports password length only on the password field', () => {
    const password = 'a'.repeat(65)
    const result = resetPasswordSchema.safeParse({
      token: 'abc',
      password,
      confirmPassword: password,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      expect(errors.password).toEqual([PASSWORD_TOO_LONG])
      expect(errors.confirmPassword).toBeUndefined()
    }
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
