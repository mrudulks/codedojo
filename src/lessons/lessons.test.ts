import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { hasPython, runJs, runPy, runTs } from '../../tests/helpers/execute'
import type { Language } from '../languages'
import { validateTaskFiles } from '../tasks/loader'
import { lessonsForTags, validateLessonFiles } from './loader'

function readJsonDir(dir: string, recursive = false): Record<string, unknown> {
  const files: Record<string, unknown> = {}
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory() && recursive) Object.assign(files, readJsonDir(path, true))
    else if (entry.name.endsWith('.json')) files[path] = JSON.parse(readFileSync(path, 'utf8'))
  }
  return files
}

const files = readJsonDir(join(__dirname, 'data'))
const { lessons, errors } = validateLessonFiles(files)
const { tasks } = validateTaskFiles(readJsonDir(join(__dirname, '../tasks/data'), true))

describe('lesson files', () => {
  it('all validate against the schema', () => {
    expect(errors).toEqual([])
    expect(lessons.length).toBe(Object.keys(files).length)
  })

  it('are named after their id', () => {
    for (const [path, raw] of Object.entries(files)) {
      expect(path.endsWith(`${(raw as { id: string }).id}.json`)).toBe(true)
    }
  })

  it('explain every tag used by a task', () => {
    const tags = new Set(tasks.flatMap((t) => t.tags))
    const missing = [...tags].filter((tag) => lessonsForTags(lessons, [tag]).length === 0)
    expect(missing).toEqual([])
  })
})

const examples = lessons.flatMap((lesson) =>
  lesson.sections.flatMap((section) =>
    Object.entries(section.example ?? {}).map(([language, example]) => ({
      name: `${lesson.id} · ${section.heading} · ${language}`,
      language: language as Language,
      ...example,
    })),
  ),
)

describe('lesson examples print exactly their stated output', () => {
  it.each(examples)('$name', async ({ language, code, output }) => {
    if (language === 'python' && !hasPython) return
    const run =
      language === 'javascript'
        ? await runJs(code)
        : language === 'typescript'
          ? await runTs(code)
          : runPy(code)
    expect(run.diagnostics ?? []).toEqual([])
    expect(run.error).toBeUndefined()
    expect(run.stdout.trimEnd()).toBe(output)
  })
})
