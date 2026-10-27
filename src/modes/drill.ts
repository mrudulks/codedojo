export interface DrillStats {
  /** Words per minute, where a word is 5 correct characters. */
  wpm: number
  /** Share of typed characters that were right when typed (0–1). */
  accuracy: number
  correctChars: number
  mistakes: number
  complete: boolean
}

/** Positions in `typed` that differ from `target` (extra characters included). */
export function mismatchPositions(target: string, typed: string): number[] {
  const wrong: number[] = []
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] !== target[i]) wrong.push(i)
  }
  return wrong
}

/** Length of the correct prefix: how far into the snippet the user has got. */
export function correctPrefixLength(target: string, typed: string): number {
  let i = 0
  while (i < typed.length && i < target.length && typed[i] === target[i]) i++
  return i
}

/** Counts characters in an insertion at `from` that do not match the target. */
export function countInsertMistakes(target: string, from: number, inserted: string): number {
  let mistakes = 0
  for (let i = 0; i < inserted.length; i++) {
    if (inserted[i] !== target[from + i]) mistakes++
  }
  return mistakes
}

export function drillStats(
  target: string,
  typed: string,
  elapsedMs: number,
  charsTyped: number,
  mistakes: number,
): DrillStats {
  const correctChars = correctPrefixLength(target, typed)
  const minutes = elapsedMs / 60000
  const wpm = minutes > 0 ? correctChars / 5 / minutes : 0
  const accuracy = charsTyped > 0 ? Math.max(0, (charsTyped - mistakes) / charsTyped) : 1
  return {
    wpm: Math.round(wpm),
    accuracy,
    correctChars,
    mistakes,
    complete: typed === target,
  }
}
