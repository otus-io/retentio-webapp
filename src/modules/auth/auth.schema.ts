import z from 'zod'

/** Sentinel for refine() messages; mapped to i18n in auth actions. */
export const PASSWORDS_MISMATCH = 'passwords_mismatch'
/** Sentinel for username regex; mapped to i18n in auth actions. */
export const USERNAME_INVALID = 'username_invalid'
/** Sentinel for username length; mapped to i18n in auth actions. */
export const USERNAME_LENGTH = 'username_length'
/** Sentinel for whitespace inside a username; mapped to i18n in auth actions. */
export const USERNAME_SPACES = 'username_spaces'
/** Sentinel for whitespace inside a password; mapped to i18n in auth actions. */
export const PASSWORD_SPACES = 'password_spaces'
/** Sentinel for a too-short password; mapped to i18n in auth actions. */
export const PASSWORD_TOO_SHORT = 'password_too_short'
/** Sentinel for a too-long password; mapped to i18n in auth actions. */
export const PASSWORD_TOO_LONG = 'password_too_long'
/** Sentinel for a password over bcrypt's byte limit; mapped to i18n in auth actions. */
export const PASSWORD_TOO_MANY_BYTES = 'password_too_many_bytes'

export const USERNAME_MIN = 2
export const USERNAME_MAX = 32
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 64
/** bcrypt rejects passwords longer than 72 bytes. */
export const PASSWORD_MAX_BYTES = 72

const whitespace = /\s/u

function charLength(value: string) {
  return [...value].length
}

function hasWhitespace(value: string) {
  return whitespace.test(value)
}

function utf8ByteLength(value: string) {
  return new TextEncoder().encode(value).length
}

function loginUsernameField() {
  return z.string().trim().min(1).superRefine((value, ctx) => {
    if (hasWhitespace(value)) {
      ctx.addIssue(USERNAME_SPACES)
      return z.NEVER
    }
  })
}

function registerUsernameField() {
  return z.string().trim().superRefine((value, ctx) => {
    if (hasWhitespace(value)) {
      ctx.addIssue(USERNAME_SPACES)
      return z.NEVER
    }
    if (!/^[a-z][a-z0-9_-]*$/.test(value)) {
      ctx.addIssue(USERNAME_INVALID)
      return z.NEVER
    }
    const n = charLength(value)
    if (n < USERNAME_MIN || n > USERNAME_MAX) {
      ctx.addIssue(USERNAME_LENGTH)
      return z.NEVER
    }
  })
}

function passwordField() {
  return z.string().superRefine((value, ctx) => {
    if (hasWhitespace(value)) {
      ctx.addIssue(PASSWORD_SPACES)
      return z.NEVER
    }
    if (charLength(value) < PASSWORD_MIN) {
      ctx.addIssue(PASSWORD_TOO_SHORT)
      return z.NEVER
    }
    if (charLength(value) > PASSWORD_MAX) {
      ctx.addIssue(PASSWORD_TOO_LONG)
      return z.NEVER
    }
    if (utf8ByteLength(value) > PASSWORD_MAX_BYTES) {
      ctx.addIssue(PASSWORD_TOO_MANY_BYTES)
      return z.NEVER
    }
  })
}

// Login trims the username and rejects whitespace inside it.
// Length limits apply when a password is created or reset, so an older password can still sign in.
export const loginSchema = z.object({
  username: loginUsernameField(),
  password: z.string().min(1),
  redirect: z.string().optional(),
})

export type LoginDTO = z.infer<typeof loginSchema>

// 注册
export const registerSchema = z.object({
  username: registerUsernameField(),
  email: z.email(),
  password: passwordField(),
  confirmPassword: z.string(),
  redirect: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: PASSWORDS_MISMATCH,
  path: ['confirmPassword'],
})

export type RegisterDTO = z.infer<typeof registerSchema>

// 忘记密码（发送重置邮件）
export const forgotPasswordSchema = z.object({
  email: z.email(),
})

export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>

// 重置密码（邮件链接 ?token=）
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordField(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: PASSWORDS_MISMATCH,
  path: ['confirmPassword'],
})

export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>

// 验证邮箱（邮件链接 ?token=）
export const verifyEmailSchema = z.object({
  token: z.string().min(1),
})

export type VerifyEmailDTO = z.infer<typeof verifyEmailSchema>

export type LoginResponseDTO = BaseApiResult<
  { token: string },
  { expires: string }
>

export type RegisterResponseDTO = BaseApiResult<
  { email: string; username: string },
  { created_at: string }
>

export type ProfileResponseDTO = BaseApiResult<
  { email: string; username: string },
  { created_at: string }
>
