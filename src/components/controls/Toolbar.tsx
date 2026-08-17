import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { RosterParams } from '@/hooks/useRosterParams'
import { cn } from '@/utils/cn'
import { formatCount } from '@/utils/formatters'
import { SearchBar } from './SearchBar'
import { SortSelect } from './SortSelect'
import { TypeFilter } from './TypeFilter'

/**
 * Everything that decides what the grid shows, plus the readout that says what
 * it is showing.
 *
 * The counts are set in mono and phrased as instrument labels — the Pokédex is a
 * cataloguing device, and a live count is the most characteristic thing such a
 * device does.
 */
export function Toolbar({
  params,
  favoriteCount,
  matchCount,
  shownCount,
  statSortIsPartial,
  isFiltered,
  onSearchChange,
  onTypeChange,
  onSortChange,
  onFavoritesOnlyChange,
  onClearFilters,
}: {
  params: RosterParams
  favoriteCount: number
  matchCount: number
  shownCount: number
  statSortIsPartial: boolean
  isFiltered: boolean
  onSearchChange: (value: string) => void
  onTypeChange: (value: RosterParams['type']) => void
  onSortChange: (value: RosterParams['sort']) => void
  onFavoritesOnlyChange: (value: boolean) => void
  onClearFilters: () => void
}) {
  return (
    <section aria-label="Search and filter" className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchBar
          value={params.search}
          onChange={onSearchChange}
          className="md:flex-1"
        />

        <div className="flex gap-3">
          <SortSelect
            value={params.sort}
            onChange={onSortChange}
            className="flex-1 md:w-52 md:flex-none"
          />

          <Button
            size="lg"
            variant={params.favoritesOnly ? 'primary' : 'secondary'}
            aria-pressed={params.favoritesOnly}
            onClick={() => onFavoritesOnlyChange(!params.favoritesOnly)}
            className="h-12 shrink-0 rounded-2xl px-4"
          >
            <Heart
              size={15}
              strokeWidth={2.25}
              aria-hidden="true"
              fill={params.favoritesOnly ? 'currentColor' : 'none'}
            />
            <span className="max-md:sr-only">Favourites</span>
            <span
              className={cn(
                'tabular rounded-full px-1.5 text-[10px]',
                params.favoritesOnly ? 'bg-white/20' : 'bg-surface-2 text-text-muted',
              )}
            >
              {favoriteCount}
            </span>
          </Button>
        </div>
      </div>

      <TypeFilter value={params.type} onChange={onTypeChange} />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border pt-3">
        <p
          role="status"
          className="tabular text-[11px] tracking-[0.08em] text-text-muted uppercase"
        >
          {formatCount(matchCount)} {matchCount === 1 ? 'match' : 'matches'}
          <span className="mx-2 text-border">/</span>
          {formatCount(shownCount)} shown
        </p>

        {statSortIsPartial ? (
          <p className="text-[11px] text-text-muted/80">
            Sorting applies to the Pokémon loaded so far.
          </p>
        ) : null}

        {isFiltered ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearFilters}
            className="ms-auto -my-1"
          >
            Clear filters
          </Button>
        ) : null}
      </div>
    </section>
  )
}
