export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export function formatMs(ms: number): string {
  if (ms < 1) return '<1 ms'
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`
}

/** Values in test results are shown as compact JSON. */
export function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined'
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export interface RichPart {
  kind: 'text' | 'code' | 'bold'
  text: string
}

/** Splits prose on `backticks` and **stars** into parts (rendered without v-html). */
export function splitRichText(text: string): RichPart[] {
  return text
    .split(/(`[^`]+`|\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part): RichPart => {
      if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
        return { kind: 'code', text: part.slice(1, -1) }
      }
      if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
        return { kind: 'bold', text: part.slice(2, -2) }
      }
      return { kind: 'text', text: part }
    })
}
