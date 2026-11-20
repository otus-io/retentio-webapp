import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getDeckService = vi.fn()
const notFound = vi.fn(() => {
  throw new Error('NOT_FOUND')
})

vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
vi.mock('next/navigation', () => ({ notFound: () => notFound() }))
vi.mock('@/modules/decks/decks.service', () => ({ getDeckService: (id: string) => getDeckService(id) }))
vi.mock('@/components/study/StudySession', () => ({ default: ({ deck }: { deck: { id: string } }) => <div>study {deck.id}</div> }))
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
    render(await StudyPage(props))
    render(await QaPage(props))
    expect(screen.getByText('study d1')).toBeTruthy()
    expect(screen.getByText('qa d1')).toBeTruthy()
  })

  it('404 for a missing deck', async () => {
    getDeckService.mockResolvedValue({ success: false })
    await expect(StudyPage(props)).rejects.toThrow('NOT_FOUND')
    await expect(QaPage(props)).rejects.toThrow('NOT_FOUND')
  })

  it('set titles', async () => {
    expect(await studyMeta()).toEqual({ title: 'study.title' })
    expect(await qaMeta()).toEqual({ title: 'qa.title' })
  })
})
