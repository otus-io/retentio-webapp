import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

const publishPanel = vi.fn()

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('framer-motion', () => ({ motion: { div: ({ children }: { children?: ReactNode }) => <div>{children}</div> } }))
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useFormatter: () => ({ dateTime: () => 'date' }),
}))
vi.mock('@/hooks/useAutoRefresh', () => ({ default: () => {} }))
vi.mock('@/components/layout/LayoutPage', () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }))
vi.mock('@/components/app/AppButtonLink', () => ({
  AppButtonLink: ({ href, children }: { href: string, children: ReactNode }) => <a href={href}>{children}</a>,
}))
vi.mock('@/components/decks/DecksAction', () => ({
  default: ({ actions }: { actions: string[] }) => <span data-testid="deck-actions">{actions.join(',')}</span>,
}))
vi.mock('@/components/decks/DecksLabel', () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }))
vi.mock('@/components/tags/TagItem', () => ({ default: () => null }))
vi.mock('@/components/decks/DeckPublishPanel', () => ({
  default: (props: unknown) => {
    publishPanel(props)
    return null
  },
}))
vi.mock('@/components/decks/DeckImportUpdatesPanel', () => ({ default: () => null }))
vi.mock('@/components/decks/DeckContributionsPanel', () => ({ default: () => null }))
vi.mock('@/components/decks/DeckAuthorContributionsPanel', () => ({ default: () => null }))

import DecksDetail from '@/components/decks/DecksDetail'
import type { Deck } from '@/modules/decks/decks.schema'

const deck = {
  id: 'd1',
  name: 'Spanish',
  fields: [],
  rate: 1,
  stats: { cards_count: 0, reviewed_cards: 0, due_cards: 0, facts_count: 0, unseen_cards: 0, hidden_cards: 0, new_cards_today: 0 },
} as unknown as Deck

describe('DecksDetail', () => {
  it('links to study, offers QA in the menu and passes the publish preview', () => {
    const preview = { has_unpublished_changes: false } as never
    render(<DecksDetail deck={deck} updates={null} publishPreview={preview} authorContributions={null} />)
    expect(screen.getByText('study.start').closest('a')?.getAttribute('href')).toBe('/decks/d1/study')
    expect(screen.queryByText('qa.title')).toBeNull()
    expect(screen.getByTestId('deck-actions').textContent).toBe('facts,qa')
    expect(publishPanel.mock.calls[0][0]).toMatchObject({ preview })
  })
})
