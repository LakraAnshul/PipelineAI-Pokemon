import type { Pokemon } from '@/types/pokemon'

/**
 * Real values from the PokéAPI, trimmed. Using genuine numbers means a test that
 * asserts "Charizard out-attacks Pikachu" is asserting something true about
 * Pokémon, not something true about a fixture.
 */

export const pikachu: Pokemon = {
  id: 25,
  name: 'pikachu',
  types: ['electric'],
  imageUrl: 'https://example.test/artwork/25.png',
  spriteUrl: 'https://example.test/sprite/25.png',
  height: 4,
  weight: 60,
  baseExperience: 112,
  abilities: [
    { name: 'static', isHidden: false },
    { name: 'lightning-rod', isHidden: true },
  ],
  stats: {
    hp: 35,
    attack: 55,
    defense: 40,
    'special-attack': 50,
    'special-defense': 50,
    speed: 90,
  },
  totalStats: 320,
  moves: ['thunder-shock', 'quick-attack', 'thunderbolt'],
  moveCount: 3,
}

export const charizard: Pokemon = {
  id: 6,
  name: 'charizard',
  types: ['fire', 'flying'],
  imageUrl: 'https://example.test/artwork/6.png',
  spriteUrl: 'https://example.test/sprite/6.png',
  height: 17,
  weight: 905,
  baseExperience: 267,
  abilities: [
    { name: 'blaze', isHidden: false },
    { name: 'solar-power', isHidden: true },
  ],
  stats: {
    hp: 78,
    attack: 84,
    defense: 78,
    'special-attack': 109,
    'special-defense': 85,
    speed: 100,
  },
  totalStats: 534,
  moves: ['flamethrower', 'fly'],
  moveCount: 2,
}
