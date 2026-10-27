import type * as TS from 'typescript'
import { createSystem, createVirtualTypeScriptEnvironment } from '@typescript/vfs'
import type { Diagnostic } from './types'

/** Globals available in the worker; declared by hand instead of shipping lib.dom. */
export const GLOBALS_DTS = `
interface Console {
  log(...data: any[]): void;
  info(...data: any[]): void;
  debug(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;
}
declare var console: Console;
declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearTimeout(id?: number): void;
declare function setInterval(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearInterval(id?: number): void;
declare function queueMicrotask(callback: () => void): void;
declare function structuredClone<T>(value: T): T;
`

const ENTRY = '/index.ts'

export interface TsCompiler {
  check(code: string): Diagnostic[]
  transpile(code: string): { js: string; mappings: string }
}

/**
 * Type checks and transpiles single-file TypeScript programs.
 * `libFiles` maps paths like `/lib.es2022.d.ts` to their contents.
 */
export function createTsCompiler(ts: typeof TS, libFiles: Map<string, string>): TsCompiler {
  const fsMap = new Map(libFiles)
  fsMap.set('/globals.d.ts', GLOBALS_DTS)
  fsMap.set(ENTRY, ' ')
  const options: TS.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    lib: ['es2022'],
    module: ts.ModuleKind.ESNext,
    strict: true,
    noEmit: true,
    types: [],
    skipLibCheck: true,
  }
  const env = createVirtualTypeScriptEnvironment(
    createSystem(fsMap),
    [ENTRY, '/globals.d.ts'],
    ts,
    options,
  )

  return {
    check(code) {
      // The virtual file system treats an empty file as missing.
      env.updateFile(ENTRY, code.length > 0 ? code : ' ')
      const service = env.languageService
      const diagnostics = [
        ...service.getSyntacticDiagnostics(ENTRY),
        ...service.getSemanticDiagnostics(ENTRY),
      ]
      return diagnostics
        .filter((d) => d.category === ts.DiagnosticCategory.Error)
        .map((d) => {
          const pos =
            d.file && d.start !== undefined
              ? d.file.getLineAndCharacterOfPosition(d.start)
              : { line: 0, character: 0 }
          return {
            line: pos.line + 1,
            column: pos.character + 1,
            message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
          }
        })
    },
    transpile(code) {
      const output = ts.transpileModule(code, {
        fileName: 'index.ts',
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
          sourceMap: true,
        },
      })
      const js = output.outputText.replace(/\n?\/\/# sourceMappingURL=.*\s*$/, '\n')
      const map = output.sourceMapText
        ? (JSON.parse(output.sourceMapText) as { mappings: string })
        : null
      return { js, mappings: map?.mappings ?? '' }
    },
  }
}
