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
    titleKey: 'guide-sidebar.platform-notes',
    href: '/guide/platform-notes/index',
  },
  {
    titleKey: 'guide-sidebar.getting-started',
    items: [
      { titleKey: 'guide-sidebar.key-concepts', href: '/guide/getting-started/key-concepts' },
      { titleKey: 'guide-sidebar.decks', href: '/guide/getting-started/decks' },
      { titleKey: 'guide-sidebar.cards', href: '/guide/getting-started/cards' },
      { titleKey: 'guide-sidebar.facts', href: '/guide/getting-started/facts' },
      { titleKey: 'guide-sidebar.field-image-and-audio', href: '/guide/getting-started/field-image-and-audio' },
      { titleKey: 'guide-sidebar.login-registration', href: '/guide/getting-started/login-registration' },
    ],
  },
  {
    titleKey: 'guide-sidebar.studying',
    items: [
      { titleKey: 'guide-sidebar.how-to-start', href: '/guide/studying/how-to-start' },
      { titleKey: 'guide-sidebar.show-answer', href: '/guide/studying/show-answer' },
      { titleKey: 'guide-sidebar.hard-or-easy', href: '/guide/studying/hard-or-easy' },
    ],
  },
  {
    titleKey: 'guide-sidebar.adding-editing',
    items: [
      { titleKey: 'guide-sidebar.create-decks', href: '/guide/adding-editing/create-decks' },
      { titleKey: 'guide-sidebar.deck-name', href: '/guide/adding-editing/deck-name' },
      { titleKey: 'guide-sidebar.add-fields', href: '/guide/adding-editing/add-fields' },
      { titleKey: 'guide-sidebar.frequency-of-introduce-a-new-card', href: '/guide/adding-editing/frequency-of-introduce-a-new-card' },
      { titleKey: 'guide-sidebar.edit-decks', href: '/guide/adding-editing/edit-decks' },
      { titleKey: 'guide-sidebar.delete-decks', href: '/guide/adding-editing/delete-decks' },
      { titleKey: 'guide-sidebar.add-facts', href: '/guide/adding-editing/add-facts' },
      { titleKey: 'guide-sidebar.edit-facts', href: '/guide/adding-editing/edit-facts' },
      { titleKey: 'guide-sidebar.hide-cards-delete-cards', href: '/guide/adding-editing/hide-cards-delete-cards' },
    ],
  },
  {
    titleKey: 'guide-sidebar.importing',
    items: [
      { titleKey: 'guide-sidebar.importing-from-the-web', href: '/guide/importing/importing-from-the-web' },
      { titleKey: 'guide-sidebar.supported-format', href: '/guide/importing/supported-format' },
    ],
  },
  {
    titleKey: 'guide-sidebar.profile',
    items: [
      { titleKey: 'guide-sidebar.avatar-and-username', href: '/guide/profile/avatar-and-username' },
      { titleKey: 'guide-sidebar.change-language', href: '/guide/profile/change-language' },
      { titleKey: 'guide-sidebar.change-theme', href: '/guide/profile/change-theme' },
      { titleKey: 'guide-sidebar.logout', href: '/guide/profile/logout' },
    ],
  },
]
