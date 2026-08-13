'use client'
import { useEffect } from 'react'
import clsx from 'clsx'
import useAppNavMenu from '@/hooks/useAppNavMenu'
import { AppButtonLink } from '@/components/app/AppButtonLink'

interface MobileNavMenuProps {
  open: boolean
  onClose: () => void
  isLoggedIn?: boolean
}

export default function MobileNavMenu({ open, onClose, isLoggedIn = false }: MobileNavMenuProps) {
  const { navMenu } = useAppNavMenu({ isLoggedIn })

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
          <AppButtonLink
            key={item.href}
            href={item.href}
            className="block py-2.5 px-3 rounded text-base transition-colors"
            onClick={onClose}
            variant={item.isActive ? 'primary' : 'ghost'}
            fullWidth
          >
            {item.title}
          </AppButtonLink>
        ))}
      </nav>
    </aside>
  )
}
