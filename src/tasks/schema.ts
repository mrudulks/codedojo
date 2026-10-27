import { z } from 'zod'
import { LANGUAGES, type Language } from '../languages'

export const MODES = ['solve', 'fix', 'predict', 'drill', 'translate', 'refactor'] as const
export type Mode = (typeof MODES)[number]

export const MODE_LABELS: Record<Mode, string> = {
  solve: 'Solve',
  fix: 'Fix the bug',
  predict: 'Predict the output',
  drill: 'Typing drill',
  translate: 'Translate',
  refactor: 'Refactor',
}

const language = z.enum(LANGUAGES)
const identifier = z.string().regex(/^[A-Za-z_$][\w$]*$/, 'must be a valid identifier')

/** A value per language; only the task's languages need entries. */
const perLanguage = <T extends z.ZodType>(value: T) => z.partialRecord(language, value)

const testCase = z.object({
  args: z.array(z.unknown()),
  expected: z.unknown(),
})

const bannedPattern = z.object({
  pattern: z.string().min(1),
  flags: z
    .string()
    .regex(/^[gimsuy]*$/)
    .optional(),
  message: z.string().min(1),
})

const constraints = z.object({
  /** Maximum number of non-blank lines. */
  maxLines: z.number().int().positive().optional(),
  banned: z.array(bannedPattern).optional(),
})

const base = {
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'use kebab-case'),
  languages: z.array(language).min(1),
  difficulty: z.number().int().min(1).max(5),
  tags: z.array(z.string().min(1)),
  title: z.string().min(1),
  prompt: z.string().min(1),
  hints: z.array(z.string().min(1)).optional(),
}

const tested = {
  functionName: perLanguage(identifier),
  tests: z.array(testCase).min(1),
  /** Reference solutions; used by the Vitest suite, never shown before solving. */
  solution: perLanguage(z.string()).optional(),
}

const solveTask = z.object({
  ...base,
  ...tested,
  mode: z.literal('solve'),
  starter: perLanguage(z.string()),
})

const fixTask = z.object({
  ...base,
  ...tested,
  mode: z.literal('fix'),
  /** Buggy code the user starts from. */
  starter: perLanguage(z.string()),
})

const translateTask = z.object({
  ...base,
  ...tested,
  mode: z.literal('translate'),
  /** Working code in each language; one is shown read-only while you write another. */
  source: perLanguage(z.string()),
  starter: perLanguage(z.string()),
})

const refactorTask = z.object({
  ...base,
  ...tested,
  mode: z.literal('refactor'),
  /** Messy but working code. */
  starter: perLanguage(z.string()),
  constraints: perLanguage(constraints),
})

const predictTask = z.object({
  ...base,
  mode: z.literal('predict'),
  code: perLanguage(z.string().min(1)),
})

const drillTask = z.object({
  ...base,
  mode: z.literal('drill'),
  snippet: perLanguage(z.string().min(1)),
})

const taskUnion = z.discriminatedUnion('mode', [
  solveTask,
  fixTask,
  predictTask,
  drillTask,
  translateTask,
  refactorTask,
])

/** Fields that must have an entry for every language the task lists. */
const REQUIRED_PER_LANGUAGE: Record<Mode, string[]> = {
  solve: ['functionName', 'starter'],
  fix: ['functionName', 'starter'],
  translate: ['functionName', 'starter', 'source'],
  refactor: ['functionName', 'starter', 'constraints'],
  predict: ['code'],
  drill: ['snippet'],
}

export const taskSchema = taskUnion.superRefine((task, ctx) => {
  if (new Set(task.languages).size !== task.languages.length) {
    ctx.addIssue({ code: 'custom', message: 'languages has duplicates', path: ['languages'] })
  }
  const record = task as unknown as Record<string, Partial<Record<Language, unknown>> | undefined>
  for (const field of REQUIRED_PER_LANGUAGE[task.mode]) {
    for (const lang of task.languages) {
      if (record[field]?.[lang] === undefined) {
        ctx.addIssue({ code: 'custom', message: `missing ${field}.${lang}`, path: [field, lang] })
      }
    }
  }
  if (task.mode === 'translate' && task.languages.length < 2) {
    ctx.addIssue({
      code: 'custom',
      message: 'translate needs at least two languages',
      path: ['languages'],
    })
  }
  if (task.mode === 'refactor') {
    for (const [lang, c] of Object.entries(task.constraints)) {
      for (const b of c?.banned ?? []) {
        try {
          new RegExp(b.pattern, b.flags)
        } catch {
          ctx.addIssue({
            code: 'custom',
            message: `invalid regex ${b.pattern}`,
            path: ['constraints', lang],
          })
        }
      }
    }
  }
})

export type Task = z.infer<typeof taskUnion>
export type TaskOf<M extends Mode> = Extract<Task, { mode: M }>
export type TestedTask = TaskOf<'solve' | 'fix' | 'translate' | 'refactor'>
export type Constraints = z.infer<typeof constraints>

export function isTestedTask(task: Task): task is TestedTask {
  return 'tests' in task
}
