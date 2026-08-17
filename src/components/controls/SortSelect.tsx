import { ArrowDownUp, ChevronDown } from 'lucide-react'
import { SORT_OPTIONS, type SortKey } from '@/types/pokemon'
import { cn } from '@/utils/cn'

/**
 * Sort order.
 *
 * A native `<select>` on purpose: it is keyboard-navigable for free, opens as a
 * proper wheel on iOS and a proper list on Android, and cannot end up detached
 * from the viewport the way a hand-built menu can. Only the chrome is restyled.
 */
export function SortSelect({
  value,
  onChange,
  className,
}: {
  value: SortKey
  onChange: (value: SortKey) => void
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <ArrowDownUp
        size={15}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted"
      />

      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SortKey)}
        aria-label="Sort Pokémon"
        className={cn(
          'h-12 w-full cursor-pointer appearance-none rounded-2xl border border-border bg-surface',
          'pr-9 pl-9 text-sm',
          'transition-[border-color,box-shadow] duration-150',
          'focus:border-brand/45 focus:ring-4 focus:ring-brand/10 focus:outline-none',
        )}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={15}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-muted"
      />
    </div>
  )
}
