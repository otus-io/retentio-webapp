import Footer from '@/components/layout/Footer'
import TopNav from '@/components/layout/TopNav'
import { UserContextProvider } from '@/context/UserContext'
import { getProfileService } from '@/modules/auth/auth.service'


export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getProfileService()
  return (
    <UserContextProvider user={user?.success ? user : null}>
      <section>
        <TopNav />
        {children}
        <Footer />
      </section>
    </UserContextProvider>
  )
}
