import { describe, expect, it } from 'vitest'
import { POKEMON_TYPES } from '@/types/pokemon'
import { getTypeColor, getTypeGradient } from './typeColors'

describe('getTypeColor', () => {
  it('returns a complete colour set for every one of the 18 types', () => {
    for (const type of POKEMON_TYPES) {
      const color = getTypeColor(type)
      expect(color.base, `${type}.base`).toMatch(/^#[0-9a-f]{6}$/i)
      expect(color.soft, `${type}.soft`).toBeTruthy()
      expect(color.onBase, `${type}.onBase`).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('falls back to normal for an unknown type', () => {
    expect(getTypeColor('mystery' as never)).toEqual(getTypeColor('normal'))
  })

  it("honours the brief's suggested colour for each named type", () => {
    expect(getTypeColor('fire').base.toLowerCase()).toBe('#ff6b3d')
    expect(getTypeColor('water').base.toLowerCase()).toBe('#3d9bff')
    expect(getTypeColor('grass').base.toLowerCase()).toBe('#4bc46a')
    expect(getTypeColor('electric').base.toLowerCase()).toBe('#f7c531')
    expect(getTypeColor('psychic').base.toLowerCase()).toBe('#ff6b9d')
    expect(getTypeColor('ghost').base.toLowerCase()).toBe('#7b62a3')
    expect(getTypeColor('ice').base.toLowerCase()).toBe('#4fd4d4')
    expect(getTypeColor('dragon').base.toLowerCase()).toBe('#5b6ee1')
    expect(getTypeColor('dark').base.toLowerCase()).toBe('#5a5366')
    expect(getTypeColor('fairy').base.toLowerCase()).toBe('#ee90c4')
  })

  it('picks dark foreground text on the light type colours', () => {
    // Yellow, cyan, and sand are too light for white text to stay readable.
    expect(getTypeColor('electric').onBase).toBe('#1a1a24')
    expect(getTypeColor('ice').onBase).toBe('#1a1a24')
    expect(getTypeColor('rock').onBase).toBe('#1a1a24')
    expect(getTypeColor('fire').onBase).toBe('#ffffff')
  })
})

describe('getTypeGradient', () => {
  it('blends both hues for a dual-typed Pokémon', () => {
    const gradient = getTypeGradient(['grass', 'poison'])
    expect(gradient).toContain('#4bc46a')
    expect(gradient).toContain('#b563ce')
  })

  it('uses a single hue for a mono-typed Pokémon', () => {
    const gradient = getTypeGradient(['fire'])
    expect(gradient).toContain('#ff6b3d')
  })

  it('falls back to normal when the type list is empty', () => {
    expect(getTypeGradient([])).toContain('#9099a1')
  })
})
