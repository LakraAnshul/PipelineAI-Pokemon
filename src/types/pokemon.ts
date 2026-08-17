/**
 * Domain types for the PokéAPI (https://pokeapi.co/api/v2/).
 *
 * Two layers live here on purpose:
 *   - `Raw*` types mirror the API's wire format exactly, warts and all
 *     (snake_case keys, nested `NamedApiResource` indirection, nullable sprites).
 *   - The normalized types (`Pokemon`, `PokemonRef`) are what the UI consumes.
 *
 * Keeping them separate means the API's shape can change without the component
 * tree noticing — only the normalizer in `services/pokemonApi.ts` has to care.
 */

/* ─────────────────────────── Raw API shapes ─────────────────────────── */

/** The API's universal "pointer to another resource" envelope. */
export interface NamedApiResource {
  name: string
  url: string
}

export interface RawPokemonListResponse {
  count: number
  next: string | null
  previous: string | null
  results: NamedApiResource[]
}

export interface RawPokemon {
  id: number
  name: string
  /** Decimetres. `4` means 0.4 m. */
  height: number
  /** Hectograms. `60` means 6.0 kg. */
  weight: number
  base_experience: number | null
  sprites: {
    front_default: string | null
    other?: {
      'official-artwork'?: {
        front_default: string | null
      }
    }
  }
  types: { slot: number; type: NamedApiResource }[]
  abilities: { is_hidden: boolean; slot: number; ability: NamedApiResource }[]
  stats: { base_stat: number; effort: number; stat: NamedApiResource }[]
  moves: { move: NamedApiResource }[]
}

export interface RawTypeResponse {
  name: string
  pokemon: { slot: number; pokemon: NamedApiResource }[]
}

/* ────────────────────────── Normalized shapes ────────────────────────── */

export const POKEMON_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const

export type PokemonType = (typeof POKEMON_TYPES)[number]

/** `'all'` is the filter's neutral position, not a real API type. */
export type TypeFilterValue = PokemonType | 'all'

/**
 * A Pokémon's identity, known from the cheap list endpoint before any
 * detail request has been made. Pagination and sorting operate on these.
 */
export interface PokemonRef {
  id: number
  name: string
}

export type StatKey =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'special-attack'
  | 'special-defense'
  | 'speed'

/** Canonical display order for stats — matches the games' summary screen. */
export const STAT_ORDER: StatKey[] = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
]

export type PokemonStats = Record<StatKey, number>

/** A fully-resolved Pokémon, ready to render. */
export interface Pokemon extends PokemonRef {
  types: PokemonType[]
  imageUrl: string
  spriteUrl: string | null
  /** Raw decimetres — format with `formatHeight`. */
  height: number
  /** Raw hectograms — format with `formatWeight`. */
  weight: number
  baseExperience: number | null
  abilities: { name: string; isHidden: boolean }[]
  stats: PokemonStats
  /** Sum of all six base stats, the games' "total" figure. */
  totalStats: number
  moves: string[]
  moveCount: number
}

/* ──────────────────────────────── Sorting ─────────────────────────────── */

export type SortKey =
  | 'id-asc'
  | 'id-desc'
  | 'name-asc'
  | 'name-desc'
  | 'attack-desc'
  | 'speed-desc'
  | 'hp-desc'

export interface SortOption {
  value: SortKey
  label: string
  /**
   * Stat sorts need fetched details, so they can only order Pokémon that are
   * already loaded. ID and name come free from the list endpoint's URLs.
   */
  needsDetails: boolean
}

export const SORT_OPTIONS: SortOption[] = [
  { value: 'id-asc', label: 'Lowest number', needsDetails: false },
  { value: 'id-desc', label: 'Highest number', needsDetails: false },
  { value: 'name-asc', label: 'A → Z', needsDetails: false },
  { value: 'name-desc', label: 'Z → A', needsDetails: false },
  { value: 'attack-desc', label: 'Attack', needsDetails: true },
  { value: 'speed-desc', label: 'Speed', needsDetails: true },
  { value: 'hp-desc', label: 'HP', needsDetails: true },
]

export const DEFAULT_SORT: SortKey = 'id-asc'
