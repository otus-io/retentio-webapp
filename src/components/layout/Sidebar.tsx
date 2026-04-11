'use client'

import { useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChevronDown, X } from 'lucide-react'
import clsx from 'clsx'
import AppLink from '@/components/app/AppLink'
import type { SidebarNavItem } from '@/config/sidebar'
import { useSidebar } from '@/components/layout/SidebarContext'


function isItemActive(item: SidebarNavItem, pathname: string): boolean {
  if (item.href && pathname === item.href) return true
  if (item.items) return item.items.some((child) => isItemActive(child, pathname))
  return false
}

function NavItemLink({
  item,
}: {
  item: SidebarNavItem
}) {
  const pathname = usePathname()
  const t = useTranslations()
  const { setMobileOpen } = useSidebar()
  const active = item.href === pathname
  function handleNavigate() {
    setMobileOpen(false)
  }
  return (
    <AppLink
      href={item.href!}
      isActive={active}
      prefetch={true}
      className={clsx(
        'block py-1.5 px-2 rounded text-sm transition-colors',
        active && 'bg-accent/10',
      )}
      onNavigate={handleNavigate}
    >
      {t(item.titleKey)}
    </AppLink>
  )
}

function NavGroup({
  item,
}: {
  item: SidebarNavItem
}) {
  const t = useTranslations()
  const pathname = usePathname()
  const hasChildren = item.items && item.items.length > 0
  const isActive = isItemActive(item, pathname)
  const [open, setOpen] = useState(isActive)
  const toggle = useCallback(() => setOpen((prev) => !prev), [])

  if (!hasChildren) {
    return <NavItemLink item={item} />
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className={clsx(
          'flex items-center justify-between w-full py-1.5 px-2 rounded text-sm font-medium transition-colors cursor-pointer',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          isActive && 'text-accent',
        )}
      >
        <span>{t(item.titleKey)}</span>
        <ChevronDown
          className={clsx(
            'size-4 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div className="ml-2 pl-2 border-l border-gray-200 dark:border-gray-700 mt-1 space-y-0.5">
          {item.items!.map((child) => (
            <NavItemLink key={child.titleKey} item={child} />
          ))}
        </div>
      )}
    </div>
  )
}

function SidebarContent() {
  const { items } = useSidebar()
  return (
    <nav className="space-y-1 py-4 px-2">
      {items.map((item) => (
        <NavGroup key={item.titleKey} item={item} />
      ))}
    </nav>
  )
}

export default function Sidebar() {
  const t = useTranslations()
  const { mobileOpen, setMobileOpen } = useSidebar()

  return (
    <>
      {/* Mobile drawer - starts below TopNav (top-16) */}
      <aside
        className={clsx(
          'md:hidden fixed top-16.25 bottom-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 shadow-lg overflow-y-auto transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-3 pt-3">
          <span className="font-semibold text-sm">{t('guide-sidebar.guide')}</span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:block w-56 shrink-0 overflow-y-auto sticky top-16 h-[calc(100vh-64px)] self-start border-r bottom-0 border-gray-200 dark:border-gray-700"
      >
        <SidebarContent />
      </aside>
    </>
  )
}
