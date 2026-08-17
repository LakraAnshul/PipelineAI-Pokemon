import { Seam } from '@/components/ui/Seam'
import { cn } from '@/utils/cn'

/**
 * A card that has not arrived yet.
 *
 * Deliberately the same geometry as `PokemonCard` — same aspect ratio, same
 * seam, same three lines on the plate — so the grid never jumps when real data
 * replaces it. A shimmer, not the word "Loading": the shape already says that.
 */
export function PokemonCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-surface shadow-card',
        className,
      )}
    >
      <div className="aspect-[6/5] p-8">
        <div className="shimmer size-full rounded-full opacity-70" />
      </div>

      <Seam color="var(--color-border)" />

      <div className="space-y-2.5 px-4 pt-4 pb-4">
        <div className="shimmer h-2.5 w-10 rounded-full" />
        <div className="shimmer h-4 w-2/3 rounded-full" />
        <div className="flex gap-1.5 pt-0.5">
          <div className="shimmer h-4 w-14 rounded-full" />
          <div className="shimmer h-4 w-11 rounded-full" />
        </div>
      </div>
    </div>
  )
}
