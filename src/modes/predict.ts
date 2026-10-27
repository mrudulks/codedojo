export interface OutputLine {
  expected: string | undefined
  predicted: string | undefined
  matches: boolean
}

export interface OutputComparison {
  passed: boolean
  lines: OutputLine[]
}

/** Normalises line endings, trailing spaces and trailing blank lines. */
export function normalizeOutput(text: string): string[] {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  return lines
}

/** Line-by-line comparison of the real output with the user's prediction. */
export function compareOutput(actual: string, predicted: string): OutputComparison {
  const expected = normalizeOutput(actual)
  const guess = normalizeOutput(predicted)
  const lines: OutputLine[] = []
  for (let i = 0; i < Math.max(expected.length, guess.length); i++) {
    const e = expected[i]
    const p = guess[i]
    lines.push({ expected: e, predicted: p, matches: e === p })
  }
  return { passed: lines.every((l) => l.matches), lines }
}
