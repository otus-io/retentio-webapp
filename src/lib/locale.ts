import type { Locale } from 'next-intl'

export const locales = [
  {
    name: 'English',
    value: 'en',
  },
  {
    name: '中文',
    value: 'zh-CN',
  },
] satisfies { name: string; value: Locale }[]


export const DEFAULT_LOCALE: Locale = 'en'
