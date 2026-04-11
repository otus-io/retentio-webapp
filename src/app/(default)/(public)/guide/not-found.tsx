'use client'
import AppErrorPage from '@/components/app/AppErrorPage'
import { useTranslations } from 'next-intl'

export default function NotFound() {
  const t = useTranslations()
  return (
    <AppErrorPage
      code={404}
      message={t('error.not-find')}
    />
  )
}
