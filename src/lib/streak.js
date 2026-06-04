/**
 * Calculates the current consecutive-day streak from an array of date strings.
 *
 * A streak increments for each calendar day (most recent first) where the gap
 * from the previous cursor position is ≤ 1 day. The cursor starts at `now`,
 * so a day with no entry today will show 0 even if yesterday has entries —
 * matching the intentional "you haven't done it today yet" UX.
 *
 * @param {string[]} dates - Array of "YYYY-MM-DD" strings (duplicates allowed).
 * @param {Date} now - Reference point for "today" (defaults to current time).
 * @returns {number}
 */
export function calculateStreak(dates, now = new Date()) {
  if (!dates.length) return 0
  const unique = [...new Set(dates)].sort().reverse()
  let count = 0
  let cursor = now
  for (const d of unique) {
    const diff = Math.round((cursor - new Date(d)) / 86400000)
    if (diff > 1) break
    count++
    cursor = new Date(d)
  }
  return count
}
