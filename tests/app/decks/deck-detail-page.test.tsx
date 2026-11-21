import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const detail = vi.fn()
const services = vi.hoisted(() => ({
  getDeckService: vi.fn(),
  getPublishPreviewService: vi.fn(),
  getDeckImportUpdatesService: vi.fn(),
  getContributionsService: vi.fn(),
}))

vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
vi.mock('next/navigation', () => ({ notFound: vi.fn() }))
vi.mock('@/modules/decks/decks.service', () => ({ getDeckService: services.getDeckService }))
vi.mock('@/modules/deck-sharing/deck-sharing.service', () => ({
  getPublishPreviewService: services.getPublishPreviewService,
  getDeckImportUpdatesService: services.getDeckImportUpdatesService,
}))
vi.mock('@/modules/contributions/contributions.service', () => ({ getContributionsService: services.getContributionsService }))
vi.mock('@/components/decks/DecksDetail', () => ({
  default: (props: unknown) => {
    detail(props)
    return null
  },
}))

import Page from '@/app/(default)/decks/[id]/page'

const props = { params: Promise.resolve({ id: 'd1' }), searchParams: Promise.resolve({}) } as never
const preview = { has_unpublished_changes: true }

describe('deck detail page publish preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    services.getContributionsService.mockResolvedValue({ success: true, data: { contributions: [] }, meta: { total: 0 } })
  })

  it('loads the preview for a published source deck', async () => {
    services.getDeckService.mockResolvedValue({ success: true, data: { id: 'd1', published_version: 1, visibility: 'private' } })
    services.getPublishPreviewService.mockResolvedValue({ success: true, data: preview })
    render(await Page(props))
    expect(services.getPublishPreviewService).toHaveBeenCalledWith('d1')
    expect(detail.mock.calls[0][0]).toMatchObject({ publishPreview: preview })
  })

  it('passes null when the preview fails', async () => {
    services.getDeckService.mockResolvedValue({ success: true, data: { id: 'd1', published_version: 1 } })
    services.getPublishPreviewService.mockResolvedValue({ success: false })
    render(await Page(props))
    expect(detail.mock.calls[0][0]).toMatchObject({ publishPreview: null })
  })

  it('skips the preview for unpublished and imported decks', async () => {
    services.getDeckService.mockResolvedValue({ success: true, data: { id: 'd1', published_version: 0 } })
    render(await Page(props))
    services.getDeckService.mockResolvedValue({ success: true, data: { id: 'd1', published_version: 3, source_deck_id: 's' } })
    services.getDeckImportUpdatesService.mockResolvedValue({ success: false })
    render(await Page(props))
    expect(services.getPublishPreviewService).not.toHaveBeenCalled()
  })
})
