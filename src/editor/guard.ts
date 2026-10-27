import { Annotation, EditorState, type Extension, type Transaction } from '@codemirror/state'
import { EditorView } from '@codemirror/view'

export type BlockedKind = 'paste' | 'drop' | 'bulk'

/** Longest insertion accepted from a single input event in strict mode. */
export const MAX_TYPED_INSERT = 4

/** Marks programmatic changes made by our own commands as trusted. */
export const trustedInput = Annotation.define<boolean>()

const BLOCKED_INPUT_TYPES = new Set([
  'insertFromPaste',
  'insertFromPasteAsQuotation',
  'insertFromDrop',
  'insertFromYank',
  'insertReplacementText',
])

function longestInsertion(tr: Transaction): string {
  let longest = ''
  tr.changes.iterChanges((_fromA, _toA, _fromB, _toB, inserted) => {
    const text = inserted.toString()
    if (text.length > longest.length) longest = text
  })
  return longest
}

/**
 * Decides whether a transaction is bulk insertion rather than typing.
 * - Changes without a user event (starter code, resets) are programmatic and allowed.
 * - Undo/redo only restore what was typed before, so they are allowed.
 * - IME composition can legitimately produce many characters at once.
 * - Whitespace-only insertions come from Enter/Tab/auto-indent.
 * - Any other user input inserting more than MAX_TYPED_INSERT characters is bulk.
 */
export function classifyTransaction(tr: Transaction, strict: boolean): BlockedKind | null {
  if (!tr.docChanged || tr.annotation(trustedInput)) return null
  if (tr.isUserEvent('input.paste')) return 'paste'
  if (tr.isUserEvent('input.drop') || tr.isUserEvent('move.drop')) return 'drop'
  if (!strict) return null
  if (!tr.isUserEvent('input') || tr.isUserEvent('input.type.compose')) return null
  const inserted = longestInsertion(tr)
  if (inserted.length <= MAX_TYPED_INSERT || /^\s*$/.test(inserted)) return null
  return 'bulk'
}

export interface GuardOptions {
  strict: boolean
  onBlocked: (kind: BlockedKind) => void
}

/** The manual-typing guard: text only enters the editor through keystrokes. */
export function manualTypingGuard({ strict, onBlocked }: GuardOptions): Extension {
  return [
    EditorView.domEventHandlers({
      paste(event) {
        event.preventDefault()
        onBlocked('paste')
        return true
      },
      drop(event) {
        event.preventDefault()
        onBlocked('drop')
        return true
      },
      dragover(event) {
        event.preventDefault()
        return true
      },
      beforeinput(event) {
        if (BLOCKED_INPUT_TYPES.has(event.inputType)) {
          event.preventDefault()
          onBlocked(event.inputType === 'insertFromDrop' ? 'drop' : 'paste')
          return true
        }
        return false
      },
    }),
    EditorView.contentAttributes.of({
      spellcheck: 'false',
      autocorrect: 'off',
      autocapitalize: 'off',
      autocomplete: 'off',
      translate: 'no',
      'data-gramm': 'false',
      'data-lt-active': 'false',
    }),
    EditorState.transactionFilter.of((tr) => {
      const blocked = classifyTransaction(tr, strict)
      if (!blocked) return tr
      // Report after the current update finishes; filters must stay side-effect free.
      queueMicrotask(() => onBlocked(blocked))
      return []
    }),
  ]
}
