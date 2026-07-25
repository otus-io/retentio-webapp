'use client'

import type { FormEvent } from 'react'
import { Card, Form } from '@heroui/react'
import { useTranslations } from 'next-intl'
import { startTransition, useActionState, useCallback } from 'react'
import { FORGOT_PASSWORD_PATH, LOGIN_PATH } from '@/config'
import { resetPasswordAction } from '@/modules/auth/auth.action'
import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import AppLink from '@/components/app/AppLink'
import AppPasswordInput from '@/components/app/AppPasswordInput'

export default function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations('auth')
  const hasToken = token.length > 0

  const [state, action, isPending] = useActionState(resetPasswordAction, {
    data: {
      token,
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
            <Card.Title>{t('resetPasswordTitle')}</Card.Title>
            <Card.Description>{t('resetPasswordDescription')}</Card.Description>
          </Card.Header>
          {!hasToken
            ? (
              <Card.Content>
                <p className="text-sm text-danger">{t('resetPasswordMissingToken')}</p>
                <p className="text-sm text-center text-default-500 mt-4 space-x-2">
                  <AppLink className="text-sm" isActive href={FORGOT_PASSWORD_PATH}>
                    {t('requestNewResetLink')}
                  </AppLink>
                  <span>·</span>
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
                    <input name="token" type="hidden" value={token} />
                    <AppPasswordInput
                      isRequired
                      label={t('passwordLabel')}
                      name="password"
                      variant="secondary"
                      placeholder={t('passwordPlaceholder')}
                      minLength={8}
                    />
                    <AppPasswordInput
                      isRequired
                      label={t('confirmPasswordLabel')}
                      name="confirmPassword"
                      variant="secondary"
                      placeholder={t('confirmPasswordPlaceholder')}
                      minLength={8}
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
                      {t('resetPasswordButton')}
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
