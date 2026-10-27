import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'

const EDITING_KEYS = new Set(['Enter', 'Tab', 'Backspace', 'Delete'])

/** True for keys that type or erase text (not shortcuts or navigation). */
export function isTypingKey(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.isComposing) return false
  return event.key.length === 1 || EDITING_KEYS.has(event.key)
}

export function keystrokeCounter(onKeystroke: () => void): Extension {
  return EditorView.domEventHandlers({
    keydown(event) {
      if (isTypingKey(event)) onKeystroke()
      return false
    },
    compositionend() {
      onKeystroke()
      return false
    },
  })
}
