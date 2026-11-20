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

    const onSharedDecks = pathname.startsWith('/decks/shared')

    if (isLoggedIn) {
      items.push({
        title: t('nav.my-decks'),
        href: '/decks',
        isActive: pathname.startsWith('/decks') && !onSharedDecks,
      })
    }

    // The public catalog is open to everyone, signed in or not.
    items.push({
      title: t('term.deck-sharing'),
      href: '/decks/shared',
      isActive: onSharedDecks,
    })

    if (isLoggedIn) {
      items.push(
        {
          title: t('term.tags'),
          href: '/tags',
          isActive: pathname.startsWith('/tags'),
        },
        {
          title: t('statistics.title'),
          href: '/statistics',
          isActive: pathname.startsWith('/statistics'),
        },
      )
    }

    return items
  }, [t, pathname, isLoggedIn])

  return {
    navMenu,
  }
}
