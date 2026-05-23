import { afterEach, describe, expect, it, vi } from 'vitest'
import { sleep } from './sleep'

describe('sleep', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('指定毫秒后 resolve', async () => {
    vi.useFakeTimers()
    const promise = sleep(1000)

    let resolved = false
    promise.then(() => {
      resolved = true
    })

    expect(resolved).toBe(false)
    vi.advanceTimersByTime(999)
    await Promise.resolve()
    expect(resolved).toBe(false)
    vi.advanceTimersByTime(1)
    await promise
    expect(resolved).toBe(true)

    vi.useRealTimers()
  })
})
