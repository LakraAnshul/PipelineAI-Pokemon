import { useState } from 'react'
import type { Pokemon } from '@/types/pokemon'
import { cn } from '@/utils/cn'
import { formatPokemonName } from '@/utils/formatters'
import { getTypeColor } from '@/utils/typeColors'

/**
 * A Pokémon's artwork, with somewhere to fall back to.
 *
 * Official artwork is served from a separate sprites repository, so a card can
 * lose its image while the rest of the payload is fine. Two fallbacks in order:
 * the small game sprite, then a Poké Ball silhouette drawn inline — a broken-image
 * icon on a card that otherwise has real data would read as a bug in the whole
 * page, and a placeholder that has to be fetched can fail the same way the artwork
 * just did.
 *
 * Until the pixels arrive, the box holds a soft wash of the Pokémon's own type
 * colour. It costs nothing to draw, it is the right shape and size so nothing
 * shifts when the image lands, and it makes a slow connection look like something
 * loading rather than something missing.
 */
export function PokemonArtwork({
  pokemon,
  size,
  className,
  fluid = false,
  priority = false,
}: {
  pokemon: Pokemon
  /**
   * Intrinsic size in px, always set on the element so the browser knows the
   * shape before the bytes land. It is also the rendered size unless `fluid`.
   */
  size: number
  className?: string
  /**
   * Let the container decide how large to draw it — `className` supplies the
   * width, usually a percentage, and the square source supplies the height.
   * A card that grows with the viewport should grow its specimen too; a fixed
   * box would strand the artwork in the middle of a wide card.
   */
  fluid?: boolean
  /** Skip lazy-loading for above-the-fold artwork. */
  priority?: boolean
}) {
  const [state, setState] = useState(() => ({
    id: pokemon.id,
    stage: 'artwork' as 'artwork' | 'sprite' | 'gone',
    loaded: false,
  }))

  // The detail dialog keeps this component mounted while walking the dex, so a
  // fallback earned by one Pokémon must not be inherited by the next.
  if (state.id !== pokemon.id) {
    setState({ id: pokemon.id, stage: 'artwork', loaded: false })
  }

  const src =
    state.stage === 'artwork'
      ? pokemon.imageUrl
      : state.stage === 'sprite'
        ? pokemon.spriteUrl
        : null

  if (!src) {
    return (
      <span
        className={cn(
          'grid aspect-square place-items-center text-text-muted/25',
          className,
        )}
        style={fluid ? undefined : { width: size, height: size }}
        role="img"
        aria-label={`No artwork available for ${formatPokemonName(pokemon.name)}`}
      >
        <svg
          viewBox="0 0 48 48"
          width={fluid ? '50%' : size * 0.5}
          height={fluid ? '50%' : size * 0.5}
          aria-hidden="true"
        >
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M4 24h40" stroke="currentColor" strokeWidth="3" />
          <circle cx="24" cy="24" r="6.5" fill="none" stroke="currentColor" strokeWidth="3" />
        </svg>
      </span>
    )
  }

  const tint = getTypeColor(pokemon.types[0] ?? 'normal').base

  return (
    <img
      src={src}
      alt={formatPokemonName(pokemon.name)}
      width={size}
      height={size}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onLoad={() => setState((prev) => ({ ...prev, loaded: true }))}
      onError={() =>
        setState((prev) => ({
          ...prev,
          stage: prev.stage === 'artwork' ? 'sprite' : 'gone',
          loaded: false,
        }))
      }
      className={cn('select-none object-contain', className)}
      style={{
        ...(fluid ? null : { width: size, height: size }),
        // Behind the image, not under it: dropped the moment real pixels exist,
        // so the transparent parts of the artwork stay transparent.
        ...(state.loaded
          ? null
          : {
              background: `radial-gradient(circle at 50% 46%, ${tint}2e, ${tint}0f 55%, transparent 72%)`,
            }),
      }}
    />
  )
}
