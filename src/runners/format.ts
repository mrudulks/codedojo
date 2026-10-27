/**
 * A small Node-style `util.inspect` so console output in the browser reads the
 * way most people expect: `console.log([1, 2])` prints `[ 1, 2 ]`.
 * Output always stays on one line.
 */
const MAX_DEPTH = 2
const MAX_ITEMS = 100

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

function quote(text: string): string {
  const escaped = text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\t/g, '\\t')
  if (!escaped.includes("'")) return `'${escaped}'`
  if (!escaped.includes('"')) return `"${escaped}"`
  return `'${escaped.replace(/'/g, "\\'")}'`
}

function formatKey(key: string | symbol): string {
  if (typeof key === 'symbol') return `[${key.toString()}]`
  return IDENTIFIER.test(key) ? key : quote(key)
}

function wrap(prefix: string, items: string[], open: string, close: string): string {
  const head = prefix ? `${prefix} ` : ''
  if (items.length === 0) return `${head}${open}${close}`
  return `${head}${open} ${items.join(', ')} ${close}`
}

function constructorName(value: object): string | null {
  const proto: unknown = Object.getPrototypeOf(value)
  if (proto === null) return null
  const ctor = (proto as { constructor?: { name?: string } }).constructor
  return typeof ctor?.name === 'string' ? ctor.name : ''
}

function formatValue(value: unknown, depth: number, seen: Set<object>): string {
  switch (typeof value) {
    case 'string':
      return quote(value)
    case 'number':
      return Object.is(value, -0) ? '-0' : String(value)
    case 'bigint':
      return `${value}n`
    case 'boolean':
    case 'undefined':
      return String(value)
    case 'symbol':
      return value.toString()
    case 'function': {
      const source = Function.prototype.toString.call(value)
      if (source.startsWith('class')) return `[class ${value.name || '(anonymous)'}]`
      return value.name ? `[Function: ${value.name}]` : '[Function (anonymous)]'
    }
  }
  if (value === null) return 'null'
  const obj = value as object

  if (obj instanceof Date) return Number.isNaN(obj.getTime()) ? 'Invalid Date' : obj.toISOString()
  if (obj instanceof RegExp) return obj.toString()
  if (obj instanceof Error) return obj.stack?.split('\n')[0] ?? `${obj.name}: ${obj.message}`
  if (obj instanceof Promise) return 'Promise {}'
  if (seen.has(obj)) return '[Circular]'

  const name = constructorName(obj)
  if (depth > MAX_DEPTH) {
    if (Array.isArray(obj)) return '[Array]'
    return `[${name || 'Object'}]`
  }

  seen.add(obj)
  try {
    const inner = (v: unknown) => formatValue(v, depth + 1, seen)
    if (Array.isArray(obj)) {
      const items = obj.slice(0, MAX_ITEMS).map((v) => inner(v))
      if (obj.length > MAX_ITEMS) items.push(`... ${obj.length - MAX_ITEMS} more items`)
      return wrap(name === 'Array' ? '' : (name ?? ''), items, '[', ']')
    }
    if (obj instanceof Map) {
      const items = [...obj].map(([k, v]) => `${inner(k)} => ${inner(v)}`)
      return wrap(`Map(${obj.size})`, items, '{', '}')
    }
    if (obj instanceof Set) {
      return wrap(`Set(${obj.size})`, [...obj].map(inner), '{', '}')
    }
    const keys: (string | symbol)[] = [
      ...Object.keys(obj),
      ...Object.getOwnPropertySymbols(obj).filter((s) =>
        Object.prototype.propertyIsEnumerable.call(obj, s),
      ),
    ]
    const record = obj as Record<string | symbol, unknown>
    const items = keys.map((k) => `${formatKey(k)}: ${inner(record[k])}`)
    const prefix = name === null ? '[Object: null prototype]' : name === 'Object' ? '' : name
    return wrap(prefix, items, '{', '}')
  } finally {
    seen.delete(obj)
  }
}

export function inspect(value: unknown): string {
  return formatValue(value, 0, new Set())
}

/** Joins console arguments the way Node does: top-level strings print raw. */
export function formatLogArgs(args: unknown[]): string {
  return args.map((a) => (typeof a === 'string' ? a : inspect(a))).join(' ')
}
