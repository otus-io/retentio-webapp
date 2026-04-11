import { redirect } from 'next/navigation'
import { LOGIN_PATH } from '@/config'
import Profile from '@/components/auth/Profile'
import { getProfileService } from '@/modules/auth/auth.service'

export default async function Page() {
  const user = await getProfileService()
  if (!user) {
    redirect(LOGIN_PATH)
  }
  return <Profile user={user} />
}
