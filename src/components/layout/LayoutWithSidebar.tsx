import type { SidebarNavItem } from '@/config/sidebar'
import Sidebar from '@/components/layout/Sidebar'
import { SidebarProvider } from '@/components/layout/SidebarContext'
import MainContent from '@/components/layout/MainContent'

export default function LayoutWithSidebar({
  children,
  sidebarMenus,
}: {
  children: React.ReactNode
  sidebarMenus: SidebarNavItem[];
}) {
  return (
    <SidebarProvider items={sidebarMenus}>
      <Sidebar />
      <MainContent>
        {children}
      </MainContent>
    </SidebarProvider>
  )
}
