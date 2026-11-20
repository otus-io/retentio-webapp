import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { FORGOT_PASSWORD_PATH, JWT_COOKIE_NAME, LOGIN_PATH, REGISTER_PATH } from '@/config'
import { logger } from '@/lib/logger'
import { createRequest, RequestError } from '@/utils/request'

const blacklist = [
  '/dashboard',
  '/library',
  '/profile',
]

const authGuestPaths = new Set([LOGIN_PATH, REGISTER_PATH, FORGOT_PASSWORD_PATH])

/** True only when the API rejects the token (401); network errors keep the session. */
async function isTokenRejected(token: string) {
  try {
    await createRequest(async () => token)('/api/profile')
    return false
  } catch (e) {
    return e instanceof RequestError && e.status === 401
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(JWT_COOKIE_NAME)?.value

  logger.info(`[proxy] ${pathname}, token: ${token?.slice(-10)}`)

  // 检查是否是受保护的路径
  const isProtectedPath = blacklist.some((path) => pathname.startsWith(path))

  logger.info({ token, isProtectedPath }, `[proxy] => ${pathname}`)
  // 如果是受保护路径但没有 token，重定向到登录页
  if (!token) {
    if (isProtectedPath) {
      const url = new URL(LOGIN_PATH, request.url)
      url.searchParams.set('redirect', pathname)
      logger.fatal(`[proxy] no token => redirect(${LOGIN_PATH})`)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }
  else {
    if (authGuestPaths.has(pathname)) {
      // A stale cookie would otherwise bounce every login attempt back to '/'.
      if (await isTokenRejected(token)) {
        logger.fatal('[proxy] rejected token => clear cookie')
        const res = NextResponse.next()
        res.cookies.delete(JWT_COOKIE_NAME)
        return res
      }
      const url = new URL('/', request.url)
      logger.fatal('[proxy] has token => redirect(/dashboard)')
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }
}
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
