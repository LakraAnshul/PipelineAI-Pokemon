import { AnimatePresence, motion } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

/**
 * The one thing worth interrupting for: the connection is gone, so a card that
 * never arrives is not the app misbehaving.
 *
 * It slides in over the masthead, states the consequence rather than the
 * diagnosis, and leaves the moment the connection returns — an offline notice
 * that needs dismissing is a second problem. The live region itself is always
 * mounted and only its contents change, because a `role="status"` inserted at the
 * same moment as its text often goes unannounced.
 */
export function OfflineBanner() {
  const online = useOnlineStatus()

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3"
    >
      <AnimatePresence>
        {online ? null : (
          <motion.p
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-surface/95 py-2 ps-3 pe-4 text-[13px] shadow-lift backdrop-blur-xl"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <WifiOff size={15} className="shrink-0 text-danger" aria-hidden="true" />
            <span>
              <span className="font-medium">You&apos;re offline.</span>{' '}
              <span className="text-text-muted">Some Pokémon may not load.</span>
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
