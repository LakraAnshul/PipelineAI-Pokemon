import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  clearApiCache,
  getAllPokemonRefs,
  getArtworkUrl,
  getPokemonDetail,
  getPokemonDetails,
  getPokemonDetailsSettled,
  getPokemonRefsByType,
} from './pokemonApi'

const RAW_PIKACHU = {
  id: 25,
  name: 'pikachu',
  height: 4,
  weight: 60,
  base_experience: 112,
  sprites: {
    front_default: 'sprite.png',
    other: { 'official-artwork': { front_default: 'artwork.png' } },
  },
  types: [{ slot: 1, type: { name: 'electric', url: '' } }],
  abilities: [
    { is_hidden: false, slot: 1, ability: { name: 'static', url: '' } },
    { is_hidden: true, slot: 3, ability: { name: 'lightning-rod', url: '' } },
  ],
  stats: [
    { base_stat: 35, effort: 0, stat: { name: 'hp', url: '' } },
    { base_stat: 55, effort: 0, stat: { name: 'attack', url: '' } },
    { base_stat: 40, effort: 0, stat: { name: 'defense', url: '' } },
    { base_stat: 50, effort: 0, stat: { name: 'special-attack', url: '' } },
    { base_stat: 50, effort: 0, stat: { name: 'special-defense', url: '' } },
    { base_stat: 90, effort: 0, stat: { name: 'speed', url: '' } },
  ],
  moves: [
    { move: { name: 'thunder-shock', url: '' } },
    { move: { name: 'quick-attack', url: '' } },
  ],
}

/** Minimal Response stand-in — the service only touches ok/status/json. */
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response

const httpError = (status: number) => ({ ok: false, status }) as Response

/**
 * Runs `work` with the retry backoff fast-forwarded, so exercising a retryable
 * failure costs no wall-clock time. Both handlers are attached before the timers
 * run, so a rejection is never momentarily unhandled.
 */
async function withFastRetry<T>(work: () => Promise<T>): Promise<T> {
  vi.useFakeTimers()
  try {
    const settled = work().then(
      (value) => () => value,
      (error: unknown) => () => {
        throw error
      },
    )
    await vi.runAllTimersAsync()
    return (await settled)()
  } finally {
    vi.useRealTimers()
  }
}

beforeEach(() => {
  clearApiCache()
  vi.unstubAllGlobals()
})

describe('getArtworkUrl', () => {
  it('builds the official-artwork URL from an ID alone, with no request', () => {
    expect(getArtworkUrl(25)).toContain('official-artwork/25.png')
  })
})

describe('getAllPokemonRefs', () => {
  const INDEX = {
    count: 4,
    next: null,
    previous: null,
    results: [
      { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
      { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
      { name: 'pikachu-rock-star', url: 'https://pokeapi.co/api/v2/pokemon/10080/' },
      { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
    ],
  }

  it('derives numeric IDs from the result URLs and sorts by dex order', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ok(INDEX)))

    expect(await getAllPokemonRefs()).toEqual([
      { id: 1, name: 'bulbasaur' },
      { id: 2, name: 'ivysaur' },
      { id: 25, name: 'pikachu' },
    ])
  })

  it('drops alternate forms, which have no official artwork', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ok(INDEX)))

    const refs = await getAllPokemonRefs()

    expect(refs.some((ref) => ref.id >= 10000)).toBe(false)
  })

  it('caches the index, so repeat callers share one array and one request', async () => {
    const spy = vi.fn(async () => ok(INDEX))
    vi.stubGlobal('fetch', spy)

    const first = await getAllPokemonRefs()
    const second = await getAllPokemonRefs()

    expect(second).toBe(first)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('throws a malformed error when results is not an array', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ok({ count: 0, results: null })))
    await expect(getAllPokemonRefs()).rejects.toMatchObject({ kind: 'malformed' })
  })
})

