import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }))
const actions = vi.hoisted(() => ({ acceptContributionAction: vi.fn(), updateContributionStatusAction: vi.fn() }))

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/decks/s1',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/lib/ui', () => ({ showFailToast: vi.fn(), showSuccessToast: vi.fn() }))
vi.mock('@/modules/contributions/contributions.action', () => actions)
vi.mock('@/components/app/AppButton', async () => ({ default: (await import('../../helpers/heroui')).AppButtonMock }))
// Tabs switch through onSelectionChange and the table renders rows from a render prop.
vi.mock('@heroui/react', async () => {
  const base = (await import('../../helpers/heroui')).herouiMock()
  const sub = (name: string, overrides: Record<string, unknown>) => new Proxy(Reflect.get(base, name), {
    get: (target, key) => (typeof key === 'string' && key in overrides ? overrides[key] : Reflect.get(target, key)),
    apply: (target, thisArg, args) => (overrides.self as (...a: unknown[]) => unknown ?? target)(...args),
  })
  const Tabs = sub('Tabs', {
    self: ({ children, onSelectionChange }: { children: ReactNode, onSelectionChange: (k: string) => void }) => (
      <div>
        <button type="button" onClick={() => onSelectionChange('all')}>tab-all</button>
        <button type="button" onClick={() => onSelectionChange('open')}>tab-open</button>
        {children}
      </div>
    ),
  })
  const Table = sub('Table', {
    Body: ({ items, children }: { items: unknown[], children: (item: unknown) => ReactNode }) => (
      <div>{items.map((item, i) => <div key={i}>{children(item)}</div>)}</div>
    ),
  })
  return new Proxy(base, { get: (t, k) => (k === 'Tabs' ? Tabs : k === 'Table' ? Table : Reflect.get(t, k)) })
})

import DeckAuthorContributionsPanel from '@/components/decks/DeckAuthorContributionsPanel'

const contribution = { id: 'c1', status: 'open', type: 'fact_edit', reporter: 'ada', source_version: 2 }
const props = {
  deckId: 's1',
  contributions: [contribution] as never,
  selectedTab: 'open' as const,
  total: 1,
  loadFailed: false,
}

describe('DeckAuthorContributionsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('switches tabs through the URL on the deck page', () => {
    render(<DeckAuthorContributionsPanel {...props} />)
    fireEvent.click(screen.getByText('tab-open'))
    expect(router.replace).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('tab-all'))
    expect(router.replace).toHaveBeenCalledWith('/decks/s1?contributionStatus=all', { scroll: false })
  })

  it('refreshes the page after a change on the deck page', async () => {
    actions.acceptContributionAction.mockResolvedValue({ success: true })
    render(<DeckAuthorContributionsPanel {...props} />)
    await act(async () => fireEvent.click(screen.getAllByText('accept-proposal')[0]))
    expect(router.refresh).toHaveBeenCalled()
  })
})
