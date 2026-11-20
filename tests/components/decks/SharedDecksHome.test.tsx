import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/components/app/AppButton', async () => ({ default: (await import('../../helpers/heroui')).AppButtonMock }))
vi.mock('@/components/decks/SharedDecksCard', () => ({
  default: ({ deck }: { deck: { id: string } }) => <div>{deck.id}</div>,
}))
vi.mock('@/components/common/TablePagination', () => ({
  default: ({ totalPages }: { totalPages: number }) => <nav data-testid="pagination">{totalPages}</nav>,
}))

import SharedDecksHome from '@/components/decks/SharedDecksHome'

describe('SharedDecksHome', () => {
  it('shows paging only when the catalog has more than one page', () => {
    const { unmount } = render(<SharedDecksHome data={[{ id: 'a' }] as never} totalPages={3} />)
    expect(screen.getByTestId('pagination').textContent).toBe('3')
    unmount()
    render(<SharedDecksHome data={[{ id: 'a' }] as never} />)
    expect(screen.queryByTestId('pagination')).toBeNull()
  })
})
