import { act, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  getAllFactTags: vi.fn(),
  getFactTags: vi.fn(),
  associateTagToFact: vi.fn(),
  removeTagFromFact: vi.fn(),
}))
const failToast = vi.hoisted(() => vi.fn())
const sendToAuthor = vi.hoisted(() => vi.fn())
const h = vi.hoisted(() => ({
  group: {} as { onSelectionChange?: (keys: Set<string> | 'all') => void },
  form: {} as { onSuccess?: (tag: { id: string, name: string }) => void },
}))

vi.mock('@heroui/react', async () => {
  const base = (await import('../../helpers/heroui')).herouiMock() as Record<string, unknown>
  const TagGroup = Object.assign(
    (props: { children: ReactNode, onSelectionChange: (keys: Set<string> | 'all') => void }) => {
      h.group = props
      return <div>{props.children}</div>
    },
    { List: ({ children }: { children: ReactNode }) => <div>{children}</div> },
  )
  return new Proxy(base, { get: (target, key) => (key === 'TagGroup' ? TagGroup : target[key as string]), has: () => true })
})
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('@/api/tag', () => api)
vi.mock('@/lib/ui', () => ({ showFailToast: failToast }))
vi.mock('@/modules/contributions/auto-send', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  sendToAuthor,
}))
vi.mock('@/components/app/AppButton', async () => ({ default: (await import('../../helpers/heroui')).AppButtonMock }))
vi.mock('@/components/tags/TagFormModal', () => ({
  default: (props: typeof h.form) => {
    h.form = props
    return null
  },
}))

import FactsTagsModal from '@/components/facts/FactsTagsModal'
import type { Deck } from '@/modules/decks/decks.schema'
import type { Fact } from '@/modules/facts/facts.schema'

const tags = [{ id: 't1', name: 'verb' }, { id: 't2', name: 'noun' }, { id: 't3', name: 'food' }]
const imported = { id: 'd1', source_deck_id: 's1' } as unknown as Deck
const owned = { id: 'd1' } as unknown as Deck
const fact = (over: Partial<Fact> = {}) =>
  ({ id: 'f1', entries: [{ text: 'apple' }, { text: 'りんご' }], fields: [], tags: [], ...over }) as Fact

function renderModal(deck: Deck, f = fact()) {
  const props = { deck, fact: f, setIsOpen: vi.fn() }
  const view = render(<FactsTagsModal {...props} isOpen />)
  return {
    close: () => view.rerender(<FactsTagsModal {...props} isOpen={false} />),
  }
}

const loaded = () => waitFor(() => expect(screen.queryByRole('status')).toBeNull())
const select = (...ids: string[]) => act(() => h.group.onSelectionChange?.(new Set(ids)))
const settle = () => act(() => new Promise((r) => setTimeout(r, 0)))

describe('FactsTagsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getAllFactTags.mockResolvedValue({ data: { tags } })
    api.getFactTags.mockResolvedValue({ data: { tags: [tags[0]] } })
    api.associateTagToFact.mockResolvedValue({})
    api.removeTagFromFact.mockResolvedValue({})
    sendToAuthor.mockResolvedValue({ sent: 1, unsent: 0 })
  })

  it('saves each tag as it is picked or dropped', async () => {
    renderModal(owned)
    await loaded()
    select('t2')
    expect(api.associateTagToFact).toHaveBeenCalledWith('d1', 'f1', 't2')
    expect(api.removeTagFromFact).toHaveBeenCalledWith('d1', 'f1', 't1')
  })

  it('sends nothing to anyone on a deck of its own', async () => {
    const { close } = renderModal(owned)
    await loaded()
    select('t2')
    close()
    await settle()
    expect(sendToAuthor).not.toHaveBeenCalled()
  })

  it('on an imported deck, sends the tag changes by name once closed', async () => {
    const { close } = renderModal(imported)
    await loaded()
    select('t2', 't3')
    select('t2')
    close()
    await waitFor(() => expect(sendToAuthor).toHaveBeenCalledTimes(1))
    expect(sendToAuthor).toHaveBeenCalledWith('d1', [expect.objectContaining({
      id: 'fact_tags:f1',
      kind: 'fact_tags',
      preview: 'apple · りんご',
      addTags: ['noun'],
      removeTags: ['verb'],
    })])
    expect(failToast).not.toHaveBeenCalled()
  })

  it('re-sends the fact_add of a fact the importer added, which carries its tags', async () => {
    const { close } = renderModal(imported, fact({ local: true }))
    await loaded()
    select('t1', 't2')
    close()
    await waitFor(() => expect(sendToAuthor).toHaveBeenCalledWith('d1', [
      expect.objectContaining({ id: 'fact_add:f1', kind: 'fact_add', factId: 'f1' }),
    ]))
  })

  it('waits for the saves, and leaves out a tag that could not be saved', async () => {
    let fail!: () => void
    api.associateTagToFact.mockReturnValueOnce(new Promise((_, reject) => { fail = () => reject(new Error('x')) }))
    const { close } = renderModal(imported)
    await loaded()
    select('t1', 't2')
    close()
    await settle()
    expect(sendToAuthor).not.toHaveBeenCalled()
    await act(async () => fail())
    await settle()
    expect(failToast).toHaveBeenCalled()
    expect(sendToAuthor).not.toHaveBeenCalled()
  })

  it('keeps a tag whose removal could not be saved', async () => {
    api.removeTagFromFact.mockRejectedValueOnce(new Error('x'))
    const { close } = renderModal(imported)
    await loaded()
    select()
    close()
    await settle()
    expect(failToast).toHaveBeenCalled()
    expect(sendToAuthor).not.toHaveBeenCalled()
  })

  it('leaves out a tag it has no name for', async () => {
    api.getFactTags.mockResolvedValue({ data: { tags: [{ id: 'gone', name: 'gone' }] } })
    const { close } = renderModal(imported)
    await loaded()
    select()
    close()
    await settle()
    expect(sendToAuthor).not.toHaveBeenCalled()
  })

  it('includes a tag made in the dialog', async () => {
    const { close } = renderModal(imported)
    await loaded()
    act(() => h.form.onSuccess?.({ id: 't4', name: 'fruit' }))
    close()
    await waitFor(() => expect(sendToAuthor).toHaveBeenCalledWith('d1', [
      expect.objectContaining({ addTags: ['fruit'], removeTags: [] }),
    ]))
  })

  it('says so when the change cannot reach the author', async () => {
    sendToAuthor.mockResolvedValue({ sent: 0, unsent: 1 })
    const { close } = renderModal(imported)
    await loaded()
    select()
    close()
    await waitFor(() => expect(failToast).toHaveBeenCalledWith('auto-send.unsent'))
  })
})
