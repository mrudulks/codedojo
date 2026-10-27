import { computed, ref, watch, type Ref } from 'vue'
import { useSessionStats } from '../composables/useSessionStats'
import type { Language } from '../languages'
import { useRunner } from '../runners/useRunner'
import type { RunResult } from '../runners/types'
import { useDraftsStore } from '../stores/drafts'
import { useProgressStore } from '../stores/progress'
import { useSettingsStore } from '../stores/settings'
import type { TaskOf } from '../tasks/schema'
import { compareOutput, type OutputComparison } from './predict'

export function usePredictTask(task: Ref<TaskOf<'predict'>>, language: Ref<Language>) {
  const drafts = useDraftsStore()
  const progress = useProgressStore()
  const { settings } = useSettingsStore()
  const runner = useRunner()
  const stats = useSessionStats()

  const prediction = ref('')
  const result = ref<RunResult | null>(null)
  const comparison = ref<OutputComparison | null>(null)
  const hintsShown = ref(0)
  const version = ref(0)

  const draftKey = computed(() => `${task.value.id}|${language.value}|prediction`)
  const docKey = computed(() => `${draftKey.value}|${version.value}`)
  const code = computed(() => task.value.code[language.value] ?? '')

  function load() {
    prediction.value = drafts.get(draftKey.value) ?? ''
    result.value = null
    comparison.value = null
    hintsShown.value = 0
    version.value++
    stats.reset()
  }

  watch(draftKey, load, { immediate: true })
  watch(prediction, (value) => drafts.set(draftKey.value, value))

  async function check() {
    if (runner.running.value) return
    const t = task.value
    const lang = language.value
    const res = await runner.run({
      language: lang,
      code: code.value,
      options: { runWithTypeErrors: settings.runWithTypeErrors },
    })
    if (t !== task.value || lang !== language.value) return
    result.value = res
    comparison.value = compareOutput(res.stdout, prediction.value)
    await progress.record({
      taskId: t.id,
      language: lang,
      mode: 'predict',
      passed: comparison.value.passed && !res.error,
      timeMs: stats.elapsedNow(),
      keystrokes: stats.keystrokes.value,
      hintsUsed: hintsShown.value,
    })
  }

  function clear() {
    drafts.remove(draftKey.value)
    prediction.value = ''
    result.value = null
    comparison.value = null
    version.value++
  }

  function revealHint() {
    hintsShown.value = Math.min(hintsShown.value + 1, task.value.hints?.length ?? 0)
  }

  return {
    code,
    prediction,
    result,
    comparison,
    hintsShown,
    docKey,
    stats,
    running: runner.running,
    status: runner.status,
    check,
    clear,
    revealHint,
  }
}
