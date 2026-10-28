import { z } from 'zod'
import { LANGUAGES, type Language } from '../languages'

export const LESSON_GROUPS = ['start', 'basics', 'patterns', 'language', 'advanced'] as const
export type LessonGroup = (typeof LESSON_GROUPS)[number]

export const LESSON_GROUP_LABELS: Record<LessonGroup, string> = {
  start: 'Start here',
  basics: 'The basics',
  patterns: 'Problem-solving patterns',
  language: 'How the language behaves',
  advanced: 'Going further',
}

const language = z.enum(LANGUAGES)

const example = z.object({
  code: z.string().min(1),
  /** Exactly what the code prints; the Vitest suite runs every example to check it. */
  output: z.string(),
})

const section = z.object({
  heading: z.string().min(1),
  /** Paragraphs; a paragraph starting with "- " is a bullet. Supports `code` and **bold**. */
  body: z.array(z.string().min(1)).min(1),
  /** Only shown for these languages (defaults to all of the lesson's languages). */
  languages: z.array(language).min(1).optional(),
  example: z.partialRecord(language, example).optional(),
})

export const lessonSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'use kebab-case'),
    group: z.enum(LESSON_GROUPS),
    order: z.number().int().positive(),
    title: z.string().min(1),
    summary: z.string().min(1),
    /** Task tags this lesson explains; tasks with these tags link here. */
    tags: z.array(z.string().min(1)),
    languages: z.array(language).min(1),
    sections: z.array(section).min(1),
    mistakes: z.array(z.string().min(1)).optional(),
  })
  .superRefine((lesson, ctx) => {
    lesson.sections.forEach((s, i) => {
      for (const lang of s.languages ?? []) {
        if (!lesson.languages.includes(lang)) {
          ctx.addIssue({
            code: 'custom',
            path: ['sections', i, 'languages'],
            message: `"${lang}" is not one of the lesson's languages`,
          })
        }
      }
      if (!s.example) return
      for (const lang of sectionLanguages(lesson, s)) {
        if (!exampleFor(s, lang)) {
          ctx.addIssue({
            code: 'custom',
            path: ['sections', i, 'example'],
            message: `missing a ${lang} example`,
          })
        }
      }
    })
  })

export type Lesson = z.infer<typeof lessonSchema>
export type LessonSection = Lesson['sections'][number]
export type LessonExample = z.infer<typeof example>

export function sectionLanguages(lesson: Lesson, s: LessonSection): Language[] {
  return s.languages ?? lesson.languages
}

/**
 * The example to show for a language. TypeScript falls back to the JavaScript
 * example when the two would be identical; `sharedFrom` says so.
 */
export function exampleFor(
  s: LessonSection,
  lang: Language,
): { example: LessonExample; language: Language; sharedFrom?: Language } | null {
  const own = s.example?.[lang]
  if (own) return { example: own, language: lang }
  const js = s.example?.javascript
  if (lang === 'typescript' && js) {
    return { example: js, language: 'javascript', sharedFrom: 'javascript' }
  }
  return null
}
