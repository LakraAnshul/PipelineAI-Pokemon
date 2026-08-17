import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Toolbar } from '@/components/controls/Toolbar'
import { Container } from '@/components/layout/Container'
import { LoadMore } from '@/components/pokemon/LoadMore'
import { PokemonDetailModal } from '@/components/pokemon/PokemonDetailModal'
import { PokemonGrid } from '@/components/pokemon/PokemonGrid'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { GridSkeleton } from '@/components/states/GridSkeleton'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useReconnect } from '@/hooks/useOnlineStatus'
import { usePokemonRoster } from '@/hooks/usePokemonRoster'
import { useRosterParams } from '@/hooks/useRosterParams'
import { formatPokemonName } from '@/utils/formatters'

const BASE_TITLE = 'Pokémon Explorer'

/**
 * The catalogue.
 *
 * `useRosterParams` reads what to show from the URL, `usePokemonRoster` turns
 * that into Pokémon, and this page only decides which of the four states —
 * loading, error, empty, populated — is on screen. No fetching, no filtering
 * logic here.
 *
 * `/pokemon/:name` renders this same page with the detail dialog open on top, so
 * the grid keeps its scroll position and its data while a Pokémon is being read.
 */
export function HomePage() {
  const {
    params,
    setSearch,
    setType,
    setSort,
    setFavoritesOnly,
    clearFilters,
    isFiltered,
  } = useRosterParams()

  const { favoriteIdSet, count: favoriteCount } = useFavorites()
  const roster = usePokemonRoster(params, favoriteIdSet)

  // Coming back online is the one moment a failed load is worth retrying without
  // being asked, because the reason it failed has just gone away. Only when
  // something actually failed — a reconnect should not disturb a working page.
  useReconnect(() => {
    if (roster.error) roster.retry()
  })

  const { name: selectedName = null } = useParams<{ name: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  /* ── The dialog, driven entirely by the route ───────────────────────── */

  // Query params ride along, so closing the dialog returns to the same filtered
  // view rather than the unfiltered dex.
  const closeDetail = useCallback(() => {
    navigate({ pathname: '/', search: location.search })
  }, [navigate, location.search])

  const selectedIndex = selectedName
    ? roster.visibleRefs.findIndex((ref) => ref.name === selectedName)
    : -1

  const navigateDetail = useCallback(
    (step: -1 | 1) => {
      const next = roster.visibleRefs[selectedIndex + step]
      if (!next) return
      navigate({ pathname: `/pokemon/${next.name}`, search: location.search })
    },
    [navigate, location.search, roster.visibleRefs, selectedIndex],
  )

  useEffect(() => {
    document.title = selectedName
      ? `${formatPokemonName(selectedName)} · ${BASE_TITLE}`
      : BASE_TITLE

    return () => {
      document.title = BASE_TITLE
    }
  }, [selectedName])

  /* ── Which sentence an empty result deserves ────────────────────────── */

  const emptyVariant = params.favoritesOnly
    ? 'favorites'
    : params.search.trim() !== ''
      ? 'search'
      : 'filter'

  const resetFromEmpty = params.favoritesOnly
    ? () => setFavoritesOnly(false)
    : clearFilters

  return (
    <Container className="pb-4">
      <div className="max-w-2xl py-10 sm:py-14">
        <p className="font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">
          Gen I &ndash; IX
        </p>
        <h1 className="mt-3 font-display text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.05] font-bold tracking-[-0.02em]">
          Browse the National Pokédex.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-text-muted">
          Search by name or number, filter by type, compare base stats side by
          side, and keep a list of favourites.
        </p>
      </div>

      <Toolbar
        params={params}
        favoriteCount={favoriteCount}
        matchCount={roster.matchCount}
        shownCount={roster.visibleRefs.length}
        statSortIsPartial={roster.statSortIsPartial}
        isFiltered={isFiltered}
        onSearchChange={setSearch}
        onTypeChange={setType}
        onSortChange={setSort}
        onFavoritesOnlyChange={setFavoritesOnly}
        onClearFilters={clearFilters}
      />

      <div className="mt-6">
        {roster.status === 'error' ? (
          <ErrorState error={roster.error} onRetry={roster.retry} />
        ) : roster.status === 'loading' ? (
          <GridSkeleton />
        ) : roster.matchCount === 0 ? (
          <EmptyState
            variant={emptyVariant}
            query={params.search}
            onReset={resetFromEmpty}
          />
        ) : (
          <>
            {/* Cards are on screen, so a failed batch is a note, not a takeover. */}
            {roster.error ? (
              <ErrorState
                error={roster.error}
                onRetry={roster.retry}
                variant="inline"
                className="mb-5"
              />
            ) : null}

            <PokemonGrid pokemon={roster.pokemon} pendingRefs={roster.pendingRefs} />

            {roster.hasMore ? (
              <LoadMore
                onClick={roster.loadMore}
                isLoading={roster.isFetchingMore}
                remaining={roster.matchCount - roster.visibleRefs.length}
              />
            ) : null}
          </>
        )}
      </div>

      <PokemonDetailModal
        nameOrId={selectedName}
        onClose={closeDetail}
        onNavigate={navigateDetail}
        hasPrevious={selectedIndex > 0}
        hasNext={selectedIndex >= 0 && selectedIndex < roster.visibleRefs.length - 1}
      />
    </Container>
  )
}
