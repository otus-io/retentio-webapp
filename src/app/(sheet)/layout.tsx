import EmailVerificationBanner from '@/components/auth/EmailVerificationBanner'
import TopNav from '@/components/layout/TopNav'
import { UserContextProvider } from '@/context/UserContext'
import { getProfileService } from '@/modules/auth/auth.service'

/** Full-window spreadsheet pages: no footer and no page scroll; only the sheet itself scrolls. */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getProfileService()
  return (
    <UserContextProvider user={user?.success ? user : null}>
      <section className="h-dvh flex flex-col overflow-hidden">
        <TopNav />
        <EmailVerificationBanner />
        <main className="flex-1 min-h-0">{children}</main>
      </section>
    </UserContextProvider>
  )
}
