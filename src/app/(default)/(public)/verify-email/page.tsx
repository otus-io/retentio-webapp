'use server'
import type { Metadata } from 'next'
import VerifyEmailPanel from '@/components/auth/VerifyEmailPanel'
import { verifyEmailService } from '@/modules/auth/auth.service'
import { getTranslations } from 'next-intl/server'

export default async function Page(props: PageProps<'/verify-email'>) {
  const t = await getTranslations('auth')
  const searchParams = await props.searchParams
  const token = typeof searchParams.token === 'string' ? searchParams.token.trim() : ''

  if (!token) {
    return (
      <VerifyEmailPanel
        token=""
        initialStatus="error"
        initialError={t('verifyEmailMissingToken')}
      />
    )
  }

  const res = await verifyEmailService({ token })
  if (!res.success) {
    return (
      <VerifyEmailPanel
        token={token}
        initialStatus="error"
        initialError={res.message}
      />
    )
  }

  return (
    <VerifyEmailPanel
      token={token}
      initialStatus="success"
      initialError={null}
    />
  )
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('auth.verifyEmailTitle'),
    description: t('auth.verifyEmailDescription'),
  } satisfies Metadata
}
