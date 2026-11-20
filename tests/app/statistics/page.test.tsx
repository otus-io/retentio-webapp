import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const panel = vi.fn()
const getAllDecksService = vi.fn()
const getReviewsByDayService = vi.fn()

vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
vi.mock('@/components/statistics/StatisticsPanel', () => ({
  default: (props: unknown) => {
    panel(props)
    return null
  },
}))
vi.mock('@/components/app/AppError', () => ({ default: ({ error }: { error: string }) => <div>{error}</div> }))
vi.mock('@/modules/decks/decks.service', () => ({ getAllDecksService: () => getAllDecksService() }))
vi.mock('@/modules/cards/cards.service', () => ({
  getReviewsByDayService: (...a: unknown[]) => getReviewsByDayService(...a),
}))

import Page, { generateMetadata } from '@/app/(default)/statistics/page'

const props = (searchParams: Record<string, string>) => ({
  params: Promise.resolve({}),
  searchParams: Promise.resolve(searchParams),
}) as Parameters<typeof Page>[0]

const decks = [{ id: 'd1', name: 'A' }, { id: 'd2', name: 'B' }]
const series = (count: number) => ({ success: true, data: { days: [{ day: '20260906', count }] } })

describe('statistics page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAllDecksService.mockResolvedValue({ success: true, data: { decks } })
  })

  it('merges every deck over 30 days by default', async () => {
    getReviewsByDayService.mockResolvedValueOnce(series(2)).mockResolvedValueOnce(series(3))
    render(await Page(props({ days: '12', deck: 'nope' })))
    expect(getReviewsByDayService).toHaveBeenCalledWith('d1', 30)
    expect(getReviewsByDayService).toHaveBeenCalledWith('d2', 30)
    expect(panel.mock.calls[0][0]).toMatchObject({ deckId: null, days: 30, summary: { total: 5 }, partial: false })
  })

  it('loads one deck for a valid filter and range', async () => {
    getReviewsByDayService.mockResolvedValue(series(4))
    render(await Page(props({ days: '7', deck: 'd2' })))
    expect(getReviewsByDayService).toHaveBeenCalledTimes(1)
    expect(getReviewsByDayService).toHaveBeenCalledWith('d2', 7)
    expect(panel.mock.calls[0][0]).toMatchObject({ deckId: 'd2', days: 7, summary: { total: 4 } })
  })

  it('flags partial data when some decks fail', async () => {
    getReviewsByDayService.mockResolvedValueOnce(series(2)).mockResolvedValueOnce({ success: false })
    render(await Page(props({})))
    expect(panel.mock.calls[0][0]).toMatchObject({ summary: { total: 2 }, partial: true })
  })

  it('reports failure when no series loads', async () => {
    getReviewsByDayService.mockResolvedValue({ success: false })
    render(await Page(props({})))
    expect(panel.mock.calls[0][0]).toMatchObject({ summary: null })
  })

  it('shows an empty summary without decks', async () => {
    getAllDecksService.mockResolvedValue({ success: true, data: {} })
    render(await Page(props({})))
    expect(panel.mock.calls[0][0]).toMatchObject({ decks: [], summary: { total: 0 } })
  })

  it('shows an error when decks cannot be listed', async () => {
    getAllDecksService.mockResolvedValue({ success: false, message: 'down' })
    const { container } = render(await Page(props({})))
    expect(container.textContent).toBe('down')
  })

  it('sets the title', async () => {
    expect(await generateMetadata()).toEqual({ title: 'statistics.title' })
  })
})
