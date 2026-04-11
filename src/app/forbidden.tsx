'use client'
import AppErrorPage from '@/components/app/AppErrorPage'
import { useTranslations } from 'next-intl'

export default function Forbidden() {
  const t = useTranslations()
  return (
    <AppErrorPage
      code={403}
      message={t('error.forbidden')}
    />
  )
}
