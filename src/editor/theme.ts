import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'

/** Colours come from CSS variables, so one theme serves light and dark. */
const base = EditorView.theme({
  '&': {
    color: 'var(--code-text)',
    backgroundColor: 'var(--code-bg)',
    height: '100%',
    fontSize: 'var(--code-size, 14px)',
  },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.6',
    // Ligatures would hide the characters you are practising (=> shown as ⇒).
    fontVariantLigatures: 'none',
    fontFeatureSettings: '"liga" 0, "calt" 0',
  },
  '.cm-content': { caretColor: 'var(--code-cursor)', padding: '12px 0' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--code-cursor)', borderLeftWidth: '2px' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
    { backgroundColor: 'var(--code-selection)' },
  '.cm-activeLine': { backgroundColor: 'var(--code-active-line)' },
  '.cm-gutters': {
    backgroundColor: 'var(--code-bg)',
    color: 'var(--code-gutter)',
    border: 'none',
    paddingLeft: '4px',
  },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--code-text)' },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 12px 0 8px', minWidth: '28px' },
  '&.cm-focused': { outline: 'none' },
  '.cm-matchingBracket': {
    backgroundColor: 'var(--code-match)',
    outline: 'none',
  },
  '.cm-drill-wrong': {
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger)',
    textDecoration: 'underline wavy var(--danger)',
  },
  '.cm-error-line': { backgroundColor: 'var(--danger-soft)' },
})

const highlight = HighlightStyle.define([
  {
    tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword],
    color: 'var(--code-keyword)',
  },
  {
    tag: [t.definitionKeyword, t.modifier, t.self],
    color: 'var(--code-keyword)',
    fontStyle: 'italic',
  },
  { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--code-string)' },
  { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--code-number)' },
  {
    tag: [t.comment, t.lineComment, t.blockComment],
    color: 'var(--code-comment)',
    fontStyle: 'italic',
  },
  {
    tag: [
      t.function(t.variableName),
      t.function(t.propertyName),
      t.function(t.definition(t.variableName)),
    ],
    color: 'var(--code-function)',
  },
  { tag: [t.typeName, t.className, t.namespace], color: 'var(--code-type)' },
  {
    tag: [t.definition(t.variableName), t.definition(t.propertyName)],
    color: 'var(--code-definition)',
  },
  { tag: [t.propertyName], color: 'var(--code-property)' },
  { tag: [t.operator, t.punctuation, t.bracket], color: 'var(--code-punctuation)' },
  { tag: t.invalid, color: 'var(--danger)' },
])

export const editorTheme: Extension = [base, syntaxHighlighting(highlight)]
