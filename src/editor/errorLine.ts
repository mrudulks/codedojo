import type { Extension } from '@codemirror/state'
import { Decoration, EditorView } from '@codemirror/view'

const errorLine = Decoration.line({ class: 'cm-error-line' })

/** Tints the line an error points at. */
export function errorLineHighlight(line: number | null | undefined): Extension {
  if (!line) return []
  return EditorView.decorations.of((view) => {
    if (line > view.state.doc.lines) return Decoration.none
    return Decoration.set([errorLine.range(view.state.doc.line(line).from)])
  })
}
