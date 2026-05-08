import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { JWT_COOKIE_NAME, LOGIN_PATH, REGISTER_PATH } from '@/config'
import { logger } from '@/lib/logger'
import { getToken } from '@/lib/token'

const blacklist = [
  '/dashboard',
  '/library',
  '/profile',
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(JWT_COOKIE_NAME)?.value

  logger.info({ v: await getToken() }, `[proxy] ${pathname}, token: ${token}`)

  // 检查是否是受保护的路径
  const isProtectedPath = blacklist.some((path) => pathname.startsWith(path))

  logger.info({ token, isProtectedPath }, `[proxy] => ${pathname}`)
  // 如果是受保护路径但没有 token，重定向到登录页
  if(!token){
    if (isProtectedPath) {
      const url = new URL(LOGIN_PATH, request.url)
      url.searchParams.set('redirect', pathname)
      logger.fatal(`[proxy] no token => redirect(${LOGIN_PATH})`)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }
  else {
    if(pathname === LOGIN_PATH || pathname === REGISTER_PATH) {
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
