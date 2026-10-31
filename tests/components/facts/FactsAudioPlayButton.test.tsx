import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import FactsAudioPlayButton from '@/components/facts/FactsAudioPlayButton'

const mockGet = vi.fn()
const mockSet = vi.fn()
const mockGetMedia = vi.fn()
const mockResolveVersion = vi.fn()

vi.mock('@/lib/idb-cache', () => ({
  createBlobCache: () => ({
    get: (...args: unknown[]) => mockGet(...args),
    set: (...args: unknown[]) => mockSet(...args),
  }),
}))

vi.mock('@/api/media', () => ({
  getMedia: (...args: unknown[]) => mockGetMedia(...args),
  resolveImportedMediaVersion: (...args: unknown[]) => mockResolveVersion(...args),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: { name?: string }) => {
    if (key === 'common.play') return `Play ${params?.name ?? ''}`
    if (key === 'common.pause') return `Pause ${params?.name ?? ''}`
    if (key === 'term.audio') return 'Audio'
    return key
  },
}))

const audioInstances: MockAudio[] = []

class MockAudio {
  src = ''
  currentTime = 0
  onended: (() => void) | null = null
  play = vi.fn().mockResolvedValue(undefined)
  pause = vi.fn()

  constructor() {
    audioInstances.push(this)
  }
}

async function clickPlay(name = 'Play Audio') {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }))
  })
}

