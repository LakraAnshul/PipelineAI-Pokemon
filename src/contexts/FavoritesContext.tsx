import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

/**
 * Favourites, stored as dex numbers.
 *
 * Ids rather than whole Pokémon: the list has to survive a reload, and a cached
 * copy of the API's payload would go stale and bloat storage for no gain. The
 * ids are re-resolved against the API on load like any other card.
 */

const STORAGE_KEY = 'pokemon-explorer:favorites'

interface FavoritesContextValue {
  favoriteIds: number[]
  /** A Set for O(1) checks — every card asks this on every render. */
  favoriteIdSet: ReadonlySet<number>
  isFavorite: (id: number) => boolean
  toggleFavorite: (id: number) => void
  clearFavorites: () => void
  count: number
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useLocalStorage<number[]>(STORAGE_KEY, [])

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds])

  const isFavorite = useCallback((id: number) => favoriteIdSet.has(id), [favoriteIdSet])

  const toggleFavorite = useCallback(
    (id: number) => {
      setFavoriteIds((prev) =>
        // Newest first, so the favourites view reads as a recent-activity list.
        prev.includes(id) ? prev.filter((value) => value !== id) : [id, ...prev],
      )
    },
    [setFavoriteIds],
  )

  const clearFavorites = useCallback(() => setFavoriteIds([]), [setFavoriteIds])

  const value = useMemo(
    () => ({
      favoriteIds,
      favoriteIdSet,
      isFavorite,
      toggleFavorite,
      clearFavorites,
      count: favoriteIds.length,
    }),
    [favoriteIds, favoriteIdSet, isFavorite, toggleFavorite, clearFavorites],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites must be used inside a FavoritesProvider')
  return context
}
