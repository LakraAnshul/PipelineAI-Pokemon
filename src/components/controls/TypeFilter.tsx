import { POKEMON_TYPES, type TypeFilterValue } from '@/types/pokemon'
import { cn } from '@/utils/cn'
import { getTypeColor } from '@/utils/typeColors'

/**
 * The type filter, as a rail of chips.
 *
 * Chips rather than a dropdown: eighteen types with eighteen colours are worth
 * showing all at once, and the inactive chip's colour dot teaches the palette
 * before anything is selected. Selecting one fills the chip with that type's
 * colour, so the filter and the badges on the cards agree visually.
 *
 * Rendered as a radiogroup — exactly one is always active, which is what a radio
 * group means and what a row of toggle buttons would not.
 */
export function TypeFilter({
  value,
  onChange,
  className,
}: {
  value: TypeFilterValue
  onChange: (value: TypeFilterValue) => void
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Filter by type"
      className={cn(
        'no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5',
        'md:mx-0 md:flex-wrap md:overflow-visible md:px-0',
        className,
      )}
    >
      <Chip active={value === 'all'} onSelect={() => onChange('all')}>
        All
      </Chip>

      {POKEMON_TYPES.map((type) => {
        const { base, onBase } = getTypeColor(type)
        const active = value === type

        return (
          <Chip
            key={type}
            active={active}
            onSelect={() => onChange(type)}
            style={active ? { backgroundColor: base, color: onBase, borderColor: base } : undefined}
            dot={active ? undefined : base}
          >
            {type}
          </Chip>
        )
      })}
    </div>
  )
}

function Chip({
  active,
  onSelect,
  dot,
  style,
  children,
}: {
  active: boolean
  onSelect: () => void
  /** Colour swatch shown while inactive. */
  dot?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      style={style}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5',
        'font-mono text-[11px] tracking-[0.06em] uppercase',
        'transition-[background-color,border-color,color] duration-150',
        active
          ? 'border-transparent font-medium'
          : 'border-border bg-surface text-text-muted hover:border-text-muted/40 hover:text-text',
      )}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full"
          style={{ backgroundColor: dot }}
        />
      ) : null}
      {children}
    </button>
  )
}
