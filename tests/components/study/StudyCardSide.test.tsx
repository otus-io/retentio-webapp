import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/facts/FactsAudioPlayButton', () => ({ default: () => null }))
vi.mock('@/components/study/StudyCardMedia', () => ({
  default: ({ alt }: { alt: string }) => <span data-testid="media" data-alt={alt} />,
}))

import StudyCardSide from '@/components/study/StudyCardSide'
import type { CardEntry } from '@/modules/cards/cards.schema'

describe('StudyCardSide', () => {
  it('shows ruby above the text and keeps the markup out of alt text', () => {
    const entries = [
      { text: '[[猫|ねこ]]がいる', image: '/api/media/m1' },
      { image: '/api/media/m2' },
    ] as CardEntry[]
    const { container } = render(<StudyCardSide entries={entries} deckId="d1" factId="f1" imported={false} />)
    expect(container.querySelector('ruby')!.outerHTML).toBe('<ruby>猫<rt>ねこ</rt></ruby>')
    expect([...container.querySelectorAll('[data-testid="media"]')].map((m) => m.getAttribute('data-alt')))
      .toEqual(['猫がいる', ''])
  })
})
