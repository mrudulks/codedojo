import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { hasPython, runJs, runPy, runTs, type NodeRun } from '../../tests/helpers/execute'
import type { Language } from '../languages'
import { checkConstraints } from '../modes/constraints'
import { validateTaskFiles } from './loader'
import { isTestedTask, taskSchema, type Task, type TestedTask } from './schema'

const DATA_DIR = join(__dirname, 'data')

function readAll(dir: string): Record<string, unknown> {
  const files: Record<string, unknown> = {}
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) Object.assign(files, readAll(path))
    else if (name.endsWith('.json')) files[path] = JSON.parse(readFileSync(path, 'utf8'))
  }
  return files
}

const files = readAll(DATA_DIR)
const { tasks, errors } = validateTaskFiles(files)

function run(language: Language, code: string, task?: TestedTask): Promise<NodeRun> | NodeRun {
  const spec = task && { functionName: task.functionName[language]!, cases: task.tests }
  if (language === 'javascript') return runJs(code, spec)
  if (language === 'typescript') return runTs(code, spec)
  return runPy(code, spec)
}

const canRun = (lang: Language) => lang !== 'python' || hasPython

function describeFailure(r: NodeRun): string {
  return JSON.stringify(
    { error: r.error, diagnostics: r.diagnostics, results: r.results?.filter((x) => !x.passed) },
    null,
    2,
  )
}

describe('task files', () => {
  it('all validate against the schema', () => {
    expect(errors).toEqual([])
    expect(tasks.length).toBe(Object.keys(files).length)
  })

  it('live in the folder named after their mode, named after their id', () => {
    for (const [path, raw] of Object.entries(files)) {
      const task = taskSchema.parse(raw)
      expect(path.endsWith(join(task.mode, `${task.id}.json`))).toBe(true)
    }
  })

  it('include 10 solve tasks of difficulty 1–3', () => {
    const solve = tasks.filter((t) => t.mode === 'solve')
    expect(solve).toHaveLength(10)
    expect(solve.every((t) => t.difficulty <= 3)).toBe(true)
  })

  it('include at least 3 tasks per mode per language', () => {
    for (const mode of ['fix', 'predict', 'drill', 'translate', 'refactor'] as const) {
      for (const lang of ['javascript', 'typescript', 'python'] as const) {
        const count = tasks.filter((t) => t.mode === mode && t.languages.includes(lang)).length
        expect(count, `${mode}/${lang}`).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('rejects a task missing a per-language field', () => {
    const broken = {
      ...(files[Object.keys(files)[0]!] as Task),
      starter: {},
      code: {},
      snippet: {},
    }
    expect(taskSchema.safeParse(broken).success).toBe(false)
  })
})

const testedTasks = tasks.filter(isTestedTask)

describe.each(testedTasks.map((t) => [t.id, t] as const))('task %s', (_id, task) => {
  for (const lang of task.languages) {
    const reference = task.mode === 'translate' ? task.source[lang] : task.solution?.[lang]

    it.skipIf(!canRun(lang))(`reference ${lang} solution passes every test`, async () => {
      expect(reference, 'tested tasks need a reference solution').toBeDefined()
      const result = await run(lang, reference!, task)
      expect(
        result.results?.every((r) => r.passed),
        describeFailure(result),
      ).toBe(true)
      if (task.mode === 'refactor') {
        const checks = checkConstraints(reference!, task.constraints[lang])
        expect(checks.filter((c) => !c.passed)).toEqual([])
      }
    })

    if (task.mode === 'fix') {
      it.skipIf(!canRun(lang))(`buggy ${lang} starter fails at least one test`, async () => {
        const result = await run(lang, task.starter[lang]!, task)
        expect(result.error ?? '').toBe('')
        expect(result.results?.some((r) => !r.passed)).toBe(true)
      })
    }

    if (task.mode === 'refactor') {
      it.skipIf(!canRun(lang))(
        `messy ${lang} starter passes tests but breaks a constraint`,
        async () => {
          const result = await run(lang, task.starter[lang]!, task)
          expect(
            result.results?.every((r) => r.passed),
            describeFailure(result),
          ).toBe(true)
          expect(
            checkConstraints(task.starter[lang]!, task.constraints[lang]).some((c) => !c.passed),
          ).toBe(true)
        },
      )
    }

    if (task.mode === 'solve' || task.mode === 'translate') {
      it.skipIf(!canRun(lang))(`${lang} starter does not pass`, async () => {
        const result = await run(lang, task.starter[lang]!, task)
        expect(result.results?.every((r) => r.passed) ?? false).toBe(false)
      })
    }
  }
})

describe.each(tasks.filter((t) => t.mode === 'predict').map((t) => [t.id, t] as const))(
  'predict task %s',
  (_id, task) => {
    for (const lang of task.languages) {
      it.skipIf(!canRun(lang))(
        `${lang} code runs without errors and prints something`,
        async () => {
          const result = await run(lang, task.code[lang]!)
          expect(result.error, describeFailure(result)).toBeUndefined()
          expect(result.stdout.trim()).not.toBe('')
        },
      )
    }
  },
)

describe.each(tasks.filter((t) => t.mode === 'drill').map((t) => [t.id, t] as const))(
  'drill task %s',
  (_id, task) => {
    it('snippets have no trailing whitespace or tabs', () => {
      for (const lang of task.languages) {
        const snippet = task.snippet[lang]!
        expect(snippet).not.toMatch(/[ \t]$/m)
        expect(snippet).not.toContain('\t')
      }
    })
  },
)
