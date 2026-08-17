import { ArrowLeftRight, ChevronLeft, ChevronRight, Heart, X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { MoveList } from '@/components/pokemon/MoveList'
import { PokemonArtwork } from '@/components/pokemon/PokemonArtwork'
import { ErrorState } from '@/components/states/ErrorState'
import { Button } from '@/components/ui/Button'
import { IconToggle } from '@/components/ui/IconToggle'
import { Modal } from '@/components/ui/Modal'
import { PokeBallMark } from '@/components/ui/PokeBallMark'
import { Seam } from '@/components/ui/Seam'
import { StatBar } from '@/components/ui/StatBar'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { useCompare } from '@/contexts/CompareContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { usePokemonDetail } from '@/hooks/usePokemonDetail'
import { STAT_ORDER, type Pokemon } from '@/types/pokemon'
import { cn } from '@/utils/cn'
import {
  formatAbilityName,
  formatBaseExperience,
  formatHeight,
  formatPokemonId,
  formatPokemonName,
  formatWeight,
} from '@/utils/formatters'
import { getTypeColor, getTypeGradient, getTypeSpotlight } from '@/utils/typeColors'

const TITLE_ID = 'pokemon-detail-title'

/**
 * One Pokémon in full: artwork, identity, measurements, abilities, base stats,
 * and moves.
 *
 * The header band is a specimen plate — the type gradient washed back far enough
 * that the name stays legible on all eighteen types, the artwork lit by its own
 * type colour, and the Poké Ball seam closing the plate off from the data below.
 *
 * `←` and `→` walk the loaded grid without closing, which is what turns this from
 * a dialog into a way of reading the dex.
 */
export function PokemonDetailModal({
  nameOrId,
  onClose,
  onNavigate,
  hasPrevious,
  hasNext,
}: {
  /** Name or dex number from the URL. `null` keeps the dialog closed. */
  nameOrId: string | null
  onClose: () => void
  onNavigate: (step: -1 | 1) => void
  hasPrevious: boolean
  hasNext: boolean
}) {
  const { pokemon, status, error, retry } = usePokemonDetail(nameOrId)

  // Arrow keys walk the grid without closing — the dex read as a sequence, not a
  // set of dead ends. Ignored while a control has focus so Tab order still works.
  useEffect(() => {
    if (nameOrId === null) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return

      const step = event.key === 'ArrowLeft' ? -1 : 1
      if ((step === -1 && !hasPrevious) || (step === 1 && !hasNext)) return

      event.preventDefault()
      onNavigate(step)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [nameOrId, onNavigate, hasPrevious, hasNext])

  return (
    <Modal open={nameOrId !== null} onClose={onClose} labelledBy={TITLE_ID}>
      {/* Named even while loading, so the dialog is never anonymous. */}
      <h2 id={TITLE_ID} className="sr-only">
        {pokemon ? formatPokemonName(pokemon.name) : 'Pokémon details'}
      </h2>

      <Controls
        onClose={onClose}
        onNavigate={onNavigate}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
      />

      {status === 'ready' && pokemon ? (
        <Detail pokemon={pokemon} />
      ) : status === 'error' && error?.kind === 'notFound' ? (
        <NotFound onClose={onClose} />
      ) : status === 'error' ? (
        <div className="p-4 pt-14">
          <ErrorState error={error} onRetry={retry} />
        </div>
      ) : (
        <DetailSkeleton />
      )}
    </Modal>
  )
}

/* ── Chrome ───────────────────────────────────────────────────────────── */

function Controls({
  onClose,
  onNavigate,
  hasPrevious,
  hasNext,
}: {
  onClose: () => void
  onNavigate: (step: -1 | 1) => void
  hasPrevious: boolean
  hasNext: boolean
}) {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 p-3 sm:p-4">
      <div className="flex gap-2">
        <RoundButton
          label="Previous Pokémon"
          onClick={() => onNavigate(-1)}
          disabled={!hasPrevious}
        >
          <ChevronLeft size={17} aria-hidden="true" />
        </RoundButton>
        <RoundButton
          label="Next Pokémon"
          onClick={() => onNavigate(1)}
          disabled={!hasNext}
        >
          <ChevronRight size={17} aria-hidden="true" />
        </RoundButton>
      </div>

      <RoundButton label="Close details" onClick={onClose}>
        <X size={17} aria-hidden="true" />
      </RoundButton>
    </div>
  )
}

function RoundButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'relative grid size-9 place-items-center rounded-full border border-border bg-surface/85 text-text-muted backdrop-blur-sm',
        'transition-[color,border-color,transform] duration-150',
        'hover:border-text-muted/40 hover:text-text active:scale-90',
        // Grown to a 44px touch target without growing the button.
        "before:absolute before:-inset-1 before:content-['']",
        'disabled:pointer-events-none disabled:opacity-35',
      )}
    >
      {children}
    </button>
  )
}

/* ── Content ──────────────────────────────────────────────────────────── */

