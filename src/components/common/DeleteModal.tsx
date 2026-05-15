'use client'

import AppButton from '@/components/app/AppButton'
import { AlertDialog } from '@heroui/react'
import { useTranslations } from 'next-intl'
import { useActionState, useEffect } from 'react'


interface DeleteModalProps {
  action: ActionFunction
  isOpen: boolean,
  setIsOpen: (isOpen: boolean) => void
}

export default function DeleteModal({
  action: deleteAction,
  isOpen,
  setIsOpen,
}: DeleteModalProps) {
  const t = useTranslations()
  const [_state, action, isPending] = useActionState(deleteAction, null)
  useEffect(() => {
    if(_state?.success){
      setIsOpen(false)
    }
  }, [_state?.success, setIsOpen])
  return (
    <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
      <AlertDialog.Container>
        <AlertDialog.Dialog className="sm:max-w-100">
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header>
            <AlertDialog.Icon status="danger" />
            <AlertDialog.Heading>{t('common.tips')}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p>
              {t('common.delete-confirm')}
            </p>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <AppButton slot="close" variant="tertiary">
              {t('common.cancel')}
            </AppButton>
            <form action={action}>
              <AppButton
                isPending={isPending}
                variant="danger"
                type="submit"
              >
                {t('common.confirm')}
              </AppButton>
            </form>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  )
}

