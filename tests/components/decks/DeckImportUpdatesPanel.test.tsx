import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const syncImportedDeckAction = vi.hoisted(() => vi.fn())
const toast = vi.hoisted(() => vi.fn())

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('@/lib/ui', () => ({ showSuccessToast: toast }))
vi.mock('@/modules/deck-sharing/deck-sharing.action', () => ({ syncImportedDeckAction }))
vi.mock('@/components/app/AppButton', async () => ({ default: (await import('../../helpers/heroui')).AppButtonMock }))
vi.mock('@/components/app/AppError', () => ({ default: () => null }))

import DeckImportUpdatesPanel from '@/components/decks/DeckImportUpdatesPanel'

const updates = {
  source_version: 1,
  latest_version: 2,
  added_facts: [],
  removed_facts: [],
  edited_facts: [],
  media_changes: [],
  card_template_changes: [],
  change_summary: '',
} as never

describe('DeckImportUpdatesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('syncs on the deck page without a callback', async () => {
    syncImportedDeckAction.mockResolvedValue({ success: true, data: { sourceVersion: 2 } })
    render(<DeckImportUpdatesPanel deckId="i1" updates={updates} />)
    await act(async () => fireEvent.submit(document.querySelector('form')!))
    expect(toast).toHaveBeenCalledWith('sync-success')
    expect(screen.getByText('updates-title')).toBeTruthy()
    // A second sync (a fresh result) shows its toast too.
    syncImportedDeckAction.mockImplementation(async () => ({ success: true, data: { sourceVersion: 3 } }))
    await act(async () => fireEvent.submit(document.querySelector('form')!))
    expect(toast).toHaveBeenCalledTimes(2)
  })
})
