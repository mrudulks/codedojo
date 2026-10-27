import type { Constraints } from '../tasks/schema'

export interface ConstraintCheck {
  label: string
  passed: boolean
  detail?: string
}

export function countCodeLines(code: string): number {
  return code.split('\n').filter((line) => line.trim() !== '').length
}

/** Checks refactor constraints: a max line count and banned patterns. */
export function checkConstraints(
  code: string,
  constraints: Constraints | undefined,
): ConstraintCheck[] {
  const checks: ConstraintCheck[] = []
  if (!constraints) return checks
  if (constraints.maxLines !== undefined) {
    const lines = countCodeLines(code)
    checks.push({
      label: `At most ${constraints.maxLines} non-blank lines`,
      passed: lines <= constraints.maxLines,
      detail: `${lines} line${lines === 1 ? '' : 's'}`,
    })
  }
  for (const banned of constraints.banned ?? []) {
    const match = new RegExp(banned.pattern, banned.flags).exec(code)
    checks.push({
      label: banned.message,
      passed: match === null,
      detail: match ? `Found on line ${code.slice(0, match.index).split('\n').length}` : undefined,
    })
  }
  return checks
}
