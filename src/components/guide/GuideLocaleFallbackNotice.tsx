'use client'
import { Alert } from '@heroui/react'
import { useTranslations } from 'next-intl'

export default function GuideLocaleFallbackNotice() {
  const t = useTranslations()

  return (
    <Alert className="mb-4" status="warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Description>{t('content.fallback-notice')}</Alert.Description>
      </Alert.Content>
    </Alert>
  )
}
