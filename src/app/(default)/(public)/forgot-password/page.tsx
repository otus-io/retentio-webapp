'use server'
import type { Metadata } from 'next'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import { getTranslations } from 'next-intl/server'

export default async function Page() {
  return <ForgotPasswordForm />
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('auth.forgotPasswordTitle'),
    description: t('auth.forgotPasswordDescription'),
  } satisfies Metadata
}
