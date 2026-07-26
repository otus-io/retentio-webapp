import z from 'zod'

/** Sentinel for refine() messages; mapped to i18n in auth actions. */
export const PASSWORDS_MISMATCH = 'passwords_mismatch'
/** Sentinel for username regex; mapped to i18n in auth actions. */
export const USERNAME_INVALID = 'username_invalid'

// 登录
export const loginSchema = z.object({
  username: z.string()
    .min(4),
  password: z.string().min(6),
  redirect: z.string().optional(),
})

export type LoginDTO = z.infer<typeof loginSchema>

// 注册
export const registerSchema = z.object({
  username: z.string()
    .min(4)
    .regex(/^[a-z][a-z0-9]*$/, USERNAME_INVALID),
  email: z.email(),
  password: z.string().min(8).max(20),
  confirmPassword: z.string().min(8).max(20),
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
  password: z.string().min(8).max(20),
  confirmPassword: z.string().min(8).max(20),
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
