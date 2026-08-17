import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { cn } from '@/utils/cn'

/**
 * The dialog shell both the detail and comparison views sit in.
 *
 * Everything that is easy to get wrong lives here once: the portal, the
 * backdrop, `aria-modal`, the focus trap, the scroll lock, Escape, and
 * click-outside. A modal that reimplements any of those tends to forget one.
 *
 * It rises as a sheet from the bottom edge on a phone and lifts into the centre
 * on a desktop, which is the same animation read at two sizes rather than two
 * animations.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  className,
  children,
}: {
  open: boolean
  onClose: () => void
  /** Id of the element naming this dialog. */
  labelledBy: string
  className?: string
  children: ReactNode
}) {
  const panelRef = useFocusTrap<HTMLDivElement>(open)
  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            aria-hidden="true"
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            className={cn(
              'relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl bg-surface shadow-lift outline-none',
              // Pays back the home-indicator inset, so the last row of a sheet
              // is not sitting under it.
              'pb-[env(safe-area-inset-bottom)] sm:max-w-2xl sm:rounded-3xl sm:pb-0',
              className,
            )}
            initial={{ opacity: 0, y: 28, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.99 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Grab handle — a phone sheet should look like one. */}
            <span
              aria-hidden="true"
              className="absolute top-2.5 left-1/2 z-20 h-1 w-10 -translate-x-1/2 rounded-full bg-text/20 sm:hidden"
            />
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
