const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function decodeVlq(segment: string): number[] {
  const values: number[] = []
  let shift = 0
  let value = 0
  for (const char of segment) {
    const digit = BASE64.indexOf(char)
    if (digit < 0) break
    value += (digit & 31) << shift
    if (digit & 32) {
      shift += 5
    } else {
      const negative = value & 1
      value >>>= 1
      values.push(negative ? -value : value)
      value = 0
      shift = 0
    }
  }
  return values
}

/**
 * Builds a function mapping a 1-based generated line to the 1-based original
 * line, from a source map's `mappings` field (single source).
 */
export function createLineMapper(mappings: string): (generatedLine: number) => number | undefined {
  const lines: (number | undefined)[] = []
  let originalLine = 0
  for (const group of mappings.split(';')) {
    let first: number | undefined
    for (const segment of group.split(',')) {
      if (!segment) continue
      const fields = decodeVlq(segment)
      if (fields.length >= 4) {
        originalLine += fields[2] ?? 0
        first ??= originalLine
      }
    }
    lines.push(first === undefined ? undefined : first + 1)
  }
  return (generatedLine) => lines[generatedLine - 1]
}
