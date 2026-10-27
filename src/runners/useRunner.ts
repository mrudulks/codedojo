import { ref } from 'vue'
import { createRunner, type RunRequest, type RunResult } from './runner'

const status = ref<string | null>(null)
const running = ref(false)
const runner = createRunner((message) => {
  status.value = message
})

/** Shared runner for the whole app, with reactive progress state. */
export function useRunner() {
  async function run(req: RunRequest): Promise<RunResult> {
    running.value = true
    try {
      return await runner.run(req)
    } finally {
      running.value = false
    }
  }
  return { run, running, status }
}
