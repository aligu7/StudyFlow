/**
 * Get today's date as YYYY-MM-DD string in LOCAL timezone (not UTC).
 *
 * Using `new Date().toISOString().split('T')[0]` gives the UTC date,
 * which can be wrong if the user is ahead of UTC (e.g. UTC+3 at 1 AM local
 * = 10 PM previous day UTC). This helper fixes that.
 */
export function getLocalDateString(date?: Date): string {
  const d = date || new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get the start of today in ISO string (local midnight as ISO).
 * Useful for Supabase `.gte()` filters.
 */
export function getLocalTodayStart(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/**
 * Get the end of today in ISO string (local 23:59:59.999 as ISO).
 * Useful for Supabase `.lte()` filters.
 */
export function getLocalTodayEnd(): string {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

/**
 * Get local midnight (start of day) for a given date.
 */
export function getLocalMidnight(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Split a timer session's duration across day boundaries.
 *
 * Given `started_at`, `ended_at`, and `duration_seconds`, this returns
 * a map of { 'YYYY-MM-DD': seconds } distributing seconds proportionally
 * across each calendar day the session spans.
 *
 * The total time window is `ended_at - started_at` (in seconds). The ratio
 * `duration_seconds / windowSeconds` is applied to each day's portion so that
 * the sum of all portions equals `duration_seconds` exactly.
 *
 * For sessions that don't cross midnight, the entire duration lands on one day.
 */
export function splitSessionAcrossDays(
  startedAt: string,
  endedAt: string,
  durationSeconds: number,
): Record<string, number> {
  const result: Record<string, number> = {}

  if (durationSeconds <= 0) return result

  const start = new Date(startedAt)
  const end = new Date(endedAt)

  const windowMs = end.getTime() - start.getTime()

  // If window is zero or negative (shouldn't happen, but be safe),
  // attribute everything to the end date
  if (windowMs <= 0) {
    const dateStr = getLocalDateString(end)
    result[dateStr] = durationSeconds
    return result
  }

  // Walk day by day from start to end
  let cursor = new Date(start)
  let allocated = 0

  while (cursor < end) {
    const dayStr = getLocalDateString(cursor)

    // End of this calendar day (next midnight)
    const nextMidnight = getLocalMidnight(cursor)
    nextMidnight.setDate(nextMidnight.getDate() + 1)

    // The portion of the window that falls on this day
    const dayEnd = nextMidnight < end ? nextMidnight : end
    const dayMs = dayEnd.getTime() - cursor.getTime()

    // Proportional seconds for this day
    const daySeconds = Math.round((dayMs / windowMs) * durationSeconds)

    if (daySeconds > 0) {
      result[dayStr] = (result[dayStr] || 0) + daySeconds
      allocated += daySeconds
    }

    cursor = nextMidnight
  }

  // Fix rounding: ensure sum === durationSeconds by adjusting the last day
  const diff = durationSeconds - allocated
  if (diff !== 0) {
    const endDateStr = getLocalDateString(end)
    result[endDateStr] = (result[endDateStr] || 0) + diff
  }

  return result
}

/**
 * Format seconds into "Xh Ym" format (e.g., "4h 40m", "45m").
 * If seconds is 0, returns "0m".
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
