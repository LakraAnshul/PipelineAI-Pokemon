import { PokemonCardSkeleton } from '@/components/pokemon/PokemonCardSkeleton'

/**
 * A full page of card skeletons for the first load, when there is no real
 * geometry on screen yet to preserve. Announced politely rather than shown as a
 * spinner, so a screen reader hears "Loading Pokémon" once instead of nothing.
 */
export function GridSkeleton({ count = 20 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading Pokémon">
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <PokemonCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  )
}
