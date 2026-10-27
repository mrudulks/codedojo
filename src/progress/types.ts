import { z } from 'zod'
import { LANGUAGES } from '../languages'
import { MODES } from '../tasks/schema'

export const attemptSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  language: z.enum(LANGUAGES),
  mode: z.enum(MODES),
  passed: z.boolean(),
  /** Time on task when the attempt was recorded. */
  timeMs: z.number().nonnegative(),
  keystrokes: z.number().int().nonnegative(),
  hintsUsed: z.number().int().nonnegative(),
  /** Epoch milliseconds. */
  date: z.number(),
  wpm: z.number().nonnegative().optional(),
  accuracy: z.number().min(0).max(1).optional(),
})

export type Attempt = z.infer<typeof attemptSchema>

export const backupSchema = z.object({
  app: z.literal('codedojo'),
  version: z.literal(1),
  exportedAt: z.string(),
  attempts: z.array(attemptSchema),
})

export type Backup = z.infer<typeof backupSchema>
