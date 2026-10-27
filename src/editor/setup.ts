import {
  copyLineDown,
  copyLineUp,
  defaultKeymap,
  history,
  historyKeymap,
  toggleBlockComment,
  toggleComment,
  toggleLineComment,
} from '@codemirror/commands'
import { bracketMatching, indentOnInput, indentUnit } from '@codemirror/language'
import { Compartment, EditorState, type Extension } from '@codemirror/state'
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  type KeyBinding,
} from '@codemirror/view'
import { dedent, insertSpaces, newline } from './commands'
import { manualTypingGuard, type BlockedKind } from './guard'
import { languageExtension, type EditorLanguage } from './languages'
import { keystrokeCounter } from './stats'
import { editorTheme } from './theme'

/** Commands that put text into the editor without typing it. */
const COPYING_COMMANDS = new Set<unknown>([
  copyLineDown,
  copyLineUp,
  toggleComment,
  toggleLineComment,
  toggleBlockComment,
])

const safeDefaultKeymap: readonly KeyBinding[] = defaultKeymap.filter(
  (binding) => !binding.run || !COPYING_COMMANDS.has(binding.run),
)

export interface EditorSettings {
  language: EditorLanguage
  strict: boolean
  autoIndent: boolean
  tabSize: number
  readOnly: boolean
  lineNumbers: boolean
}

export interface EditorCallbacks {
  onChange?: (doc: string) => void
  onKeystroke?: () => void
  onBlocked?: (kind: BlockedKind) => void
  onRun?: () => void
}

export interface EditorController {
  readonly view: EditorView
  getDoc(): string
  /** Replaces the document programmatically (starter code); clears undo history. */
  setDoc(doc: string): void
  configure(settings: Partial<EditorSettings>): void
  setExtra(extension: Extension): void
  focus(): void
  destroy(): void
}

export function createEditor(
  parent: HTMLElement,
  doc: string,
  initial: EditorSettings,
  callbacks: EditorCallbacks = {},
): EditorController {
  let settings = { ...initial }
  const language = new Compartment()
  const guard = new Compartment()
  const indentation = new Compartment()
  const readOnly = new Compartment()
  const gutter = new Compartment()
  const extra = new Compartment()
  let extraExtension: Extension = []

  const guardExt = () =>
    settings.readOnly
      ? []
      : manualTypingGuard({
          strict: settings.strict,
          onBlocked: (kind) => callbacks.onBlocked?.(kind),
        })

  const indentExt = () => [
    indentUnit.of(' '.repeat(settings.tabSize)),
    EditorState.tabSize.of(settings.tabSize),
    settings.autoIndent ? indentOnInput() : [],
    keymap.of([
      { key: 'Enter', run: newline(settings.autoIndent) },
      { key: 'Tab', run: insertSpaces, shift: dedent },
    ]),
  ]

  const readOnlyExt = () =>
    settings.readOnly ? [EditorState.readOnly.of(true), EditorView.editable.of(false)] : []

  const gutterExt = () => (settings.lineNumbers ? [lineNumbers(), highlightActiveLineGutter()] : [])

  const runKeymap = keymap.of([
    {
      key: 'Mod-Enter',
      run: () => {
        callbacks.onRun?.()
        return true
      },
    },
  ])

  function buildState(text: string): EditorState {
    return EditorState.create({
      doc: text,
      extensions: [
        runKeymap,
        gutter.of(gutterExt()),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        highlightActiveLine(),
        bracketMatching(),
        indentation.of(indentExt()),
        keymap.of([...safeDefaultKeymap, ...historyKeymap]),
        language.of(languageExtension(settings.language)),
        guard.of(guardExt()),
        readOnly.of(readOnlyExt()),
        extra.of(extraExtension),
        keystrokeCounter(() => callbacks.onKeystroke?.()),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) callbacks.onChange?.(update.state.doc.toString())
        }),
        editorTheme,
      ],
    })
  }

  const view = new EditorView({ state: buildState(doc), parent })

  return {
    view,
    getDoc: () => view.state.doc.toString(),
    setDoc(text) {
      view.setState(buildState(text))
    },
    configure(next) {
      settings = { ...settings, ...next }
      view.dispatch({
        effects: [
          language.reconfigure(languageExtension(settings.language)),
          guard.reconfigure(guardExt()),
          indentation.reconfigure(indentExt()),
          readOnly.reconfigure(readOnlyExt()),
          gutter.reconfigure(gutterExt()),
        ],
      })
    },
    setExtra(extension) {
      extraExtension = extension
      view.dispatch({ effects: extra.reconfigure(extension) })
    },
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  }
}
