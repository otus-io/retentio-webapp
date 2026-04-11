'use client'
import AppErrorPage from '@/components/app/AppErrorPage'
import { useTranslations } from 'next-intl'

export default function Unauthorized() {
  const t = useTranslations()
  return (
    <AppErrorPage
      code={401}
      message={t('error.unauthorized')}
    />
  )
}
