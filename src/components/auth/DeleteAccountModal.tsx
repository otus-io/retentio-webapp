'use client'
import type { UseOverlayStateReturn } from '@heroui/react'
import { Form, Modal } from '@heroui/react'
import { useTranslations } from 'next-intl'
import { useActionState } from 'react'
import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import AppPasswordInput from '@/components/app/AppPasswordInput'
import { deleteAccountAction } from '@/modules/auth/auth.action'

export default function DeleteAccountModal({ isOpen, setOpen }: UseOverlayStateReturn) {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const [state, action, isPending] = useActionState(deleteAccountAction, null)

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={setOpen} isDismissable={!isPending} isKeyboardDismissDisabled={isPending}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-100">
          <Modal.CloseTrigger isDisabled={isPending} />
          <Modal.Header>
            <Modal.Heading>{t('deleteAccount')}</Modal.Heading>
          </Modal.Header>
          <Form action={action} validationErrors={state?.validationErrors}>
            <Modal.Body className="space-y-4">
              <p className="text-sm text-muted">{t('deleteAccountMessage')}</p>
              <AppPasswordInput
                label={t('currentPasswordLabel')}
                name="password"
                isRequired
                variant="secondary"
              />
              <AppError error={isPending ? null : state?.error} />
            </Modal.Body>
            <Modal.Footer>
              <AppButton slot="close" variant="ghost" isDisabled={isPending}>
                {tCommon('cancel')}
              </AppButton>
              <AppButton type="submit" variant="danger" isPending={isPending}>
                {t('deleteAccount')}
              </AppButton>
            </Modal.Footer>
          </Form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
