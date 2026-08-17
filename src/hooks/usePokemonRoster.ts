import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import {
  clearApiCache,
  getAllPokemonRefs,
  getPokemonDetailsSettled,
  getPokemonRefsByType,
  toApiError,
  type ApiError,
} from '@/services/pokemonApi'
import {
  SORT_OPTIONS,
  type Pokemon,
  type PokemonRef,
  type SortKey,
  type TypeFilterValue,
} from '@/types/pokemon'
import { filterRefsByQuery, sortRefs } from '@/utils/sortPokemon'

/**
 * The roster shown in the grid: which Pokémon, in what order, and how many.
 *
 * The shape of the PokéAPI drives the design here. Its list endpoints return
 * only `{name, url}`, so the hook works in two stages: fetch the cheap index of
 * the whole scope once, then fetch full details only for the cards on screen.
 * Search, filter, and sort all run over the index, which is what lets them span
 * the entire Pokédex rather than only the pages already loaded.
 */

/** Cards revealed per "Load more" press. One row of five on a wide desktop. */
export const PAGE_SIZE = 20

/**
 * Above this many matches, a stat sort stops fetching everything and orders
 * what is loaded instead. A type filter or a favourites list always fits under
 * it; the unfiltered dex never does. See `statSortIsPartial`.
 */
const STAT_SORT_EAGER_LIMIT = 400

export interface RosterQuery {
  search: string
  type: TypeFilterValue
  sort: SortKey
  favoritesOnly: boolean
}

export type RosterStatus = 'loading' | 'error' | 'ready'

export interface Roster {
  /** Loaded Pokémon for the visible window, already sorted. */
  pokemon: Pokemon[]
  /** The visible window including cards whose details are still in flight. */
  visibleRefs: PokemonRef[]
  /** Visible entries still waiting on details — one skeleton each. */
  pendingRefs: PokemonRef[]
  status: RosterStatus
  error: ApiError | null
  /** True while a details batch is in flight but cards are already on screen. */
  isFetchingMore: boolean
  hasMore: boolean
  loadMore: () => void
  retry: () => void
  /** Matches for the current search, filter, and favourites state. */
  matchCount: number
  /** Size of the scope those matches were drawn from. */
  scopeCount: number
  /**
   * A stat sort that could only order the loaded subset. Drives the disclosure
   * line under the toolbar — an ordering the user cannot trust is worse than one
   * that admits its own limits.
   */
  statSortIsPartial: boolean
}

/** Stable identity, so an id/name sort does not recompute as details arrive. */
const NO_DETAILS: ReadonlyMap<number, Pokemon> = new Map()

