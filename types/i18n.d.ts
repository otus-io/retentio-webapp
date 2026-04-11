import 'next-intl'
import messages from '@/i18n/locales/en.json'
import { Locale } from '@/lib/locale.server'

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}

export {}
