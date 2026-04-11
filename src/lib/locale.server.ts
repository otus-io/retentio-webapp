'use server'
import { cookies } from 'next/headers'

const localeNames = ['en', 'zh-CN'] as const

export type Locale = (typeof localeNames)[number]

export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const locale = (store.get('locale')?.value || 'en') as Locale
  const fullLocale = localeNames.includes(locale)
    ? locale
    : 'en'
  return fullLocale
}
