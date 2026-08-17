import { motion } from 'framer-motion'
import type { StatKey } from '@/types/pokemon'
import { cn } from '@/utils/cn'
import { STAT_LABELS, STAT_MAX } from '@/utils/formatters'

/**
 * One base stat as a labelled bar.
 *
 * Scaled against 255 — the highest base stat in the games — so bars are
 * comparable between any two Pokémon rather than each being normalised to its
 * own maximum. The number is always printed beside the bar, because a bar alone
 * cannot be read precisely and colour alone cannot be read at all.
 */
export function StatBar({
  stat,
  value,
  color,
  delay = 0,
  className,
}: {
  stat: StatKey
  value: number
  /** Usually the Pokémon's primary type colour. */
  color: string
  delay?: number
  className?: string
}) {
  const percent = Math.min(100, (value / STAT_MAX) * 100)

  return (
    <div
      className={cn('grid grid-cols-[58px_1fr_34px] items-center gap-3', className)}
    >
      <span className="font-mono text-[10px] tracking-[0.06em] text-text-muted uppercase">
        {STAT_LABELS[stat]}
      </span>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-surface-2"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={STAT_MAX}
        aria-label={STAT_LABELS[stat]}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span className="tabular text-right text-xs">{value}</span>
    </div>
  )
}
