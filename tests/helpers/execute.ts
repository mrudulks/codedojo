import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'
import { buildJsHarness, countLines, JS_REPORT_FN, JS_SOURCE_NAME } from '../../src/harness/js'
import { buildPyProgram, PY_RESULT_MARKER, type PyProgramOutput } from '../../src/harness/py'
import type { TestResult, TestSpec } from '../../src/harness/types'
import { formatLogArgs } from '../../src/runners/format'
import { createTsCompiler, type TsCompiler } from '../../src/runners/tsCompile'
import type { Diagnostic } from '../../src/runners/types'

export interface NodeRun {
  stdout: string
  error?: string
  results?: TestResult[]
  diagnostics?: Diagnostic[]
}

/** Runs JS the way js.worker.ts does, but in a Node vm context. */
export async function runJs(code: string, spec?: TestSpec): Promise<NodeRun> {
  let stdout = ''
  let results: TestResult[] | undefined
  const log = (...args: unknown[]) => {
    stdout += formatLogArgs(args) + '\n'
  }
  const context = vm.createContext({
    console: { log, info: log, debug: log, warn: log, error: log },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    queueMicrotask,
    structuredClone,
    [JS_REPORT_FN]: (r: TestResult[]) => {
      results = r
    },
  })
  const source = spec ? code + '\n' + buildJsHarness(spec, countLines(code)) : code
  try {
    vm.runInContext(source, context, { filename: JS_SOURCE_NAME, timeout: 3000 })
  } catch (err) {
    const e = err as Error
    return { stdout, error: `${e.name}: ${e.message}` }
  }
  for (let i = 0; i < 200 && ((spec && !results) || i < 5); i++) {
    await new Promise((r) => setTimeout(r, 5))
  }
  return { stdout, results }
}

let compiler: TsCompiler | undefined

export function getTsCompiler(): TsCompiler {
  if (!compiler) {
    const libDir = dirname(createRequire(import.meta.url).resolve('typescript/lib/lib.es5.d.ts'))
    const libs = new Map<string, string>()
    for (const file of readdirSync(libDir)) {
      if (/^lib\.(es|decorators).*\.d\.ts$/.test(file)) {
        libs.set('/' + file, readFileSync(join(libDir, file), 'utf8'))
      }
    }
    compiler = createTsCompiler(ts, libs)
  }
  return compiler
}

export async function runTs(code: string, spec?: TestSpec): Promise<NodeRun> {
  const c = getTsCompiler()
  const diagnostics = c.check(code)
  if (diagnostics.length > 0) return { stdout: '', diagnostics, error: 'type errors' }
  return runJs(c.transpile(code).js, spec)
}

export const hasPython = spawnSync('python3', ['--version']).status === 0

export function runPy(code: string, spec?: TestSpec): NodeRun {
  const program = buildPyProgram(code, spec, true)
  const proc = spawnSync('python3', ['-I', '-c', program], { encoding: 'utf8', timeout: 10000 })
  const out = proc.stdout ?? ''
  const idx = out.lastIndexOf(PY_RESULT_MARKER)
  if (idx < 0) return { stdout: out, error: proc.stderr || 'no result' }
  const parsed = JSON.parse(out.slice(idx + PY_RESULT_MARKER.length)) as PyProgramOutput
  return {
    stdout: out.slice(0, idx),
    error: parsed.error,
    results: parsed.results,
  }
}
