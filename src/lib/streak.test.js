import { describe, it, expect } from 'vitest'
import { calculateStreak } from './streak'

// Fixed reference point: Jun 4 2026 at noon UTC.
// Using UTC noon avoids rounding edge cases at midnight since
// new Date("YYYY-MM-DD") parses as UTC midnight.
const NOW = new Date('2026-06-04T12:00:00.000Z')

describe('calculateStreak', () => {
  it('returns 0 for an empty date array', () => {
    expect(calculateStreak([], NOW)).toBe(0)
  })

  it('returns 1 when only today has activity', () => {
    expect(calculateStreak(['2026-06-04'], NOW)).toBe(1)
  })

  it('returns 2 for today and yesterday', () => {
    expect(calculateStreak(['2026-06-04', '2026-06-03'], NOW)).toBe(2)
  })

  it('counts a full consecutive week correctly', () => {
    const dates = ['2026-06-04', '2026-06-03', '2026-06-02', '2026-06-01', '2026-05-31', '2026-05-30', '2026-05-29']
    expect(calculateStreak(dates, NOW)).toBe(7)
  })

  it('stops counting at a gap in the streak', () => {
    // Jun 3 is missing — only today (Jun 4) counts
    expect(calculateStreak(['2026-06-04', '2026-06-02', '2026-06-01'], NOW)).toBe(1)
  })

  it('returns 0 when the most recent activity was yesterday but not today', () => {
    // The streak requires today to be present; yesterday alone resets the count
    expect(calculateStreak(['2026-06-03', '2026-06-02', '2026-06-01'], NOW)).toBe(0)
  })

  it('deduplicates dates and counts each calendar day once', () => {
    // Multiple log entries on the same day should not inflate the streak
    expect(calculateStreak(['2026-06-04', '2026-06-04', '2026-06-03', '2026-06-03'], NOW)).toBe(2)
  })

  it('returns 0 when all activity is from more than 1 day ago', () => {
    expect(calculateStreak(['2026-05-28', '2026-05-27', '2026-05-26'], NOW)).toBe(0)
  })

  it('handles dates supplied in non-sorted order', () => {
    // Should sort internally before counting
    expect(calculateStreak(['2026-06-02', '2026-06-04', '2026-06-03'], NOW)).toBe(3)
  })
})
