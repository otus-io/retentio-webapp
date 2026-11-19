import { beforeEach, describe, expect, it, vi } from 'vitest'

const publishDeckServiceMock = vi.fn()

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async (ns: string) => (key: string) => `${ns}.${key}`),
}))
vi.mock('@/modules/deck-sharing/deck-sharing.service', () => ({
  importDeckService: vi.fn(),
  publishDeckService: (...args: unknown[]) => publishDeckServiceMock(...args),
  syncImportedDeckService: vi.fn(),
}))

import { publishDeckAction } from '@/modules/deck-sharing/deck-sharing.action'

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
