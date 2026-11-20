import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => values ? `${key}:${JSON.stringify(values)}` : key,
  useFormatter: () => ({
    number: (v: number) => String(v),
    dateTime: (d: Date, o: { weekday?: string }) => (o.weekday ? `wd${d.getUTCDay()}` : d.toISOString().slice(0, 10)),
  }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/components/app/AppSelect', async () => ({ default: (await import('../../helpers/heroui')).AppSelectMock }))
vi.mock('@/components/app/AppError', () => ({ default: ({ error }: { error: string }) => <div data-testid="error">{error}</div> }))
vi.mock('@/components/layout/LayoutPage', () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }))

import StatisticsPanel from '@/components/statistics/StatisticsPanel'
import { summarizeReviewDays } from '@/modules/cards/cards.schema'

const decks = [{ id: 'd1', name: 'Spanish' }]

describe('StatisticsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders tiles, daily bars and weekdays', () => {
    const summary = summarizeReviewDays([[{ day: '20260906', count: 4 }, { day: '20260907', count: 0 }]])
    const { container } = render(<StatisticsPanel decks={decks} deckId={null} days={7} summary={summary} />)
    expect(screen.getByText('period-reviews')).toBeTruthy()
    expect(screen.getByText('2026-09-06: reviews-count:{"count":4}')).toBeTruthy()
    expect(screen.getByText('wd0')).toBeTruthy()
    expect(screen.getByText('utc-note')).toBeTruthy()
    expect(container.querySelectorAll('[style*="height"]')).toHaveLength(2)
  })

  it('says when there is no activity', () => {
    render(<StatisticsPanel decks={decks} deckId="d1" days={30} summary={summarizeReviewDays([])} />)
    expect(screen.getByText('no-activity')).toBeTruthy()
  })

  it('navigates when the deck or range changes', () => {
    render(<StatisticsPanel decks={decks} deckId="d1" days={30} summary={summarizeReviewDays([])} />)
    const [deckSelect, rangeSelect] = screen.getAllByRole('combobox')
    fireEvent.change(rangeSelect, { target: { value: '90' } })
    expect(push).toHaveBeenLastCalledWith('/statistics?deck=d1&days=90')
    fireEvent.change(deckSelect, { target: { value: '__all__' } })
    expect(push).toHaveBeenLastCalledWith('/statistics?days=30')
    fireEvent.change(deckSelect, { target: { value: 'd1' } })
    expect(push).toHaveBeenLastCalledWith('/statistics?deck=d1&days=30')
  })

  it('warns about partial data', () => {
    render(<StatisticsPanel decks={decks} deckId={null} days={30} summary={summarizeReviewDays([])} partial />)
    expect(screen.getByTestId('error').textContent).toBe('partial-load')
  })

  it('shows empty and error states', () => {
    const { unmount } = render(<StatisticsPanel decks={[]} deckId={null} days={30} summary={null} />)
    expect(screen.getByText('no-decks')).toBeTruthy()
    expect(screen.queryByTestId('error')).toBeNull()
    unmount()
    render(<StatisticsPanel decks={decks} deckId={null} days={30} summary={null} />)
    expect(screen.getByTestId('error').textContent).toBe('load-failed')
  })
})
