export const LANGUAGES = ['javascript', 'typescript', 'python'] as const

export type Language = (typeof LANGUAGES)[number]

export const LANGUAGE_LABELS: Record<Language, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
}

export const LANGUAGE_SHORT: Record<Language, string> = {
  javascript: 'JS',
  typescript: 'TS',
  python: 'Py',
}

/** Python uses 4-space indentation by default, JS/TS use 2. */
export const DEFAULT_INDENT: Record<Language, 2 | 4> = {
  javascript: 2,
  typescript: 2,
  python: 4,
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value)
}
