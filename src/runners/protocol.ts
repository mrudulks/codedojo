import type { TestResult } from '../harness/types'

/** Message sent to js.worker.ts. */
export interface JsJob {
  code: string
  /** Lines that belong to the user's code; anything after is harness. */
  userLineCount: number
  /** Wait for the harness to report before finishing. */
  hasTests: boolean
}

/** Message posted back by js.worker.ts. */
export interface JsJobResult {
  stdout: string
  stderr: string
  error?: string
  errorLine?: number
  results?: TestResult[]
  timeMs: number
}

export interface TsCompileJob {
  id: number
  code: string
}

export interface TsCompileResult {
  id: number
  js: string
  /** Source map `mappings` string for js → ts line mapping. */
  mappings: string
  diagnostics: { line: number; column: number; message: string }[]
  error?: string
}

export type PyWorkerIn = { type: 'init' } | { type: 'run'; id: number; program: string }

export type PyWorkerOut =
  | { type: 'ready' }
  | { type: 'init-error'; message: string }
  | {
      type: 'result'
      id: number
      stdout: string
      stderr: string
      payload?: string
      error?: string
      timeMs: number
    }
