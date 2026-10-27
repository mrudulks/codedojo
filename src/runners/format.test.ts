import { describe, expect, it } from 'vitest'
import { formatLogArgs, inspect } from './format'

describe('inspect', () => {
  it('formats arrays like Node', () => {
    expect(inspect([1, 2])).toBe('[ 1, 2 ]')
    expect(inspect([])).toBe('[]')
    expect(inspect(['a', [true, null]])).toBe("[ 'a', [ true, null ] ]")
  })

  it('formats objects and nested depth', () => {
    expect(inspect({ a: 1, 'b-c': 'x' })).toBe("{ a: 1, 'b-c': 'x' }")
    expect(inspect({})).toBe('{}')
    expect(inspect({ a: { b: { c: { d: 1 } } } })).toBe('{ a: { b: { c: [Object] } } }')
  })

  it('formats maps, sets, functions and classes', () => {
    expect(inspect(new Map([['k', 1]]))).toBe("Map(1) { 'k' => 1 }")
    expect(inspect(new Set([1, 2]))).toBe('Set(2) { 1, 2 }')
    expect(inspect(function foo() {})).toBe('[Function: foo]')
    class Point {
      constructor(public x = 1) {}
    }
    expect(inspect(new Point())).toBe('Point { x: 1 }')
    expect(inspect(Point)).toBe('[class Point]')
  })

  it('handles circular references', () => {
    const a: Record<string, unknown> = {}
    a.self = a
    expect(inspect(a)).toBe('{ self: [Circular] }')
  })
})

describe('formatLogArgs', () => {
  it('prints top-level strings raw', () => {
    expect(formatLogArgs(['sum:', 3, 'ok'])).toBe('sum: 3 ok')
    expect(formatLogArgs([undefined, -0, 10n])).toBe('undefined -0 10n')
  })
})
