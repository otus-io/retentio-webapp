import z from 'zod'

/** Sentinel for refine() messages; mapped to i18n in auth actions. */
export const PASSWORDS_MISMATCH = 'passwords_mismatch'
/** Sentinel for username regex; mapped to i18n in auth actions. */
export const USERNAME_INVALID = 'username_invalid'
/** Sentinel for username length; mapped to i18n in auth actions. */
export const USERNAME_LENGTH = 'username_length'
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

function charLength(value: string) {
  return [...value].length
}

function utf8ByteLength(value: string) {
  return new TextEncoder().encode(value).length
}

function usernameLengthField() {
  return z.string().refine((value) => {
    const n = charLength(value.trim())
    return n >= USERNAME_MIN && n <= USERNAME_MAX
  }, USERNAME_LENGTH)
}

function passwordField() {
  return z.string()
    .refine((value) => charLength(value) >= PASSWORD_MIN, PASSWORD_TOO_SHORT)
    .refine((value) => charLength(value) <= PASSWORD_MAX, PASSWORD_TOO_LONG)
    .refine((value) => utf8ByteLength(value) <= PASSWORD_MAX_BYTES, PASSWORD_TOO_MANY_BYTES)
}

// 登录
export const loginSchema = z.object({
  username: usernameLengthField(),
  password: passwordField(),
  redirect: z.string().optional(),
})

export type LoginDTO = z.infer<typeof loginSchema>

// 注册
export const registerSchema = z.object({
  username: z.string()
    .regex(/^[a-z][a-z0-9_-]*$/, USERNAME_INVALID)
    .refine((value) => {
      const n = charLength(value)
      return n >= USERNAME_MIN && n <= USERNAME_MAX
    }, USERNAME_LENGTH),
  email: z.email(),
  password: passwordField(),
  confirmPassword: passwordField(),
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
  confirmPassword: passwordField(),
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
