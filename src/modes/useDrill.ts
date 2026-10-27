import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import type { Language } from '../languages'
import { drillExtension } from '../editor/drill'
import { useProgressStore } from '../stores/progress'
import type { TaskOf } from '../tasks/schema'
import { drillStats, type DrillStats } from './drill'

export function useDrill(task: Ref<TaskOf<'drill'>>, language: Ref<Language>) {
  const progress = useProgressStore()

  const typed = ref('')
  const keystrokes = ref(0)
  const blocked = ref(0)
  const charsTyped = ref(0)
  const mistakes = ref(0)
  const startedAt = ref<number | null>(null)
  const finished = ref<(DrillStats & { timeMs: number }) | null>(null)
  const now = ref(Date.now())
  const version = ref(0)
  const timer = setInterval(() => (now.value = Date.now()), 500)
  onBeforeUnmount(() => clearInterval(timer))

  const target = computed(() => task.value.snippet[language.value] ?? '')
  const docKey = computed(() => `${task.value.id}|${language.value}|${version.value}`)
  const elapsedMs = computed(() => {
    if (finished.value) return finished.value.timeMs
    return startedAt.value === null ? 0 : Math.max(0, now.value - startedAt.value)
  })
  const live = computed(() =>
    drillStats(target.value, typed.value, elapsedMs.value, charsTyped.value, mistakes.value),
  )
  const progressRatio = computed(() =>
    target.value.length ? live.value.correctChars / target.value.length : 0,
  )

  const extension = computed(() =>
    drillExtension(target.value, {
      onInsert(chars, wrong) {
        if (finished.value) return
        startedAt.value ??= Date.now()
        charsTyped.value += chars
        mistakes.value += wrong
      },
    }),
  )

  function restart() {
    typed.value = ''
    keystrokes.value = 0
    blocked.value = 0
    charsTyped.value = 0
    mistakes.value = 0
    startedAt.value = null
    finished.value = null
    version.value++
  }

  watch(() => `${task.value.id}|${language.value}`, restart)

  watch(typed, async (value) => {
    if (finished.value || value !== target.value || startedAt.value === null) return
    const timeMs = Date.now() - startedAt.value
    const stats = drillStats(target.value, value, timeMs, charsTyped.value, mistakes.value)
    finished.value = { ...stats, timeMs }
    await progress.record({
      taskId: task.value.id,
      language: language.value,
      mode: 'drill',
      passed: true,
      timeMs,
      keystrokes: keystrokes.value,
      hintsUsed: 0,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
    })
  })

  return {
    typed,
    target,
    docKey,
    extension,
    keystrokes,
    blocked,
    elapsedMs,
    live,
    progressRatio,
    finished,
    restart,
  }
}