describe('FactsAudioPlayButton', () => {
  let OriginalAudio: typeof Audio

  beforeEach(() => {
    audioInstances.length = 0
    mockGet.mockReset()
    mockSet.mockReset()
    mockGetMedia.mockReset()
    mockResolveVersion.mockReset()
    OriginalAudio = globalThis.Audio
    globalThis.Audio = MockAudio as unknown as typeof Audio
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:cached')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    globalThis.Audio = OriginalAudio
    vi.restoreAllMocks()
  })

  it('renders play button with accessible label', () => {
    render(<FactsAudioPlayButton mediaId="audio-1" />)
    expect(screen.getByRole('button', { name: 'Play Audio' })).toBeDefined()
  })

  it('fetches media, caches it, and plays', async () => {
    const blob = new Blob(['x'], { type: 'audio/mpeg' })
    mockGet.mockResolvedValue(undefined)
    mockGetMedia.mockResolvedValue({ url: 'blob:fetched', blob })
    mockSet.mockResolvedValue(undefined)

    render(<FactsAudioPlayButton mediaId="audio-1" />)
    await clickPlay()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pause Audio' })).toBeDefined()
    })
    expect(mockGetMedia).toHaveBeenCalledWith('audio-1')
    expect(mockSet).toHaveBeenCalledWith('audio-1', blob)
    expect(audioInstances[0].src).toBe('blob:fetched')
    expect(audioInstances[0].play).toHaveBeenCalledTimes(2)
  })

  it('unlocks audio with silent wav before media fetch resolves', async () => {
    let resolveMedia!: (value: { url: string, blob: Blob }) => void
    mockGet.mockResolvedValue(undefined)
    mockGetMedia.mockImplementation(
      () => new Promise((resolve) => {
        resolveMedia = resolve
      }),
    )

    render(<FactsAudioPlayButton mediaId="audio-1" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Play Audio' }))
    })

    await waitFor(() => {
      expect(audioInstances).toHaveLength(1)
    })
    expect(audioInstances[0].src.startsWith('data:audio/wav')).toBe(true)
    expect(audioInstances[0].play).toHaveBeenCalled()
    expect(mockGetMedia).toHaveBeenCalledWith('audio-1')

    await act(async () => {
      resolveMedia({
        url: 'blob:fetched',
        blob: new Blob(['x'], { type: 'audio/mpeg' }),
      })
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pause Audio' })).toBeDefined()
    })
    expect(audioInstances[0].src).toBe('blob:fetched')
  })

  it('still plays after unlock play rejects', async () => {
    mockGet.mockResolvedValue(new Blob(['x'], { type: 'audio/mpeg' }))
    let playCalls = 0
    class UnlockFailAudio extends MockAudio {
      play = vi.fn().mockImplementation(() => {
        playCalls += 1
        if (playCalls === 1) return Promise.reject(new Error('unlock'))
        return Promise.resolve()
      })
    }
    globalThis.Audio = UnlockFailAudio as unknown as typeof Audio

    render(<FactsAudioPlayButton mediaId="audio-1" />)
    await clickPlay()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pause Audio' })).toBeDefined()
    })
    expect(playCalls).toBe(2)
  })

  it('downloads imported audio with the published snapshot version', async () => {
    const blob = new Blob(['x'], { type: 'audio/mpeg' })
    mockGet.mockResolvedValue(undefined)
    mockResolveVersion.mockResolvedValue(3)
    mockGetMedia.mockResolvedValue({ url: 'blob:fetched', blob })
    mockSet.mockResolvedValue(undefined)

    render(
      <FactsAudioPlayButton mediaId="audio-1" deckId="deck-1" factId="fact-1" imported />,
    )
    await clickPlay()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pause Audio' })).toBeDefined()
    })
    expect(mockResolveVersion).toHaveBeenCalledWith('deck-1', 'fact-1', 'audio-1')
    expect(mockGet).toHaveBeenCalledWith('audio-1:v3')
    expect(mockGetMedia).toHaveBeenCalledWith('audio-1', undefined, 3)
    expect(mockSet).toHaveBeenCalledWith('audio-1:v3', blob)
  })

  it('downloads imported audio without a version pin when none is published', async () => {
    const blob = new Blob(['x'], { type: 'audio/mpeg' })
    mockGet.mockResolvedValue(undefined)
    mockResolveVersion.mockResolvedValue(0)
    mockGetMedia.mockResolvedValue({ url: 'blob:fetched', blob })
    mockSet.mockResolvedValue(undefined)

    render(
      <FactsAudioPlayButton mediaId="audio-1" deckId="deck-1" factId="fact-1" imported />,
    )
    await clickPlay()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pause Audio' })).toBeDefined()
    })
    expect(mockGet).toHaveBeenCalledWith('audio-1')
    expect(mockGetMedia).toHaveBeenCalledWith('audio-1')
    expect(mockSet).toHaveBeenCalledWith('audio-1', blob)
  })

  it('uses cached blob when available', async () => {
    const blob = new Blob(['cached'], { type: 'audio/mpeg' })
    mockGet.mockResolvedValue(blob)

    render(<FactsAudioPlayButton mediaId="audio-1" />)
    await clickPlay()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pause Audio' })).toBeDefined()
    })
    expect(mockGetMedia).not.toHaveBeenCalled()
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
  })

  it('pauses when clicked while playing', async () => {
    mockGet.mockResolvedValue(new Blob(['x'], { type: 'audio/mpeg' }))

    render(<FactsAudioPlayButton mediaId="audio-1" />)
    await clickPlay()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pause Audio' })).toBeDefined()
    })

    await clickPlay('Pause Audio')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Play Audio' })).toBeDefined()
    })
    expect(audioInstances[0].pause).toHaveBeenCalled()
  })

  it('reuses object URL on second play', async () => {
    mockGet.mockResolvedValue(new Blob(['x'], { type: 'audio/mpeg' }))

    render(<FactsAudioPlayButton mediaId="audio-1" />)
    await clickPlay()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pause Audio' })).toBeDefined()
    })
    await clickPlay('Pause Audio')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Play Audio' })).toBeDefined()
    })

    mockGet.mockClear()
    ;(URL.createObjectURL as ReturnType<typeof vi.fn>).mockClear()

    await clickPlay()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pause Audio' })).toBeDefined()
    })
    expect(mockGet).not.toHaveBeenCalled()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('resets to play when audio ends', async () => {
    mockGet.mockResolvedValue(new Blob(['x'], { type: 'audio/mpeg' }))

    render(<FactsAudioPlayButton mediaId="audio-1" />)
    await clickPlay()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pause Audio' })).toBeDefined()
    })

    expect(audioInstances[0].onended).toBeTypeOf('function')
    act(() => {
      audioInstances[0].onended?.()
    })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Play Audio' })).toBeDefined()
    })
  })

  it('stops the previous player when another starts', async () => {
    mockGet.mockResolvedValue(new Blob(['x'], { type: 'audio/mpeg' }))

    const { unmount: unmountA } = render(<FactsAudioPlayButton mediaId="audio-a" />)
    await clickPlay()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pause Audio' })).toBeDefined()
    })

    const { unmount: unmountB } = render(<FactsAudioPlayButton mediaId="audio-b" />)
    const playB = screen.getAllByRole('button').find(
      (b) => b.getAttribute('aria-label') === 'Play Audio',
    )
    expect(playB).toBeDefined()
    await act(async () => {
      fireEvent.click(playB!)
    })

    await waitFor(() => {
      const labels = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))
      expect(labels.filter((l) => l === 'Pause Audio')).toHaveLength(1)
      expect(labels.filter((l) => l === 'Play Audio')).toHaveLength(1)
    })

    unmountA()
    unmountB()
  })

  it('handles play failure without staying in playing state', async () => {
    mockGet.mockResolvedValue(new Blob(['x'], { type: 'audio/mpeg' }))
    const playFail = vi.fn().mockRejectedValue(new Error('blocked'))
    class FailingAudio extends MockAudio {
      play = playFail
    }
    globalThis.Audio = FailingAudio as unknown as typeof Audio

    render(<FactsAudioPlayButton mediaId="audio-1" />)
    await clickPlay()

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: 'Play Audio' })
      expect(btn).toBeDefined()
      expect(btn.hasAttribute('disabled')).toBe(false)
    })
  })

  it('handles fetch failure without staying in playing state', async () => {
    mockGet.mockResolvedValue(undefined)
    mockGetMedia.mockRejectedValue(new Error('network'))

    render(<FactsAudioPlayButton mediaId="audio-1" />)
    await clickPlay()

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: 'Play Audio' })
      expect(btn).toBeDefined()
      expect(btn.hasAttribute('disabled')).toBe(false)
    })
  })

  it('revokes object URL on unmount', async () => {
    mockGet.mockResolvedValue(new Blob(['x'], { type: 'audio/mpeg' }))

    const { unmount } = render(<FactsAudioPlayButton mediaId="audio-1" />)
    await clickPlay()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pause Audio' })).toBeDefined()
    })

    unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:cached')
  })

  it('keeps mousedown from bubbling to the cell', () => {
    const onMouseDown = vi.fn()
    render(
      <div onMouseDown={onMouseDown}>
        <FactsAudioPlayButton mediaId="audio-1" />
      </div>,
    )
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Play Audio' }))
    expect(onMouseDown).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<FactsAudioPlayButton mediaId="audio-1" className="custom-class" />)
    expect(screen.getByRole('button').className).toContain('custom-class')
  })

  it('unmounts safely before any playback', () => {
    const { unmount } = render(<FactsAudioPlayButton mediaId="audio-1" />)
    unmount()
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })
})
