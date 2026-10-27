/// <reference lib="webworker" />
import type { PyWorkerIn, PyWorkerOut } from './protocol'

/** Pyodide is fetched from the CDN the first time Python runs. */
const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.mjs'

interface Pyodide {
  runPython(code: string): unknown
  setStdout(options: { write: (buffer: Uint8Array) => number }): void
  setStderr(options: { write: (buffer: Uint8Array) => number }): void
}

interface PyodideModule {
  loadPyodide(options?: Record<string, unknown>): Promise<Pyodide>
}

const scope = self as unknown as DedicatedWorkerGlobalScope
let pyodide: Pyodide | undefined
let stdout = ''
let stderr = ''

function post(message: PyWorkerOut) {
  scope.postMessage(message)
}

function writer(target: 'out' | 'err') {
  const decoder = new TextDecoder()
  return {
    write(buffer: Uint8Array) {
      const text = decoder.decode(buffer, { stream: true })
      if (target === 'out') stdout += text
      else stderr += text
      return buffer.length
    },
  }
}

async function init() {
  if (pyodide) return post({ type: 'ready' })
  try {
    const mod = (await import(/* @vite-ignore */ PYODIDE_URL)) as PyodideModule
    pyodide = await mod.loadPyodide()
    pyodide.setStdout(writer('out'))
    pyodide.setStderr(writer('err'))
    post({ type: 'ready' })
  } catch (err) {
    post({ type: 'init-error', message: err instanceof Error ? err.message : String(err) })
  }
}

function run(id: number, program: string) {
  stdout = ''
  stderr = ''
  const start = performance.now()
  if (!pyodide) {
    return post({ type: 'result', id, stdout, stderr, error: 'Python is not loaded', timeMs: 0 })
  }
  try {
    const payload = pyodide.runPython(program)
    post({
      type: 'result',
      id,
      stdout,
      stderr,
      payload: typeof payload === 'string' ? payload : undefined,
      timeMs: performance.now() - start,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    post({ type: 'result', id, stdout, stderr, error: message, timeMs: performance.now() - start })
  }
}

scope.onmessage = (event: MessageEvent<PyWorkerIn>) => {
  const msg = event.data
  if (msg.type === 'init') void init()
  else run(msg.id, msg.program)
}
