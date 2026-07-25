'use client'

import type { FormEvent } from 'react'
import { Card, Form } from '@heroui/react'
import { useTranslations } from 'next-intl'
import { startTransition, useActionState, useCallback } from 'react'
import { LOGIN_PATH } from '@/config'
import { forgotPasswordAction } from '@/modules/auth/auth.action'
import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import AppInput from '@/components/app/AppInput'
import AppLink from '@/components/app/AppLink'

export default function ForgotPasswordForm() {
  const t = useTranslations('auth')

  const [state, action, isPending] = useActionState(forgotPasswordAction, {
    data: {
      email: '',
    },
  })

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.target as HTMLFormElement)
    startTransition(() => action(formData))
  }, [action])

  return (
    <div className="flex-1 sm:min-h-[calc(100vh-270px)] pt-8 max-w-content w-full px-2 sm:px-4 md:px-6 mx-auto box-border space-y-2">
      <div className="max-w-lg mx-auto space-y-4 py-8 px-2 sm:p-0">
        <Card>
          <Card.Header>
            <Card.Title>{t('forgotPasswordTitle')}</Card.Title>
            <Card.Description>{t('forgotPasswordDescription')}</Card.Description>
          </Card.Header>
          {state?.success
            ? (
              <Card.Content>
                <p className="text-sm text-default-500">{t('forgotPasswordSent')}</p>
                <p className="text-sm text-center text-default-500 mt-4">
                  <AppLink className="text-sm" isActive href={LOGIN_PATH}>
                    {t('goLogin')}
                  </AppLink>
                </p>
              </Card.Content>
            )
            : (
              <Form
                action={action}
                onSubmit={handleSubmit}
                validationErrors={state?.validationErrors}
              >
                <Card.Content>
                  <div className="w-full justify-center items-center space-y-4">
                    <AppInput
                      label={t('emailLabel')}
                      name="email"
                      type="email"
                      isRequired
                      placeholder={t('emailPlaceholder')}
                      variant="secondary"
                      defaultValue={state?.data?.email}
                    />
                  </div>
                </Card.Content>
                <Card.Footer>
                  <div className="flex flex-col gap-4 w-full">
                    <AppButton
                      isPending={isPending}
                      className="w-full"
                      type="submit"
                      size="lg"
                    >
                      {t('forgotPasswordButton')}
                    </AppButton>
                    <p className="text-sm text-center text-default-500">
                      <AppLink className="text-sm" isActive href={LOGIN_PATH}>
                        {t('goLogin')}
                      </AppLink>
                    </p>
                  </div>
                </Card.Footer>
              </Form>
            )}
        </Card>
        <AppError error={state?.error} />
      </div>
    </div>
  )
}
