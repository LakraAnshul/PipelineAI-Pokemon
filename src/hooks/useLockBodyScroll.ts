import { useEffect } from 'react'

/**
 * Stops the page behind a dialog from scrolling.
 *
 * The scrollbar's width is paid back as padding, otherwise hiding it shifts the
 * whole layout a few pixels left the moment a modal opens — a flinch that is very
 * visible on desktop and entirely avoidable.
 */
export function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return

    const { body } = document
    const previousOverflow = body.style.overflow
    const previousPadding = body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPadding
    }
  }, [active])
}
