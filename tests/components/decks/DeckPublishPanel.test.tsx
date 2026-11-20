import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => values ? `${key}:${JSON.stringify(values)}` : key,
  useFormatter: () => ({ dateTime: () => 'date' }),
}))
vi.mock('@/components/app/AppButton', async () => ({ default: (await import('../../helpers/heroui')).AppButtonMock }))
vi.mock('@/components/app/AppError', () => ({ default: () => null }))
vi.mock('@/modules/deck-sharing/deck-sharing.action', () => ({ publishDeckAction: vi.fn() }))
vi.mock('@/lib/ui', () => ({ showSuccessToast: vi.fn() }))

import DeckPublishPanel from '@/components/decks/DeckPublishPanel'
import type { PublishPreview } from '@/modules/deck-sharing/deck-sharing.schema'
import type { Deck } from '@/modules/decks/decks.schema'

const deck = { id: 'd1', published_version: 2, updated_at: '2026-01-01T00:00:00Z' } as Deck
const empty: PublishPreview = {
  published_version: 2,
  has_unpublished_changes: false,
  facts: { added: 0, edited: 0, removed: 0 },
  media: { added: 0, updated: 0, deleted: 0 },
  tags: { deck: { added: 0, removed: 0 }, facts: { added: 0, removed: 0, facts_changed: 0 } },
  card_templates_changed: 0,
  meta_changed: false,
}

const republish = () => screen.getAllByText('republish')[0] as HTMLButtonElement

describe('DeckPublishPanel preview', () => {
  it('disables republishing when nothing changed', () => {
    render(<DeckPublishPanel deck={deck} preview={empty} />)
    expect(screen.getByText('preview-no-changes')).toBeTruthy()
    expect(republish().disabled).toBe(true)
  })

  it('summarizes unpublished changes', () => {
    render(
      <DeckPublishPanel
        deck={deck}
        preview={{
          ...empty,
          has_unpublished_changes: true,
          facts: { added: 1, edited: 2, removed: 0 },
          tags: { deck: { added: 1, removed: 0 }, facts: { added: 2, removed: 0, facts_changed: 1 } },
          card_templates_changed: 1,
          meta_changed: true,
        }}
      />,
    )
    expect(screen.getByText('preview-has-changes')).toBeTruthy()
    expect(screen.getByText('preview-facts:{"added":1,"edited":2,"removed":0}')).toBeTruthy()
    expect(screen.queryByText(/preview-media/)).toBeNull()
    expect(screen.getByText('preview-tags:{"count":3}')).toBeTruthy()
    expect(screen.getByText('preview-templates:{"count":1}')).toBeTruthy()
    expect(screen.getByText('preview-meta')).toBeTruthy()
    expect(republish().disabled).toBe(false)
  })

  it('lists media changes alone', () => {
    render(<DeckPublishPanel deck={deck} preview={{ ...empty, has_unpublished_changes: true, media: { added: 0, updated: 1, deleted: 0 } }} />)
    expect(screen.getByText('preview-media:{"added":0,"edited":1,"removed":0}')).toBeTruthy()
    expect(screen.queryByText(/preview-tags|preview-templates|preview-meta/)).toBeNull()
  })

  it('works without a preview', () => {
    render(<DeckPublishPanel deck={deck} />)
    expect(republish().disabled).toBe(false)
    expect(screen.queryByText(/preview-/)).toBeNull()
  })
})
