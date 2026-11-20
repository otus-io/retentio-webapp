import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

const autoRefresh = vi.hoisted(() => vi.fn())

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('@/hooks/useAutoRefresh', () => ({ default: autoRefresh }))
const { Pass } = vi.hoisted(() => ({ Pass: ({ children }: { children: ReactNode }) => children }))
vi.mock('@/components/layout/LayoutPage', () => ({ default: Pass }))
vi.mock('@/components/app/AppLink', () => ({ default: Pass }))
vi.mock('@/components/app/AppTooltip', () => ({ default: Pass }))
vi.mock('@/components/decks/DecksSearch', () => ({ DecksSearch: () => null }))
vi.mock('@/components/decks/DeckCreateButton', () => ({ default: () => null }))
vi.mock('@/components/decks/DeckImportButton', () => ({ default: () => null }))
vi.mock('@/components/decks/DecksCard', () => ({
  default: ({ deck, sharing }: { deck: { id: string }, sharing?: unknown }) => (
    <div data-testid={`card-${deck.id}`}>{JSON.stringify(sharing ?? null)}</div>
  ),
}))

import DecksList from '@/components/decks/DecksList'
import type { Deck } from '@/modules/decks/decks.schema'

const decks = [{ id: 'd1', name: 'Spanish' }, { id: 'd2', name: 'French' }] as unknown as Deck[]

describe('DecksList', () => {
  it('gives each card its sharing badges and re-checks them every minute', () => {
    render(<DecksList data={decks} sharing={{ d1: { flash: true, openContributions: false } }} />)
    expect(screen.getByTestId('card-d1').textContent).toBe('{"flash":true,"openContributions":false}')
    expect(screen.getByTestId('card-d2').textContent).toBe('null')
    expect(autoRefresh).toHaveBeenCalledWith({ interval: 60_000 })
  })

  it('works without sharing data', () => {
    render(<DecksList data={decks} />)
    expect(screen.getByTestId('card-d1').textContent).toBe('null')
  })
})
