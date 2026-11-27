import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: { count?: number }) =>
    values?.count === undefined ? key : `${key}:${values.count}`,
  useFormatter: () => ({ dateTime: () => 'date' }),
}))
vi.mock('@/components/layout/LayoutPage', () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }))
vi.mock('@/components/app/AppLink', () => ({ default: ({ children }: { children: ReactNode }) => <a>{children}</a> }))
vi.mock('@/components/app/AppButton', async () => ({ default: (await import('../../helpers/heroui')).AppButtonMock }))
vi.mock('@/components/app/AppButtonLink', () => ({
  AppButtonLink: ({ href, children }: { href: string, children: ReactNode }) => <a href={href}>{children}</a>,
}))
vi.mock('@/context/UserContext', () => ({ useUserContext: () => ({ isLogin: true, accessAction: vi.fn() }) }))
vi.mock('@/modules/deck-sharing/deck-sharing.action', () => ({ importDeckAction: vi.fn() }))

import SharedDecksDetail from '@/components/decks/SharedDecksDetail'
import type { DeckCatalogItem } from '@/modules/deck-sharing/deck-sharing.schema'

const deck: DeckCatalogItem = {
  id: 'src-1',
  name: 'N5',
  owner: 'alice',
  fields: [],
  published_version: 1,
  fact_count: 3,
  published_at: '2026-05-22T12:00:00Z',
}

describe('SharedDecksDetail', () => {
  it('shows the total import count, defaulting to zero', () => {
    const { unmount } = render(
      <SharedDecksDetail deck={{ ...deck, import_count: 42 }} importedDeckId={null} ownedDeckId={null} />,
    )
    expect(screen.getByText('deck-sharing.import-count:42')).toBeTruthy()
    unmount()

    render(<SharedDecksDetail deck={deck} importedDeckId={null} ownedDeckId={null} />)
    expect(screen.getByText('deck-sharing.import-count:0')).toBeTruthy()
  })
})
