import type { PokemonType } from '@/types/pokemon'

/**
 * One Pokémon type's colour set.
 *
 * `base` is the saturated hue (badge fills, stat bars, the seam latch).
 * `soft` is a translucent wash safe behind text in either theme.
 * `onBase` is the foreground that stays readable on top of `base`.
 */
export interface TypeColor {
  base: string
  soft: string
  onBase: string
}

/** Foreground pair. Light type colours need dark text to hold contrast. */
const DARK_TEXT = '#1a1a24'
const LIGHT_TEXT = '#ffffff'

/**
 * The full 18-type palette. Follows the brief's suggested mapping — fire
 * red/orange, water blue, grass green, electric yellow, psychic pink, ghost
 * purple, ice cyan, dragon indigo, dark gray, fairy pink — and completes the
 * remaining eight in the same register: vivid but not neon, so a grid of mixed
 * types still reads as one system.
 */
const TYPE_COLORS: Record<PokemonType, TypeColor> = {
  normal: { base: '#9099a1', soft: 'rgba(144,153,161,0.14)', onBase: LIGHT_TEXT },
  fire: { base: '#ff6b3d', soft: 'rgba(255,107,61,0.14)', onBase: LIGHT_TEXT },
  water: { base: '#3d9bff', soft: 'rgba(61,155,255,0.14)', onBase: LIGHT_TEXT },
  electric: { base: '#f7c531', soft: 'rgba(247,197,49,0.16)', onBase: DARK_TEXT },
  grass: { base: '#4bc46a', soft: 'rgba(75,196,106,0.14)', onBase: LIGHT_TEXT },
  ice: { base: '#4fd4d4', soft: 'rgba(79,212,212,0.16)', onBase: DARK_TEXT },
  fighting: { base: '#e0526a', soft: 'rgba(224,82,106,0.14)', onBase: LIGHT_TEXT },
  poison: { base: '#b563ce', soft: 'rgba(181,99,206,0.14)', onBase: LIGHT_TEXT },
  ground: { base: '#d97845', soft: 'rgba(217,120,69,0.14)', onBase: LIGHT_TEXT },
  flying: { base: '#8fa8dd', soft: 'rgba(143,168,221,0.16)', onBase: DARK_TEXT },
  psychic: { base: '#ff6b9d', soft: 'rgba(255,107,157,0.14)', onBase: LIGHT_TEXT },
  bug: { base: '#92bc2c', soft: 'rgba(146,188,44,0.14)', onBase: LIGHT_TEXT },
  rock: { base: '#c5b78c', soft: 'rgba(197,183,140,0.18)', onBase: DARK_TEXT },
  ghost: { base: '#7b62a3', soft: 'rgba(123,98,163,0.14)', onBase: LIGHT_TEXT },
  dragon: { base: '#5b6ee1', soft: 'rgba(91,110,225,0.14)', onBase: LIGHT_TEXT },
  dark: { base: '#5a5366', soft: 'rgba(90,83,102,0.14)', onBase: LIGHT_TEXT },
  steel: { base: '#68a3bd', soft: 'rgba(104,163,189,0.16)', onBase: LIGHT_TEXT },
  fairy: { base: '#ee90c4', soft: 'rgba(238,144,196,0.16)', onBase: DARK_TEXT },
}

export function getTypeColor(type: PokemonType): TypeColor {
  return TYPE_COLORS[type] ?? TYPE_COLORS.normal
}

/**
 * The wash that sits behind a Pokémon's artwork, in its card's upper chamber
 * and again in the detail modal's header. Dual-typed Pokémon blend both hues,
 * which is the cheapest honest way to show a Pokémon is two things at once.
 */
export function getTypeGradient(types: PokemonType[]): string {
  const primary = getTypeColor(types[0] ?? 'normal').base
  const secondary = types[1] ? getTypeColor(types[1]).base : primary
  return `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`
}

/** Radial spotlight behind the artwork — a specimen under a lamp. */
export function getTypeSpotlight(types: PokemonType[]): string {
  const primary = getTypeColor(types[0] ?? 'normal').base
  return `radial-gradient(circle at 50% 45%, ${primary} 0%, transparent 70%)`
}
