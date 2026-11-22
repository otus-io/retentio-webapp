import { JWT_COOKIE_NAME } from '@/config'
import { cookies } from 'next/headers'

/**
 * Get token from cookie (server-side only)
 */
export async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(JWT_COOKIE_NAME)?.value || null
}

/** Not a Server Action module: a `'use server'` getToken would let page scripts read the httpOnly JWT. */
export function tokenCookieOptions() {
  return {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true,
  } as const
}

/**
 * Set token in cookie (server-side only)
 */
export async function setToken(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(JWT_COOKIE_NAME, token, tokenCookieOptions())
}

/**
 * Remove token cookie (server-side only)
 */
export async function removeToken(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(JWT_COOKIE_NAME)
}
