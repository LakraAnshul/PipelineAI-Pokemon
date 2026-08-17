import { useEffect, useState } from 'react'

/**
 * Trails `value` by `delay` milliseconds.
 *
 * Search runs against an in-memory index, so this is not about sparing the
 * network — it is about not re-sorting and re-rendering 1,000 cards on every
 * keystroke. The input itself stays instant; only the results wait.
 */
export function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
