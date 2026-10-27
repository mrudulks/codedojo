import type { TestSpec } from './types'

/** Global function the generated harness calls with its results. */
export const JS_REPORT_FN = '__codedojo_report'

/** File name used for `//# sourceURL`, so stack frames point at user code. */
export const JS_SOURCE_NAME = 'user.js'

export function countLines(code: string): number {
  return code.split('\n').length
}

/**
 * Builds JavaScript that runs after the user's code (in the same script),
 * calls `functionName` once per test case and reports
 * `{ passed, args, expected, got, error, errorLine }` through `__codedojo_report`.
 * Values are compared after a JSON round trip with object keys sorted.
 */
export function buildJsHarness(spec: TestSpec, userLineCount: number): string {
  const cases = JSON.stringify(spec.cases)
  return `
;(async () => {
  const __cases = ${cases};
  const __json = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const __canon = (v) => {
    if (Array.isArray(v)) return '[' + v.map(__canon).join(',') + ']';
    if (v && typeof v === 'object') {
      return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + __canon(v[k])).join(',') + '}';
    }
    return v === undefined ? 'undefined' : JSON.stringify(v);
  };
  const __line = (e) => {
    const stack = e && typeof e.stack === 'string' ? e.stack : '';
    const re = /${JS_SOURCE_NAME.replace('.', '\\.')}:(\\d+)/g;
    let m;
    while ((m = re.exec(stack))) {
      const n = Number(m[1]);
      if (n <= ${userLineCount}) return n;
    }
    return undefined;
  };
  const __describe = (e) => (e instanceof Error ? e.name + ': ' + e.message : 'Thrown: ' + String(e));
  let __fn;
  try {
    __fn = ${spec.functionName};
  } catch (e) {
    __fn = undefined;
  }
  const __results = [];
  for (const c of __cases) {
    if (typeof __fn !== 'function') {
      __results.push({ passed: false, args: c.args, expected: c.expected, got: undefined, error: 'Function ${spec.functionName} is not defined' });
      continue;
    }
    try {
      const raw = await __fn(...structuredClone(c.args));
      let got;
      try {
        got = __json(raw);
      } catch (e) {
        got = String(raw);
      }
      __results.push({ passed: __canon(got) === __canon(c.expected), args: c.args, expected: c.expected, got });
    } catch (e) {
      __results.push({ passed: false, args: c.args, expected: c.expected, got: undefined, error: __describe(e), errorLine: __line(e) });
    }
  }
  ${JS_REPORT_FN}(__results);
})();
`
}
