import { describe, expect, it, vi } from 'vitest'
import { request } from '@/utils/request'
import { submitDescriptionContribution } from '@/api/contributions'

vi.mock('@/utils/request', () => ({ request: vi.fn() }))

describe('contributions api', () => {
  it('posts a description suggestion', () => {
    submitDescriptionContribution('i1', { proposed_description: 'New', message: 'why' })
    expect(request).toHaveBeenCalledWith('/api/decks/i1/contributions/description', {
      method: 'POST',
      body: JSON.stringify({ proposed_description: 'New', message: 'why' }),
    })
  })
})
