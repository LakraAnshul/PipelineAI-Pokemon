import { describe, expect, it } from 'vitest'
import {
  formatAbilityName,
  formatBaseExperience,
  formatHeight,
  formatPokemonId,
  formatPokemonName,
  formatWeight,
  STAT_LABELS,
} from './formatters'

describe('formatPokemonId', () => {
  it('pads to three digits behind a hash', () => {
    expect(formatPokemonId(25)).toBe('#025')
    expect(formatPokemonId(1)).toBe('#001')
    expect(formatPokemonId(150)).toBe('#150')
  })

  it('does not truncate four-digit dex numbers', () => {
    expect(formatPokemonId(1302)).toBe('#1302')
  })
})

describe('formatPokemonName', () => {
  it('capitalises a simple name', () => {
    expect(formatPokemonName('pikachu')).toBe('Pikachu')
  })

  it('applies the real-world spelling for irregular names', () => {
    expect(formatPokemonName('mr-mime')).toBe('Mr. Mime')
    expect(formatPokemonName('porygon-z')).toBe('Porygon-Z')
    expect(formatPokemonName('nidoran-f')).toBe('Nidoran ♀')
    expect(formatPokemonName('nidoran-m')).toBe('Nidoran ♂')
    expect(formatPokemonName('type-null')).toBe('Type: Null')
    expect(formatPokemonName('ho-oh')).toBe('Ho-Oh')
  })

  it('title-cases multi-word names not on the override list', () => {
    expect(formatPokemonName('tapu-fini')).toBe('Tapu Fini')
  })

  it('survives an empty string', () => {
    expect(formatPokemonName('')).toBe('')
  })
})

describe('unit conversion', () => {
  it('converts decimetres to metres', () => {
    expect(formatHeight(4)).toBe('0.4 m')
    expect(formatHeight(17)).toBe('1.7 m')
    expect(formatHeight(100)).toBe('10.0 m')
  })

  it('converts hectograms to kilograms', () => {
    expect(formatWeight(60)).toBe('6.0 kg')
    expect(formatWeight(905)).toBe('90.5 kg')
  })
})

describe('formatAbilityName', () => {
  it('humanises hyphenated ability slugs', () => {
    expect(formatAbilityName('lightning-rod')).toBe('Lightning Rod')
    expect(formatAbilityName('static')).toBe('Static')
  })
})

describe('formatBaseExperience', () => {
  it('prints the number when the API has one', () => {
    expect(formatBaseExperience(112)).toBe('112')
    expect(formatBaseExperience(0)).toBe('0')
  })

  it('shows a dash rather than the word "null" when the API has none', () => {
    expect(formatBaseExperience(null)).toBe('—')
  })
})

describe('STAT_LABELS', () => {
  it('abbreviates the special stats so they fit a narrow column', () => {
    expect(STAT_LABELS.hp).toBe('HP')
    expect(STAT_LABELS['special-attack']).toBe('Sp. Atk')
    expect(STAT_LABELS['special-defense']).toBe('Sp. Def')
  })
})
