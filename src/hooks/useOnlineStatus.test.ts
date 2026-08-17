import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useOnlineStatus, useReconnect } from './useOnlineStatus'

/** jsdom reports a fixed `navigator.onLine`, so the value is stubbed per test. */
function setOnLine(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value })
}

function emit(type: 'online' | 'offline') {
  setOnLine(type === 'online')
  act(() => {
    window.dispatchEvent(new Event(type))
  })
}

afterEach(() => {
  setOnLine(true)
})

describe('useOnlineStatus', () => {
  it('reads the current connection state on the first render', () => {
    setOnLine(false)
    expect(renderHook(() => useOnlineStatus()).result.current).toBe(false)

    setOnLine(true)
    expect(renderHook(() => useOnlineStatus()).result.current).toBe(true)
  })

  it('follows the connection dropping and coming back', () => {
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)

    emit('offline')
    expect(result.current).toBe(false)

    emit('online')
    expect(result.current).toBe(true)
  })

  it('stops listening once unmounted', () => {
    const { unmount } = renderHook(() => useOnlineStatus())
    const remove = vi.spyOn(window, 'removeEventListener')

    unmount()

    expect(remove).toHaveBeenCalledWith('online', expect.any(Function))
    expect(remove).toHaveBeenCalledWith('offline', expect.any(Function))
  })
})

describe('useReconnect', () => {
  it('does not fire merely because the page is already online', () => {
    const onReconnect = vi.fn()
    renderHook(() => useReconnect(onReconnect))
    expect(onReconnect).not.toHaveBeenCalled()
  })

  it('fires when the connection comes back, and not when it drops', () => {
    const onReconnect = vi.fn()
    renderHook(() => useReconnect(onReconnect))

    emit('offline')
    expect(onReconnect).not.toHaveBeenCalled()

    emit('online')
    expect(onReconnect).toHaveBeenCalledTimes(1)
  })

  it('calls the latest callback, not the one from the first render', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(({ fn }: { fn: () => void }) => useReconnect(fn), {
      initialProps: { fn: first },
    })

    rerender({ fn: second })
    emit('online')

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('stops listening once unmounted', () => {
    const onReconnect = vi.fn()
    const { unmount } = renderHook(() => useReconnect(onReconnect))

    unmount()
    emit('online')

    expect(onReconnect).not.toHaveBeenCalled()
  })
})
