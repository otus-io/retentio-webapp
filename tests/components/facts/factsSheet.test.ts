import { describe, expect, it } from 'vitest'
import { endScrollRow, FACTS_PAGE_SIZE, nextPageStart, sheetRowCount } from '@/components/facts/factsSheet'

describe('factsSheet', () => {
  it('ends the grid with the last three facts at the top, then empty rows filling the screen', () => {
    expect([0, 2, 3, 250].map((total) => sheetRowCount(total, 30))).toEqual([30, 30, 30, 277])
    // Always at least one empty row, even on a screen too short to fit four rows.
    expect(sheetRowCount(250, 2)).toBe(251)
  })

  it('scrolls the end into view three facts above the first empty row', () => {
    expect([0, 2, 3, 250].map(endScrollRow)).toEqual([0, 0, 0, 247])
  })

  describe('nextPageStart', () => {
    const unloaded = (...ranges: [number, number][]) => (i: number) => ranges.some(([a, b]) => i >= a && i < b)

    it('starts at the first unloaded row on screen', () => {
      expect(nextPageStart(unloaded([100, 450]), 480, 120)).toBe(100)
    })

    it('picks the nearest unloaded rows below or above the screen', () => {
      expect(nextPageStart(unloaded([100, 200], [600, 700]), 800, 550)).toBe(600)
      expect(nextPageStart(unloaded([100, 200], [600, 700]), 800, 250)).toBe(100)
    })

    it('widens back over unloaded rows above, at most one page', () => {
      expect(nextPageStart(unloaded([0, 1000]), 1000, 900)).toBe(900 - FACTS_PAGE_SIZE + 1)
    })

    it('returns null once every row is loaded', () => {
      expect(nextPageStart(unloaded(), 300, 0)).toBeNull()
      expect(nextPageStart(unloaded(), 0, 0)).toBeNull()
    })
  })
})
