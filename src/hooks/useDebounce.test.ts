import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebounce } from './useDebounce'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useDebounce', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('pika', 250))
    expect(result.current).toBe('pika')
  })

  it('holds the old value until the delay has passed', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 250), {
      initialProps: { value: 'pika' },
    })

    rerender({ value: 'chu' })
    expect(result.current).toBe('pika')

    act(() => vi.advanceTimersByTime(250))
    expect(result.current).toBe('chu')
  })

  it('only emits the last value in a burst of changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 250), {
      initialProps: { value: 'c' },
    })

    rerender({ value: 'ch' })
    act(() => vi.advanceTimersByTime(100))
    rerender({ value: 'cha' })
    act(() => vi.advanceTimersByTime(100))
    rerender({ value: 'char' })

    expect(result.current).toBe('c')

    act(() => vi.advanceTimersByTime(250))
    expect(result.current).toBe('char')
  })
})
