import {
  POKEMON_TYPES,
  STAT_ORDER,
  type NamedApiResource,
  type Pokemon,
  type PokemonRef,
  type PokemonStats,
  type PokemonType,
  type RawPokemon,
  type RawPokemonListResponse,
  type RawTypeResponse,
  type StatKey,
} from '@/types/pokemon'

/**
 * The only module that talks to the network.
 *
 * Two jobs: turn the API's wire format into the normalized domain types, and
 * turn every possible failure into a single `ApiError` the UI can switch on.
 * Components never see a `Response`, a snake_case key, or a bare `TypeError`.
 */

const BASE_URL = 'https://pokeapi.co/api/v2'

/**
 * Artwork is served from the sprites repo, not the JSON API, and the filename
 * is just the dex number — so a card can show art before its detail request
 * lands. That is the whole reason `PokemonRef` is useful on its own.
 */
const ARTWORK_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork'

/**
 * The list endpoint mixes canonical species (ids 1…1025) with alternate forms
 * numbered from 10001 up — Mega Charizard, Pikachu Rock Star, and friends.
 * Those forms have no official artwork, so they would render as broken cards.
 * The roster stops below this floor.
 */
const ALTERNATE_FORM_ID_FLOOR = 10000

/** High enough to take the whole index in one request, whatever the API's count. */
const INDEX_LIMIT = 20000

/** Detail requests per batch. Enough to fill a page fast, few enough to be polite. */
const DETAIL_CONCURRENCY = 12

const REQUEST_TIMEOUT_MS = 12_000

/**
 * The pause before the one retry. Long enough that a connection dropping between
 * cell towers has come back, short enough that nobody reads it as a hang.
 */
const RETRY_DELAY_MS = 600

/* ──────────────────────────────── Errors ──────────────────────────────── */

/**
 * Why a request failed, in the terms the UI actually branches on:
 * `network` — offline, DNS, CORS, or timeout: retrying may well work.
 * `http`    — the API answered with a failure status.
 * `notFound`— a 404: the thing asked for does not exist, retrying will not help.
 * `malformed`— we got a 200 whose body was not the shape we need.
 */
export type ApiErrorKind = 'network' | 'http' | 'notFound' | 'malformed'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: { status?: number; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause })
    this.name = 'ApiError'
    this.kind = kind
    this.status = options.status
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/** Last line of defence: anything thrown outside `request` still reads as an ApiError. */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error
  return new ApiError('network', 'Unexpected failure while loading Pokédex data.', {
    cause: error,
  })
}

/* ──────────────────────────────── Transport ───────────────────────────────── */

/** Guarded because jsdom and older runtimes do not all ship `AbortSignal.timeout`. */
function timeoutSignal(): AbortSignal | undefined {
  return typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    : undefined
}

/**
 * Worth asking again? A dropped connection or a 5xx is usually a moment passing.
 * A 404 is a fact, and unreadable JSON will be unreadable twice — retrying either
 * only spends the user's time. That distinction is what keeps search feeling
 * instant when someone types a name that does not exist.
 */
function isRetryable(error: ApiError): boolean {
  return error.kind === 'network' || (error.kind === 'http' && (error.status ?? 0) >= 500)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function attempt<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
      signal: timeoutSignal(),
    })
  } catch (cause) {
    // fetch only rejects for transport-level problems, timeouts included.
    throw new ApiError('network', `Could not reach the PokéAPI (${path}).`, { cause })
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new ApiError('notFound', `No PokéAPI resource at ${path}.`, { status: 404 })
    }
    throw new ApiError('http', `PokéAPI answered ${response.status} for ${path}.`, {
      status: response.status,
    })
  }

  try {
    return (await response.json()) as T
  } catch (cause) {
    throw new ApiError('malformed', `PokéAPI sent unreadable JSON for ${path}.`, { cause })
  }
}

/**
 * Every read goes through here: timed out, classified, and given exactly one
 * second chance when the failure is the kind a second chance fixes. One, not a
 * ladder of them — a card that is still empty after two tries should say so and
 * offer the user a button, not keep the spinner turning.
 */
async function request<T>(path: string): Promise<T> {
  try {
    return await attempt<T>(path)
  } catch (error) {
    if (!isApiError(error) || !isRetryable(error)) throw error
    await delay(RETRY_DELAY_MS)
    return attempt<T>(path)
  }
}

/* ───────────────────────────────── Cache ──────────────────────────────────── */

/**
 * Promises, not values — so two callers asking for Pikachu at the same moment
 * share one request instead of racing. Rejections evict themselves, which keeps
 * a transient failure from poisoning the entry for the rest of the session.
 */
const cache = new Map<string, Promise<unknown>>()

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit) return hit as Promise<T>

  const pending = load()
  cache.set(key, pending)
  pending.catch(() => cache.delete(key))
  return pending
}

/** Exposed for tests, and for a hard "Try again" that should bypass the cache. */
export function clearApiCache(): void {
  cache.clear()
}

/* ─────────────────────────────── Normalizers ──────────────────────────────── */

const TYPE_NAMES: ReadonlySet<string> = new Set(POKEMON_TYPES)
const STAT_KEYS: ReadonlySet<string> = new Set(STAT_ORDER)

/** `…/pokemon/25/` → `25`. The list endpoint gives no id of its own. */
function extractId(url: string): number | null {
  const match = /\/(\d+)\/?$/.exec(url)
  return match ? Number(match[1]) : null
}

