import { describe, expect, it } from 'vitest'
import {
  computeIntervalRange,
  intervalToUnit,
  parseMediaUrl,
  reviewDayToDate,
  summarizeReviewDays,
} from '@/modules/cards/cards.schema'

describe('computeIntervalRange', () => {
  it('floors an invalid window to 300 seconds', () => {
    expect(computeIntervalRange(1000, 500, 500)).toEqual({ min: 150, max: 1200, def: 600 })
  })

  it('uses fixed factors when overdue', () => {
    expect(computeIntervalRange(5000, 0, 1000)).toEqual({ min: 500, max: 4000, def: 2000 })
  })

  it('scales factors by urgency when not yet due', () => {
    // interval 1000, urgency 0.5
    expect(computeIntervalRange(500, 0, 1000)).toEqual({ min: 750, max: 2500, def: 1500 })
  })

  it('floors short intervals to 300 seconds (unseen marker)', () => {
    expect(computeIntervalRange(1301, 1000, 1001)).toEqual({ min: 150, max: 1200, def: 600 })
  })

  it('widens a degenerate range', () => {
    // urgency 0 → min = max = def = interval
    expect(computeIntervalRange(0, 0, 1000)).toEqual({ min: 1000, max: 4000, def: 1000 })
  })
})

describe('intervalToUnit', () => {
  it.each([
    [30, { value: 30, unit: 'second' }],
    [90, { value: 1.5, unit: 'minute' }],
    [7200, { value: 2, unit: 'hour' }],
    [86400 * 3, { value: 3, unit: 'day' }],
    [86400 * 45, { value: 1.5, unit: 'month' }],
    [86400 * 365 * 2, { value: 2, unit: 'year' }],
  ])('%i seconds', (seconds, expected) => {
    expect(intervalToUnit(seconds)).toEqual(expected)
  })
})

describe('parseMediaUrl', () => {
  it('extracts the id and snapshot version', () => {
    expect(parseMediaUrl('https://api.x/api/media/abc?v=3')).toEqual({ id: 'abc', version: 3 })
  })

  it('omits a missing or invalid version', () => {
    expect(parseMediaUrl('https://api.x/api/media/abc')).toEqual({ id: 'abc' })
    expect(parseMediaUrl('https://api.x/api/media/abc?v=x')).toEqual({ id: 'abc' })
  })

  it('treats a bare value as the id', () => {
    expect(parseMediaUrl('raw-id')).toEqual({ id: 'raw-id' })
  })
})

describe('summarizeReviewDays', () => {
  it('merges series by day and computes totals', () => {
    const summary = summarizeReviewDays([
      [{ day: '20260906', count: 2 }, { day: '20260907', count: 0 }],
      [{ day: '20260906', count: 1 }, { day: '20260907', count: 4 }],
    ])
    expect(summary.days).toEqual([{ day: '20260906', count: 3 }, { day: '20260907', count: 4 }])
    expect(summary.total).toBe(7)
    expect(summary.today).toBe(4)
    expect(summary.activeDays).toBe(2)
    expect(summary.average).toBe(3.5)
    // 2026-09-06 is a Sunday
    expect(summary.weekdays).toEqual([3, 4, 0, 0, 0, 0, 0])
  })

  it('handles no data', () => {
    expect(summarizeReviewDays([])).toEqual({
      days: [],
      total: 0,
      today: 0,
      activeDays: 0,
      average: 0,
      weekdays: [0, 0, 0, 0, 0, 0, 0],
    })
  })
})

describe('reviewDayToDate', () => {
  it('parses YYYYMMDD as UTC midnight', () => {
    expect(reviewDayToDate('20260102').toISOString()).toBe('2026-01-02T00:00:00.000Z')
  })
})
