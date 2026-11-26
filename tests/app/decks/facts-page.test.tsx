import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const grid = vi.fn()
const services = vi.hoisted(() => ({
  getDeckService: vi.fn(),
  getFactsPageService: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
vi.mock('next/navigation', () => ({ notFound: services.notFound }))
vi.mock('@/modules/decks/decks.service', () => ({ getDeckService: services.getDeckService }))
vi.mock('@/modules/facts/facts.service', () => ({ getFactsPageService: services.getFactsPageService }))
vi.mock('@/components/facts/FactsGridPage', () => ({
  default: (props: unknown) => {
    grid(props)
    return null
  },
}))

import Page, { generateMetadata } from '@/app/(sheet)/decks/[id]/facts/page'

function props() {
  return { params: Promise.resolve({ id: 'd1' }), searchParams: Promise.resolve({}) } as never
}

describe('deck facts page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    services.getDeckService.mockResolvedValue({ success: true, data: { id: 'd1', fields: ['a'] } })
    services.getFactsPageService.mockResolvedValue({ success: true, data: { facts: [{ id: 'f1' }] }, meta: { total: 321 } })
  })

  it('renders the oldest 100 facts with the total', async () => {
    render(await Page(props()))
    expect(services.getFactsPageService).toHaveBeenCalledWith('d1', { limit: 100, offset: 0, sort: 'created_at' })
    expect(grid.mock.calls[0][0]).toMatchObject({ facts: [{ id: 'f1' }], total: 321 })
  })

  it('returns not found when the deck or facts fail to load', async () => {
    services.getDeckService.mockResolvedValueOnce({ success: false })
    await expect(Page(props())).rejects.toThrow('NEXT_NOT_FOUND')
    services.getFactsPageService.mockResolvedValueOnce({ success: false })
    await expect(Page(props())).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('sets the page title', async () => {
    expect(await generateMetadata()).toEqual({ title: 'term.decks' })
  })
})
