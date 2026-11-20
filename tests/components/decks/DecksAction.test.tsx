import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/modules/decks/decks.action', () => ({ deleteDeckAction: vi.fn() }))
vi.mock('@/components/common/DeleteModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="delete-modal" /> : null),
}))

import DecksAction from '@/components/decks/DecksAction'
import type { Deck } from '@/modules/decks/decks.schema'

const deck = { id: 'd1', visibility: 'private' } as unknown as Deck

describe('DecksAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows only the requested items and opens the QA page', () => {
    render(<DecksAction deck={deck} actions={['facts', 'qa']} />)
    expect(screen.queryByText('common.edit')).toBeNull()
    expect(screen.queryByText('common.delete')).toBeNull()
    fireEvent.click(screen.getByText('qa.title'))
    expect(push).toHaveBeenCalledWith('/decks/d1/qa')
    fireEvent.click(screen.getByText('common.edit-facts'))
    expect(push).toHaveBeenLastCalledWith('/decks/d1/facts')
  })

  it('edits and confirms deletion', () => {
    render(<DecksAction deck={deck} actions={['edit', 'delete']} />)
    expect(screen.queryByText('qa.title')).toBeNull()
    fireEvent.click(screen.getByText('common.edit'))
    expect(push).toHaveBeenCalledWith('/decks/d1/edit')
    fireEvent.click(screen.getByText('common.delete'))
    expect(screen.getByTestId('delete-modal')).toBeTruthy()
  })
})
