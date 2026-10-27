import { buildJsHarness, countLines } from '../harness/js'
import type { TestSpec } from '../harness/types'
import type { JsJob, JsJobResult } from './protocol'
import {
  DEFAULT_TIMEOUT_MS,
  timeoutMessage,
  type RunRequest,
  type RunResult,
  type Runner,
} from './types'
import { callWorker } from './workerCall'

function spawn(): Worker {
  return new Worker(new URL('./js.worker.ts', import.meta.url), { type: 'module' })
}

export interface JsExecutor extends Runner {
  /** Runs already-JavaScript code; used by the TypeScript runner after transpiling. */
  execute(code: string, tests: TestSpec | undefined, timeoutMs: number): Promise<RunResult>
}

/**
 * Every run gets a fresh worker so globals never leak between runs.
 * One spare worker is kept warm so starting a run is instant.
 */
export function createJsExecutor(): JsExecutor {
  let spare: Worker | undefined

  function take(): Worker {
    const worker = spare ?? spawn()
    spare = spawn()
    return worker
  }

  async function execute(code: string, tests: TestSpec | undefined, timeoutMs: number) {
    const userLineCount = countLines(code)
    const job: JsJob = {
      code: tests ? code + '\n' + buildJsHarness(tests, userLineCount) : code,
      userLineCount,
      hasTests: Boolean(tests),
    }
    const worker = take()
    const started = performance.now()
    try {
      const outcome = await callWorker<JsJob, JsJobResult>(worker, job, timeoutMs)
      if (outcome.timedOut) {
        return {
          stdout: '',
          stderr: '',
          error: timeoutMessage(timeoutMs),
          timeMs: performance.now() - started,
          timedOut: true,
        }
      }
      return { ...outcome.data, timedOut: false }
    } catch (err) {
      return {
        stdout: '',
        stderr: '',
        error: err instanceof Error ? err.message : String(err),
        timeMs: performance.now() - started,
        timedOut: false,
      }
    } finally {
      worker.terminate()
    }
  }

  return {
    execute,
    run(req: RunRequest) {
      return execute(req.code, req.tests, req.timeoutMs ?? DEFAULT_TIMEOUT_MS)
    },
  }
}
