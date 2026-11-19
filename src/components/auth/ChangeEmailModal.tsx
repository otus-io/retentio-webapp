'use client'
import type { UseOverlayStateReturn } from '@heroui/react'
import { Form, Modal } from '@heroui/react'
import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useState } from 'react'
import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import AppInput from '@/components/app/AppInput'
import AppPasswordInput from '@/components/app/AppPasswordInput'
import { showSuccessToast } from '@/lib/ui'
import { changeEmailAction } from '@/modules/auth/auth.action'

interface ChangeEmailModalProps extends UseOverlayStateReturn {
  currentEmail: string
}

export default function ChangeEmailModal({ isOpen, setOpen, close, currentEmail }: ChangeEmailModalProps) {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const [state, action, isPending] = useActionState(changeEmailAction, null)
  // The last failure stays visible until the user edits a field or retries.
  const [errorDismissed, setErrorDismissed] = useState(false)
  const dismissError = () => setErrorDismissed(true)

  useEffect(() => {
    if (!state?.success) return
    showSuccessToast(t('changeEmailSuccess', { email: state.data?.email }))
    close()
  }, [state, close, t])

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={setOpen} isDismissable={!isPending}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-100">
          <Modal.CloseTrigger isDisabled={isPending} />
          <Modal.Header>
            <Modal.Heading>{t('changeEmail')}</Modal.Heading>
          </Modal.Header>
          <Form
            action={action}
            validationErrors={state?.validationErrors}
            onSubmit={() => setErrorDismissed(false)}
          >
            <Modal.Body className="space-y-4">
              <p className="text-sm text-muted">{t('changeEmailDescription', { email: currentEmail })}</p>
              <AppInput
                label={t('newEmailLabel')}
                name="email"
                type="email"
                isRequired
                variant="secondary"
                defaultValue={state?.success ? undefined : state?.data?.email}
                onChange={dismissError}
              />
              <AppPasswordInput
                label={t('currentPasswordLabel')}
                name="password"
                isRequired
                variant="secondary"
                onChange={dismissError}
              />
              <AppError error={errorDismissed || isPending ? null : state?.error} />
            </Modal.Body>
            <Modal.Footer>
              <AppButton slot="close" variant="ghost" isDisabled={isPending}>
                {tCommon('cancel')}
              </AppButton>
              <AppButton type="submit" isPending={isPending}>
                {t('changeEmail')}
              </AppButton>
            </Modal.Footer>
          </Form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
