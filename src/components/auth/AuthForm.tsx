'use client'

import type { FormEvent } from 'react'
import { Card, Form } from '@heroui/react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { startTransition, useActionState, useCallback, useMemo, useState } from 'react'
import { LOGIN_PATH, REGISTER_PATH } from '@/config'
import { loginAction, registerAction } from '@/modules/auth/auth.action'
import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import AppInput from '@/components/app/AppInput'
import AppLink from '@/components/app/AppLink'
import AppPasswordInput from '@/components/app/AppPasswordInput'
import TermsAgreement from '@/components/auth/TermsAgreement'
import { showWarningToast } from '@/lib/ui'

export default function AuthForm({ type }: { type: 'login' | 'register' }) {
  const t = useTranslations('auth')
  const searchParams = useSearchParams()

  const redirectPath = useMemo(() => {
    return searchParams.get('redirect') || '/'
  }, [searchParams])

  const isLogin = type === 'login'

  const authAction = isLogin ? loginAction : registerAction

  const [state, action, isPending] = useActionState(authAction, {
    data: {
      username: '',
      password: '',
      terms: 'false',
    },
  })

  const [isTermsAccepted, setIsTermsAccepted] = useState(state?.data?.terms === 'true')

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.target as HTMLFormElement)
    if (!formData.get('terms') && !isLogin) {
      showWarningToast(t('termsWarning'))
      return
    }
    startTransition(() => action(formData))
  }, [action, t, isLogin])


  return (
    <div className="flex-1 sm:min-h-[calc(100vh-270px)] pt-8 max-w-content w-full px-2 sm:px-4 md:px-6 mx-auto box-border space-y-2">
      <div className="max-w-lg mx-auto space-y-4 py-8 px-2 sm:p-0">
        <Card>
          <Card.Header>
            <Card.Title>{isLogin ? t('loginTitle') : t('registerTitle')}</Card.Title>
            <Card.Description>{isLogin ? t('loginDescription') : t('registerDescription')}</Card.Description>
          </Card.Header>
          <Form
            action={action}
            onSubmit={handleSubmit}
            validationErrors={state?.validationErrors}
          >
            <Card.Content>
              <div className="w-full justify-center items-center space-y-4">
                <AppInput
                  label={t('usernameLabel')}
                  name="username"
                  isRequired
                  placeholder={t('usernamePlaceholder')}
                  variant="secondary"
                  defaultValue={state?.data?.username}
                />

                {
                  !isLogin && (
                    <AppInput
                      label={t('emailLabel')}
                      name="email"
                      type="email"
                      isRequired
                      placeholder={t('emailPlaceholder')}
                      variant="secondary"
                      defaultValue={state?.data?.email}
                    />
                  )
                }
                <AppPasswordInput
                  isRequired
                  label={t('passwordLabel')}
                  name="password"
                  variant="secondary"
                  placeholder={t('passwordPlaceholder')}
                  defaultValue={state?.data?.password}
                  minLength={isLogin ? 6 : 8}
                />

                {
                  !isLogin && (
                    <AppPasswordInput
                      isRequired
                      label={t('confirmPasswordLabel')}
                      name="confirmPassword"
                      variant="secondary"
                      placeholder={t('confirmPasswordPlaceholder')}
                      defaultValue={state?.data?.confirmPassword}
                      minLength={8}
                    />
                  )
                }
                <input
                  name="redirect"
                  type="hidden"
                  value={redirectPath}
                />
              </div>
            </Card.Content>
            <Card.Footer>
              <div className="flex flex-col gap-4 w-full">
                {
                  !isLogin && (
                    <TermsAgreement
                      defaultSelected={isTermsAccepted}
                      onChange={setIsTermsAccepted}
                    />
                  )
                }
                <div className="flex gap-4">
                  <AppButton
                    isPending={isPending}
                    className="w-full"
                    type="submit"
                    size="lg"
                  >
                    {isLogin ? t('loginButton') : t('registerButton')}
                  </AppButton>
                </div>
                <p className="text-sm text-center text-default-500">
                  {t('noAccount')}
                  <AppLink
                    className="ml-1 text-sm"
                    isActive
                    href={isLogin ? REGISTER_PATH : LOGIN_PATH}
                  >
                    {isLogin ? t('goRegister') : t('goLogin')}
                  </AppLink>
                </p>
              </div>
            </Card.Footer>
          </Form>
        </Card>
        <AppError error={state?.error} />
      </div>
    </div>
  )
}
