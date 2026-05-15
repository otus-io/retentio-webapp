import 'next-intl'
import type messages from '@/i18n/locales/en.json'
import type { Locale } from '@/lib/locale.server'

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}

export {}
