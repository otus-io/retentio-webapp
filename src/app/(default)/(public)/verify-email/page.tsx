'use server'
import type { Metadata } from 'next'
import VerifyEmailPanel from '@/components/auth/VerifyEmailPanel'
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

  return (
    <VerifyEmailPanel
      token={token}
      initialStatus="pending"
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
