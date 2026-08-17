import { describe, expect, it } from 'vitest'
import type { Pokemon, PokemonRef } from '@/types/pokemon'
import { filterRefsByQuery, sortRefs } from './sortPokemon'

const refs: PokemonRef[] = [
  { id: 25, name: 'pikachu' },
  { id: 1, name: 'bulbasaur' },
  { id: 122, name: 'mr-mime' },
  { id: 6, name: 'charizard' },
]

/** Only the fields the sorters read. */
function detail(id: number, stats: Partial<Pokemon['stats']>): Pokemon {
  return {
    id,
    name: `mon-${id}`,
    types: [],
    imageUrl: '',
    spriteUrl: null,
    height: 0,
    weight: 0,
    baseExperience: null,
    abilities: [],
    stats: {
      hp: 0,
      attack: 0,
      defense: 0,
      'special-attack': 0,
      'special-defense': 0,
      speed: 0,
      ...stats,
    },
    totalStats: 0,
    moves: [],
    moveCount: 0,
  }
}

describe('sortRefs', () => {
  it('sorts by dex number in both directions', () => {
    expect(sortRefs(refs, 'id-asc', new Map()).map((r) => r.id)).toEqual([1, 6, 25, 122])
    expect(sortRefs(refs, 'id-desc', new Map()).map((r) => r.id)).toEqual([122, 25, 6, 1])
  })

  it('sorts by name in both directions', () => {
    expect(sortRefs(refs, 'name-asc', new Map()).map((r) => r.name)).toEqual([
      'bulbasaur',
      'charizard',
      'mr-mime',
      'pikachu',
    ])
    expect(sortRefs(refs, 'name-desc', new Map()).map((r) => r.name)[0]).toBe('pikachu')
  })

  it('leaves the input array untouched', () => {
    const original = [...refs]
    sortRefs(refs, 'id-asc', new Map())
    expect(refs).toEqual(original)
  })

  it('sorts by a stat, highest first, using loaded details', () => {
    const details = new Map([
      [25, detail(25, { attack: 55 })],
      [1, detail(1, { attack: 49 })],
      [6, detail(6, { attack: 84 })],
      [122, detail(122, { attack: 45 })],
    ])

    expect(sortRefs(refs, 'attack-desc', details).map((r) => r.id)).toEqual([6, 25, 1, 122])
  })

  it('parks Pokémon with no loaded details at the end, in dex order', () => {
    const details = new Map([
      [122, detail(122, { speed: 90 })],
      [1, detail(1, { speed: 45 })],
    ])

    expect(sortRefs(refs, 'speed-desc', details).map((r) => r.id)).toEqual([122, 1, 6, 25])
  })
})

describe('filterRefsByQuery', () => {
  it('returns everything for an empty or whitespace query', () => {
    expect(filterRefsByQuery(refs, '')).toBe(refs)
    expect(filterRefsByQuery(refs, '   ')).toBe(refs)
  })

  it('matches on a name fragment, case-insensitively', () => {
    expect(filterRefsByQuery(refs, 'CHAR').map((r) => r.name)).toEqual(['charizard'])
  })

  it('matches a hyphenated name typed with a space', () => {
    expect(filterRefsByQuery(refs, 'mr mime').map((r) => r.id)).toEqual([122])
  })

  it('matches on dex number, with or without the hash', () => {
    expect(filterRefsByQuery(refs, '25').map((r) => r.id)).toEqual([25])
    expect(filterRefsByQuery(refs, '#6').map((r) => r.id)).toEqual([6])
  })

  it('matches a zero-padded dex number the way the card displays it', () => {
    expect(filterRefsByQuery(refs, '006').map((r) => r.id)).toEqual([6])
  })

  it('returns an empty array when nothing matches', () => {
    expect(filterRefsByQuery(refs, 'zzzz')).toEqual([])
  })
})
