import { request } from '@/utils/request'
import type {
  ApiResult,
  AuthResultDTO,
  LoginDTO,
  LoginResponseDTO,
  ProfileResponseDTO,
  RegisterDTO,
  RegisterResponseDTO,
} from './auth.schema'
import { getToken, setToken, removeToken } from '@/lib/token.server'
import { logger } from '@/lib/logger'

async function fetchProfileWithTokenService(token: string): Promise<AuthResultDTO> {
  await setToken(token)
  try {
    const profile = await request<ProfileResponseDTO>('/api/profile')
    return {
      user: {
        username: profile.data.username,
        email: profile.data.email,
        createdAt: profile.meta.created_at,
      },
      token,
    }
  } catch {
    await removeToken()
    logger.error('fetchProfileWithTokenService failed')
    throw new Error('Failed to fetch profile')
  }
}

export async function loginService(params: LoginDTO): Promise<ApiResult<AuthResultDTO>> {
  const { username, password } = params
  try {
    const loginRes = await request<LoginResponseDTO>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    const result = await fetchProfileWithTokenService(loginRes.data.token)
    return { ok: true, data: result }
  } catch (e){
    console.log(e)
    logger.error({ e }, 'loginService failed')
    await removeToken()
    return { ok: false, error: 'loginFailed' }
  }
}

export async function registerService(params: RegisterDTO): Promise<ApiResult<AuthResultDTO>> {
  const { username, password, email } = params
  try {
    await request<RegisterResponseDTO>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    })
    const loginRes = await request<LoginResponseDTO>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    const result = await fetchProfileWithTokenService(loginRes.data.token)
    return { ok: true, data: result }
  } catch (e) {
    logger.error({ e }, 'registerFailed failed')
    await removeToken()
    return { ok: false, error: 'registerFailed' }
  }
}

export async function getProfileService() {
  try {
    if(!await getToken()){
      return null
    }
    return await request<ProfileResponseDTO>('/api/profile')
  } catch (e) {
    logger.error({ e }, 'getProfileService failed')
    return null
  }
}

export async function logoutService(): Promise<void> {
  try {
    await request<unknown>('/auth/logout', { method: 'POST' })
  } catch {
    // Clear local state regardless of API result
  } finally {
    await removeToken()
  }
}

