import { EditorState } from '@codemirror/state'
import { describe, expect, it } from 'vitest'
import { classifyTransaction, trustedInput } from './guard'

const state = EditorState.create({ doc: 'abc' })
const insert = (text: string, userEvent?: string, trusted = false) =>
  state.update({
    changes: { from: 3, insert: text },
    userEvent,
    annotations: trusted ? trustedInput.of(true) : [],
  })

describe('classifyTransaction', () => {
  it('allows single keystrokes and short IME-free input', () => {
    expect(classifyTransaction(insert('x', 'input.type'), true)).toBeNull()
    expect(classifyTransaction(insert('abcd', 'input.type'), true)).toBeNull()
  })

  it('blocks paste and drop even when strict mode is off', () => {
    expect(classifyTransaction(insert('x', 'input.paste'), false)).toBe('paste')
    expect(classifyTransaction(insert('x', 'input.drop'), false)).toBe('drop')
  })

  it('blocks bulk insertion such as autofill in strict mode only', () => {
    expect(classifyTransaction(insert('autofilled', 'input.type'), true)).toBe('bulk')
    expect(classifyTransaction(insert('autofilled', 'input.type'), false)).toBeNull()
    expect(classifyTransaction(insert('autocomplete', 'input.complete'), true)).toBe('bulk')
  })

  it('allows composition, whitespace, undo and programmatic changes', () => {
    expect(classifyTransaction(insert('こんにちは', 'input.type.compose'), true)).toBeNull()
    expect(classifyTransaction(insert('\n        ', 'input'), true)).toBeNull()
    expect(classifyTransaction(insert('restored text', 'undo'), true)).toBeNull()
    expect(classifyTransaction(insert('starter code'), true)).toBeNull()
    expect(classifyTransaction(insert('anything', 'input.type', true), true)).toBeNull()
  })
})
