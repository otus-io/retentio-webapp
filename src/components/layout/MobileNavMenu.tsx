'use client'
import { useEffect } from 'react'
import clsx from 'clsx'
import AppLink from '@/components/app/AppLink'
import useAppNavMenu from '@/hooks/useAppNavMenu'

interface MobileNavMenuProps {
  open: boolean
  onClose: () => void
}

export default function MobileNavMenu({ open, onClose }: MobileNavMenuProps) {
  const { navMenu } = useAppNavMenu()

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <aside
      className={clsx(
        'md:hidden fixed top-16.25 left-0 right-0 bottom-0 z-40 bg-background shadow-lg overflow-y-auto transition-transform duration-0',
        open ? 'translate-y-0' : 'translate-y-full pointer-events-none',
      )}
    >
      <nav className="flex flex-col gap-1 py-4 px-4">
        {navMenu.map((item) => (
          <AppLink
            key={item.href}
            href={item.href}
            isActive={item.isActive}
            className="block py-2.5 px-3 rounded text-base transition-colors"
            onClick={onClose}
          >
            {item.title}
          </AppLink>
        ))}
      </nav>
    </aside>
  )
}
