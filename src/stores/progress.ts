import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Language } from '../languages'
import { buildDashboard, solvedSets } from '../progress/stats'
import { todayQueue } from '../progress/scheduler'
import {
  loadAttempts,
  mergeAttempts,
  parseBackup,
  saveAttempts,
  toBackup,
} from '../progress/storage'
import type { Attempt } from '../progress/types'
import { useTasksStore } from './tasks'

export type NewAttempt = Omit<Attempt, 'id' | 'date'>

export const useProgressStore = defineStore('progress', () => {
  const attempts = ref<Attempt[]>([])
  const loaded = ref(false)
  const storageError = ref<string | null>(null)
  const tasksStore = useTasksStore()

  async function load() {
    try {
      attempts.value = await loadAttempts()
    } catch (err) {
      storageError.value = `Progress could not be loaded: ${String(err)}`
    } finally {
      loaded.value = true
    }
  }

  async function persist() {
    try {
      // IndexedDB can't clone Vue's reactive proxies; store plain copies.
      await saveAttempts(attempts.value.map((a) => ({ ...a })))
      storageError.value = null
    } catch (err) {
      storageError.value = `Progress could not be saved: ${String(err)}`
    }
  }

  async function record(entry: NewAttempt) {
    const attempt: Attempt = { ...entry, id: crypto.randomUUID(), date: Date.now() }
    attempts.value = [...attempts.value, attempt]
    await persist()
  }

  const solved = computed(() => solvedSets(attempts.value))

  function isSolved(taskId: string, language: Language): boolean {
    return solved.value[language].has(taskId)
  }

  const dashboard = computed(() => buildDashboard(tasksStore.tasks, attempts.value))

  function queue(language: Language) {
    return todayQueue(tasksStore.tasks, attempts.value, language)
  }

  function exportJson(): string {
    return JSON.stringify(toBackup(attempts.value), null, 2)
  }

  /** Returns how many attempts were added. */
  async function importJson(json: string): Promise<number> {
    const backup = parseBackup(json)
    const before = attempts.value.length
    attempts.value = mergeAttempts(attempts.value, backup.attempts)
    await persist()
    return attempts.value.length - before
  }

  return {
    attempts,
    loaded,
    storageError,
    load,
    record,
    isSolved,
    dashboard,
    queue,
    exportJson,
    importJson,
  }
})
