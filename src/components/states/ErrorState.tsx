import { CloudOff, ServerCrash, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { isApiError, type ApiError } from '@/services/pokemonApi'
import { cn } from '@/utils/cn'

/**
 * Something failed. Say so, say what to do, and offer the button that does it.
 *
 * The headline and body are fixed so the message never mutates into jargon; the
 * muted line underneath is where the specific cause goes. Retrying is not
 * destructive, so `Try Again` is the primary action.
 */
export function ErrorState({
  error,
  onRetry,
  variant = 'page',
  className,
}: {
  error: unknown
  onRetry: () => void
  /** `page` owns the viewport; `inline` sits above a grid that still has cards. */
  variant?: 'page' | 'inline'
  className?: string
}) {
  const { Icon, detail } = describe(error)

  if (variant === 'inline') {
    return (
      <div
        role="alert"
        className={cn(
          'flex flex-wrap items-center gap-3 rounded-2xl border border-danger/25 bg-danger/5 px-4 py-3',
          className,
        )}
      >
        <Icon size={17} className="shrink-0 text-danger" aria-hidden="true" />
        <p className="text-sm">
          <span className="font-medium">Something went wrong.</span>{' '}
          <span className="text-text-muted">{detail}</span>
        </p>
        <Button size="sm" variant="danger" onClick={onRetry} className="ms-auto">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div
      role="alert"
      className={cn(
        'mx-auto flex max-w-sm flex-col items-center px-6 py-20 text-center',
        className,
      )}
    >
      <span className="grid size-16 place-items-center rounded-2xl border border-danger/20 bg-danger/8 text-danger">
        <Icon size={26} strokeWidth={1.75} aria-hidden="true" />
      </span>

      <h2 className="mt-6 font-display text-2xl font-bold tracking-tight">
        Something went wrong.
      </h2>
      <p className="mt-2 text-text-muted">We couldn&apos;t load the Pokémon.</p>
      <p className="mt-1 text-sm text-text-muted/80">{detail}</p>

      <Button variant="primary" size="lg" onClick={onRetry} className="mt-7">
        Try Again
      </Button>
    </div>
  )
}

/** Turns an ApiError kind into an icon and a line that names the actual cause. */
function describe(error: unknown): {
  Icon: typeof TriangleAlert
  detail: string
} {
  const kind: ApiError['kind'] | 'unknown' = isApiError(error) ? error.kind : 'unknown'

  switch (kind) {
    case 'network':
      return {
        Icon: CloudOff,
        detail: 'The PokéAPI could not be reached. Check your connection and try again.',
      }
    case 'notFound':
      return {
        Icon: TriangleAlert,
        detail: 'That Pokémon is not in the Pokédex.',
      }
    case 'http': {
      const status = isApiError(error) && error.status ? ` (${error.status})` : ''
      return {
        Icon: ServerCrash,
        detail: `The PokéAPI returned an error${status}. It may be busy — try again in a moment.`,
      }
    }
    case 'malformed':
      return {
        Icon: TriangleAlert,
        detail: 'The PokéAPI sent data this app could not read.',
      }
    default:
      return { Icon: TriangleAlert, detail: 'An unexpected error occurred.' }
  }
}
