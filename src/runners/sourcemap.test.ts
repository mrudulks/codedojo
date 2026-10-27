import { describe, expect, it } from 'vitest'
import { getTsCompiler } from '../../tests/helpers/execute'
import { createLineMapper } from './sourcemap'

describe('createLineMapper', () => {
  it('maps transpiled lines back to TypeScript lines', () => {
    const code = [
      'interface Point {',
      '  x: number',
      '}',
      'type Id = string',
      'const p: Point = { x: 1 }',
      "throw new Error('boom')",
    ].join('\n')
    const { js, mappings } = getTsCompiler().transpile(code)
    const jsLine = js.split('\n').findIndex((l) => l.includes('throw')) + 1
    expect(jsLine).toBeLessThan(6)
    expect(createLineMapper(mappings)(jsLine)).toBe(6)
  })
})
