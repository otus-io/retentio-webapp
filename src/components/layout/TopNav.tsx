'use client'
import { useCallback, useState } from 'react'
import LocaleSwitcher from '@/components/layout/LocaleSwitcher'
import ThemeButton from '@/components/layout/ThemeButton'
import MobileMenuButton from '@/components/layout/MobileMenuButton'
import MobileNavMenu from '@/components/layout/MobileNavMenu'
import UserButton from '@/components/auth/UserButton'
import AppLogo from '@/components/app/AppLogo'
import useAppNavMenu from '@/hooks/useAppNavMenu'
import { AppButtonLink } from '@/components/app/AppButtonLink'
import GuideSearchButton from '@/components/guide/GuideSearchButton'
import { ProfileResponseDTO } from '@/modules/auth/auth.schema'

interface TopNavProps {
  user?: ProfileResponseDTO | null
}

export default function TopNav({ user }: TopNavProps) {
  const { navMenu } = useAppNavMenu()
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <>
      <header
        className="shadow z-40 dark:border-b bg-background dark:border-gray-700 h-16 sticky top-0"
      >
        <div className="max-w-content mx-auto flex items-center h-full px-3.5">
          <div className="flex-1 flex justify-start gap-4 items-center">
            <AppLogo />
            {/* Desktop nav menu */}
            <ul className="hidden md:flex gap-2 items-center">
              {navMenu.map((item) => (
                <li key={item.href}>
                  <AppButtonLink
                    href={item.href}
                    style={{ '--radius': '0.1em' }}
                    variant={item.isActive ? 'primary' : 'ghost'}
                  >
                    {item.title}
                  </AppButtonLink>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 flex justify-end gap-2">
            <GuideSearchButton />
            <LocaleSwitcher />
            <ThemeButton />
            <UserButton user={user} />
            <MobileMenuButton open={mobileOpen} onToggle={toggleMobile} />
          </div>
        </div>
      </header>
      <MobileNavMenu open={mobileOpen} onClose={closeMobile} />
    </>
  )
}
