import { computed, ref, watch, type Ref } from 'vue'
import { useSessionStats } from '../composables/useSessionStats'
import type { Language } from '../languages'
import { useRunner } from '../runners/useRunner'
import type { RunResult } from '../runners/types'
import { useDraftsStore } from '../stores/drafts'
import { useProgressStore } from '../stores/progress'
import { useSettingsStore } from '../stores/settings'
import type { TestedTask } from '../tasks/schema'

/**
 * State for modes that check code against tests (solve, fix, translate, refactor):
 * drafts, running, hints, and recording an attempt for every check.
 */
export function useTestedTask(
  task: Ref<TestedTask>,
  language: Ref<Language>,
  extraCheck: (code: string) => boolean = () => true,
) {
  const drafts = useDraftsStore()
  const progress = useProgressStore()
  const { settings } = useSettingsStore()
  const runner = useRunner()
  const stats = useSessionStats()

  const code = ref('')
  const result = ref<RunResult | null>(null)
  const passed = ref(false)
  const hintsShown = ref(0)
  const version = ref(0)

  const draftKey = computed(() => `${task.value.id}|${language.value}`)
  const docKey = computed(() => `${draftKey.value}|${version.value}`)
  const starter = computed(() => task.value.starter[language.value] ?? '')

  function load() {
    code.value = drafts.get(draftKey.value) ?? starter.value
    result.value = null
    passed.value = false
    hintsShown.value = 0
    version.value++
    stats.reset()
  }

  watch(draftKey, load, { immediate: true })
  watch(code, (value) => {
    if (value !== starter.value) drafts.set(draftKey.value, value)
  })

  async function run() {
    if (runner.running.value) return
    const t = task.value
    const lang = language.value
    const submitted = code.value
    const res = await runner.run({
      language: lang,
      code: submitted,
      tests: { functionName: t.functionName[lang] ?? '', cases: t.tests },
      options: { runWithTypeErrors: settings.runWithTypeErrors },
    })
    // Ignore results if the user switched task or language while it ran.
    if (t !== task.value || lang !== language.value) return
    result.value = res
    const testsPass = !res.error && !!res.results?.length && res.results.every((r) => r.passed)
    passed.value = testsPass && extraCheck(submitted)
    await progress.record({
      taskId: t.id,
      language: lang,
      mode: t.mode,
      passed: passed.value,
      timeMs: stats.elapsedNow(),
      keystrokes: stats.keystrokes.value,
      hintsUsed: hintsShown.value,
    })
  }

  function reset() {
    drafts.remove(draftKey.value)
    code.value = starter.value
    result.value = null
    passed.value = false
    version.value++
  }

  function revealHint() {
    hintsShown.value = Math.min(hintsShown.value + 1, task.value.hints?.length ?? 0)
  }

  return {
    code,
    result,
    passed,
    hintsShown,
    docKey,
    stats,
    running: runner.running,
    status: runner.status,
    run,
    reset,
    revealHint,
  }
}
