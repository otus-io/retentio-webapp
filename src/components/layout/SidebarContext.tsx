'use client'

import { SidebarNavItem } from '@/config/sidebar'
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface SidebarContextType {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  items: SidebarNavItem[]
  flattenItems: SidebarNavItem[]
}

const SidebarContext = createContext<SidebarContextType | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within SidebarProvider')
  return context
}

export function SidebarProvider({
  children,
  items,
}: {
  children: ReactNode
  items: SidebarNavItem[]
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const flattenItems = useMemo(() => {
    function getSidebarNavItems(items: SidebarNavItem[]): SidebarNavItem[] {
      return items.flatMap((item) => {
        if (item.items?.length) return getSidebarNavItems(item.items)
        return item.href ? [item] : []
      })
    }
    return getSidebarNavItems(items)
  }, [items])

  return (
    <SidebarContext.Provider
      value={{
        items,
        flattenItems,
        mobileOpen,
        setMobileOpen,
      }}
    >
      <main className="flex max-w-content mx-auto flex-1">
        {children}
      </main>
    </SidebarContext.Provider>
  )
}

