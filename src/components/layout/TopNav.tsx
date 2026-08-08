'use client'
import { useCallback, useState } from 'react'
import { Book } from 'lucide-react'
import LocaleSwitcher from '@/components/layout/LocaleSwitcher'
import ThemeButton from '@/components/layout/ThemeButton'
import MobileMenuButton from '@/components/layout/MobileMenuButton'
import MobileNavMenu from '@/components/layout/MobileNavMenu'
import UserButton from '@/components/auth/UserButton'
import AppLogo from '@/components/app/AppLogo'
import useAppNavMenu from '@/hooks/useAppNavMenu'
import { AppButtonLink } from '@/components/app/AppButtonLink'
import GuideSearchButton from '@/components/guide/GuideSearchButton'
import { useUserContext } from '@/context/UserContext'



export default function TopNav() {
  const { user } = useUserContext()
  const { navMenu } = useAppNavMenu({ isLoggedIn: !!user })
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])
  const guideItem = navMenu.find((item) => item.href === '/guide')
  const mainNav = navMenu.filter((item) => item.href !== '/guide')

  return (
    <>
      <header
        className="shadow z-40 dark:border-b bg-background dark:border-gray-700 h-16 sticky top-0"
      >
        <div className="max-w-content mx-auto flex items-center h-full px-3.5">
          <div className="flex-1 flex justify-start gap-4 items-center">
            <AppLogo />
            {/* Desktop nav menu */}
            {mainNav.length > 0 && (
              <ul className="hidden md:flex gap-2 items-center translate-y-2">
                {mainNav.map((item) => (
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
            )}
          </div>
          <div className="flex-1 flex justify-end items-center gap-2 translate-y-2">
            {guideItem && (
              <AppButtonLink
                href={guideItem.href}
                className="hidden md:inline-flex"
                style={{ '--radius': '0.1em' }}
                variant={guideItem.isActive ? 'primary' : 'ghost'}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Book className="size-5 shrink-0" />
                  {guideItem.title}
                </span>
              </AppButtonLink>
            )}
            <GuideSearchButton />
            <LocaleSwitcher />
            <ThemeButton />
            <UserButton user={user} />
            <MobileMenuButton open={mobileOpen} onToggle={toggleMobile} />
          </div>
        </div>
      </header>
      <MobileNavMenu open={mobileOpen} onClose={closeMobile} isLoggedIn={!!user} />
    </>
  )
}
