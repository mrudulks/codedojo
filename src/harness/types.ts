export interface TestCase {
  args: unknown[]
  expected: unknown
}

export interface TestResult {
  passed: boolean
  args: unknown[]
  expected: unknown
  got: unknown
  error?: string
  /** 1-based line in the user's code where the error was raised, when known. */
  errorLine?: number
}

/** What a runner needs to check a function against test cases. */
export interface TestSpec {
  functionName: string
  cases: TestCase[]
}
