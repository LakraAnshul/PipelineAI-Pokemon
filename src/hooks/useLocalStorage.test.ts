import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  it('starts from the initial value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage('favs', [1, 2]))
    expect(result.current[0]).toEqual([1, 2])
  })

  it('rehydrates a previously stored value', () => {
    window.localStorage.setItem('favs', JSON.stringify([25]))
    const { result } = renderHook(() => useLocalStorage<number[]>('favs', []))
    expect(result.current[0]).toEqual([25])
  })

  it('persists updates, including via an updater function', () => {
    const { result } = renderHook(() => useLocalStorage<number[]>('favs', []))

    act(() => result.current[1]([25]))
    expect(window.localStorage.getItem('favs')).toBe('[25]')

    act(() => result.current[1]((prev) => [...prev, 6]))
    expect(result.current[0]).toEqual([25, 6])
    expect(window.localStorage.getItem('favs')).toBe('[25,6]')
  })

  it('falls back to the initial value when the stored entry is corrupt', () => {
    window.localStorage.setItem('favs', '{not json')
    const { result } = renderHook(() => useLocalStorage<number[]>('favs', []))
    expect(result.current[0]).toEqual([])
  })

  it('keeps working when storage refuses to write', () => {
    const setItem = vi
      .spyOn(window.localStorage, 'setItem')
      .mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

    const { result } = renderHook(() => useLocalStorage<number[]>('favs', []))
    act(() => result.current[1]([25]))

    expect(result.current[0]).toEqual([25])
    setItem.mockRestore()
  })

  it('adopts a value written by another tab', () => {
    const { result } = renderHook(() => useLocalStorage<number[]>('favs', []))

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'favs', newValue: '[7]' }),
      )
    })

    expect(result.current[0]).toEqual([7])
  })
})
