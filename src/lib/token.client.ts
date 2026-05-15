
'use client'

import { JWT_COOKIE_NAME } from '@/config'

export async function getClientToken() {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${JWT_COOKIE_NAME}=`))
    ?.split('=')?.[1] ?? null
}




