import * as authApi from '@/api/auth'
import type { LoginDTO, RegisterDTO } from './auth.schema'
import { getToken, setToken, removeToken } from '@/lib/token'
import { ServiceResponse } from '@/lib/response'

async function fetchProfileWithTokenService(token: string) {
  await setToken(token)
  try {
    return ServiceResponse.success(await authApi.getProfile())
  } catch (e) {
    await removeToken()
    return ServiceResponse.error('fetchProfileWithTokenService failed', e)
  }
}

export async function loginService(params: LoginDTO) {
  const { username, password } = params
  try {
    const loginRes = await authApi.login({ username, password })
    return await fetchProfileWithTokenService(loginRes.data.token)
  } catch (e) {
    await removeToken()
    return ServiceResponse.error('loginFailed failed', e)
  }
}

export async function registerService(params: RegisterDTO) {
  const { username, password, email } = params
  try {
    await authApi.register({ username, password, email })
    const loginRes = await authApi.login({ username, password })
    return await fetchProfileWithTokenService(loginRes.data.token)
  } catch (e) {
    await removeToken()
    return ServiceResponse.error('registerFailed failed', e)
  }
}

export async function getProfileService() {
  try {
    if (!await getToken()) {
      return ServiceResponse.error('token not found')
    }
    return ServiceResponse.success(await authApi.getProfile())
  } catch (e) {
    return ServiceResponse.error('getProfileService failed', e)
  }
}

export async function logoutService() {
  try {
    return ServiceResponse.success(await authApi.logout())
  } catch (e) {
    return ServiceResponse.error('logoutService failed', e)
  } finally {
    await removeToken()
  }
}
