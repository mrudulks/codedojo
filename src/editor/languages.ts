import { javascriptLanguage, typescriptLanguage } from '@codemirror/lang-javascript'
import { pythonLanguage } from '@codemirror/lang-python'
import type { Extension } from '@codemirror/state'
import type { Language } from '../languages'

export type EditorLanguage = Language | 'plain'

/**
 * Only the parsers are used, not the full language support bundles, so no
 * completion sources or snippets are registered.
 */
export function languageExtension(language: EditorLanguage): Extension {
  switch (language) {
    case 'javascript':
      return javascriptLanguage
    case 'typescript':
      return typescriptLanguage
    case 'python':
      return pythonLanguage
    case 'plain':
      return []
  }
}
