import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { OfflineBanner } from './OfflineBanner'

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

describe('OfflineBanner', () => {
  it('says nothing while the connection is fine', () => {
    render(<OfflineBanner />)
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument()
  })

  it('keeps the live region mounted, so the message is announced when it arrives', () => {
    render(<OfflineBanner />)
    const region = screen.getByRole('status')
    expect(region).toBeInTheDocument()
    expect(region).toHaveAttribute('aria-live', 'polite')
  })

  it('names the consequence when the connection drops', () => {
    render(<OfflineBanner />)

    emit('offline')

    const region = screen.getByRole('status')
    expect(region).toHaveTextContent("You're offline. Some Pokémon may not load.")
  })

  it('leaves on its own once the connection returns', async () => {
    setOnLine(false)
    render(<OfflineBanner />)
    expect(screen.getByRole('status')).toHaveTextContent(/offline/i)

    emit('online')

    await waitFor(() => {
      expect(screen.queryByText(/offline/i)).not.toBeInTheDocument()
    })
  })
})
