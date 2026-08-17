import { formatMoveName } from '@/utils/formatters'

/** How many moves are worth showing before the list stops being a list. */
const VISIBLE = 12

/**
 * Moves, truncated honestly.
 *
 * Some Pokémon learn well over a hundred; printing them all would bury the stats
 * that people came for. Twelve is enough to characterise a Pokémon, and the count
 * that follows says exactly how much was left out rather than implying the list
 * is complete.
 */
export function MoveList({ moves, total }: { moves: string[]; total: number }) {
  const shown = moves.slice(0, VISIBLE)
  const remaining = total - shown.length

  if (shown.length === 0) {
    return <p className="text-sm text-text-muted">No moves listed.</p>
  }

  return (
    <div>
      <ul className="flex flex-wrap gap-1.5">
        {shown.map((move) => (
          <li
            key={move}
            className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs text-text-muted"
          >
            {formatMoveName(move)}
          </li>
        ))}
      </ul>

      {remaining > 0 ? (
        <p className="tabular mt-2.5 text-[11px] tracking-[0.06em] text-text-muted/75 uppercase">
          + {remaining} more {remaining === 1 ? 'move' : 'moves'}
        </p>
      ) : null}
    </div>
  )
}
