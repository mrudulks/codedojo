import { taskSchema, type Task } from './schema'

export interface TaskLoadError {
  file: string
  message: string
}

export interface LoadedTasks {
  tasks: Task[]
  errors: TaskLoadError[]
}

/** Validates raw task files; invalid files are reported and skipped. */
export function validateTaskFiles(files: Record<string, unknown>): LoadedTasks {
  const tasks: Task[] = []
  const errors: TaskLoadError[] = []
  const seen = new Set<string>()
  for (const [file, raw] of Object.entries(files)) {
    const parsed = taskSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; ')
      errors.push({ file, message })
      continue
    }
    if (seen.has(parsed.data.id)) {
      errors.push({ file, message: `duplicate task id "${parsed.data.id}"` })
      continue
    }
    seen.add(parsed.data.id)
    tasks.push(parsed.data)
  }
  tasks.sort((a, b) => a.difficulty - b.difficulty || a.title.localeCompare(b.title))
  return { tasks, errors }
}

/** Every JSON file under src/tasks/data is a task; adding one needs no code change. */
export function loadBundledTasks(): LoadedTasks {
  const files = import.meta.glob<unknown>('./data/**/*.json', { eager: true, import: 'default' })
  return validateTaskFiles(files)
}