function toRefs(resources: NamedApiResource[]): PokemonRef[] {
  return resources
    .map((resource) => {
      const id = extractId(resource.url ?? '')
      return id === null ? null : { id, name: resource.name }
    })
    .filter(
      (ref): ref is PokemonRef => ref !== null && ref.id < ALTERNATE_FORM_ID_FLOOR,
    )
    .sort((a, b) => a.id - b.id)
}

function toTypes(entries: RawPokemon['types']): PokemonType[] {
  return (entries ?? [])
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((entry) => entry.type?.name)
    .filter((name): name is PokemonType => TYPE_NAMES.has(name))
}

function toStats(entries: RawPokemon['stats']): PokemonStats {
  const stats: PokemonStats = {
    hp: 0,
    attack: 0,
    defense: 0,
    'special-attack': 0,
    'special-defense': 0,
    speed: 0,
  }
  for (const entry of entries ?? []) {
    const key = entry.stat?.name
    if (STAT_KEYS.has(key)) stats[key as StatKey] = entry.base_stat ?? 0
  }
  return stats
}

function normalizePokemon(raw: RawPokemon): Pokemon {
  if (typeof raw?.id !== 'number' || typeof raw?.name !== 'string') {
    throw new ApiError('malformed', 'Pokémon payload has no id or name.')
  }

  const stats = toStats(raw.stats)
  const moves = (raw.moves ?? []).map((entry) => entry.move.name)

  return {
    id: raw.id,
    name: raw.name,
    types: toTypes(raw.types),
    imageUrl:
      raw.sprites?.other?.['official-artwork']?.front_default ?? getArtworkUrl(raw.id),
    spriteUrl: raw.sprites?.front_default ?? null,
    height: raw.height ?? 0,
    weight: raw.weight ?? 0,
    baseExperience: raw.base_experience ?? null,
    abilities: (raw.abilities ?? []).map((entry) => ({
      name: entry.ability.name,
      isHidden: entry.is_hidden,
    })),
    stats,
    totalStats: STAT_ORDER.reduce((sum, key) => sum + stats[key], 0),
    moves,
    moveCount: moves.length,
  }
}

/* ──────────────────────────────── Public API ──────────────────────────────── */

/** Official artwork for a dex number, derivable without a request. */
export function getArtworkUrl(id: number): string {
  return `${ARTWORK_BASE}/${id}.png`
}

/**
 * The whole roster as `{id, name}` — one request, then cached for the session.
 *
 * Paging happens over this array rather than over `?offset=`, which is what
 * makes search and sort span the entire Pokédex instead of only the pages
 * already on screen. Detail requests stay lazy: 20 at a time, on demand.
 */
export function getAllPokemonRefs(): Promise<PokemonRef[]> {
  return cached('index', async () => {
    const data = await request<RawPokemonListResponse>(
      `/pokemon?limit=${INDEX_LIMIT}&offset=0`,
    )
    if (!Array.isArray(data?.results)) {
      throw new ApiError('malformed', 'Pokédex index has no results array.')
    }
    return toRefs(data.results)
  })
}

/** Every Pokémon of one type, dex-sorted. Powers the type filter. */
export function getPokemonRefsByType(type: PokemonType): Promise<PokemonRef[]> {
  return cached(`type:${type}`, async () => {
    const data = await request<RawTypeResponse>(`/type/${type}`)
    if (!Array.isArray(data?.pokemon)) {
      throw new ApiError('malformed', `Type "${type}" has no pokemon list.`)
    }
    return toRefs(data.pokemon.map((entry) => entry.pokemon))
  })
}

export function getPokemonDetail(idOrName: number | string): Promise<Pokemon> {
  const slug = String(idOrName).trim().toLowerCase()
  return cached(`pokemon:${slug}`, async () =>
    normalizePokemon(await request<RawPokemon>(`/pokemon/${encodeURIComponent(slug)}`)),
  )
}

/** What a batch of detail requests actually did — successes and the first failure. */
export interface DetailBatchResult {
  pokemon: Pokemon[]
  /**
   * Kept so the UI can say *why* nothing loaded. A batch where every request
   * failed is an error worth reporting; a batch where one failed is not.
   */
  firstError: ApiError | null
}

/**
 * Details for a batch, capped at `DETAIL_CONCURRENCY` in flight.
 *
 * One Pokémon failing must not blank a whole page, so failures drop out and the
 * rest render. Order follows the request, not whichever response arrived first.
 */
export async function getPokemonDetailsSettled(
  refs: PokemonRef[],
): Promise<DetailBatchResult> {
  if (refs.length === 0) return { pokemon: [], firstError: null }

  let firstError: ApiError | null = null

  const settled = await mapWithConcurrency(refs, DETAIL_CONCURRENCY, (ref) =>
    getPokemonDetail(ref.id).catch((error: unknown) => {
      firstError ??= toApiError(error)
      return null
    }),
  )

  return {
    pokemon: settled.filter((pokemon): pokemon is Pokemon => pokemon !== null),
    firstError,
  }
}

/** The successes only, for callers that do not need to explain a failure. */
export async function getPokemonDetails(refs: PokemonRef[]): Promise<Pokemon[]> {
  return (await getPokemonDetailsSettled(refs)).pokemon
}

/**
 * A fixed pool of workers pulling from a shared cursor. Results land at their
 * original index, so the output order matches the input order.
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  const pool = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await worker(items[index])
    }
  })

  await Promise.all(pool)
  return results
}
