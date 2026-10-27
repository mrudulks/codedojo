/** Local midnight of the day containing `ms`. */
export function startOfDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Adds calendar days in local time (safe across daylight-saving changes). */
export function addDays(dayStart: number, days: number): number {
  const d = new Date(dayStart)
  d.setDate(d.getDate() + days)
  return d.getTime()
}

export function daysBetween(fromDay: number, toDay: number): number {
  return Math.round((startOfDay(toDay) - startOfDay(fromDay)) / 86400000)
}
