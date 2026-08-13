import { createTranslator } from 'next-intl'
import en from '@/i18n/locales/en.json'

export const t = createTranslator({ locale: 'en', messages: en })
