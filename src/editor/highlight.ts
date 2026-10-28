import { javascriptLanguage, typescriptLanguage } from '@codemirror/lang-javascript'
import { pythonLanguage } from '@codemirror/lang-python'
import { classHighlighter, highlightCode } from '@lezer/highlight'
import type { Language } from '../languages'

export interface HighlightToken {
  text: string
  /** Space-separated `tok-*` classes; empty for unstyled text. */
  classes: string
}

const PARSERS = {
  javascript: javascriptLanguage.parser,
  typescript: typescriptLanguage.parser,
  python: pythonLanguage.parser,
}

/** Static syntax highlighting for read-only code (no editor instance needed). */
export function highlightLines(code: string, language: Language): HighlightToken[][] {
  const lines: HighlightToken[][] = [[]]
  highlightCode(
    code,
    PARSERS[language].parse(code),
    classHighlighter,
    (text, classes) => lines[lines.length - 1]!.push({ text, classes }),
    () => lines.push([]),
  )
  return lines
}
