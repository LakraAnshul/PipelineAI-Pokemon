import type { StatKey } from '@/types/pokemon'

/**
 * Display formatting. Everything here turns raw API values into the strings
 * the UI shows — the API speaks decimetres and hyphenated slugs, people don't.
 */

/** The highest base stat any Pokémon has (Blissey's HP), so bars share a scale. */
export const STAT_MAX = 255

export const STAT_LABELS: Record<StatKey, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
}

/**
 * Names the API slugs in a way that title-casing alone gets wrong. Without
 * these, `mr-mime` renders as "Mr Mime" and `nidoran-f` as "Nidoran F".
 */
const NAME_OVERRIDES: Record<string, string> = {
  'mr-mime': 'Mr. Mime',
  'mr-rime': 'Mr. Rime',
  'mime-jr': 'Mime Jr.',
  'porygon-z': 'Porygon-Z',
  'nidoran-f': 'Nidoran ♀',
  'nidoran-m': 'Nidoran ♂',
  'ho-oh': 'Ho-Oh',
  'jangmo-o': 'Jangmo-o',
  'hakamo-o': 'Hakamo-o',
  'kommo-o': 'Kommo-o',
  'type-null': 'Type: Null',
  'farfetchd': "Farfetch'd",
  'sirfetchd': "Sirfetch'd",
  'flabebe': 'Flabébé',
  'deoxys-normal': 'Deoxys',
  'wo-chien': 'Wo-Chien',
  'chien-pao': 'Chien-Pao',
  'ting-lu': 'Ting-Lu',
  'chi-yu': 'Chi-Yu',
}

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ')
}

/** `25` → `#025`. Four-digit dex numbers keep all four digits. */
export function formatPokemonId(id: number): string {
  return `#${String(id).padStart(3, '0')}`
}

/** `mr-mime` → `Mr. Mime`. */
export function formatPokemonName(name: string): string {
  if (!name) return ''
  const override = NAME_OVERRIDES[name.toLowerCase()]
  if (override) return override
  return titleCase(name)
}

/** `lightning-rod` → `Lightning Rod`. */
export function formatAbilityName(name: string): string {
  return titleCase(name)
}

/** `moves` come through as slugs too, and read the same way as abilities. */
export const formatMoveName = formatAbilityName

/** The API reports decimetres; people think in metres. `4` → `0.4 m`. */
export function formatHeight(decimetres: number): string {
  return `${(decimetres / 10).toFixed(1)} m`
}

/** The API reports hectograms; people think in kilograms. `60` → `6.0 kg`. */
export function formatWeight(hectograms: number): string {
  return `${(hectograms / 10).toFixed(1)} kg`
}

/** Thousands separators for the catalog readout: `1302` → `1,302`. */
export function formatCount(value: number): string {
  return value.toLocaleString('en-US')
}

/**
 * A handful of species have no `base_experience` at all. An em dash says "no
 * value" the way a table does; printing the word "null" says the site is broken.
 */
export function formatBaseExperience(value: number | null): string {
  return value === null ? '—' : String(value)
}
