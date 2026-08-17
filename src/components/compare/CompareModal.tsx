import { ChevronUp, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PokemonArtwork } from '@/components/pokemon/PokemonArtwork'
import { ErrorState } from '@/components/states/ErrorState'
import { Modal } from '@/components/ui/Modal'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { useCompare } from '@/contexts/CompareContext'
import { getPokemonDetails, toApiError, type ApiError } from '@/services/pokemonApi'
import { STAT_ORDER, type Pokemon, type StatKey } from '@/types/pokemon'
import { cn } from '@/utils/cn'
import { STAT_LABELS, STAT_MAX, formatPokemonId, formatPokemonName } from '@/utils/formatters'
import { getTypeColor, getTypeGradient } from '@/utils/typeColors'

const TITLE_ID = 'compare-title'

/**
 * Base stats, side by side.
 *
 * A real table, because that is what this is: stat names down the side, Pokémon
 * across the top, and every row readable by a screen reader in both directions.
 * The winner in each row is marked three ways — weight, colour, and a caret — so
 * the answer survives being read aloud or seen without colour.
 */
export function CompareModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { items } = useCompare()
  const [entries, setEntries] = useState<Pokemon[] | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setEntries(null)
    setError(null)

    getPokemonDetails(items)
      .then((result) => {
        if (!cancelled) setEntries(result)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(toApiError(cause))
      })

    return () => {
      cancelled = true
    }
  }, [open, items, reloadToken])

  return (
    <Modal open={open} onClose={onClose} labelledBy={TITLE_ID} className="sm:max-w-3xl">
      <div className="flex items-start justify-between gap-3 px-5 pt-6 pb-4 sm:px-7">
        <div>
          <p className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
            Side by side
          </p>
          <h2 id={TITLE_ID} className="mt-1.5 font-display text-2xl font-bold tracking-tight">
            Base stat comparison
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close comparison"
          title="Close comparison"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-text-muted transition-colors hover:border-text-muted/40 hover:text-text"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="px-5 pb-7 sm:px-7">
        {error ? (
          <ErrorState
            error={error}
            onRetry={() => setReloadToken((token) => token + 1)}
            variant="inline"
          />
        ) : entries === null ? (
          <p role="status" className="py-10 text-center text-sm text-text-muted">
            Loading stats…
          </p>
        ) : entries.length < 2 ? (
          <p className="py-10 text-center text-sm text-text-muted">
            Pick at least two Pokémon to compare.
          </p>
        ) : (
          <StatTable entries={entries} />
        )}
      </div>
    </Modal>
  )
}

function StatTable({ entries }: { entries: Pokemon[] }) {
  return (
    <table className="w-full table-fixed border-collapse">
      <caption className="sr-only">
        Base stats for {entries.map((entry) => formatPokemonName(entry.name)).join(', ')}
      </caption>

      <thead>
        <tr>
          <th scope="col" className="w-14 sm:w-20">
            <span className="sr-only">Stat</span>
          </th>
          {entries.map((entry) => (
            <th key={entry.id} scope="col" className="px-1 pb-4 align-bottom">
              <Column entry={entry} />
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {STAT_ORDER.map((stat) => (
          <Row key={stat} stat={stat} entries={entries} />
        ))}

        <tr>
          <th
            scope="row"
            className="border-t border-border pt-3 text-left font-mono text-[10px] tracking-[0.06em] uppercase"
          >
            Total
          </th>
          {entries.map((entry) => {
            const best = Math.max(...entries.map((candidate) => candidate.totalStats))
            const winner = entry.totalStats === best && !isTie(entries.map((e) => e.totalStats))

            return (
              <td
                key={entry.id}
                data-winner={winner}
                className="border-t border-border px-1 pt-3 text-center"
              >
                <span
                  className={cn(
                    'tabular inline-flex items-center gap-0.5 text-sm',
                    winner ? 'font-semibold text-text' : 'text-text-muted',
                  )}
                >
                  {entry.totalStats}
                  {winner ? <ChevronUp size={12} aria-hidden="true" /> : null}
                </span>
              </td>
            )
          })}
        </tr>
      </tbody>
    </table>
  )
}

function Column({ entry }: { entry: Pokemon }) {
  return (
    <span className="relative flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl px-2 pt-3 pb-2.5">
      <span
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.16]"
        style={{ background: getTypeGradient(entry.types) }}
      />
      <PokemonArtwork pokemon={entry} size={64} className="relative" />
      <span className="tabular relative text-[10px] text-text-muted">
        {formatPokemonId(entry.id)}
      </span>
      <span className="relative truncate font-display text-xs leading-tight font-bold sm:text-sm">
        {formatPokemonName(entry.name)}
      </span>
      <span className="relative flex flex-wrap justify-center gap-1">
        {entry.types.map((type) => (
          <TypeBadge key={type} type={type} size="sm" />
        ))}
      </span>
    </span>
  )
}

function Row({ stat, entries }: { stat: StatKey; entries: Pokemon[] }) {
  const values = entries.map((entry) => entry.stats[stat])
  const best = Math.max(...values)
  const tied = isTie(values)

  return (
    <tr>
      <th
        scope="row"
        className="py-2.5 text-left font-mono text-[10px] tracking-[0.06em] text-text-muted uppercase"
      >
        {STAT_LABELS[stat]}
      </th>

      {entries.map((entry) => {
        const value = entry.stats[stat]
        const winner = !tied && value === best

        return (
          <td key={entry.id} data-winner={winner} className="px-1 py-2.5 align-middle">
            <span
              className={cn(
                'tabular flex items-center justify-center gap-0.5 text-xs',
                winner ? 'font-semibold text-text' : 'text-text-muted',
              )}
            >
              {value}
              {winner ? <ChevronUp size={11} aria-hidden="true" /> : null}
            </span>
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface-2">
              <span
                className="block h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${Math.min(100, (value / STAT_MAX) * 100)}%`,
                  backgroundColor: getTypeColor(entry.types[0] ?? 'normal').base,
                  opacity: winner ? 1 : 0.55,
                }}
              />
            </span>
          </td>
        )
      })}
    </tr>
  )
}

/** No winner when everyone matches — a tie is information, not a draw to break. */
function isTie(values: number[]): boolean {
  return values.every((value) => value === values[0])
}
