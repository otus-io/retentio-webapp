import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

export interface IAppNavMenu {
  title: string
  href: string
  isActive?: boolean
}

export default function useAppNavMenu({ isLoggedIn = false }: { isLoggedIn?: boolean } = {}) {
  const t = useTranslations()
  const pathname = usePathname()

  const navMenu = useMemo(() => {
    const items: IAppNavMenu[] = [
      {
        title: t('nav.guide'),
        href: '/guide',
        isActive: pathname.startsWith('/guide'),
      },
    ]

    if (isLoggedIn) {
      items.push({
        title: t('term.decks'),
        href: '/decks',
        isActive: pathname.startsWith('/decks'),
      })
    }

    return items
  }, [t, pathname, isLoggedIn])

  return {
    navMenu,
  }
}
