import type { Pokemon, PokemonRef, SortKey, StatKey } from '@/types/pokemon'

/**
 * Filtering and sorting, kept pure and away from React.
 *
 * These run over `PokemonRef` — id and name only — because that is all the list
 * endpoint gives us. Working at that level is what lets search and sort cover
 * the whole Pokédex instead of only the cards already fetched.
 */

const STAT_FOR_SORT: Partial<Record<SortKey, StatKey>> = {
  'attack-desc': 'attack',
  'speed-desc': 'speed',
  'hp-desc': 'hp',
}

export function sortRefs(
  refs: PokemonRef[],
  sort: SortKey,
  details: ReadonlyMap<number, Pokemon>,
): PokemonRef[] {
  switch (sort) {
    case 'id-asc':
      return refs.slice().sort((a, b) => a.id - b.id)
    case 'id-desc':
      return refs.slice().sort((a, b) => b.id - a.id)
    case 'name-asc':
      return refs.slice().sort((a, b) => a.name.localeCompare(b.name))
    case 'name-desc':
      return refs.slice().sort((a, b) => b.name.localeCompare(a.name))
    default: {
      const statKey = STAT_FOR_SORT[sort]
      return statKey ? sortByStat(refs, statKey, details) : refs.slice()
    }
  }
}

/**
 * Highest first. A Pokémon whose details have not arrived has no stat to sort
 * on, so it waits at the end in dex order rather than pretending to be a zero —
 * which would put it above nothing and below everything, silently and wrongly.
 */
function sortByStat(
  refs: PokemonRef[],
  statKey: StatKey,
  details: ReadonlyMap<number, Pokemon>,
): PokemonRef[] {
  return refs.slice().sort((a, b) => {
    const left = details.get(a.id)?.stats[statKey]
    const right = details.get(b.id)?.stats[statKey]

    if (left === undefined && right === undefined) return a.id - b.id
    if (left === undefined) return 1
    if (right === undefined) return -1
    return right - left || a.id - b.id
  })
}

/**
 * Matches a name fragment or a dex number. Hyphens count as spaces, so typing
 * "mr mime" finds `mr-mime`, and a padded number finds the card that displays
 * it — searching "006" works because the card says #006.
 */
export function filterRefsByQuery(refs: PokemonRef[], query: string): PokemonRef[] {
  const needle = query.trim().toLowerCase().replace(/^#/, '')
  if (!needle) return refs

  return refs.filter((ref) => {
    const name = ref.name.toLowerCase()
    return (
      name.includes(needle) ||
      name.replace(/-/g, ' ').includes(needle) ||
      String(ref.id).includes(needle) ||
      String(ref.id).padStart(3, '0').includes(needle)
    )
  })
}
