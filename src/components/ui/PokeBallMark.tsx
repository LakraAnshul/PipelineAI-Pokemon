/**
 * The brand mark: a Poké Ball, drawn rather than photographed, so it reads at
 * 24px and inherits the theme's own colours instead of fighting them.
 */
export function PokeBallMark({
  size = 28,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="10.5" fill="var(--color-surface)" />
      <path d="M1.5 12a10.5 10.5 0 0 1 21 0Z" fill="var(--color-brand)" />
      <path d="M1.5 12h21" stroke="var(--color-text)" strokeWidth="1.5" />
      <circle
        cx="12"
        cy="12"
        r="3.4"
        fill="var(--color-surface)"
        stroke="var(--color-text)"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="1.15" fill="var(--color-text)" />
      <circle
        cx="12"
        cy="12"
        r="10.5"
        stroke="var(--color-text)"
        strokeWidth="1.5"
      />
    </svg>
  )
}
