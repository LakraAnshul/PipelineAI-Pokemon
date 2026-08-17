import { useEffect, useRef, useSyncExternalStore } from 'react'

/**
 * Whether the browser thinks it has a network.
 *
 * `navigator.onLine` is only trustworthy in one direction: `false` reliably means
 * nothing will load, while `true` only means an interface exists — a captive
 * portal or a dead uplink still reads as online. So this drives a banner that
 * *adds* an explanation when things are broken, and never one that claims
 * everything is fine.
 *
 * `useSyncExternalStore` rather than state plus an effect: the value is read at
 * render time, so the first paint after a reconnect is already correct.
 */
function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener('online', onStoreChange)
  window.addEventListener('offline', onStoreChange)
  return () => {
    window.removeEventListener('online', onStoreChange)
    window.removeEventListener('offline', onStoreChange)
  }
}

function getSnapshot(): boolean {
  return navigator.onLine
}

/** No network state exists before hydration; assume online so nothing flashes. */
function getServerSnapshot(): boolean {
  return true
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Runs `onReconnect` at the moment the connection comes back — the `online` event
 * is the transition, so nothing fires on mount and being online is not an event.
 *
 * The callback is read from a ref, which lets callers pass an inline closure over
 * fresh state without rebinding the listener on every render.
 */
export function useReconnect(onReconnect: () => void): void {
  const latest = useRef(onReconnect)

  useEffect(() => {
    latest.current = onReconnect
  })

  useEffect(() => {
    const handler = () => latest.current()
    window.addEventListener('online', handler)
    return () => window.removeEventListener('online', handler)
  }, [])
}
