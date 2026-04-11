import Footer from '@/components/layout/Footer'
import TopNav from '@/components/layout/TopNav'
import { getProfileService } from '@/modules/auth/auth.service'


export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getProfileService()
  return (
    <section>
      <TopNav user={user} />
      {children}
      <Footer />
    </section>
  )
}
