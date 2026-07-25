import z from 'zod'

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
    .regex(/^[a-z][a-z0-9]*$/, '用户名只能包含小写字母和数字，且必须以字母开头'),
  email: z.email(),
  password: z.string().min(8).max(20),
  confirmPassword: z.string().min(8).max(20),
  redirect: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
})

export type RegisterDTO = z.infer<typeof registerSchema>

// 重置密码（邮件链接 ?token=）
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(20),
  confirmPassword: z.string().min(8).max(20),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
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
