import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getDeckService = vi.fn()
const notFound = vi.fn(() => {
  throw new Error('NOT_FOUND')
})

vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
vi.mock('next/navigation', () => ({ notFound: () => notFound() }))
const getStudyTagsService = vi.fn()
vi.mock('@/modules/decks/decks.service', () => ({ getDeckService: (id: string) => getDeckService(id) }))
vi.mock('@/modules/cards/cards.service', () => ({ getStudyTagsService: (id: string) => getStudyTagsService(id) }))
vi.mock('@/components/study/StudySession', () => ({
  default: ({ deck, tags }: { deck: { id: string }, tags: { name: string }[] }) => (
    <div>study {deck.id} [{tags.map((t) => t.name).join(',')}]</div>
  ),
}))
vi.mock('@/components/qa/QaSession', () => ({ default: ({ deck }: { deck: { id: string } }) => <div>qa {deck.id}</div> }))
vi.mock('@/components/app/ClientOnly', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }))

import StudyPage, { generateMetadata as studyMeta } from '@/app/(default)/decks/[id]/study/page'
import QaPage, { generateMetadata as qaMeta } from '@/app/(default)/decks/[id]/qa/page'

const props = { params: Promise.resolve({ id: 'd1' }), searchParams: Promise.resolve({}) } as never

describe('study and qa pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('render the session for the deck', async () => {
    getDeckService.mockResolvedValue({ success: true, data: { id: 'd1' } })
    getStudyTagsService.mockResolvedValue({ success: true, data: { tags: [{ name: 'n5' }] } })
    render(await StudyPage(props))
    render(await QaPage(props))
    expect(screen.getByText('study d1 [n5]')).toBeTruthy()
    expect(screen.getByText('qa d1')).toBeTruthy()
  })

  it('studies without a filter when tags fail or are null', async () => {
    getDeckService.mockResolvedValue({ success: true, data: { id: 'd1' } })
    getStudyTagsService.mockResolvedValueOnce({ success: false }).mockResolvedValueOnce({ success: true, data: { tags: null } })
    render(await StudyPage(props))
    render(await StudyPage(props))
    expect(screen.getAllByText('study d1 []')).toHaveLength(2)
  })

  it('404 for a missing deck', async () => {
    getStudyTagsService.mockResolvedValue({ success: true, data: { tags: [] } })
    getDeckService.mockResolvedValue({ success: false })
    await expect(StudyPage(props)).rejects.toThrow('NOT_FOUND')
    await expect(QaPage(props)).rejects.toThrow('NOT_FOUND')
  })

  it('set titles', async () => {
    expect(await studyMeta()).toEqual({ title: 'study.title' })
    expect(await qaMeta()).toEqual({ title: 'qa.title' })
  })
})