export function usePokemonRoster(
  query: RosterQuery,
  favoriteIdSet: ReadonlySet<number>,
): Roster {
  const { type, sort, favoritesOnly } = query
  const search = useDebounce(query.search, 250)

  const [scopeRefs, setScopeRefs] = useState<PokemonRef[] | null>(null)
  const [scopeError, setScopeError] = useState<ApiError | null>(null)
  const [details, setDetails] = useState<ReadonlyMap<number, Pokemon>>(NO_DETAILS)
  const [detailError, setDetailError] = useState<ApiError | null>(null)
  const [attempted, setAttempted] = useState<ReadonlySet<number>>(() => new Set())
  const [pendingBatches, setPendingBatches] = useState(0)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [reloadToken, setReloadToken] = useState(0)

  /* ── Stage one: the index for the current type scope ─────────────────── */

  useEffect(() => {
    let cancelled = false
    setScopeRefs(null)
    setScopeError(null)

    const load = type === 'all' ? getAllPokemonRefs() : getPokemonRefsByType(type)

    load
      .then((refs) => {
        if (!cancelled) setScopeRefs(refs)
      })
      .catch((error: unknown) => {
        if (!cancelled) setScopeError(toApiError(error))
      })

    return () => {
      cancelled = true
    }
  }, [type, reloadToken])

  /* ── Narrow, then order ─────────────────────────────────────────────── */

  const matchingRefs = useMemo(() => {
    if (!scopeRefs) return []
    const inScope = favoritesOnly
      ? scopeRefs.filter((ref) => favoriteIdSet.has(ref.id))
      : scopeRefs
    return filterRefsByQuery(inScope, search)
  }, [scopeRefs, favoritesOnly, favoriteIdSet, search])

  const sortNeedsDetails =
    SORT_OPTIONS.find((option) => option.value === sort)?.needsDetails ?? false

  const sortedRefs = useMemo(
    () => sortRefs(matchingRefs, sort, sortNeedsDetails ? details : NO_DETAILS),
    [matchingRefs, sort, sortNeedsDetails, details],
  )

  const visibleRefs = useMemo(
    () => sortedRefs.slice(0, visibleCount),
    [sortedRefs, visibleCount],
  )

  /* ── Stage two: details for what is on screen ───────────────────────── */

  /**
   * A stat sort cannot honestly order Pokémon whose stats are unknown, so when
   * the match set is small enough, fetch all of it before sorting. On the full
   * dex that would be a thousand requests, so there we order what we have and
   * say so.
   */
  const statSortIsPartial =
    sortNeedsDetails && matchingRefs.length > STAT_SORT_EAGER_LIMIT

  const detailTargets =
    sortNeedsDetails && !statSortIsPartial ? matchingRefs : visibleRefs

  useEffect(() => {
    const missing = detailTargets.filter(
      (ref) => !details.has(ref.id) && !attempted.has(ref.id),
    )
    if (missing.length === 0) return

    // Marked before the request resolves so a re-render mid-flight does not
    // queue the same ids again, and a permanent failure is not retried forever.
    setAttempted((prev) => {
      const next = new Set(prev)
      for (const ref of missing) next.add(ref.id)
      return next
    })
    setPendingBatches((count) => count + 1)

    getPokemonDetailsSettled(missing)
      .then(({ pokemon, firstError }) => {
        if (pokemon.length > 0) {
          setDetails((prev) => {
            const next = new Map(prev)
            for (const entry of pokemon) next.set(entry.id, entry)
            return next
          })
        }
        // One casualty out of twenty is not worth an error banner; a batch that
        // returned nothing at all is.
        setDetailError(pokemon.length === 0 ? firstError : null)
      })
      .catch((error: unknown) => setDetailError(toApiError(error)))
      .finally(() => setPendingBatches((count) => count - 1))
  }, [detailTargets, details, attempted])

  /* ── Paging ─────────────────────────────────────────────────────────── */

  // Any change to what is being looked at starts the window over at page one.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search, type, sort, favoritesOnly])

  const loadMore = useCallback(
    () => setVisibleCount((count) => count + PAGE_SIZE),
    [],
  )

  const retry = useCallback(() => {
    clearApiCache()
    setDetails(NO_DETAILS)
    setAttempted(new Set())
    setDetailError(null)
    setVisibleCount(PAGE_SIZE)
    setReloadToken((token) => token + 1)
  }, [])

  /* ── What the grid renders ──────────────────────────────────────────── */

  const pokemon = useMemo(
    () =>
      visibleRefs
        .map((ref) => details.get(ref.id))
        .filter((entry): entry is Pokemon => entry !== undefined),
    [visibleRefs, details],
  )

  /**
   * A skeleton is a promise that a card is coming, so it is only shown while a
   * batch is actually in flight or one has yet to be queued. An entry whose
   * details failed for good drops out of the grid rather than shimmering forever.
   */
  const pendingRefs = useMemo(
    () =>
      visibleRefs.filter(
        (ref) =>
          !details.has(ref.id) && (pendingBatches > 0 || !attempted.has(ref.id)),
      ),
    [visibleRefs, details, pendingBatches, attempted],
  )

  const status: RosterStatus = scopeError
    ? 'error'
    : detailError && pokemon.length === 0
      ? 'error'
      : scopeRefs === null || (matchingRefs.length > 0 && pokemon.length === 0)
        ? 'loading'
        : 'ready'

  return {
    pokemon,
    visibleRefs,
    pendingRefs,
    status,
    error: scopeError ?? detailError,
    isFetchingMore: pendingBatches > 0 && pokemon.length > 0,
    hasMore: visibleCount < sortedRefs.length,
    loadMore,
    retry,
    matchCount: matchingRefs.length,
    scopeCount: scopeRefs?.length ?? 0,
    statSortIsPartial,
  }
}
