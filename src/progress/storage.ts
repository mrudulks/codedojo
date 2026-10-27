import { createStore, get, set } from 'idb-keyval'
import { backupSchema, type Attempt, type Backup } from './types'

const store = createStore('codedojo', 'progress')
const ATTEMPTS_KEY = 'attempts'

export async function loadAttempts(): Promise<Attempt[]> {
  return (await get<Attempt[]>(ATTEMPTS_KEY, store)) ?? []
}

export async function saveAttempts(attempts: Attempt[]): Promise<void> {
  await set(ATTEMPTS_KEY, attempts, store)
}

export function toBackup(attempts: Attempt[], now = new Date()): Backup {
  return { app: 'codedojo', version: 1, exportedAt: now.toISOString(), attempts }
}

/** Parses an exported backup; throws with a readable message if it is not one. */
export function parseBackup(json: string): Backup {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new Error('That file is not valid JSON')
  }
  const parsed = backupSchema.safeParse(raw)
  if (!parsed.success) throw new Error('That file is not a Code Dojo progress backup')
  return parsed.data
}

/** Merges imported attempts into existing ones, skipping ids already present. */
export function mergeAttempts(existing: Attempt[], incoming: Attempt[]): Attempt[] {
  const ids = new Set(existing.map((a) => a.id))
  return [...existing, ...incoming.filter((a) => !ids.has(a.id))].sort((a, b) => a.date - b.date)
}