describe('getPokemonDetail', () => {
  it('normalizes the raw payload into a Pokemon', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ok(RAW_PIKACHU)))

    const pokemon = await getPokemonDetail('pikachu')

    expect(pokemon.id).toBe(25)
    expect(pokemon.name).toBe('pikachu')
    expect(pokemon.types).toEqual(['electric'])
    expect(pokemon.height).toBe(4)
    expect(pokemon.weight).toBe(60)
    expect(pokemon.baseExperience).toBe(112)
    expect(pokemon.imageUrl).toBe('artwork.png')
    expect(pokemon.spriteUrl).toBe('sprite.png')
    expect(pokemon.stats).toEqual({
      hp: 35,
      attack: 55,
      defense: 40,
      'special-attack': 50,
      'special-defense': 50,
      speed: 90,
    })
    expect(pokemon.totalStats).toBe(320)
    expect(pokemon.abilities).toEqual([
      { name: 'static', isHidden: false },
      { name: 'lightning-rod', isHidden: true },
    ])
    expect(pokemon.moves).toEqual(['thunder-shock', 'quick-attack'])
    expect(pokemon.moveCount).toBe(2)
  })

  it('falls back to the derived artwork URL when the sprite is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ok({ ...RAW_PIKACHU, sprites: { front_default: null } })),
    )

    const pokemon = await getPokemonDetail('pikachu')

    expect(pokemon.imageUrl).toContain('official-artwork/25.png')
    expect(pokemon.spriteUrl).toBeNull()
  })

  it('defaults any stat the API omits to zero', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ok({ ...RAW_PIKACHU, stats: [RAW_PIKACHU.stats[0]] })),
    )

    const pokemon = await getPokemonDetail('pikachu')

    expect(pokemon.stats.hp).toBe(35)
    expect(pokemon.stats.speed).toBe(0)
  })

  it('ignores type names outside the known 18', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        ok({
          ...RAW_PIKACHU,
          types: [
            { slot: 1, type: { name: 'electric', url: '' } },
            { slot: 2, type: { name: 'unknown-type', url: '' } },
          ],
        }),
      ),
    )

    expect((await getPokemonDetail('pikachu')).types).toEqual(['electric'])
  })

  it('classifies a 500 as http and keeps the status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => httpError(500)))
    await expect(withFastRetry(() => getPokemonDetail('pikachu'))).rejects.toMatchObject({
      kind: 'http',
      status: 500,
    })
  })

  it('classifies a thrown fetch as network', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )

    const error = await withFastRetry(() => getPokemonDetail('pikachu')).catch(
      (e: unknown) => e,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).kind).toBe('network')
  })

  it('serves a repeat request from cache without re-fetching', async () => {
    const spy = vi.fn(async () => ok(RAW_PIKACHU))
    vi.stubGlobal('fetch', spy)

    await getPokemonDetail('pikachu')
    await getPokemonDetail('pikachu')

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('dedupes concurrent identical requests into one fetch', async () => {
    const spy = vi.fn(async () => ok(RAW_PIKACHU))
    vi.stubGlobal('fetch', spy)

    await Promise.all([getPokemonDetail('pikachu'), getPokemonDetail('pikachu')])

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('does not cache failures, so a later attempt can succeed', async () => {
    const spy = vi.fn<() => Promise<Response>>().mockResolvedValue(ok(RAW_PIKACHU))
    // Two 500s exhausts the request and its one retry; the third call is fresh.
    spy.mockResolvedValueOnce(httpError(500)).mockResolvedValueOnce(httpError(500))
    vi.stubGlobal('fetch', spy)

    await expect(withFastRetry(() => getPokemonDetail('pikachu'))).rejects.toThrow()
    await expect(getPokemonDetail('pikachu')).resolves.toMatchObject({ id: 25 })
  })

  it('retries a 5xx once and resolves when the second answer is good', async () => {
    const spy = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(httpError(503))
      .mockResolvedValueOnce(ok(RAW_PIKACHU))
    vi.stubGlobal('fetch', spy)

    await expect(withFastRetry(() => getPokemonDetail('pikachu'))).resolves.toMatchObject({
      id: 25,
    })
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('retries a dropped connection once', async () => {
    const spy = vi
      .fn<() => Promise<Response>>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(ok(RAW_PIKACHU))
    vi.stubGlobal('fetch', spy)

    await expect(withFastRetry(() => getPokemonDetail('pikachu'))).resolves.toMatchObject({
      id: 25,
    })
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('classifies a 404 as notFound, and never retries it so search stays instant', async () => {
    const spy = vi.fn(async () => httpError(404))
    vi.stubGlobal('fetch', spy)

    await expect(getPokemonDetail('missingmon')).rejects.toMatchObject({ kind: 'notFound' })
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('classifies unparseable JSON as malformed, and does not retry it', async () => {
    const spy = vi.fn(
      async () =>
        ({
          ok: true,
          status: 200,
          json: async () => {
            throw new SyntaxError('Unexpected token')
          },
        }) as unknown as Response,
    )
    vi.stubGlobal('fetch', spy)

    await expect(getPokemonDetail('pikachu')).rejects.toMatchObject({ kind: 'malformed' })
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe('getPokemonDetails', () => {
  it('resolves a batch in the order requested, not the order it finishes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const id = Number(url.split('/').pop())
        return ok({ ...RAW_PIKACHU, id, name: `mon-${id}` })
      }),
    )

    const result = await getPokemonDetails([
      { id: 3, name: 'mon-3' },
      { id: 1, name: 'mon-1' },
      { id: 2, name: 'mon-2' },
    ])

    expect(result.map((p) => p.id)).toEqual([3, 1, 2])
  })

  it('drops the entries that fail rather than failing the whole batch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const id = Number(url.split('/').pop())
        return id === 2 ? httpError(500) : ok({ ...RAW_PIKACHU, id })
      }),
    )

    const result = await withFastRetry(() =>
      getPokemonDetails([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 3, name: 'c' },
      ]),
    )

    expect(result.map((p) => p.id)).toEqual([1, 3])
  })

  it('returns an empty array for an empty batch without fetching', async () => {
    const spy = vi.fn(async () => ok(RAW_PIKACHU))
    vi.stubGlobal('fetch', spy)

    expect(await getPokemonDetails([])).toEqual([])
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('getPokemonDetailsSettled', () => {
  it('reports no error when every request succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ok(RAW_PIKACHU)))

    const result = await getPokemonDetailsSettled([{ id: 25, name: 'pikachu' }])

    expect(result.pokemon).toHaveLength(1)
    expect(result.firstError).toBeNull()
  })

  it('keeps the first failure so the UI can explain a fully-failed batch', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => httpError(503)))

    const result = await withFastRetry(() =>
      getPokemonDetailsSettled([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ]),
    )

    expect(result.pokemon).toEqual([])
    expect(result.firstError).toBeInstanceOf(ApiError)
    expect(result.firstError?.kind).toBe('http')
    expect(result.firstError?.status).toBe(503)
  })
})

describe('getPokemonRefsByType', () => {
  it('maps the type payload to dex-sorted refs and drops alternate forms', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        ok({
          name: 'electric',
          pokemon: [
            { slot: 1, pokemon: { name: 'raichu', url: 'https://x/pokemon/26/' } },
            { slot: 1, pokemon: { name: 'pikachu', url: 'https://x/pokemon/25/' } },
            {
              slot: 1,
              pokemon: { name: 'pikachu-rock-star', url: 'https://x/pokemon/10080/' },
            },
          ],
        }),
      ),
    )

    expect(await getPokemonRefsByType('electric')).toEqual([
      { id: 25, name: 'pikachu' },
      { id: 26, name: 'raichu' },
    ])
  })

  it('throws a malformed error when the type payload has no pokemon list', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ok({ name: 'electric' })))
    await expect(getPokemonRefsByType('electric')).rejects.toMatchObject({
      kind: 'malformed',
    })
  })
})
