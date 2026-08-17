import type { ComponentPropsWithRef } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

/**
 * Every button in the app.
 *
 * `primary` is the only red thing in the chrome, so exactly one action per view
 * gets it. Focus rings come from the global `:focus-visible` rule rather than
 * per-variant styles, which keeps keyboard affordances impossible to forget.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  ...props
}: ComponentPropsWithRef<'button'> & {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap',
        'transition-[background-color,border-color,color,box-shadow,transform] duration-150',
        'disabled:pointer-events-none disabled:opacity-45',
        'active:scale-[0.98]',
        SIZES[size],
        VARIANTS[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  )
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white shadow-card hover:brightness-110',
  secondary:
    'border border-border bg-surface text-text hover:bg-surface-2 hover:border-text-muted/35',
  ghost: 'text-text-muted hover:bg-surface-2 hover:text-text',
  danger: 'border border-danger/35 text-danger hover:bg-danger/10',
}
