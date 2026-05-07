import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

export interface IAppNavMenu {
  title: string
  href: string
  isActive?: boolean
}

export default function useAppNavMenu() {
  const t = useTranslations()
  const pathname = usePathname()

  const navMenu = useMemo(() => {
    return [
      {
        title: t('nav.guide'),
        href: '/guide',
        isActive: pathname.startsWith('/guide'),
      },
      {
        title: t('term.decks'),
        href: '/decks',
        isActive: pathname.startsWith('/decks'),
      },
    ] satisfies IAppNavMenu[]
  }, [t, pathname])

  return {
    navMenu,
  }
}
