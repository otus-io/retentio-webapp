'use server'
import type { Metadata } from 'next'
import AuthForm from '@/components/auth/AuthForm'
import { getTranslations } from 'next-intl/server'

export default async function Page() {
  return <AuthForm type="register" />
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('auth.registerTitle'),
    description: t('auth.registerDescription'),
  } satisfies Metadata
}
