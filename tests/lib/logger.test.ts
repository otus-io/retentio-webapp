import { afterEach, describe, expect, it, vi } from 'vitest'

const pinoMock = vi.fn(() => ({
  info: vi.fn(),
  error: vi.fn(),
}))

vi.mock('pino', () => ({
  default: (...args: unknown[]) => pinoMock(...args),
}))

describe('logger', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
    pinoMock.mockClear()
  })

  it('uses pino-pretty outside production', async () => {
    vi.resetModules()
    vi.stubEnv('NODE_ENV', 'development')
    pinoMock.mockClear()

    const { logger } = await import('@/lib/logger')

    expect(pinoMock).toHaveBeenCalledWith({
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
        },
      },
    })
    expect(logger).toBe(pinoMock.mock.results[0]?.value)
  })

  it('omits the transport in production', async () => {
    vi.resetModules()
    vi.stubEnv('NODE_ENV', 'production')
    pinoMock.mockClear()

    await import('@/lib/logger')

    expect(pinoMock).toHaveBeenCalledWith({ transport: undefined })
  })
})
