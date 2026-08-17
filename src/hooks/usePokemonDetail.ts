import { useCallback, useEffect, useState } from 'react'
import { getPokemonDetail, toApiError, type ApiError } from '@/services/pokemonApi'
import type { Pokemon } from '@/types/pokemon'

/**
 * One Pokémon, fetched by name or dex number.
 *
 * Deep links are the reason this exists separately from `usePokemonRoster`:
 * `/pokemon/charizard` has to work on a cold load, with no grid and no index
 * behind it. The service layer caches, so opening a card that is already on
 * screen resolves without a request.
 */

export type DetailStatus = 'idle' | 'loading' | 'error' | 'ready'

export interface Detail {
  pokemon: Pokemon | null
  status: DetailStatus
  error: ApiError | null
  retry: () => void
}

export function usePokemonDetail(nameOrId: string | null): Detail {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    setError(null)
    setPokemon(null)

    if (!nameOrId) return

    let cancelled = false

    getPokemonDetail(nameOrId)
      .then((result) => {
        if (!cancelled) setPokemon(result)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(toApiError(cause))
      })

    return () => {
      cancelled = true
    }
  }, [nameOrId, reloadToken])

  const retry = useCallback(() => {
    setError(null)
    setReloadToken((token) => token + 1)
  }, [])

  const status: DetailStatus = !nameOrId
    ? 'idle'
    : error
      ? 'error'
      : pokemon
        ? 'ready'
        : 'loading'

  return { pokemon, status, error, retry }
}
