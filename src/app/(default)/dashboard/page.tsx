import { redirect } from 'next/navigation'
import { LOGIN_PATH } from '@/config'
import Dashboard from '@/components/retentio/Dashboard'
import { getProfileService } from '@/modules/auth/auth.service'
import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'

export default async function Page() {
  const user = await getProfileService()
  if (!user) {
    redirect(LOGIN_PATH)
  }
  return <Dashboard user={user} />
}


export async function generateMetadata() {
  const user = await getProfileService()
  const t = await getTranslations()
  return {
    title: t('nav.dashboard'),
    description: t('dashboard.welcome', { 'name': `${user?.data.username}` }),
  } satisfies Metadata
}
