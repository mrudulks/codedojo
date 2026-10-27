import { RangeSetBuilder, type Extension } from '@codemirror/state'
import {
  Decoration,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view'
import { countInsertMistakes, mismatchPositions } from '../modes/drill'

const wrong = Decoration.mark({ class: 'cm-drill-wrong' })

function build(view: EditorView, target: string): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  const positions = mismatchPositions(target, view.state.doc.toString())
  let i = 0
  while (i < positions.length) {
    const start = positions[i]!
    let end = start + 1
    while (positions[i + 1] === end) {
      end++
      i++
    }
    builder.add(start, end, wrong)
    i++
  }
  return builder.finish()
}

export interface DrillTracking {
  /** Called for each typed insertion with the number of characters and how many were wrong. */
  onInsert(chars: number, mistakes: number): void
}

/** Highlights characters that differ from the target and counts mistakes as they happen. */
export function drillExtension(target: string, tracking: DrillTracking): Extension {
  const highlight = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      constructor(view: EditorView) {
        this.decorations = build(view, target)
      }
      update(update: ViewUpdate) {
        if (update.docChanged) this.decorations = build(update.view, target)
      }
    },
    { decorations: (v) => v.decorations },
  )
  const counter = EditorView.updateListener.of((update) => {
    for (const tr of update.transactions) {
      if (!tr.isUserEvent('input')) continue
      tr.changes.iterChanges((_fa, _ta, fromB, _tb, inserted) => {
        const text = inserted.toString()
        if (text) tracking.onInsert(text.length, countInsertMistakes(target, fromB, text))
      })
    }
  })
  return [highlight, counter]
}
