import { computed, onBeforeUnmount, ref } from 'vue'

/** Live stats for one task session: keystrokes, blocked pastes and time on task. */
export function useSessionStats() {
  const keystrokes = ref(0)
  const blocked = ref(0)
  const startedAt = ref(Date.now())
  const now = ref(Date.now())
  const timer = setInterval(() => (now.value = Date.now()), 1000)
  onBeforeUnmount(() => clearInterval(timer))

  const elapsedMs = computed(() => Math.max(0, now.value - startedAt.value))

  function reset() {
    keystrokes.value = 0
    blocked.value = 0
    startedAt.value = Date.now()
    now.value = Date.now()
  }

  return {
    keystrokes,
    blocked,
    elapsedMs,
    reset,
    keystroke: () => keystrokes.value++,
    block: () => blocked.value++,
    /** Exact elapsed time right now (the reactive one ticks once a second). */
    elapsedNow: () => Date.now() - startedAt.value,
  }
}

export type SessionStats = ReturnType<typeof useSessionStats>
