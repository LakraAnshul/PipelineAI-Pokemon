import { Search, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { cn } from '@/utils/cn'

/**
 * Search by name or dex number.
 *
 * Runs against an in-memory index, so results follow within a frame of the
 * debounce — no spinner, no submit button, no form. `Escape` clears the field,
 * which is the shortcut people already expect from a search box.
 */
export function SearchBar({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  // `/` focuses search, the way it does in most catalogues and code hosts.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return

      const target = event.target as HTMLElement | null
      const typingElsewhere =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable === true
      if (typingElsewhere) return

      event.preventDefault()
      inputRef.current?.focus()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className={cn('relative', className)}>
      <Search
        size={17}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-muted"
      />

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.preventDefault()
            onChange('')
          }
        }}
        placeholder="Search Pokémon..."
        aria-label="Search Pokémon by name or number"
        autoComplete="off"
        spellCheck={false}
        className={cn(
          'h-12 w-full rounded-2xl border border-border bg-surface pr-11 pl-11',
          'text-[15px] placeholder:text-text-muted',
          'transition-[border-color,box-shadow] duration-150',
          'focus:border-brand/45 focus:ring-4 focus:ring-brand/10 focus:outline-none',
        )}
      />

      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange('')
            inputRef.current?.focus()
          }}
          aria-label="Clear search"
          className={cn(
            'absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center',
            'rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text',
          )}
        >
          <X size={15} aria-hidden="true" />
        </button>
      ) : (
        <kbd
          aria-hidden="true"
          className="tabular pointer-events-none absolute top-1/2 right-3.5 hidden -translate-y-1/2 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-text-muted/70 md:block"
        >
          /
        </kbd>
      )}
    </div>
  )
}
