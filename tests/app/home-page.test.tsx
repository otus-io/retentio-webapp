import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const home = vi.fn()
const getDeckCatalogService = vi.hoisted(() => vi.fn())

vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
vi.mock('@/modules/deck-sharing/deck-sharing.service', () => ({ getDeckCatalogService }))
vi.mock('@/components/home/HomePage', () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}))
vi.mock('@/components/decks/SharedDecksHome', () => ({
  default: (props: unknown) => {
    home(props)
    return null
  },
}))

import Page from '@/app/(default)/(public)/page'

/** Renders the page and its async catalog section. */
async function renderPage(searchParams: Record<string, string>) {
  const page = await Page({ searchParams: Promise.resolve(searchParams) } as never)
  const section = page.props.children.props.children
  return render(await section.type(section.props))
}

describe('home page catalog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('pages through the public catalog six decks at a time', async () => {
    getDeckCatalogService.mockResolvedValue({ success: true, data: { decks: [{ id: 'a' }] }, meta: { total: 14 } })
    await renderPage({ page: '3' })
    expect(getDeckCatalogService).toHaveBeenCalledWith({ limit: 6, offset: 12 })
    expect(home).toHaveBeenLastCalledWith({ data: [{ id: 'a' }], totalPages: 3 })
  })

  it('falls back to the first page for invalid page numbers and a missing total', async () => {
    getDeckCatalogService.mockResolvedValue({ success: true, data: { decks: [] }, meta: {} })
    for (const page of ['0', '-2', 'abc', '1.5']) await renderPage({ page })
    await renderPage({})
    for (const call of getDeckCatalogService.mock.calls) expect(call[0]).toEqual({ limit: 6, offset: 0 })
    expect(home).toHaveBeenLastCalledWith({ data: [], totalPages: 0 })
  })

  it('hides the catalog when it fails to load', async () => {
    getDeckCatalogService.mockResolvedValue({ success: false, message: 'down' })
    const { container } = await renderPage({})
    expect(container.innerHTML).toBe('')
    expect(home).not.toHaveBeenCalled()
  })
})
