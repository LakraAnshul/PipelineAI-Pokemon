import { useCallback, useEffect, useState } from 'react'

/**
 * `useState` that survives a reload.
 *
 * Every localStorage call is guarded: Safari private mode throws on write, and
 * a hand-edited or half-written entry throws on parse. Persistence is a
 * convenience here, so when it fails the app carries on with in-memory state
 * rather than crashing on mount.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => read(key, initialValue))

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage full or blocked — the in-memory value is still correct.
    }
  }, [key, value])

  // Keeps two tabs of the Pokédex from disagreeing about your favourites.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== key || event.newValue === null) return
      try {
        setValue(JSON.parse(event.newValue) as T)
      } catch {
        // Another tab wrote something unreadable; keep what we have.
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  const update = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => (typeof next === 'function' ? (next as (p: T) => T)(prev) : next))
  }, [])

  return [value, update]
}

function read<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key)
    return stored === null ? fallback : (JSON.parse(stored) as T)
  } catch {
    return fallback
  }
}
