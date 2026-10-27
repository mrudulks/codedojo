import { describe, expect, it } from 'vitest'
import { hasPython, runJs, runPy, runTs } from '../../tests/helpers/execute'
import { buildJsHarness, JS_REPORT_FN } from './js'
import { buildPyProgram } from './py'
import type { TestSpec } from './types'

const spec: TestSpec = {
  functionName: 'add',
  cases: [
    { args: [1, 2], expected: 3 },
    { args: [{ a: 1 }, { b: 2 }], expected: { b: 2, a: 1 } },
  ],
}

describe('buildJsHarness', () => {
  it('is a pure function of its inputs', () => {
    expect(buildJsHarness(spec, 3)).toBe(buildJsHarness(spec, 3))
    expect(buildJsHarness(spec, 3)).toContain(JS_REPORT_FN)
  })

  it('reports passes, failures and per-test errors with lines', async () => {
    const code = [
      'function add(a, b) {',
      "  if (typeof a === 'object') return { ...a, ...b }",
      '  if (a === 1) return 3',
      "  throw new Error('nope')",
      '}',
    ].join('\n')
    const run = await runJs(code, {
      functionName: 'add',
      cases: [...spec.cases, { args: [5, 5], expected: 10 }],
    })
    expect(run.results?.map((r) => r.passed)).toEqual([true, true, false])
    expect(run.results?.[2]?.error).toBe('Error: nope')
    expect(run.results?.[2]?.errorLine).toBe(4)
  })

  it('reports a missing function for every case', async () => {
    const run = await runJs('const x = 1', spec)
    expect(run.results?.every((r) => !r.passed && r.error?.includes('not defined'))).toBe(true)
  })

  it('awaits async functions and does not let tests mutate shared args', async () => {
    const code =
      'async function add(a, b) { if (Array.isArray(a)) { a.push(1); return a.length } return a + b }'
    const run = await runJs(code, {
      functionName: 'add',
      cases: [
        { args: [[], 0], expected: 1 },
        { args: [2, 3], expected: 5 },
      ],
    })
    expect(run.results?.map((r) => r.passed)).toEqual([true, true])
    expect(run.results?.[0]?.args).toEqual([[], 0])
  })
})

describe('TypeScript compile', () => {
  it('reports type errors with line numbers', async () => {
    const run = await runTs('const a: number = 1\nconst b: string = a\nconsole.log(b)')
    expect(run.diagnostics).toHaveLength(1)
    expect(run.diagnostics?.[0]?.line).toBe(2)
    expect(run.diagnostics?.[0]?.message).toContain("not assignable to type 'string'")
  })

  it('runs typed code against tests', async () => {
    const code = 'function add(a: number, b: number): number {\n  return a + b\n}'
    const run = await runTs(code, { functionName: 'add', cases: [{ args: [1, 2], expected: 3 }] })
    expect(run.results?.[0]?.passed).toBe(true)
  })
})

describe.skipIf(!hasPython)('buildPyProgram', () => {
  it('is a pure function and survives any characters in the code', () => {
    expect(buildPyProgram('print("hi")')).toBe(buildPyProgram('print("hi")'))
    const run = runPy("print('héllo \"\\'\\'\\' 🎉')")
    expect(run.stdout).toBe("héllo \"''' 🎉\n")
  })

  it('compares through JSON and reports tracebacks', () => {
    const code = [
      'def add(a, b):',
      '    if isinstance(a, dict):',
      '        return {**a, **b}',
      '    if a == 1:',
      '        return (3)',
      '    return [a, b][5]',
    ].join('\n')
    const run = runPy(code, {
      functionName: 'add',
      cases: [...spec.cases, { args: [2, 2], expected: 4 }],
    })
    expect(run.results?.map((r) => r.passed)).toEqual([true, true, false])
    expect(run.results?.[2]?.error).toContain('IndexError')
    expect(run.results?.[2]?.error).toContain('line 6')
    expect(run.results?.[2]?.errorLine).toBe(6)
  })

  it('reports syntax errors with their line', () => {
    const run = runPy('x = 1\ndef f(:\n    pass')
    expect(run.error).toContain('SyntaxError')
  })
})
