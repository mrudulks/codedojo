import { LANGUAGES, type Language } from '../languages'
import type { Task } from '../tasks/schema'
import { addDays, startOfDay } from './dates'
import { tagStats, type TagStat } from './scheduler'
import type { Attempt } from './types'

export interface Dashboard {
  solvedByLanguage: Record<Language, number>
  streakDays: number
  averageTimeMs: number | null
  wpmTrend: { date: number; wpm: number }[]
  weakestTags: TagStat[]
  totalAttempts: number
}

/** Task ids solved at least once, per language. */
export function solvedSets(attempts: Attempt[]): Record<Language, Set<string>> {
  const sets = Object.fromEntries(LANGUAGES.map((l) => [l, new Set<string>()])) as Record<
    Language,
    Set<string>
  >
  for (const a of attempts) if (a.passed) sets[a.language].add(a.taskId)
  return sets
}

/** Consecutive days with practice, ending today (or yesterday if today has none yet). */
export function streak(attempts: Attempt[], now = Date.now()): number {
  const days = new Set(attempts.map((a) => startOfDay(a.date)))
  let day = startOfDay(now)
  if (!days.has(day)) day = addDays(day, -1)
  let count = 0
  while (days.has(day)) {
    count++
    day = addDays(day, -1)
  }
  return count
}

export function buildDashboard(tasks: Task[], attempts: Attempt[], now = Date.now()): Dashboard {
  const solved = solvedSets(attempts)
  const passing = attempts.filter((a) => a.passed && a.mode !== 'drill')
  return {
    solvedByLanguage: Object.fromEntries(LANGUAGES.map((l) => [l, solved[l].size])) as Record<
      Language,
      number
    >,
    streakDays: streak(attempts, now),
    averageTimeMs: passing.length
      ? passing.reduce((s, a) => s + a.timeMs, 0) / passing.length
      : null,
    wpmTrend: attempts
      .filter((a) => a.wpm !== undefined)
      .sort((a, b) => a.date - b.date)
      .slice(-12)
      .map((a) => ({ date: a.date, wpm: a.wpm! })),
    weakestTags: tagStats(tasks, attempts)
      .filter((t) => t.passRate < 1)
      .slice(0, 4),
    totalAttempts: attempts.length,
  }
}
