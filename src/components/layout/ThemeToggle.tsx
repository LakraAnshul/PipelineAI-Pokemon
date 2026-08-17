import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/utils/cn'

/**
 * Light/dark switch.
 *
 * The two icons are stacked and cross-dissolved rather than swapped, so the
 * control never changes size mid-press. The label names the *result* — a button
 * reading "Dark" is ambiguous about whether that is the current state or the one
 * click away.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = `Switch to ${isDark ? 'light' : 'dark'} theme`

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        'grid size-10 place-items-center rounded-full border border-border bg-surface',
        'text-text-muted transition-colors duration-150 hover:text-text hover:border-text-muted/35',
        'active:scale-95',
      )}
    >
      <span className="relative grid size-[18px] place-items-center">
        <Sun
          size={18}
          strokeWidth={2}
          aria-hidden="true"
          className={cn(
            'absolute transition-all duration-200',
            isDark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100',
          )}
        />
        <Moon
          size={17}
          strokeWidth={2}
          aria-hidden="true"
          className={cn(
            'absolute transition-all duration-200',
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0',
          )}
        />
      </span>
    </button>
  )
}
