import type { TestResult, TestSpec } from './types'

/** Prefix of the stdout line that carries the result when the program runs outside Pyodide. */
export const PY_RESULT_MARKER = '\u0000CODEDOJO_RESULT:'

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/**
 * Builds a Python program that runs the user's code with `exec` in a fresh
 * namespace (file name `<main>`), optionally calls `spec.functionName` per test
 * case, and evaluates to a JSON string `{ error?, errorLine?, results? }`.
 * Code and tests are embedded as base64 so any characters survive.
 * With `printResult`, the JSON is printed after PY_RESULT_MARKER instead
 * (used when running with a plain `python3`).
 */
export function buildPyProgram(userCode: string, spec?: TestSpec, printResult = false): string {
  const src = toBase64(userCode)
  const tests = toBase64(JSON.stringify(spec ?? null))
  const tail = printResult
    ? `print(${JSON.stringify(PY_RESULT_MARKER)} + __codedojo_result)`
    : '__codedojo_result'
  return `import base64 as __b64, copy as __copy, json as __json, traceback as __tb

def __codedojo_fmt(e):
    frames = [f for f in __tb.extract_tb(e.__traceback__) if f.filename == "<main>"]
    out = ""
    if frames:
        out += "Traceback (most recent call last):\\n" + "".join(__tb.format_list(frames))
    out += "".join(__tb.format_exception_only(type(e), e))
    return out.rstrip()

def __codedojo_line(e):
    if isinstance(e, SyntaxError) and e.filename == "<main>":
        return e.lineno
    frames = [f for f in __tb.extract_tb(e.__traceback__) if f.filename == "<main>"]
    return frames[-1].lineno if frames else None

def __codedojo_main():
    src = __b64.b64decode("${src}").decode("utf-8")
    spec = __json.loads(__b64.b64decode("${tests}").decode("utf-8"))
    ns = {"__name__": "__main__"}
    try:
        exec(compile(src, "<main>", "exec"), ns)
    except BaseException as e:
        return {"error": __codedojo_fmt(e), "errorLine": __codedojo_line(e)}
    if spec is None:
        return {}
    name = spec["functionName"]
    fn = ns.get(name)
    results = []
    for case in spec["cases"]:
        entry = {"passed": False, "args": case["args"], "expected": case["expected"], "got": None}
        if not callable(fn):
            entry["error"] = "Function " + name + " is not defined"
            results.append(entry)
            continue
        try:
            got = fn(*__copy.deepcopy(case["args"]))
            try:
                norm = __json.loads(__json.dumps(got))
            except (TypeError, ValueError):
                norm = repr(got)
            entry["got"] = norm
            entry["passed"] = norm == case["expected"]
        except Exception as e:
            entry["error"] = __codedojo_fmt(e)
            entry["errorLine"] = __codedojo_line(e)
        results.append(entry)
    return {"results": results}

__codedojo_result = __json.dumps(__codedojo_main())
${tail}
`
}

export interface PyProgramOutput {
  error?: string
  errorLine?: number | null
  results?: TestResult[]
}
