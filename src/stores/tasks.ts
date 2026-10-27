import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import type { Language } from '../languages'
import { loadBundledTasks } from '../tasks/loader'
import { MODES, type Mode, type Task } from '../tasks/schema'
import { filterTasks, type TaskFilters } from '../tasks/filter'

export type View = 'home' | 'task'

export const useTasksStore = defineStore('tasks', () => {
  const { tasks: all, errors } = loadBundledTasks()
  if (errors.length > 0) console.error('Invalid task files', errors)

  const tasks = ref<Task[]>(all)
  const loadErrors = ref(errors)
  const view = ref<View>('home')
  const selectedId = ref<string | null>(null)
  const filters = reactive<TaskFilters>({
    difficulty: null,
    tag: null,
    query: '',
    languageOnly: true,
  })

  const selected = computed(() => tasks.value.find((t) => t.id === selectedId.value) ?? null)

  const allTags = computed(() => [...new Set(tasks.value.flatMap((t) => t.tags))].sort())

  function grouped(language: Language): { mode: Mode; tasks: Task[] }[] {
    const visible = filterTasks(tasks.value, filters, language)
    return MODES.map((mode) => ({ mode, tasks: visible.filter((t) => t.mode === mode) })).filter(
      (g) => g.tasks.length > 0,
    )
  }

  function open(id: string) {
    selectedId.value = id
    view.value = 'task'
  }

  function goHome() {
    view.value = 'home'
  }

  return { tasks, loadErrors, view, selectedId, selected, filters, allTags, grouped, open, goHome }
})
