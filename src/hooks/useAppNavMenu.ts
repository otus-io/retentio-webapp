import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

export interface IAppNavMenu {
  title: string
  href: string
  isActive?: boolean
}

export default function useAppNavMenu() {
  const t = useTranslations('nav')
  const pathname = usePathname()

  const navMenu = useMemo(() => {
    return [
      {
        title: t('guide'),
        href: '/guide',
        isActive: pathname.startsWith('/guide'),
      },
      {
        title: t('dashboard'),
        href: '/dashboard',
        isActive: pathname.startsWith('/dashboard'),
      },
      {
        title: t('library'),
        href: '/library',
        isActive: pathname.startsWith('/library'),
      },
    ] satisfies IAppNavMenu[]
  }, [t, pathname])

  return {
    navMenu,
  }
}
