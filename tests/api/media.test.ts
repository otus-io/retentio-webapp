import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __clearMediaVersionCache,
  resolveImportedMediaVersion,
} from '@/api/media'
import { getFact } from '@/api/facts'

vi.mock('@/api/facts', () => ({
  getFact: vi.fn(),
}))

vi.mock('@/utils/request', () => ({
  request: vi.fn(),
}))

describe('resolveImportedMediaVersion', () => {
  beforeEach(() => {
    __clearMediaVersionCache()
    vi.mocked(getFact).mockReset()
  })

  it('loads media_versions once and returns a positive pin', async () => {
    vi.mocked(getFact).mockResolvedValue({
      data: { media_versions: { 'audio-1': 3, 'img-1': 0 } },
    } as Awaited<ReturnType<typeof getFact>>)

    await expect(
      resolveImportedMediaVersion('deck-1', 'fact-1', 'audio-1'),
    ).resolves.toBe(3)
    await expect(
      resolveImportedMediaVersion('deck-1', 'fact-1', 'img-1'),
    ).resolves.toBeUndefined()
    expect(getFact).toHaveBeenCalledTimes(1)
  })

  it('coalesces concurrent misses into one getFact call', async () => {
    let resolveFact!: (value: Awaited<ReturnType<typeof getFact>>) => void
    vi.mocked(getFact).mockImplementation(
      () => new Promise((resolve) => {
        resolveFact = resolve
      }),
    )

    const first = resolveImportedMediaVersion('deck-1', 'fact-1', 'audio-1')
    const second = resolveImportedMediaVersion('deck-1', 'fact-1', 'audio-2')

    expect(getFact).toHaveBeenCalledTimes(1)

    resolveFact({
      data: { media_versions: { 'audio-1': 2, 'audio-2': 5 } },
    } as Awaited<ReturnType<typeof getFact>>)

    await expect(first).resolves.toBe(2)
    await expect(second).resolves.toBe(5)
    expect(getFact).toHaveBeenCalledTimes(1)
  })

  it('treats missing media_versions as an empty map', async () => {
    vi.mocked(getFact).mockResolvedValue({
      data: {},
    } as Awaited<ReturnType<typeof getFact>>)

    await expect(
      resolveImportedMediaVersion('deck-1', 'fact-1', 'audio-1'),
    ).resolves.toBeUndefined()
  })

  it('allows a retry after getFact fails', async () => {
    vi.mocked(getFact)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({
        data: { media_versions: { 'audio-1': 4 } },
      } as Awaited<ReturnType<typeof getFact>>)

    await expect(
      resolveImportedMediaVersion('deck-1', 'fact-1', 'audio-1'),
    ).rejects.toThrow('network')
    await expect(
      resolveImportedMediaVersion('deck-1', 'fact-1', 'audio-1'),
    ).resolves.toBe(4)
    expect(getFact).toHaveBeenCalledTimes(2)
  })
})
