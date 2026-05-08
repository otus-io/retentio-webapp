import { request } from '@/utils/request'
import type {
  LoginDTO,
  LoginResponseDTO,
  ProfileResponseDTO,
  RegisterDTO,
  RegisterResponseDTO,
} from './auth.schema'
import { getToken, setToken, removeToken } from '@/lib/token'
import { ServiceResponse } from '@/lib/response'

async function fetchProfileWithTokenService(token: string){
  await setToken(token)
  try {
    const profile = await request<ProfileResponseDTO>('/api/profile')
    return ServiceResponse.success(profile)
  } catch (e){
    await removeToken()
    return ServiceResponse.error('fetchProfileWithTokenService failed', e)
  }
}

export async function loginService(params: LoginDTO) {
  const { username, password } = params
  try {
    const loginRes = await request<LoginResponseDTO>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    const result = await fetchProfileWithTokenService(loginRes.data.token)
    return result
  } catch (e){
    await removeToken()
    return ServiceResponse.error('loginFailed failed', e)
  }
}

export async function registerService(params: RegisterDTO) {
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
    return result
  } catch (e) {
    await removeToken()
    return ServiceResponse.error('registerFailed failed', e)
  }
}

export async function getProfileService() {
  try {
    if(!await getToken()){
      return ServiceResponse.error('token not found')
    }
    const result = await request<ProfileResponseDTO>('/api/profile')
    return ServiceResponse.success(result)
  } catch (e) {
    return ServiceResponse.error('getProfileService failed', e)
  }
}

export async function logoutService(){
  try {
    const result = await request<BaseApiResult<{ msg: string }>>('/auth/logout', { method: 'POST' })
    return ServiceResponse.success(result)
  } catch (e){
    return ServiceResponse.error('logoutService failed', e)
  } finally {
    await removeToken()
  }
}

