import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { PokemonRef } from '@/types/pokemon'

/**
 * The compare tray.
 *
 * Holds `PokemonRef`s rather than ids so the tray can render a name and its
 * artwork with no request at all — artwork URLs are derivable from the dex
 * number. Full stats are pulled from the API cache when the panel opens.
 */

const STORAGE_KEY = 'pokemon-explorer:compare'

/**
 * Three is the ceiling because three stat columns are the most that stay
 * readable on a phone without becoming a horizontal scroll.
 */
export const MAX_COMPARE = 3

interface CompareContextValue {
  items: PokemonRef[]
  isComparing: (id: number) => boolean
  /** Adds when there is room, removes when already selected. */
  toggleCompare: (ref: PokemonRef) => void
  removeFromCompare: (id: number) => void
  clearCompare: () => void
  isFull: boolean
  count: number
  max: number
}

const CompareContext = createContext<CompareContextValue | null>(null)

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<PokemonRef[]>(STORAGE_KEY, [])

  const ids = useMemo(() => new Set(items.map((item) => item.id)), [items])

  const isComparing = useCallback((id: number) => ids.has(id), [ids])

  const toggleCompare = useCallback(
    (ref: PokemonRef) => {
      setItems((prev) => {
        if (prev.some((item) => item.id === ref.id)) {
          return prev.filter((item) => item.id !== ref.id)
        }
        // Silently ignoring the add would look broken; the button is disabled
        // at the tray limit instead, so this is only a safety net.
        if (prev.length >= MAX_COMPARE) return prev
        return [...prev, ref]
      })
    },
    [setItems],
  )

  const removeFromCompare = useCallback(
    (id: number) => setItems((prev) => prev.filter((item) => item.id !== id)),
    [setItems],
  )

  const clearCompare = useCallback(() => setItems([]), [setItems])

  const value = useMemo(
    () => ({
      items,
      isComparing,
      toggleCompare,
      removeFromCompare,
      clearCompare,
      isFull: items.length >= MAX_COMPARE,
      count: items.length,
      max: MAX_COMPARE,
    }),
    [items, isComparing, toggleCompare, removeFromCompare, clearCompare],
  )

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare(): CompareContextValue {
  const context = useContext(CompareContext)
  if (!context) throw new Error('useCompare must be used inside a CompareProvider')
  return context
}
