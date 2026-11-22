import type { NextRequest } from 'next/server'
import { API_BASE_URL } from '@/config'
import { getToken } from '@/lib/token'

/**
 * Same-origin bridge for browser calls to `/api/*` on the backend: the JWT cookie is httpOnly,
 * so the token is attached here instead of in client code.
 */
async function forward(req: NextRequest, ctx: RouteContext<'/backend/[...path]'>) {
  const { path } = await ctx.params
  if (path[0] !== 'api' || path.some((s) => s === '.' || s === '..')) {
    return new Response(null, { status: 404 })
  }

  const headers = new Headers()
  const contentType = req.headers.get('content-type')
  if (contentType) headers.set('Content-Type', contentType)
  const token = await getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const upstream = await fetch(`${API_BASE_URL}/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
  })

  const resHeaders = new Headers()
  const upstreamType = upstream.headers.get('content-type')
  if (upstreamType) resHeaders.set('Content-Type', upstreamType)
  // fetch decodes compressed bodies, so the upstream length is only valid when uncompressed.
  const length = upstream.headers.get('content-length')
  if (length && !upstream.headers.get('content-encoding')) resHeaders.set('Content-Length', length)

  return new Response(upstream.body, { status: upstream.status, headers: resHeaders })
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE }
