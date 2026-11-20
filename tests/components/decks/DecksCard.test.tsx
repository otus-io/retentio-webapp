import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()

// The real Card forwards div props such as onClick; the shared mock drops them.
vi.mock('@heroui/react', async () => {
  const base = (await import('../../helpers/heroui')).herouiMock()
  const CardMock = ({ children, onClick }: { children: ReactNode, onClick: () => void }) => (
    <div onClick={onClick}>{children}</div>
  )
  return new Proxy(base, { get: (target, key) => (key === 'Card' ? CardMock : Reflect.get(target, key)) })
})
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useFormatter: () => ({ number: (v: number) => `n${v}` }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/components/app/AppLink', () => ({
  default: ({ children, href, onClick }: { children: ReactNode, href: string, onClick: (e: unknown) => void }) => (
    <a href={href} onClick={(e) => { e.preventDefault(); onClick(e) }}>{children}</a>
  ),
}))
vi.mock('@/components/decks/DecksAction', () => ({
  default: ({ actions }: { actions: string[] }) => <button type="button">{actions.join(',')}</button>,
}))

import DecksCard from '@/components/decks/DecksCard'
import type { Deck } from '@/modules/decks/decks.schema'

const stats = { cards_count: 400, unseen_cards: 399, due_cards: 12, facts_count: 200, total_reviews: 1500 }
const makeDeck = (over: Record<string, unknown> = {}) =>
  ({ id: 'd1', name: 'Spanish', visibility: 'private', stats, ...over }) as unknown as Deck

describe('DecksCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts studying from the card or its name', () => {
    render(<DecksCard deck={makeDeck()} />)
    expect(screen.getByText('Spanish').closest('a')?.getAttribute('href')).toBe('/decks/d1/study')
    fireEvent.click(screen.getByText('Spanish'))
    expect(push).toHaveBeenCalledTimes(0)
    fireEvent.click(screen.getByText('common.total-reviews'))
    expect(push).toHaveBeenCalledWith('/decks/d1/study')
  })

  it('keeps menu clicks from starting a study session', () => {
    render(<DecksCard deck={makeDeck()} />)
    fireEvent.click(screen.getByText('details,facts,qa,edit,delete'))
    expect(push).not.toHaveBeenCalled()
  })

  it('shows stats and learned progress like the mobile app', () => {
    render(<DecksCard deck={makeDeck()} />)
    expect(screen.getByText('n1500')).toBeTruthy()
    expect(screen.getByText('n12').className).toContain('text-danger')
    expect(screen.getByText('n200')).toBeTruthy()
    expect(screen.getByText('1/400 (0.25%)')).toBeTruthy()
    expect(screen.queryByText('term.public')).toBeNull()
  })

  it('handles empty decks, missing totals and public decks', () => {
    const empty = { cards_count: 0, unseen_cards: 0, due_cards: 0, facts_count: 0 }
    render(<DecksCard deck={makeDeck({ visibility: 'public', stats: empty })} />)
    expect(screen.getAllByText('n0')).toHaveLength(3)
    expect(screen.getAllByText('n0')[1].className).toContain('text-muted')
    expect(screen.getByText('0/0 (0%)')).toBeTruthy()
    expect(screen.getByText('term.public')).toBeTruthy()
  })
})
