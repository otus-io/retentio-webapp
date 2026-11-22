import { describe, expect, it } from 'vitest'
import { getToken } from '@/lib/token.stub'

describe('token stub', () => {
  it('never exposes a token outside the react-server layer', async () => {
    await expect(getToken()).resolves.toBeNull()
  })
})
