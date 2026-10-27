import { buildPyProgram, type PyProgramOutput } from '../harness/py'
import type { PyWorkerIn, PyWorkerOut } from './protocol'
import {
  DEFAULT_TIMEOUT_MS,
  timeoutMessage,
  type RunRequest,
  type RunResult,
  type Runner,
  type StatusListener,
} from './types'
import { callWorker } from './workerCall'

/** Downloading and starting Pyodide can take a while on a slow connection. */
const LOAD_TIMEOUT_MS = 120000

export function createPyExecutor(onStatus: StatusListener): Runner {
  let ready: Promise<Worker> | undefined
  let nextId = 1

  function load(message: string): Promise<Worker> {
    const w = new Worker(new URL('./py.worker.ts', import.meta.url), { type: 'module' })
    onStatus(message)
    ready = callWorker<PyWorkerIn, PyWorkerOut>(w, { type: 'init' }, LOAD_TIMEOUT_MS)
      .then((outcome) => {
        if (outcome.timedOut) throw new Error('Python took too long to load')
        if (outcome.data.type === 'init-error') {
          throw new Error(`Python could not be loaded: ${outcome.data.message}`)
        }
        return w
      })
      .catch((err: unknown) => {
        w.terminate()
        ready = undefined
        throw err
      })
      .finally(() => onStatus(null))
    return ready
  }

  return {
    async run(req: RunRequest): Promise<RunResult> {
      const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS
      let w: Worker
      try {
        w = await (ready ?? load('Loading Python… (first run downloads about 10 MB)'))
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err)
        return { stdout: '', stderr: '', error, timeMs: 0, timedOut: false }
      }

      const id = nextId++
      const program = buildPyProgram(req.code, req.tests)
      const started = performance.now()
      const outcome = await callWorker<PyWorkerIn, PyWorkerOut>(
        w,
        { type: 'run', id, program },
        timeoutMs,
        (data) => data.type === 'result' && data.id === id,
      ).catch((err: unknown) => ({ crashed: err instanceof Error ? err.message : String(err) }))

      if ('crashed' in outcome || outcome.timedOut) {
        // The worker was terminated; start a new one in the background.
        ready = undefined
        void load('Restarting Python…').catch(() => undefined)
        const error = 'crashed' in outcome ? outcome.crashed : timeoutMessage(timeoutMs)
        return {
          stdout: '',
          stderr: '',
          error,
          timeMs: performance.now() - started,
          timedOut: !('crashed' in outcome),
        }
      }

      const data = outcome.data
      if (data.type !== 'result') throw new Error('Unexpected message from the Python worker')
      const parsed: PyProgramOutput = data.payload
        ? (JSON.parse(data.payload) as PyProgramOutput)
        : {}
      return {
        stdout: data.stdout,
        stderr: data.stderr,
        error: data.error ?? parsed.error,
        errorLine: parsed.errorLine ?? undefined,
        results: parsed.results?.map((r) => ({ ...r, errorLine: r.errorLine ?? undefined })),
        timeMs: data.timeMs,
        timedOut: false,
      }
    },
  }
}