function Detail({ pokemon }: { pokemon: Pokemon }) {
  const primary = getTypeColor(pokemon.types[0] ?? 'normal')
  const { isFavorite, toggleFavorite } = useFavorites()
  const { isComparing, isFull, toggleCompare } = useCompare()

  const favorite = isFavorite(pokemon.id)
  const comparing = isComparing(pokemon.id)
  const displayName = formatPokemonName(pokemon.name)

  return (
    <>
      <div className="relative overflow-hidden bg-surface-2/50 px-5 pt-16 pb-6 text-center sm:px-7">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.18]"
          style={{ background: getTypeGradient(pokemon.types) }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-25"
          style={{ background: getTypeSpotlight(pokemon.types) }}
        />
        <PokeBallMark
          size={300}
          className="pointer-events-none absolute -top-24 -right-24 rotate-12 opacity-[0.05]"
        />

        <div className="relative">
          <PokemonArtwork
            pokemon={pokemon}
            size={186}
            fluid
            priority
            className="mx-auto h-auto w-[54%] max-w-[248px] min-w-[150px] drop-shadow-2xl motion-safe:animate-float"
          />

          <p className="tabular mt-2 text-xs tracking-[0.12em] text-text-muted">
            {formatPokemonId(pokemon.id)}
          </p>
          <p className="font-display text-3xl leading-tight font-extrabold tracking-[-0.02em] sm:text-4xl">
            {displayName}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            {pokemon.types.map((type) => (
              <TypeBadge key={type} type={type} size="md" />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            <IconToggle
              active={favorite}
              label={
                favorite
                  ? `Remove ${displayName} from favourites`
                  : `Add ${displayName} to favourites`
              }
              onClick={() => toggleFavorite(pokemon.id)}
            >
              <Heart size={15} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
            </IconToggle>

            <Button
              variant={comparing ? 'primary' : 'secondary'}
              size="sm"
              aria-pressed={comparing}
              disabled={isFull && !comparing}
              onClick={() => toggleCompare({ id: pokemon.id, name: pokemon.name })}
              className="rounded-full"
            >
              <ArrowLeftRight size={14} aria-hidden="true" />
              {comparing ? 'In comparison' : 'Compare'}
            </Button>
          </div>
        </div>
      </div>

      <Seam color={primary.base} />

      <div className="space-y-7 px-5 py-7 sm:px-7">
        <Section title="About">
          <dl className="grid grid-cols-3 gap-2.5">
            <Measure label="Height" value={formatHeight(pokemon.height)} />
            <Measure label="Weight" value={formatWeight(pokemon.weight)} />
            <Measure label="Base XP" value={formatBaseExperience(pokemon.baseExperience)} />
          </dl>
        </Section>

        <Section title="Abilities">
          <ul className="flex flex-wrap gap-1.5">
            {pokemon.abilities.map((ability) => (
              <li
                key={ability.name}
                className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs"
              >
                {formatAbilityName(ability.name)}
                {ability.isHidden ? (
                  <span className="ms-1.5 text-text-muted">(hidden)</span>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Base stats">
          <div className="space-y-2.5">
            {STAT_ORDER.map((stat, index) => (
              <StatBar
                key={stat}
                stat={stat}
                value={pokemon.stats[stat]}
                color={primary.base}
                delay={0.08 + index * 0.05}
              />
            ))}

            <div className="grid grid-cols-[58px_1fr_34px] items-center gap-3 border-t border-border pt-2.5">
              <span className="font-mono text-[10px] tracking-[0.06em] uppercase">
                Total
              </span>
              <span />
              <span className="tabular text-right text-xs font-semibold">
                {pokemon.totalStats}
              </span>
            </div>
          </div>
        </Section>

        <Section title="Moves">
          <MoveList moves={pokemon.moves} total={pokemon.moveCount} />
        </Section>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Measure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2/50 px-3 py-3 text-center">
      <dt className="font-mono text-[9px] tracking-[0.14em] text-text-muted uppercase">
        {label}
      </dt>
      <dd className="mt-1.5 font-display text-[15px] font-semibold">{value}</dd>
    </div>
  )
}

/* ── Non-happy paths, in the same geometry ────────────────────────────── */

function NotFound({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center px-6 py-20 pt-24 text-center"
    >
      <PokeBallMark size={44} className="opacity-40" />
      <h3 className="mt-6 font-display text-2xl font-bold tracking-tight">
        Pokémon not found.
      </h3>
      <p className="mt-2 text-text-muted">Try searching for another Pokémon.</p>
      <Button variant="primary" size="lg" onClick={onClose} className="mt-7">
        Back to all Pokémon
      </Button>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div>
      <div aria-hidden="true">
        <div className="bg-surface-2/50 px-5 pt-16 pb-6 sm:px-7">
          <div className="shimmer mx-auto size-[186px] rounded-full bg-surface-2" />
          <div className="shimmer mx-auto mt-3 h-3 w-14 rounded bg-surface-2" />
          <div className="shimmer mx-auto mt-3 h-8 w-44 rounded bg-surface-2" />
          <div className="shimmer mx-auto mt-4 h-5 w-32 rounded-full bg-surface-2" />
        </div>

        <Seam color="var(--color-border)" />

        <div className="space-y-6 px-5 py-7 sm:px-7">
          <div className="grid grid-cols-3 gap-2.5">
            {[0, 1, 2].map((cell) => (
              <div key={cell} className="shimmer h-[68px] rounded-2xl bg-surface-2" />
            ))}
          </div>
          <div className="space-y-2.5">
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="shimmer h-4 rounded bg-surface-2" />
            ))}
          </div>
        </div>
      </div>

      <p role="status" className="sr-only">
        Loading Pokémon details
      </p>
    </div>
  )
}
