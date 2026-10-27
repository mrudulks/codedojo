/// <reference lib="webworker" />
import ts from 'typescript'
import { createTsCompiler, type TsCompiler } from './tsCompile'
import type { TsCompileJob, TsCompileResult } from './protocol'

const scope = self as unknown as DedicatedWorkerGlobalScope

// Bundled with this worker only, so the main app never downloads them.
const libSources = import.meta.glob<string>(
  [
    '/node_modules/typescript/lib/lib.es*.d.ts',
    '/node_modules/typescript/lib/lib.decorators*.d.ts',
  ],
  { query: '?raw', import: 'default', eager: true },
)

let compiler: TsCompiler | undefined

function getCompiler(): TsCompiler {
  if (!compiler) {
    const libs = new Map<string, string>()
    for (const [path, source] of Object.entries(libSources)) {
      libs.set('/' + path.split('/').pop(), source)
    }
    compiler = createTsCompiler(ts, libs)
  }
  return compiler
}

scope.onmessage = (event: MessageEvent<TsCompileJob>) => {
  const { id, code } = event.data
  let result: TsCompileResult
  try {
    const c = getCompiler()
    const diagnostics = c.check(code)
    const { js, mappings } = c.transpile(code)
    result = { id, js, mappings, diagnostics }
  } catch (err) {
    result = { id, js: '', mappings: '', diagnostics: [], error: String(err) }
  }
  scope.postMessage(result)
}
