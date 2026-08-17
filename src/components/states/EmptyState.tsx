import { Heart, SearchX, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

/**
 * Nothing to show — and why, plus the one action that fixes it.
 *
 * An empty screen with no way out reads as a broken screen, so every variant
 * ships with a reset. The three variants exist because "your search found
 * nothing", "your filters found nothing", and "you have not saved anything yet"
 * are different situations that deserve different sentences.
 */
export function EmptyState({
  variant,
  query,
  onReset,
  className,
}: {
  variant: 'search' | 'filter' | 'favorites'
  /** Echoed back for the search variant, so the user sees what was looked for. */
  query?: string
  onReset: () => void
  className?: string
}) {
  const copy = COPY[variant]

  return (
    <div
      className={cn(
        'mx-auto flex max-w-sm flex-col items-center px-6 py-20 text-center',
        className,
      )}
    >
      <span className="grid size-16 place-items-center rounded-2xl border border-border bg-surface-2 text-text-muted">
        <copy.Icon size={26} strokeWidth={1.75} aria-hidden="true" />
      </span>

      <h2 className="mt-6 font-display text-2xl font-bold tracking-tight">
        {copy.title}
      </h2>
      <p className="mt-2 text-text-muted">{copy.body}</p>

      {variant === 'search' && query ? (
        <p className="tabular mt-3 text-xs text-text-muted/80">
          No match for &ldquo;{query}&rdquo;
        </p>
      ) : null}

      <Button variant="secondary" onClick={onReset} className="mt-7">
        {copy.action}
      </Button>
    </div>
  )
}

const COPY = {
  search: {
    Icon: SearchX,
    title: 'Pokémon not found.',
    body: 'Try searching for another Pokémon.',
    action: 'Clear search',
  },
  filter: {
    Icon: SlidersHorizontal,
    title: 'No Pokémon found.',
    body: 'Try searching for a different Pokémon.',
    action: 'Show all Pokémon',
  },
  favorites: {
    Icon: Heart,
    title: 'No favourites yet.',
    body: 'Tap the heart on any Pokémon to keep it here.',
    action: 'Browse Pokémon',
  },
} as const
