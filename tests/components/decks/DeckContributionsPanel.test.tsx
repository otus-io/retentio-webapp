import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

const showFailToast = vi.fn()
const showSuccessToast = vi.fn()

vi.mock('next-intl', () => ({
  useTranslations: (ns?: string) => (key: string, values?: { count?: number }) =>
    `${ns}.${key}${values?.count === undefined ? '' : `:${values.count}`}`,
}))
vi.mock('@/lib/ui', () => ({
  showFailToast: (...args: unknown[]) => showFailToast(...args),
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
}))
vi.mock('@/modules/contributions/contributions.action', () => ({
  submitDeckContributionsBatchAction: vi.fn(),
}))
vi.mock('@/components/app/AppInput', () => ({ default: () => null }))
vi.mock('@/components/app/AppTextarea', () => ({ default: () => null }))
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
  const TableContent = ({ children, onSelectionChange }: {
    children?: ReactNode
    onSelectionChange: (s: 'all' | Set<string>) => void
  }) => (
    <div>
      <button type="button" onClick={() => onSelectionChange('all')}>select all</button>
      <button type="button" onClick={() => onSelectionChange(new Set(['deck_tags']))}>select tags</button>
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

describe('DeckContributionsPanel proposals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value) },
    })
    localStorage.setItem(`retentio_pending_contribs_v2:${deck.id}`, JSON.stringify([pending]))
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  async function saveDeckTags() {
    const { container } = render(<DeckContributionsPanel deck={{ ...deck, fields: ['Word'] } as Deck} />)
    await screen.findByText('+a')
    fireEvent.click(container.querySelector('.lucide-tags')!.closest('button')!)
    fireEvent.click(container.querySelector('.lucide-check')!.closest('button')!)
  }

  it('sends a saved proposal to the author right away', async () => {
    vi.mocked(submitDeckContributionsBatchAction).mockResolvedValue({
      success: true,
      data: { submitted: [{ localId: 'deck_tags', kind: 'deck_tags', contributionId: 'c1' }], failed: [] },
    })
    await saveDeckTags()
    await waitFor(() => expect(showSuccessToast).toHaveBeenCalledWith('auto-send.sent'))
    expect(vi.mocked(submitDeckContributionsBatchAction).mock.calls[0][0].contributions)
      .toEqual([expect.objectContaining({ id: 'deck_tags', addTags: ['a'] })])
    expect(JSON.parse(localStorage.getItem(`retentio_pending_contribs_v2:${deck.id}`)!)).toEqual([])
  })

  it('opens the description suggestion form', async () => {
    const { container } = render(<DeckContributionsPanel deck={{ ...deck, fields: ['Word'] } as Deck} />)
    await screen.findByText('+a')
    fireEvent.click(container.querySelector('.lucide-file-text')!.closest('button')!)
    expect(screen.getByText('undefined.contributions.description-title')).toBeTruthy()
  })

  it('keeps a proposal pending when it cannot be sent', async () => {
    vi.mocked(submitDeckContributionsBatchAction).mockResolvedValue({ success: false, error: 'Offline' })
    await saveDeckTags()
    await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('auto-send.unsent'))
    expect(JSON.parse(localStorage.getItem(`retentio_pending_contribs_v2:${deck.id}`)!)).toHaveLength(1)
  })
})

describe('DeckContributionsPanel discard', () => {
  const rename = { id: 'field_rename', kind: 'field_rename', proposedFields: ['W'], preview: 'W', savedAt: '2026-01-01T00:00:00Z' }
  const key = `retentio_pending_contribs_v2:${deck.id}`

  beforeEach(() => {
    vi.clearAllMocks()
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, value: string) => { store.set(k, value) },
    })
    localStorage.setItem(key, JSON.stringify([pending, rename]))
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  async function discard(selectButton: string) {
    render(<DeckContributionsPanel deck={deck} />)
    await screen.findByText('+a')
    const discardButton = screen.getByRole('button', { name: 'outbox.discard-selected' })
    expect((discardButton as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getAllByRole('button', { name: selectButton })[0])
    fireEvent.click(discardButton)
  }

  it('drops every selected unsent contribution without sending it', async () => {
    await discard('select all')
    await waitFor(() => expect(screen.queryByText('+a')).toBeNull())
    expect(screen.queryByText('W')).toBeNull()
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual([])
    expect(showSuccessToast).toHaveBeenCalledWith('outbox.discarded:2')
    expect(submitDeckContributionsBatchAction).not.toHaveBeenCalled()
  })

  it('keeps the contributions that were not selected', async () => {
    await discard('select tags')
    await waitFor(() => expect(screen.queryByText('+a')).toBeNull())
    screen.getByText('W')
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual([rename])
    expect(showSuccessToast).toHaveBeenCalledWith('outbox.discarded:1')
  })
})
