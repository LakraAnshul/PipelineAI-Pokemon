import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeftRight, X } from 'lucide-react'
import { useState } from 'react'
import { CompareModal } from '@/components/compare/CompareModal'
import { Button } from '@/components/ui/Button'
import { useCompare } from '@/contexts/CompareContext'
import { getArtworkUrl } from '@/services/pokemonApi'
import { formatPokemonName } from '@/utils/formatters'

/** Two is the fewest that can be compared; the tray waits until there are two. */
const MIN_COMPARE = 2

/**
 * The comparison basket.
 *
 * It only appears once something is in it, and it says how close the selection is
 * to being useful — "Add one more" is more helpful than a disabled button with no
 * explanation. Artwork comes straight from the dex number, so the tray costs no
 * requests at all.
 */
export function CompareTray() {
  const { items, count, max, removeFromCompare, clearCompare } = useCompare()
  const [open, setOpen] = useState(false)
  const ready = count >= MIN_COMPARE

  return (
    <>
      <AnimatePresence>
        {count > 0 ? (
          <motion.div
            // The safe-area inset keeps the tray clear of the iOS home
            // indicator, which otherwise sits right on top of "Compare".
            className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-xl pb-[env(safe-area-inset-bottom)] sm:inset-x-4 sm:bottom-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rounded-2xl border border-border bg-surface/90 p-2.5 shadow-lift backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <ul className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
                  {items.map((item) => (
                    <li key={item.id}>
                      <span className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 py-1 ps-1 pe-1.5">
                        <img
                          src={getArtworkUrl(item.id)}
                          alt=""
                          width={28}
                          height={28}
                          loading="lazy"
                          className="size-7 shrink-0 object-contain"
                        />
                        <span className="max-w-24 truncate text-xs font-medium">
                          {formatPokemonName(item.name)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCompare(item.id)}
                          aria-label={`Remove ${formatPokemonName(item.name)} from comparison`}
                          className="relative grid size-5 shrink-0 place-items-center rounded-full text-text-muted transition-colors before:absolute before:-inset-3 before:content-[''] hover:bg-surface hover:text-text"
                        >
                          <X size={12} aria-hidden="true" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!ready}
                    onClick={() => setOpen(true)}
                  >
                    <ArrowLeftRight size={13} aria-hidden="true" />
                    Compare
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearCompare}>
                    Clear
                  </Button>
                </div>
              </div>

              <p aria-live="polite" className="mt-1.5 px-1 text-[11px] text-text-muted">
                {ready
                  ? `${count} of ${max} selected.`
                  : 'Add one more Pokémon to compare.'}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <CompareModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
