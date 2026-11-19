'use client'
import { Alert, useOverlayState } from '@heroui/react'
import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import AppButton from '@/components/app/AppButton'
import ChangeEmailModal from '@/components/auth/ChangeEmailModal'
import { useUserContext } from '@/context/UserContext'
import { showFailToast, showSuccessToast } from '@/lib/ui'
import { resendVerificationAction } from '@/modules/auth/auth.action'

export default function EmailVerificationBanner() {
  const t = useTranslations('auth')
  const { user } = useUserContext()
  const modal = useOverlayState()
  const [isPending, startTransition] = useTransition()

  if (!user || user.data.email_verified !== false) return null
  const { email } = user.data

  const resend = () => {
    startTransition(async () => {
      const res = await resendVerificationAction(email)
      if (res.success) showSuccessToast(t('verificationSent'))
      else showFailToast(res.error)
    })
  }

  return (
    <div className="max-w-content mx-auto px-3.5 pt-3">
      <Alert status="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{t('emailUnverifiedTitle')}</Alert.Title>
          <Alert.Description>{t('emailUnverifiedBanner', { email })}</Alert.Description>
          <div className="flex flex-wrap gap-2 mt-2">
            <AppButton size="sm" variant="secondary" onPress={resend} isPending={isPending}>
              {t('resendVerification')}
            </AppButton>
            <AppButton size="sm" variant="ghost" onPress={modal.open} isDisabled={isPending}>
              {t('changeEmail')}
            </AppButton>
          </div>
        </Alert.Content>
      </Alert>
      <ChangeEmailModal {...modal} currentEmail={email} />
    </div>
  )
}
