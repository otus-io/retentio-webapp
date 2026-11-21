import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('@/lib/ui', () => ({ showFailToast: vi.fn(), showSuccessToast: vi.fn() }))
vi.mock('@/modules/contributions/contributions.action', () => ({ submitDeckContributionsBatchAction: vi.fn() }))
vi.mock('@/components/app/AppInput', () => ({
  default: (p: { label: string, value: string, isReadOnly?: boolean, onChange?: (v: string) => void }) => (
    <input aria-label={p.label} value={p.value} readOnly={p.isReadOnly} onChange={(e) => p.onChange?.(e.target.value)} />
  ),
}))
vi.mock('@/components/app/AppButton', () => ({
  default: (p: { children?: ReactNode, onPress?: () => void, isDisabled?: boolean, 'aria-label'?: string }) => (
    <button type="button" aria-label={p['aria-label']} onClick={p.onPress} disabled={p.isDisabled}>{p.children}</button>
  ),
}))

import { ContributionFormModal } from '@/components/decks/DeckContributionsPanel'
import type { PendingDeckContribution } from '@/modules/contributions/contributions.schema'
import type { Deck } from '@/modules/decks/decks.schema'

const deck = { id: 'i1', fields: ['Word', 'Meaning'], description: 'Author summary' } as Deck

function open(kind: 'field_rename' | 'deck_tags' | 'description_edit', existing?: PendingDeckContribution, d = deck) {
  const onSave = vi.fn()
  render(<ContributionFormModal deck={d} kind={kind} existing={existing} onClose={vi.fn()} onSave={onSave} />)
  const save = screen.getByRole('button', { name: 'common.save' }) as HTMLButtonElement
  // The mocked translator drops the field number, so per-field labels repeat: target the first.
  const type = (label: string, value: string) =>
    fireEvent.change(screen.getAllByLabelText(label)[0], { target: { value } })
  return { onSave, save, type }
}

describe('ContributionFormModal', () => {
  afterEach(cleanup)

  it('suggests a new description with a note', () => {
    const { onSave, save, type } = open('description_edit')
    expect(screen.getByText('contributions.description-title')).toBeTruthy()
    expect((screen.getByLabelText('contributions.current-description') as HTMLInputElement).value).toBe('Author summary')
    expect(save.disabled).toBe(true)

    type('contributions.suggested-description', '  Author summary ')
    expect(save.disabled).toBe(true)
    type('contributions.suggested-description', '   ')
    expect(save.disabled).toBe(true)
    type('contributions.suggested-description', 'x'.repeat(501))
    expect(save.disabled).toBe(true)

    type('contributions.suggested-description', ` ${'y'.repeat(100)} `)
    type('contributions.message', ' clearer ')
    fireEvent.click(save)
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      id: 'description_edit',
      kind: 'description_edit',
      proposedDescription: 'y'.repeat(100),
      preview: `${'y'.repeat(79)}…`,
      message: 'clearer',
    }))
  })

  it('starts from an unsent suggestion and handles a deck without a description', () => {
    const existing = {
      id: 'description_edit',
      kind: 'description_edit',
      preview: 'Short',
      proposedDescription: 'Short',
      message: 'saved note',
      savedAt: 't',
    } as PendingDeckContribution
    const { onSave, save } = open('description_edit', existing, { ...deck, description: undefined })
    expect((screen.getByLabelText('contributions.current-description') as HTMLInputElement).value).toBe('—')
    expect((screen.getByLabelText('contributions.message') as HTMLInputElement).value).toBe('saved note')
    fireEvent.click(save)
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ preview: 'Short', message: 'saved note' }))
  })

  it('sends field renames and deck tags with the note, and leaves it out when empty', () => {
    const rename = open('field_rename')
    rename.type('contributions.suggested-field', 'Term')
    rename.type('contributions.message', 'labels')
    fireEvent.click(rename.save)
    expect(rename.onSave).toHaveBeenCalledWith(expect.objectContaining({ proposedFields: ['Term', 'Meaning'], message: 'labels' }))
    cleanup()

    const tags = open('deck_tags')
    tags.type('contributions.add-tags', 'verbs')
    fireEvent.click(tags.save)
    expect(tags.onSave.mock.calls[0][0]).not.toHaveProperty('message')
    expect(tags.onSave).toHaveBeenCalledWith(expect.objectContaining({ addTags: ['verbs'] }))
  })
})
