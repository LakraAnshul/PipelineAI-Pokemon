import { cn } from '@/utils/cn'

/**
 * The signature device: a Poké Ball's seam.
 *
 * A hairline rule with a latch straddling it. It appears wherever the interface
 * splits a specimen from its data — between a card's artwork and its readout,
 * and again under the detail modal's header. The latch takes the Pokémon's
 * primary type colour, which is how type earns a structural role here instead of
 * being another badge.
 *
 * ────────────────●────────────────
 */
export function Seam({
  color,
  align = 'center',
  className,
}: {
  /** Latch fill. Defaults to the brand red. */
  color?: string
  align?: 'center' | 'left'
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={cn('relative border-t border-border', className)}
    >
      <span
        className={cn(
          'absolute top-0 grid size-6 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface',
          align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0',
        )}
      >
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: color ?? 'var(--color-brand)' }}
        />
      </span>
    </div>
  )
}
