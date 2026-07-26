import { request } from '@/utils/request'
import type {
  ForgotPasswordDTO,
  LoginDTO,
  LoginResponseDTO,
  ProfileResponseDTO,
  RegisterDTO,
  RegisterResponseDTO,
  ResetPasswordDTO,
  VerifyEmailDTO,
} from '@/modules/auth/auth.schema'

/**
 * 用户登录
 */
export function login(params: Pick<LoginDTO, 'username' | 'password'>) {
  return request<LoginResponseDTO>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * 用户注册
 */
export function register(params: Pick<RegisterDTO, 'username' | 'password' | 'email'>) {
  return request<RegisterResponseDTO>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * 请求密码重置邮件
 */
export function forgotPassword(params: ForgotPasswordDTO) {
  return request<BaseApiResult<{ msg: string }>>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: params.email }),
  })
}

/**
 * 使用令牌重置密码
 */
export function resetPassword(params: ResetPasswordDTO) {
  return request<BaseApiResult<{ msg: string }>>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      token: params.token,
      new_password: params.password,
    }),
  })
}

/**
 * 使用令牌验证邮箱
 */
export function verifyEmail(params: VerifyEmailDTO) {
  return request<BaseApiResult<{ msg: string }>>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token: params.token }),
  })
}

/**
 * 获取当前用户信息
 */
export function getProfile() {
  return request<ProfileResponseDTO>('/api/profile')
}

/**
 * 用户登出
 */
export function logout() {
  return request<BaseApiResult<{ msg: string }>>('/auth/logout', { method: 'POST' })
}
