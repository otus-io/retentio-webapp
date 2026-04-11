import { guideSidebarConfig } from '@/config/sidebar'
import LayoutWithSidebar from '@/components/layout/LayoutWithSidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutWithSidebar
      sidebarMenus={guideSidebarConfig}
    >
      {children}
    </LayoutWithSidebar>
  )
}
