import type { PokemonType } from '@/types/pokemon'
import { cn } from '@/utils/cn'
import { getTypeColor } from '@/utils/typeColors'

/**
 * A Pokémon's type, as a filled pill in that type's colour.
 *
 * The rest of the interface is near-monochrome on purpose, so these are the only
 * saturated things on screen and a type is recognisable at a glance across a
 * grid. Set small and in the mono face, they read as instrument labels rather
 * than decoration. The colour is never the only cue — the type is always spelled
 * out beside it.
 */
export function TypeBadge({
  type,
  size = 'md',
  className,
}: {
  type: PokemonType
  size?: 'sm' | 'md'
  className?: string
}) {
  const { base, onBase } = getTypeColor(type)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-mono font-medium uppercase',
        size === 'sm'
          ? 'px-1.5 py-0.5 text-[9px] tracking-[0.08em]'
          : 'px-2.5 py-1 text-[10px] tracking-[0.1em]',
        className,
      )}
      style={{ backgroundColor: base, color: onBase }}
    >
      {type}
    </span>
  )
}
