'use server'
import type { Metadata } from 'next'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import { getTranslations } from 'next-intl/server'

export default async function Page(props: PageProps<'/reset-password'>) {
  const searchParams = await props.searchParams
  const token = typeof searchParams.token === 'string' ? searchParams.token.trim() : ''
  return <ResetPasswordForm token={token} />
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('auth.resetPasswordTitle'),
    description: t('auth.resetPasswordDescription'),
  } satisfies Metadata
}
