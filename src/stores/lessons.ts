import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loadBundledLessons, lessonsForTags } from '../lessons/loader'
import type { Lesson } from '../lessons/schema'
import { useTasksStore } from './tasks'

export const useLessonsStore = defineStore('lessons', () => {
  const { lessons: all, errors } = loadBundledLessons()
  if (errors.length > 0) console.error('Invalid lesson files', errors)

  const lessons = ref<Lesson[]>(all)
  const selectedId = ref<string | null>(null)
  const selected = computed(() => lessons.value.find((l) => l.id === selectedId.value) ?? null)

  function forTags(tags: string[]): Lesson[] {
    return lessonsForTags(lessons.value, tags)
  }

  /** Opens a lesson, or the lesson index when `id` is null. */
  function open(id: string | null) {
    selectedId.value = id
    useTasksStore().view = 'learn'
  }

  return { lessons, selectedId, selected, forTags, open }
})
