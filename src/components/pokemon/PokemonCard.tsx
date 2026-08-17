import { ArrowLeftRight, Heart } from 'lucide-react'
import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Seam } from '@/components/ui/Seam'
import { IconToggle } from '@/components/ui/IconToggle'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { PokemonArtwork } from './PokemonArtwork'
import type { Pokemon } from '@/types/pokemon'
import { cn } from '@/utils/cn'
import { formatPokemonId, formatPokemonName } from '@/utils/formatters'
import { getTypeColor, getTypeSpotlight } from '@/utils/typeColors'

/**
 * One Pokémon in the grid, built like the ball it comes in: a lit upper chamber
 * holding the specimen, the seam, then a data plate underneath.
 *
 * The card is not itself a link. An overlay link covers it so the whole surface
 * is clickable, while the favourite and compare toggles sit above that overlay —
 * nesting buttons inside an anchor would be invalid and would break both mouse
 * and keyboard behaviour.
 */
export const PokemonCard = memo(function PokemonCard({
  pokemon,
  isFavorite,
  isComparing,
  compareDisabled,
  onToggleFavorite,
  onToggleCompare,
  index = 0,
  priority = false,
}: {
  pokemon: Pokemon
  isFavorite: boolean
  isComparing: boolean
  /** True when the compare tray is full and this card is not in it. */
  compareDisabled: boolean
  onToggleFavorite: (pokemon: Pokemon) => void
  onToggleCompare: (pokemon: Pokemon) => void
  /** Position in the current page, used only to stagger the entrance. */
  index?: number
  priority?: boolean
}) {
  const displayName = formatPokemonName(pokemon.name)
  const primary = getTypeColor(pokemon.types[0] ?? 'normal')

  return (
    <article
      className={cn(
        'group relative isolate overflow-hidden rounded-2xl border border-border bg-surface shadow-card',
        'transition-[box-shadow,transform,border-color] duration-300 ease-out',
        'hover:-translate-y-1 hover:shadow-lift focus-within:-translate-y-1 focus-within:shadow-lift',
        'motion-safe:animate-rise',
      )}
      style={{ animationDelay: `${Math.min(index, 19) * 35}ms` }}
    >
      {/* Upper chamber — the specimen under a lamp tinted by its own type. */}
      <div className="relative grid aspect-[6/5] place-items-center overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.16] transition-opacity duration-300 group-hover:opacity-[0.28]"
          style={{ backgroundImage: getTypeSpotlight(pokemon.types) }}
        />
        <PokemonArtwork
          pokemon={pokemon}
          size={132}
          priority={priority}
          className="relative drop-shadow-[0_10px_18px_rgb(16_16_32/0.22)] transition-transform duration-300 ease-out group-hover:scale-[1.07]"
        />
      </div>

      <Seam color={primary.base} />

      {/* Data plate. */}
      <div className="px-4 pt-4 pb-4">
        <p className="tabular text-[11px] text-text-muted">
          {formatPokemonId(pokemon.id)}
        </p>
        <h3 className="mt-0.5 truncate font-display text-[17px] leading-tight font-bold tracking-tight">
          {displayName}
        </h3>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {pokemon.types.map((type) => (
            <TypeBadge key={type} type={type} size="sm" />
          ))}
        </div>
      </div>

      {/* Covers the card so any click opens the detail view. Sits under the
          toggles in stacking order, which is what keeps both usable. */}
      <Link
        to={`/pokemon/${pokemon.name}`}
        className="absolute inset-0 z-10 rounded-2xl"
        aria-label={`${displayName}, ${formatPokemonId(pokemon.id)} — view details`}
      />

      {/* gap-3 rather than gap-2 so the two grown touch targets sit edge to
          edge instead of overlapping — a mis-tap here is a wrong action. */}
      <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-3">
        <IconToggle
          active={isFavorite}
          size="sm"
          label={isFavorite ? `Remove ${displayName} from favourites` : `Add ${displayName} to favourites`}
          onClick={() => onToggleFavorite(pokemon)}
        >
          <Heart
            size={14}
            strokeWidth={2.25}
            aria-hidden="true"
            fill={isFavorite ? 'currentColor' : 'none'}
          />
        </IconToggle>

        <IconToggle
          active={isComparing}
          activeColor={primary.base}
          size="sm"
          disabled={compareDisabled}
          label={
            isComparing
              ? `Remove ${displayName} from compare`
              : compareDisabled
                ? 'Compare tray is full'
                : `Add ${displayName} to compare`
          }
          onClick={() => onToggleCompare(pokemon)}
          className={cn(
            'disabled:opacity-40',
            // Quiet until wanted: the compare toggle only shows itself on
            // hover or focus, unless this card is already in the tray.
            !isComparing &&
              'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 max-md:opacity-100',
          )}
        >
          <ArrowLeftRight size={13} strokeWidth={2.25} aria-hidden="true" />
        </IconToggle>
      </div>
    </article>
  )
})
