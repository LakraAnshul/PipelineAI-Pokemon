import { useCompare } from '@/contexts/CompareContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import type { Pokemon, PokemonRef } from '@/types/pokemon'
import { PokemonCard } from './PokemonCard'
import { PokemonCardSkeleton } from './PokemonCardSkeleton'

/**
 * The grid.
 *
 * Two columns on a phone rather than the one the brief sketches: at this card
 * size two still clear a 44px touch target with room to spare, and halving the
 * scroll length matters more on a list this long. Five across on a wide desktop
 * keeps the cards from stretching into billboards.
 *
 * Placeholders are keyed by dex number, not position, so a card that arrives
 * replaces its own skeleton instead of whichever one happens to be there.
 */
export function PokemonGrid({
  pokemon,
  pendingRefs,
}: {
  pokemon: Pokemon[]
  /** Visible entries whose details are still in flight. */
  pendingRefs: PokemonRef[]
}) {
  const { favoriteIdSet, toggleFavorite } = useFavorites()
  const { isComparing, isFull, toggleCompare } = useCompare()

  return (
    <ul
      aria-label="Pokémon"
      // Says "more of this list is still arriving" without moving focus or
      // interrupting — the skeletons below are the visual half of the same fact.
      aria-busy={pendingRefs.length > 0}
      className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
    >
      {pokemon.map((entry, index) => (
        <li key={entry.id}>
          <PokemonCard
            pokemon={entry}
            index={index}
            priority={index < 6}
            isFavorite={favoriteIdSet.has(entry.id)}
            isComparing={isComparing(entry.id)}
            compareDisabled={isFull && !isComparing(entry.id)}
            onToggleFavorite={(target) => toggleFavorite(target.id)}
            onToggleCompare={(target) =>
              toggleCompare({ id: target.id, name: target.name })
            }
          />
        </li>
      ))}

      {pendingRefs.map((ref) => (
        <li key={`pending-${ref.id}`}>
          <PokemonCardSkeleton />
        </li>
      ))}
    </ul>
  )
}
