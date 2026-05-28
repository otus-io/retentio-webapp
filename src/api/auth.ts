import { request } from '@/utils/request'
import type {
  LoginDTO,
  LoginResponseDTO,
  ProfileResponseDTO,
  RegisterDTO,
  RegisterResponseDTO,
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
