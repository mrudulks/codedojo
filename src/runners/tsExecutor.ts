import type { JsExecutor } from './jsExecutor'
import type { TsCompileJob, TsCompileResult } from './protocol'
import { createLineMapper } from './sourcemap'
import {
  DEFAULT_TIMEOUT_MS,
  type RunRequest,
  type RunResult,
  type Runner,
  type StatusListener,
} from './types'
import { callWorker } from './workerCall'

/** Compiling never runs user code, but the first call loads the compiler. */
const COMPILE_TIMEOUT_MS = 60000

export function createTsExecutor(js: JsExecutor, onStatus: StatusListener): Runner {
  let worker: Worker | undefined
  let loaded = false
  let nextId = 1

  async function compile(code: string): Promise<TsCompileResult> {
    worker ??= new Worker(new URL('./ts.worker.ts', import.meta.url), { type: 'module' })
    const id = nextId++
    if (!loaded) onStatus('Loading TypeScript…')
    try {
      const outcome = await callWorker<TsCompileJob, TsCompileResult>(
        worker,
        { id, code },
        COMPILE_TIMEOUT_MS,
        (data) => data.id === id,
      )
      if (outcome.timedOut) {
        worker = undefined
        throw new Error('The TypeScript compiler did not respond')
      }
      loaded = true
      return outcome.data
    } catch (err) {
      worker = undefined
      loaded = false
      throw err
    } finally {
      onStatus(null)
    }
  }

  return {
    async run(req: RunRequest): Promise<RunResult> {
      const started = performance.now()
      let compiled: TsCompileResult
      try {
        compiled = await compile(req.code)
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err)
        return { stdout: '', stderr: '', error, timeMs: 0, timedOut: false }
      }
      if (compiled.error) {
        return { stdout: '', stderr: '', error: compiled.error, timeMs: 0, timedOut: false }
      }
      const diagnostics = compiled.diagnostics
      if (diagnostics.length > 0 && !req.options?.runWithTypeErrors) {
        const count = diagnostics.length
        return {
          stdout: '',
          stderr: '',
          error: `${count} type error${count === 1 ? '' : 's'}; the code was not run`,
          diagnostics,
          timeMs: performance.now() - started,
          timedOut: false,
        }
      }

      const result = await js.execute(compiled.js, req.tests, req.timeoutMs ?? DEFAULT_TIMEOUT_MS)
      const toTs = createLineMapper(compiled.mappings)
      const mapLine = (line: number | undefined) =>
        line === undefined ? undefined : (toTs(line) ?? line)
      return {
        ...result,
        errorLine: mapLine(result.errorLine),
        results: result.results?.map((r) => ({ ...r, errorLine: mapLine(r.errorLine) })),
        diagnostics: diagnostics.length > 0 ? diagnostics : undefined,
      }
    },
  }
}
