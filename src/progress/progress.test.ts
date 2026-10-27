import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Task } from '../tasks/schema'
import { addDays, startOfDay } from './dates'
import { buildCards, dueCards, todayQueue } from './scheduler'
import { buildDashboard, streak } from './stats'
import { mergeAttempts, parseBackup, toBackup } from './storage'
import type { Attempt } from './types'

const DAY0 = new Date(2026, 2, 2, 10, 0, 0).getTime()

function task(id: string, tags: string[], difficulty = 1): Task {
  return {
    id,
    mode: 'solve',
    languages: ['javascript', 'python'],
    difficulty,
    tags,
    title: id,
    prompt: 'p',
    functionName: { javascript: 'f', python: 'f' },
    starter: { javascript: '', python: '' },
    tests: [{ args: [], expected: 1 }],
  }
}

let seq = 0
function attempt(taskId: string, date: number, passed: boolean, hintsUsed = 0): Attempt {
  return {
    id: `a${seq++}`,
    taskId,
    language: 'javascript',
    mode: 'solve',
    passed,
    timeMs: 60000,
    keystrokes: 100,
    hintsUsed,
    date,
  }
}

const at = (days: number, hour = 10) => addDays(startOfDay(DAY0), days) + hour * 3600000

describe('scheduler with a mocked clock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(DAY0)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('brings a task solved with a hint back into the queue two days later', () => {
    const tasks = [task('two-sum', ['arrays'])]
    const attempts = [
      attempt('two-sum', Date.now(), false, 1),
      attempt('two-sum', Date.now(), true, 1),
    ]
    const reviews = () =>
      todayQueue(tasks, attempts, 'javascript').filter((q) => q.reason === 'review')

    expect(reviews()).toHaveLength(0)
    vi.setSystemTime(at(1))
    expect(reviews()).toHaveLength(0)
    vi.setSystemTime(at(2, 0))
    expect(reviews().map((q) => q.task.id)).toEqual(['two-sum'])
    expect(reviews()[0]?.detail).toBe('hinted')
  })

  it('schedules failures for tomorrow and clean solves for a week, doubling on each clean review', () => {
    const failed = [attempt('t', at(0), false)]
    expect(dueCards(failed, at(1)).length).toBe(1)

    const history = [attempt('t', at(0), true)]
    expect(buildCards(history).get('t|javascript')?.intervalDays).toBe(7)
    expect(dueCards(history, at(6))).toHaveLength(0)
    expect(dueCards(history, at(7))).toHaveLength(1)

    history.push(attempt('t', at(7), true))
    expect(buildCards(history).get('t|javascript')?.intervalDays).toBe(14)
    history.push(attempt('t', at(10), true)) // early practice keeps the schedule
    expect(buildCards(history).get('t|javascript')?.due).toBe(addDays(startOfDay(at(7)), 14))
    history.push(attempt('t', at(21), true))
    expect(buildCards(history).get('t|javascript')?.intervalDays).toBe(28)
  })

  it('counts a day as solved if any attempt that day passed', () => {
    const attempts = [attempt('t', at(0, 9), false), attempt('t', at(0, 11), true)]
    expect(buildCards(attempts).get('t|javascript')?.outcome).toBe('clean')
  })

  it('adds one new task from the weakest tag after reviews', () => {
    const tasks = [
      task('a', ['strings']),
      task('b', ['arrays']),
      task('c', ['arrays'], 2),
      task('d', ['strings'], 2),
    ]
    const attempts = [attempt('a', at(0), true), attempt('b', at(0), false)]
    vi.setSystemTime(at(1))
    const queue = todayQueue(tasks, attempts, 'python')
    expect(queue.map((q) => [q.task.id, q.reason])).toEqual([
      ['b', 'review'],
      ['c', 'new'],
    ])
    expect(queue[1]?.language).toBe('python')
  })
})

describe('dashboard', () => {
  it('computes streak, solved counts and weakest tags', () => {
    const tasks = [task('a', ['strings']), task('b', ['arrays'])]
    const attempts = [
      attempt('a', at(0), true),
      attempt('a', at(1), true),
      attempt('b', at(2), false),
      attempt('b', at(2), true),
    ]
    expect(streak(attempts, at(2))).toBe(3)
    expect(streak(attempts, at(3))).toBe(3)
    expect(streak(attempts, at(4))).toBe(0)
    const dash = buildDashboard(tasks, attempts, at(2))
    expect(dash.solvedByLanguage.javascript).toBe(2)
    expect(dash.weakestTags.map((t) => t.tag)).toEqual(['arrays'])
  })
})

describe('backup', () => {
  it('round-trips through JSON and merges without duplicates', () => {
    const attempts = [attempt('a', at(0), true)]
    const parsed = parseBackup(JSON.stringify(toBackup(attempts)))
    expect(parsed.attempts).toEqual(attempts)
    expect(mergeAttempts(attempts, parsed.attempts)).toHaveLength(1)
    expect(() => parseBackup('{"nope":1}')).toThrow('not a Code Dojo progress backup')
  })
})
