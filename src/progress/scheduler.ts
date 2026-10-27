import type { Language } from '../languages'
import type { Task } from '../tasks/schema'
import { addDays, startOfDay } from './dates'
import type { Attempt } from './types'

/** Review intervals in days. */
export const INTERVALS = { clean: 7, hinted: 2, failed: 1 } as const

export type Outcome = keyof typeof INTERVALS

export interface Card {
  taskId: string
  language: Language
  outcome: Outcome
  intervalDays: number
  /** Local midnight of the day the task is due again. */
  due: number
  lastPracticed: number
}

export function cardKey(taskId: string, language: Language): string {
  return `${taskId}|${language}`
}

interface DayResult {
  day: number
  passed: boolean
  hints: number
}

/** Collapses attempts into one result per day: passed if any attempt passed. */
function dailyResults(attempts: Attempt[]): DayResult[] {
  const byDay = new Map<number, DayResult>()
  for (const a of attempts) {
    const day = startOfDay(a.date)
    const current = byDay.get(day) ?? { day, passed: false, hints: 0 }
    current.passed ||= a.passed
    current.hints = Math.max(current.hints, a.hintsUsed)
    byDay.set(day, current)
  }
  return [...byDay.values()].sort((a, b) => a.day - b.day)
}

/**
 * Applies one day's result to a card:
 * - failed → review tomorrow
 * - solved with hints → review in 2 days
 * - solved without hints → 7 days; each clean re-solve on or after the due day doubles the interval
 *   (practising again early keeps the current schedule).
 */
export function nextCard(
  prev: Card | undefined,
  result: DayResult,
  taskId: string,
  language: Language,
): Card {
  const make = (outcome: Outcome, intervalDays: number): Card => ({
    taskId,
    language,
    outcome,
    intervalDays,
    due: addDays(result.day, intervalDays),
    lastPracticed: result.day,
  })
  if (!result.passed) return make('failed', INTERVALS.failed)
  if (result.hints > 0) return make('hinted', INTERVALS.hinted)
  if (prev?.outcome === 'clean') {
    if (result.day < prev.due) return { ...prev, lastPracticed: result.day }
    return make('clean', prev.intervalDays * 2)
  }
  return make('clean', INTERVALS.clean)
}

/** Builds the review card for every task + language that has attempts. */
export function buildCards(attempts: Attempt[]): Map<string, Card> {
  const groups = new Map<string, Attempt[]>()
  for (const a of attempts) {
    const key = cardKey(a.taskId, a.language)
    const list = groups.get(key) ?? []
    list.push(a)
    groups.set(key, list)
  }
  const cards = new Map<string, Card>()
  for (const [key, list] of groups) {
    const { taskId, language } = list[0]!
    let card: Card | undefined
    for (const result of dailyResults(list)) card = nextCard(card, result, taskId, language)
    if (card) cards.set(key, card)
  }
  return cards
}

export function dueCards(attempts: Attempt[], now = Date.now()): Card[] {
  const today = startOfDay(now)
  return [...buildCards(attempts).values()]
    .filter((c) => c.due <= today)
    .sort((a, b) => a.due - b.due)
}

export interface TagStat {
  tag: string
  attempts: number
  passed: number
  passRate: number
}

export function tagStats(tasks: Task[], attempts: Attempt[]): TagStat[] {
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const stats = new Map<string, TagStat>()
  for (const a of attempts) {
    for (const tag of byId.get(a.taskId)?.tags ?? []) {
      const s = stats.get(tag) ?? { tag, attempts: 0, passed: 0, passRate: 0 }
      s.attempts++
      if (a.passed) s.passed++
      s.passRate = s.passed / s.attempts
      stats.set(tag, s)
    }
  }
  return [...stats.values()].sort((a, b) => a.passRate - b.passRate || b.attempts - a.attempts)
}

export interface QueueItem {
  task: Task
  language: Language
  reason: 'review' | 'new'
  /** For reviews: how the last session went. For new tasks: the weak tag picked. */
  detail: string
}

/**
 * Today's queue: due reviews first (most overdue first), then one new task,
 * preferably from the tag with the lowest pass rate.
 */
export function todayQueue(
  tasks: Task[],
  attempts: Attempt[],
  preferred: Language,
  now = Date.now(),
): QueueItem[] {
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const queue: QueueItem[] = []
  for (const card of dueCards(attempts, now)) {
    const task = byId.get(card.taskId)
    if (task && task.languages.includes(card.language)) {
      queue.push({ task, language: card.language, reason: 'review', detail: card.outcome })
    }
  }

  const tried = new Set(attempts.map((a) => a.taskId))
  const fresh = tasks
    .filter((t) => !tried.has(t.id))
    .sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id))
  const pickLanguage = (t: Task) => (t.languages.includes(preferred) ? preferred : t.languages[0]!)

  for (const { tag } of tagStats(tasks, attempts)) {
    const task = fresh.find((t) => t.tags.includes(tag))
    if (task) {
      queue.push({ task, language: pickLanguage(task), reason: 'new', detail: tag })
      return queue
    }
  }
  const task = fresh.find((t) => t.languages.includes(preferred)) ?? fresh[0]
  if (task) queue.push({ task, language: pickLanguage(task), reason: 'new', detail: '' })
  return queue
}
