import type { Language } from '../languages'
import type { TestResult, TestSpec } from '../harness/types'

export const DEFAULT_TIMEOUT_MS = 3000

export interface RunRequest {
  language: Language
  code: string
  tests?: TestSpec
  timeoutMs?: number
  options?: RunOptions
}

export interface RunOptions {
  /** TypeScript only: run even if the type checker reports errors. */
  runWithTypeErrors?: boolean
}

export interface Diagnostic {
  line: number
  column: number
  message: string
}

export interface RunResult {
  stdout: string
  stderr: string
  error?: string
  /** 1-based line in the user's code for `error`, when known. */
  errorLine?: number
  /** Compile-time problems (TypeScript type errors). */
  diagnostics?: Diagnostic[]
  results?: TestResult[]
  timeMs: number
  timedOut: boolean
}

export interface Runner {
  run(req: RunRequest): Promise<RunResult>
}

/** Progress notices from runners, e.g. while Pyodide downloads. */
export type StatusListener = (message: string | null) => void

export function timeoutMessage(timeoutMs: number): string {
  const seconds = timeoutMs / 1000
  return `Stopped: took longer than ${seconds} second${seconds === 1 ? '' : 's'}`
}
