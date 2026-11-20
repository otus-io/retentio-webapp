'use client'

import AppButton from '@/components/app/AppButton'
import { AlertDialog } from '@heroui/react'
import { useTranslations } from 'next-intl'

interface StudyDeleteCardDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

/** Confirms deleting only the studied card; the fact and its other cards stay. */
export default function StudyDeleteCardDialog({ isOpen, onClose, onConfirm }: StudyDeleteCardDialogProps) {
  const t = useTranslations('study')
  const tCommon = useTranslations('common')
  return (
    <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onClose}>
      <AlertDialog.Container>
        <AlertDialog.Dialog className="sm:max-w-100">
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header>
            <AlertDialog.Heading>{t('delete-card')}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p>{t('delete-card-confirm')}</p>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <AppButton slot="close" variant="tertiary">{tCommon('cancel')}</AppButton>
            <AppButton variant="danger" onPress={onConfirm}>{t('delete-card')}</AppButton>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  )
}
