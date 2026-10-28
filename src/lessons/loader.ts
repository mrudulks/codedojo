import { lessonSchema, LESSON_GROUPS, type Lesson } from './schema'

export interface LessonLoadError {
  file: string
  message: string
}

/** Validates raw lesson files; invalid files are reported and skipped. */
export function validateLessonFiles(files: Record<string, unknown>): {
  lessons: Lesson[]
  errors: LessonLoadError[]
} {
  const lessons: Lesson[] = []
  const errors: LessonLoadError[] = []
  const seen = new Set<string>()
  for (const [file, raw] of Object.entries(files)) {
    const parsed = lessonSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; ')
      errors.push({ file, message })
      continue
    }
    if (seen.has(parsed.data.id)) {
      errors.push({ file, message: `duplicate lesson id "${parsed.data.id}"` })
      continue
    }
    seen.add(parsed.data.id)
    lessons.push(parsed.data)
  }
  lessons.sort(
    (a, b) =>
      LESSON_GROUPS.indexOf(a.group) - LESSON_GROUPS.indexOf(b.group) ||
      a.order - b.order ||
      a.title.localeCompare(b.title),
  )
  return { lessons, errors }
}

/** Every JSON file under src/lessons/data is a lesson; adding one needs no code change. */
export function loadBundledLessons() {
  const files = import.meta.glob<unknown>('./data/*.json', { eager: true, import: 'default' })
  return validateLessonFiles(files)
}

/** Lessons that explain at least one of the given tags. */
export function lessonsForTags(lessons: Lesson[], tags: string[]): Lesson[] {
  return lessons.filter((l) => l.tags.some((t) => tags.includes(t)))
}
