export type WorkerOutcome<T> = { timedOut: true } | { timedOut: false; data: T }

/**
 * Posts one message to a worker and resolves with the first reply.
 * If the reply takes longer than `timeoutMs`, the worker is terminated
 * (the caller is responsible for creating a new one).
 */
export function callWorker<TIn, TOut>(
  worker: Worker,
  message: TIn,
  timeoutMs: number,
  accept: (data: TOut) => boolean = () => true,
): Promise<WorkerOutcome<TOut>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      worker.terminate()
      resolve({ timedOut: true })
    }, timeoutMs)
    const onMessage = (event: MessageEvent<TOut>) => {
      if (!accept(event.data)) return
      cleanup()
      resolve({ timedOut: false, data: event.data })
    }
    const onError = (event: ErrorEvent) => {
      cleanup()
      worker.terminate()
      reject(new Error(event.message || 'The worker crashed'))
    }
    function cleanup() {
      clearTimeout(timer)
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
    }
    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)
    worker.postMessage(message)
  })
}
