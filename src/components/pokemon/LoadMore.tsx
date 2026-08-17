import { Button } from '@/components/ui/Button'
import { PokeBallLoader } from '@/components/ui/PokeBallLoader'
import { formatCount } from '@/utils/formatters'

/**
 * Paging by request rather than on scroll.
 *
 * Infinite scroll would hide the footer forever and take the page position away
 * from the reader; a button keeps both. The count underneath answers the
 * question the button raises — how much is left.
 */
export function LoadMore({
  onClick,
  isLoading,
  remaining,
}: {
  onClick: () => void
  isLoading: boolean
  remaining: number
}) {
  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      <Button
        size="lg"
        onClick={onClick}
        disabled={isLoading}
        className="min-w-48 rounded-2xl"
      >
        {isLoading ? (
          <>
            <PokeBallLoader size={17} label="Loading more Pokémon" />
            Loading
          </>
        ) : (
          'Load More'
        )}
      </Button>

      <p className="tabular text-[11px] tracking-[0.08em] text-text-muted uppercase">
        {formatCount(remaining)} more
      </p>
    </div>
  )
}
