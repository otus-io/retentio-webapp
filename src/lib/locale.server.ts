'use server'
import { cookies } from 'next/headers'

const localeNames = ['en', 'zh'] as const

export type Locale = (typeof localeNames)[number]

function normalizeLocale(value: string | undefined): Locale {
  if (value === 'zh-CN') return 'zh'
  return localeNames.includes(value as Locale) ? (value as Locale) : 'en'
}

export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  return normalizeLocale(store.get('locale')?.value)
}
