'use client'

import { Card } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState, useTransition } from 'react'
import { LOGIN_PATH, VERIFY_EMAIL_PATH } from '@/config'
import { verifyEmailAction } from '@/modules/auth/auth.action'
import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import AppLink from '@/components/app/AppLink'

type Status = 'pending' | 'success' | 'error'

export default function VerifyEmailPanel({
  token,
  initialStatus,
  initialError,
}: {
  token: string
  initialStatus: Status
  initialError: string | null
}) {
  const t = useTranslations('auth')
  const router = useRouter()
  const [status, setStatus] = useState<Status>(initialStatus)
  const [error, setError] = useState<string | null>(initialError)
  const [isPending, startTransition] = useTransition()
  const ranRef = useRef(false)

  const hasToken = token.length > 0

  useEffect(() => {
    if (!hasToken || initialStatus !== 'pending' || ranRef.current) return
    ranRef.current = true
    let cancelled = false
    void verifyEmailAction(token).then((res) => {
      if (cancelled) return
      if (res.success) {
        setStatus('success')
        router.replace(`${VERIFY_EMAIL_PATH}?verified=1`)
        return
      }
      setStatus('error')
      setError(res.error ?? t('verifyEmailFailed'))
    })
    return () => {
      cancelled = true
    }
  }, [hasToken, initialStatus, router, t, token])

  function handleRetry() {
    if (!hasToken) return
    startTransition(async () => {
      setError(null)
      setStatus('pending')
      const res = await verifyEmailAction(token)
      if (res.success) {
        setStatus('success')
        router.replace(`${VERIFY_EMAIL_PATH}?verified=1`)
        return
      }
      setStatus('error')
      setError(res.error ?? t('verifyEmailFailed'))
    })
  }

  return (
    <div className="flex-1 sm:min-h-[calc(100vh-270px)] pt-8 max-w-content w-full px-2 sm:px-4 md:px-6 mx-auto box-border space-y-2">
      <div className="max-w-lg mx-auto space-y-4 py-8 px-2 sm:p-0">
        <Card>
          <Card.Header>
            <Card.Title>{t('verifyEmailTitle')}</Card.Title>
            <Card.Description>{t('verifyEmailDescription')}</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              {status === 'pending' && (
                <p className="text-sm text-default-500">{t('verifyEmailPending')}</p>
              )}
              {status === 'success' && (
                <p className="text-sm text-default-500">{t('verifyEmailSuccess')}</p>
              )}
              {status === 'error' && error && <AppError error={error} />}
              {status === 'error' && hasToken && (
                <AppButton
                  className="w-full"
                  type="button"
                  size="lg"
                  isPending={isPending}
                  onPress={handleRetry}
                >
                  {t('verifyEmailRetry')}
                </AppButton>
              )}
              <p className="text-sm text-center text-default-500">
                <AppLink className="text-sm" isActive href={LOGIN_PATH}>
                  {t('goLogin')}
                </AppLink>
              </p>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}
