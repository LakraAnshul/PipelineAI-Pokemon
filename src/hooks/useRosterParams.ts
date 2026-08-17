import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  DEFAULT_SORT,
  POKEMON_TYPES,
  SORT_OPTIONS,
  type SortKey,
  type TypeFilterValue,
} from '@/types/pokemon'

/**
 * The URL is the source of truth for what the grid is showing.
 *
 * Search, type, sort, and the favourites toggle all live in the query string, so
 * a filtered view can be bookmarked, shared, and reloaded, and the browser's
 * back button undoes a filter the way people expect. Nothing here is mirrored in
 * component state — one source, no drift.
 */

export interface RosterParams {
  search: string
  type: TypeFilterValue
  sort: SortKey
  favoritesOnly: boolean
}

const TYPE_VALUES: ReadonlySet<string> = new Set(POKEMON_TYPES)
const SORT_VALUES: ReadonlySet<string> = new Set(SORT_OPTIONS.map((o) => o.value))

export function useRosterParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useMemo<RosterParams>(() => {
    const type = searchParams.get('type') ?? 'all'
    const sort = searchParams.get('sort') ?? DEFAULT_SORT

    return {
      search: searchParams.get('q') ?? '',
      // A hand-edited or stale URL must not put the app in an impossible state.
      type: TYPE_VALUES.has(type) ? (type as TypeFilterValue) : 'all',
      sort: SORT_VALUES.has(sort) ? (sort as SortKey) : DEFAULT_SORT,
      favoritesOnly: searchParams.get('favorites') === '1',
    }
  }, [searchParams])

  /**
   * Filters replace the history entry rather than pushing one. Typing four
   * letters into search should not cost four presses of the back button — and it
   * leaves Back free to mean "close the detail view", which is what it means
   * once a modal is open.
   */
  const update = useCallback(
    (patch: Partial<RosterParams>) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          const write = (key: string, value: string, isDefault: boolean) => {
            if (isDefault) next.delete(key)
            else next.set(key, value)
          }

          if (patch.search !== undefined) {
            write('q', patch.search, patch.search.trim() === '')
          }
          if (patch.type !== undefined) {
            write('type', patch.type, patch.type === 'all')
          }
          if (patch.sort !== undefined) {
            write('sort', patch.sort, patch.sort === DEFAULT_SORT)
          }
          if (patch.favoritesOnly !== undefined) {
            write('favorites', '1', !patch.favoritesOnly)
          }

          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setSearch = useCallback((search: string) => update({ search }), [update])
  const setType = useCallback((type: TypeFilterValue) => update({ type }), [update])
  const setSort = useCallback((sort: SortKey) => update({ sort }), [update])
  const setFavoritesOnly = useCallback(
    (favoritesOnly: boolean) => update({ favoritesOnly }),
    [update],
  )

  /** Back to the unfiltered dex, sort untouched — sort is a preference, not a filter. */
  const clearFilters = useCallback(
    () => update({ search: '', type: 'all', favoritesOnly: false }),
    [update],
  )

  const isFiltered =
    params.search.trim() !== '' || params.type !== 'all' || params.favoritesOnly

  return {
    params,
    setSearch,
    setType,
    setSort,
    setFavoritesOnly,
    clearFilters,
    isFiltered,
  }
}
