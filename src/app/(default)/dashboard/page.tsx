import { redirect } from 'next/navigation'
import { LOGIN_PATH } from '@/config'
import Dashboard from '@/components/retentio/Dashboard'
import { getProfileService } from '@/modules/auth/auth.service'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export default async function Page() {
  const user = await getProfileService()
  if (!user?.success) {
    redirect(LOGIN_PATH)
  }
  return <Dashboard user={user} />
}


export async function generateMetadata() {
  // Shares one /api/profile request with Page: Next memoizes identical GET fetches per render.
  const user = await getProfileService()
  const t = await getTranslations()
  const name = user?.success === true ? user.data.username : ''
  return {
    title: t('nav.dashboard'),
    description: t('dashboard.welcome', { 'name': `${name}` }),
  } satisfies Metadata
}
