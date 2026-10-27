import type { Language } from '../languages'
import { createJsExecutor } from './jsExecutor'
import { createPyExecutor } from './pyExecutor'
import { createTsExecutor } from './tsExecutor'
import type { RunRequest, RunResult, Runner, StatusListener } from './types'

export type { RunRequest, RunResult, Runner } from './types'
export { DEFAULT_TIMEOUT_MS } from './types'

/**
 * The single entry point the UI uses to run code. Language-specific details
 * (workers, compilers, Pyodide) stay behind this interface.
 */
export function createRunner(onStatus: StatusListener = () => {}): Runner {
  const js = createJsExecutor()
  let ts: Runner | undefined
  let py: Runner | undefined

  const byLanguage: Record<Language, () => Runner> = {
    javascript: () => js,
    typescript: () => (ts ??= createTsExecutor(js, onStatus)),
    python: () => (py ??= createPyExecutor(onStatus)),
  }

  return {
    run(req: RunRequest): Promise<RunResult> {
      return byLanguage[req.language]().run(req)
    },
  }
}
