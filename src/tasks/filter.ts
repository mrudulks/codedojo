import type { Language } from '../languages'
import type { Task } from './schema'

export interface TaskFilters {
  difficulty: number | null
  tag: string | null
  query: string
  /** Only show tasks available in the current language. */
  languageOnly: boolean
}

export function filterTasks(tasks: Task[], filters: TaskFilters, language: Language): Task[] {
  const query = filters.query.trim().toLowerCase()
  return tasks.filter(
    (t) =>
      (!filters.languageOnly || t.languages.includes(language)) &&
      (filters.difficulty === null || t.difficulty === filters.difficulty) &&
      (filters.tag === null || t.tags.includes(filters.tag)) &&
      (query === '' ||
        t.title.toLowerCase().includes(query) ||
        t.tags.some((tag) => tag.includes(query))),
  )
}
