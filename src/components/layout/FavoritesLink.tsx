import { Heart } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useFavorites } from '@/contexts/FavoritesContext'
import { cn } from '@/utils/cn'

/**
 * A running count of favourites that doubles as the way into them.
 *
 * It only appears once there is something to count, so the header stays quiet
 * for a first-time visitor and gains a piece of chrome the moment the app has
 * state worth returning to. Pressing it is a filter toggle, not a page: the rest
 * of the query string survives, so favourites can be crossed with a type or a
 * search rather than replacing them.
 */
export function FavoritesLink() {
  const { count } = useFavorites()
  const [searchParams] = useSearchParams()

  const active = searchParams.get('favorites') === '1'
  if (count === 0 && !active) return null

  const next = new URLSearchParams(searchParams)
  if (active) next.delete('favorites')
  else next.set('favorites', '1')
  const query = next.toString()

  return (
    <Link
      to={{ pathname: '/', search: query ? `?${query}` : '' }}
      aria-current={active ? 'page' : undefined}
      title={active ? 'Show all Pokémon' : 'Show favourites'}
      className={cn(
        'flex h-9 items-center gap-1.5 rounded-full border px-3 transition-colors duration-150',
        active
          ? 'border-transparent bg-favorite text-white'
          : 'border-border text-text-muted hover:border-text-muted/40 hover:text-text',
      )}
    >
      <Heart
        size={14}
        strokeWidth={2.25}
        aria-hidden="true"
        fill={active ? 'currentColor' : 'none'}
      />
      <span className="tabular text-xs font-semibold">{count}</span>
      <span className="sr-only">
        {active
          ? 'favourites — showing favourites only, activate to show all Pokémon'
          : `favourite${count === 1 ? '' : 's'} — activate to show favourites only`}
      </span>
    </Link>
  )
}
