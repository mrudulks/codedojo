/// <reference lib="webworker" />
import { parse } from 'acorn'
import { JS_REPORT_FN, JS_SOURCE_NAME } from '../harness/js'
import type { TestResult } from '../harness/types'
import { formatLogArgs } from './format'
import type { JsJob, JsJobResult } from './protocol'

// A fresh worker is created for every run, so overriding globals here is safe.
const scope = self as unknown as DedicatedWorkerGlobalScope

const realSetTimeout = scope.setTimeout.bind(scope)
const realClearTimeout = scope.clearTimeout.bind(scope)
const realSetInterval = scope.setInterval.bind(scope)
const realClearInterval = scope.clearInterval.bind(scope)

let stdout = ''
let stderr = ''
let firstError: { message: string; line?: number } | undefined
let reported: TestResult[] | undefined
let userLineCount = Infinity
const pendingTimers = new Set<number>()

function describe(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`
  return `Uncaught ${formatLogArgs([err])}`
}

function lineOf(err: unknown): number | undefined {
  const stack = err instanceof Error ? (err.stack ?? '') : ''
  const re = new RegExp(`${JS_SOURCE_NAME.replace('.', '\\.')}:(\\d+)`, 'g')
  for (const match of stack.matchAll(re)) {
    const line = Number(match[1])
    if (line <= userLineCount) return line
  }
  return undefined
}

function recordError(err: unknown): void {
  if (!firstError) firstError = { message: describe(err), line: lineOf(err) }
}

function syntaxErrorLine(code: string): { message: string; line?: number } | undefined {
  try {
    parse(code, { ecmaVersion: 'latest', sourceType: 'script' })
    return undefined
  } catch (err) {
    const loc = (err as { loc?: { line: number } }).loc
    const message = err instanceof Error ? err.message.replace(/\s*\(\d+:\d+\)$/, '') : String(err)
    return { message: `SyntaxError: ${message}`, line: loc?.line }
  }
}

const write =
  (target: 'out' | 'err') =>
  (...args: unknown[]) => {
    const line = formatLogArgs(args) + '\n'
    if (target === 'out') stdout += line
    else stderr += line
  }

console.log = write('out')
console.info = write('out')
console.debug = write('out')
console.error = write('err')
console.warn = write('err')

scope.setTimeout = ((handler: TimerHandler, ms?: number, ...args: unknown[]) => {
  const id: number = realSetTimeout(() => {
    pendingTimers.delete(id)
    try {
      if (typeof handler === 'function') handler(...args)
    } catch (err) {
      recordError(err)
    }
  }, ms)
  pendingTimers.add(id)
  return id
}) as typeof setTimeout
scope.clearTimeout = ((id?: number) => {
  if (id !== undefined) pendingTimers.delete(id)
  realClearTimeout(id)
}) as typeof clearTimeout
scope.setInterval = ((handler: TimerHandler, ms?: number, ...args: unknown[]) => {
  const id: number = realSetInterval(() => {
    try {
      if (typeof handler === 'function') handler(...args)
    } catch (err) {
      recordError(err)
    }
  }, ms)
  pendingTimers.add(id)
  return id
}) as typeof setInterval
scope.clearInterval = ((id?: number) => {
  if (id !== undefined) pendingTimers.delete(id)
  realClearInterval(id)
}) as typeof clearInterval

scope.addEventListener('unhandledrejection', (event) => {
  event.preventDefault()
  recordError(event.reason)
})

// The harness calls this global with its results.
;(scope as unknown as Record<string, unknown>)[JS_REPORT_FN] = (results: TestResult[]) => {
  reported = results
}

const tick = () => new Promise<void>((resolve) => realSetTimeout(resolve, 0))

scope.onmessage = async (event: MessageEvent<JsJob>) => {
  const job = event.data
  userLineCount = job.userLineCount
  const start = performance.now()
  try {
    // Indirect eval runs the code as a classic global script, like a <script> tag.
    ;(0, eval)(`${job.code}\n//# sourceURL=${JS_SOURCE_NAME}`)
  } catch (err) {
    if (err instanceof SyntaxError)
      firstError = syntaxErrorLine(job.code) ?? { message: describe(err) }
    else recordError(err)
  }
  // Let promises and timers finish; the main thread enforces the time limit.
  await tick()
  while (!firstError && (pendingTimers.size > 0 || (job.hasTests && !reported))) await tick()

  const result: JsJobResult = {
    stdout,
    stderr,
    error: firstError?.message,
    errorLine: firstError?.line,
    results: reported,
    timeMs: performance.now() - start,
  }
  scope.postMessage(result)
}
