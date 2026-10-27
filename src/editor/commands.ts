import { indentLess, indentMore, insertNewline, insertNewlineAndIndent } from '@codemirror/commands'
import { indentUnit } from '@codemirror/language'
import { EditorSelection } from '@codemirror/state'
import type { Command } from '@codemirror/view'

/** Tab: insert spaces up to the next tab stop, or indent the selected lines. */
export const insertSpaces: Command = (view) => {
  const { state } = view
  if (state.readOnly) return false
  if (state.selection.ranges.some((r) => !r.empty)) return indentMore(view)
  const size = state.facet(indentUnit).length || 2
  view.dispatch(
    state.changeByRange((range) => {
      const line = state.doc.lineAt(range.head)
      const pad = size - ((range.head - line.from) % size)
      return {
        changes: { from: range.head, insert: ' '.repeat(pad) },
        range: EditorSelection.cursor(range.head + pad),
      }
    }),
    { userEvent: 'input.indent', scrollIntoView: true },
  )
  return true
}

export const dedent: Command = indentLess

/** Enter, with or without carrying the indentation over to the new line. */
export function newline(autoIndent: boolean): Command {
  return autoIndent ? insertNewlineAndIndent : insertNewline
}
