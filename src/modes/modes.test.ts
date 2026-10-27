import { describe, expect, it } from 'vitest'
import { checkConstraints, countCodeLines } from './constraints'
import { countInsertMistakes, drillStats, mismatchPositions } from './drill'
import { compareOutput } from './predict'

describe('checkConstraints', () => {
  it('counts non-blank lines and finds banned patterns with their line', () => {
    const code = 'let a = 1\n\nvar b = 2\n'
    expect(countCodeLines(code)).toBe(2)
    const checks = checkConstraints(code, {
      maxLines: 1,
      banned: [{ pattern: '\\bvar\\b', message: 'No var' }],
    })
    expect(checks.map((c) => c.passed)).toEqual([false, false])
    expect(checks[1]?.detail).toBe('Found on line 3')
  })
})

describe('compareOutput', () => {
  it('ignores trailing whitespace and blank lines', () => {
    expect(compareOutput('a\nb\n', 'a  \nb\n\n').passed).toBe(true)
  })

  it('reports mismatched and missing lines', () => {
    const result = compareOutput('1\n2\n3\n', '1\n3')
    expect(result.passed).toBe(false)
    expect(result.lines.map((l) => l.matches)).toEqual([true, false, false])
    expect(result.lines[2]).toEqual({ expected: '3', predicted: undefined, matches: false })
  })
})

describe('drill', () => {
  it('finds mistakes and computes wpm and accuracy', () => {
    expect(mismatchPositions('hello', 'hxllo!')).toEqual([1, 5])
    expect(countInsertMistakes('hello', 1, 'ex')).toBe(1)
    const stats = drillStats('hello world', 'hello world', 6000, 12, 1)
    expect(stats.complete).toBe(true)
    expect(stats.wpm).toBe(22)
    expect(stats.accuracy).toBeCloseTo(11 / 12)
  })
})
