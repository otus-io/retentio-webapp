'use client'

import { Menu } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useSidebar } from '@/components/layout/SidebarContext'
import DocNavigation from '@/components/layout/DocNavigation'

export default function MainContent({
  children,
  isNavVisible = true,
}: {
  children: React.ReactNode
  isNavVisible?: boolean
}) {
  const t = useTranslations()
  const { setMobileOpen } = useSidebar()

  return (
    <div className="flex-1 min-w-0 md:min-h-screen">
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden flex items-center gap-2 w-full px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer sticky top-16 z-10 bg-background"
      >
        <Menu className="size-4" />
        <span>{t('guide-sidebar.menu')}</span>
      </button>
      {children}
      {
        isNavVisible === true && <DocNavigation />
      }
    </div>
  )
}
