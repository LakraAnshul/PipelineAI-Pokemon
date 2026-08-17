import { cn } from '@/utils/cn'

/**
 * A spinning Poké Ball, for the one moment where the whole screen is empty and
 * there is no card geometry to imitate yet. Everywhere else, skeletons that
 * match the real layout beat a spinner.
 */
export function PokeBallLoader({
  size = 40,
  className,
  label = 'Loading',
}: {
  size?: number
  className?: string
  label?: string
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-block', className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        className="motion-safe:animate-spin"
        style={{ animationDuration: '1.4s' }}
        aria-hidden="true"
      >
        <circle cx="24" cy="24" r="21" fill="var(--color-surface)" />
        {/* Upper half in brand red, lower half left as the surface: a Poké Ball
            drawn with the same two tones the rest of the chrome uses. */}
        <path
          d="M3 24a21 21 0 0 1 42 0Z"
          fill="var(--color-brand)"
        />
        <path d="M3 24h42" stroke="var(--color-text)" strokeWidth="3" />
        <circle
          cx="24"
          cy="24"
          r="7"
          fill="var(--color-surface)"
          stroke="var(--color-text)"
          strokeWidth="3"
        />
        <circle
          cx="24"
          cy="24"
          r="21"
          fill="none"
          stroke="var(--color-text)"
          strokeWidth="3"
        />
      </svg>
    </span>
  )
}
