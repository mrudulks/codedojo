/** localStorage helpers that never throw (private mode, blocked storage). */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : { ...fallback, ...(JSON.parse(raw) as T) }
  } catch {
    return fallback
  }
}

export function readRaw<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage is a convenience here; losing it is fine.
  }
}
