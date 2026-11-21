'use client'
import { useOverlayState } from '@heroui/react'
import { Mail, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import AppButton from '@/components/app/AppButton'
import ChangeEmailModal from '@/components/auth/ChangeEmailModal'
import DeleteAccountModal from '@/components/auth/DeleteAccountModal'

export default function ProfileActions({ email }: { email: string }) {
  const t = useTranslations('auth')
  const changeEmail = useOverlayState()
  const deleteAccount = useOverlayState()
  // A fresh key per opening remounts the modal, dropping the previous attempt's errors.
  const [session, setSession] = useState(0)

  return (
    <div className="flex flex-wrap gap-2">
      <AppButton
        variant="secondary"
        icon={<Mail className="size-4" />}
        onPress={() => { setSession((n) => n + 1); changeEmail.open() }}
      >
        {t('changeEmail')}
      </AppButton>
      <AppButton
        variant="danger-soft"
        icon={<Trash2 className="size-4" />}
        onPress={() => { setSession((n) => n + 1); deleteAccount.open() }}
      >
        {t('deleteAccount')}
      </AppButton>
      <ChangeEmailModal key={`email-${session}`} {...changeEmail} currentEmail={email} />
      <DeleteAccountModal key={`delete-${session}`} {...deleteAccount} />
    </div>
  )
}
