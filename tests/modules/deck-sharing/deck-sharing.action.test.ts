import { beforeEach, describe, expect, it, vi } from 'vitest'

const publishDeckServiceMock = vi.fn()
const getPublishPreviewServiceMock = vi.fn()
const getDeckImportUpdatesServiceMock = vi.fn()

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async (ns: string) => (key: string) => `${ns}.${key}`),
}))
vi.mock('@/modules/deck-sharing/deck-sharing.service', () => ({
  importDeckService: vi.fn(),
  publishDeckService: (...args: unknown[]) => publishDeckServiceMock(...args),
  syncImportedDeckService: vi.fn(),
  getPublishPreviewService: (...args: unknown[]) => getPublishPreviewServiceMock(...args),
  getDeckImportUpdatesService: (...args: unknown[]) => getDeckImportUpdatesServiceMock(...args),
}))

import {
  getDeckImportUpdatesAction,
  getPublishPreviewAction,
  publishDeckAction,
} from '@/modules/deck-sharing/deck-sharing.action'

describe('sharing sheet loaders', () => {
  it('getPublishPreviewAction returns the preview or the error', async () => {
    getPublishPreviewServiceMock.mockResolvedValueOnce({ success: true, data: { has_unpublished_changes: true } })
    expect(await getPublishPreviewAction('d1')).toEqual({ success: true, data: { has_unpublished_changes: true } })
    getPublishPreviewServiceMock.mockResolvedValueOnce({ success: false, message: 'nope' })
    expect(await getPublishPreviewAction('d1')).toEqual({ success: false, error: 'nope' })
  })

  it('getDeckImportUpdatesAction returns the updates or the error', async () => {
    getDeckImportUpdatesServiceMock.mockResolvedValueOnce({ success: true, data: { latest_version: 2 } })
    expect(await getDeckImportUpdatesAction('i1')).toEqual({ success: true, data: { latest_version: 2 } })
    getDeckImportUpdatesServiceMock.mockResolvedValueOnce({ success: false, message: 'gone' })
    expect(await getDeckImportUpdatesAction('i1')).toEqual({ success: false, error: 'gone' })
  })
})

describe('publishDeckAction errors', () => {
  beforeEach(() => {
    publishDeckServiceMock.mockReset()
  })

  it('shows the verify-email message when the backend requires a verified email', async () => {
    publishDeckServiceMock.mockResolvedValue({
      success: false,
      message: 'Email verification required',
      status: 403,
      code: 'email_not_verified',
    })
    const state = await publishDeckAction({ deckId: 'deck-1', currentVersion: 0 }, null, new FormData())
    expect(state).toMatchObject({ success: false, error: 'auth.emailNotVerifiedError' })
  })

  it('keeps the backend message for other failures', async () => {
    publishDeckServiceMock.mockResolvedValue({ success: false, message: 'Deck has no facts', status: 400 })
    const state = await publishDeckAction({ deckId: 'deck-1', currentVersion: 0 }, null, new FormData())
    expect(state).toMatchObject({ success: false, error: 'Deck has no facts' })
  })
})
