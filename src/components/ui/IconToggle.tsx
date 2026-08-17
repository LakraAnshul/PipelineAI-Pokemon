import { useEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

/**
 * A circular icon button with an on/off state — favourite and compare.
 *
 * `aria-pressed` carries the state to assistive tech, and the label is always
 * supplied explicitly, because an icon alone never says what it will do.
 *
 * Switching it on is worth a small celebration: the button springs once and a
 * ring leaves it, so hearting something feels like an act rather than a state
 * change. Switching it off is silent — undoing should not be congratulated.
 */
export function IconToggle({
  active,
  activeColor,
  label,
  size = 'md',
  children,
  className,
  ...props
}: Omit<ComponentPropsWithRef<'button'>, 'aria-pressed' | 'aria-label'> & {
  active: boolean
  /** Fill used when on. Defaults to brand red. */
  activeColor?: string
  label: string
  size?: 'sm' | 'md'
  children: ReactNode
}) {
  const [celebrating, setCelebrating] = useState(false)
  const wasActive = useRef(active)

  useEffect(() => {
    const turnedOn = active && !wasActive.current
    wasActive.current = active
    if (!turnedOn) return

    setCelebrating(true)
    const timer = window.setTimeout(() => setCelebrating(false), 440)
    return () => window.clearTimeout(timer)
  }, [active])

  const fill = activeColor ?? 'var(--color-brand)'

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        'relative grid place-items-center rounded-full border backdrop-blur-sm',
        'transition-[background-color,border-color,color,transform] duration-150',
        'active:scale-90',
        // A 32px circle is the right size to look at and the wrong size to hit,
        // so the touch target is grown past the border instead of the button.
        "before:absolute before:content-['']",
        size === 'sm' ? 'size-8 before:-inset-1.5' : 'size-9 before:-inset-1',
        active
          ? 'border-transparent text-white'
          : 'border-border bg-surface/80 text-text-muted hover:text-text hover:border-text-muted/40',
        celebrating && 'motion-safe:animate-pop',
        className,
      )}
      style={active ? { backgroundColor: fill } : undefined}
      {...props}
    >
      {celebrating ? (
        <span
          aria-hidden="true"
          // Transparent unless the animation is actually allowed to run — its
          // keyframes supply the opacity, so reduced motion gets nothing at all
          // rather than a solid disc sitting there for 440ms.
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 motion-safe:animate-halo"
          style={{ backgroundColor: fill }}
        />
      ) : null}
      <span className="relative grid place-items-center">{children}</span>
    </button>
  )
}
