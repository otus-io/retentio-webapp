import type { Messages } from 'next-intl'

type NestedKeyOf<T, Prefix extends string = ''> = {
  [K in Extract<keyof T, string>]: T[K] extends Record<string, unknown>
    ? NestedKeyOf<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`
}[Extract<keyof T, string>]

export type MessageKey = NestedKeyOf<Messages>

export interface SidebarNavItem {
  titleKey: MessageKey
  href?: string
  items?: SidebarNavItem[]
}

export const guideSidebarConfig: SidebarNavItem[] = [
  {
    titleKey: 'guide-sidebar.guide',
    href: '/guide',
  },
  {
    titleKey: 'guide-sidebar.background',
    items: [
      { titleKey: 'guide-sidebar.what-is-retentio', href: '/guide/background/what-is-retentio' },
      { titleKey: 'guide-sidebar.read-more', href: '/guide/background/read-more' },
    ],
  },
  {
    titleKey: 'guide-sidebar.key-concepts',
    items: [
      { titleKey: 'guide-sidebar.overview', href: '/guide/key-concepts/overview' },
      { titleKey: 'guide-sidebar.decks', href: '/guide/key-concepts/decks' },
      { titleKey: 'guide-sidebar.facts', href: '/guide/key-concepts/facts' },
      { titleKey: 'guide-sidebar.cards', href: '/guide/key-concepts/cards' },
      { titleKey: 'guide-sidebar.tags', href: '/guide/key-concepts/tags' },
    ],
  },
  {
    titleKey: 'guide-sidebar.get-started',
    items: [
      { titleKey: 'guide-sidebar.login-registration', href: '/guide/get-started/login-registration' },
      { titleKey: 'guide-sidebar.create-your-deck', href: '/guide/get-started/create-your-deck' },
      { titleKey: 'guide-sidebar.import-an-existing-deck', href: '/guide/get-started/import-an-existing-deck' },
      { titleKey: 'guide-sidebar.start-studying', href: '/guide/get-started/start-studying' },
    ],
  },
]
