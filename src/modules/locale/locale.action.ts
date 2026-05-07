'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function setLocaleAction(locale: string) {
  // 注意：Next.js 15 开始 cookies() 是异步的，和你之前代码保持一致
  const cookieStore = await cookies()

  // 设置 Cookie
  cookieStore.set('locale', locale, {
    maxAge: 31536000, // 1年
    path: '/',
    // httpOnly: true, // 如果不需要客户端 JS 读取，可以开启增加安全性
  })

  // 刷新当前路径，让 next-intl 重新执行 getRequestConfig
  revalidatePath('/', 'layout')
}
