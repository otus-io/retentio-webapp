import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

const showFailToast = vi.fn()

vi.mock('next-intl', () => ({
  useTranslations: (ns?: string) => (key: string, values?: { count?: number }) =>
    `${ns}.${key}${values?.count === undefined ? '' : `:${values.count}`}`,
}))
vi.mock('@/lib/ui', () => ({
  showFailToast: (...args: unknown[]) => showFailToast(...args),
  showSuccessToast: vi.fn(),
}))
vi.mock('@/modules/contributions/contributions.action', () => ({
  submitDeckContributionsBatchAction: vi.fn(),
}))
vi.mock('@/components/app/AppInput', () => ({ default: () => null }))
vi.mock('@/components/app/AppButton', () => ({
  default: ({ children, onPress, isDisabled }: { children?: ReactNode, onPress?: () => void, isDisabled?: boolean }) => (
    <button type="button" onClick={onPress} disabled={isDisabled}>{children}</button>
  ),
}))
interface PassProps { children?: ReactNode | ((item: unknown) => ReactNode), items?: unknown[] }

vi.mock('@heroui/react', () => {
  const Pass = ({ children, items }: PassProps) => (
    <div>{typeof children === 'function' ? items?.map((item) => children(item)) : children}</div>
  )
  const compound = new Proxy(Pass, { get: (target, prop) => (prop in target ? Reflect.get(target, prop) : Pass) })
  const TableContent = ({ children, onSelectionChange }: { children?: ReactNode, onSelectionChange: (s: 'all') => void }) => (
    <div>
      <button type="button" onClick={() => onSelectionChange('all')}>select all</button>
      {children}
    </div>
  )
  return {
    Card: compound,
    Checkbox: compound,
    Chip: Pass,
    EmptyState: Pass,
    Modal: compound,
    Tabs: compound,
    Table: new Proxy(Pass, {
      get: (target, prop) => (prop === 'Content' ? TableContent : prop in target ? Reflect.get(target, prop) : Pass),
    }),
  }
})

import { submitDeckContributionsBatchAction } from '@/modules/contributions/contributions.action'
import DeckContributionsPanel from '@/components/decks/DeckContributionsPanel'
import type { Deck } from '@/modules/decks/decks.schema'

const deck = { id: 'import-1' } as Deck
const pending = { id: 'deck_tags', kind: 'deck_tags', addTags: ['a'], removeTags: [], preview: '+a', savedAt: '2026-01-01T00:00:00Z' }

async function submitAll() {
  render(<DeckContributionsPanel deck={deck} />)
  await screen.findByText('+a')
  // The pending table renders first; the sent table also gets a mocked Table.Content.
  fireEvent.click(screen.getAllByRole('button', { name: 'select all' })[0])
  fireEvent.click(screen.getByRole('button', { name: /^contributions\.submit-selected/ }))
}

describe('DeckContributionsPanel batch failures', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value) },
    })
    localStorage.setItem(`retentio_pending_contribs_v2:${deck.id}`, JSON.stringify([pending]))
  })

  it('asks the user to verify their email when the backend requires it', async () => {
    vi.mocked(submitDeckContributionsBatchAction).mockResolvedValue({
      success: true,
      data: { submitted: [], failed: [{ localId: 'deck_tags', error: 'Email verification required', code: 'email_not_verified' }] },
    })
    await submitAll()
    await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('auth.emailNotVerifiedError'))
    expect(showFailToast).toHaveBeenCalledTimes(1)
  })

  it('reports the failure count for other errors', async () => {
    vi.mocked(submitDeckContributionsBatchAction).mockResolvedValue({
      success: true,
      data: { submitted: [], failed: [{ localId: 'deck_tags', error: 'boom' }] },
    })
    await submitAll()
    await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('contributions.batch-submit-failed:1'))
    expect(showFailToast).not.toHaveBeenCalledWith('auth.emailNotVerifiedError')
  })

  it('reports other failures alongside the verify-email message', async () => {
    vi.mocked(submitDeckContributionsBatchAction).mockResolvedValue({
      success: true,
      data: {
        submitted: [],
        failed: [
          { localId: 'deck_tags', error: 'Email verification required', code: 'email_not_verified' },
          { localId: 'field_rename', error: 'boom' },
        ],
      },
    })
    await submitAll()
    await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('auth.emailNotVerifiedError'))
    expect(showFailToast).toHaveBeenCalledWith('contributions.batch-submit-failed:1')
  })
})
