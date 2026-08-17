import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'

const STORAGE_KEY = 'pokemon-explorer:theme'

const originalMatchMedia = window.matchMedia

/** A matchMedia whose answer is fixed but whose listeners can be fired. */
function stubMatchMedia(prefersDark: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()

  window.matchMedia = ((query: string) => ({
    matches: prefersDark,
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
      void listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
      void listeners.delete(listener),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia

  return {
    /** Simulates the OS switching schemes. */
    emit(matches: boolean) {
      act(() => {
        for (const listener of listeners) listener({ matches } as MediaQueryListEvent)
      })
    },
    get listenerCount() {
      return listeners.size
    },
  }
}

function Probe() {
  const { theme, toggleTheme } = useTheme()
  return (
    <>
      <p>theme: {theme}</p>
      <button type="button" onClick={toggleTheme}>
        toggle
      </button>
    </>
  )
}

function renderProbe() {
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  )
}

const root = document.documentElement

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    root.classList.remove('dark')
    root.style.colorScheme = ''
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('defaults to the system preference when nothing has been chosen', () => {
    stubMatchMedia(true)
    renderProbe()

    expect(screen.getByText('theme: dark')).toBeInTheDocument()
    expect(root).toHaveClass('dark')
  })

  it('resumes from the class the boot script already set', () => {
    // The inline script in index.html runs before React and wins; re-deriving
    // the theme here would flip the page after paint.
    root.classList.add('dark')
    stubMatchMedia(false)
    renderProbe()

    expect(screen.getByText('theme: dark')).toBeInTheDocument()
  })

  it('toggles the class on the document and records the choice', async () => {
    stubMatchMedia(false)
    renderProbe()
    expect(root).not.toHaveClass('dark')

    await userEvent.click(screen.getByRole('button', { name: 'toggle' }))
    expect(root).toHaveClass('dark')
    expect(root.style.colorScheme).toBe('dark')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')

    await userEvent.click(screen.getByRole('button', { name: 'toggle' }))
    expect(root).not.toHaveClass('dark')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
  })

  it('prefers the stored choice over the system preference', () => {
    localStorage.setItem(STORAGE_KEY, 'light')
    stubMatchMedia(true)
    renderProbe()

    expect(screen.getByText('theme: light')).toBeInTheDocument()
    expect(root).not.toHaveClass('dark')
  })

  it('follows the system until the visitor overrules it', async () => {
    const media = stubMatchMedia(false)
    renderProbe()

    media.emit(true)
    expect(screen.getByText('theme: dark')).toBeInTheDocument()

    // Choosing for yourself ends the arrangement — nothing should move the
    // theme afterwards but another press.
    await userEvent.click(screen.getByRole('button', { name: 'toggle' }))
    expect(screen.getByText('theme: light')).toBeInTheDocument()
    expect(media.listenerCount).toBe(0)

    media.emit(true)
    expect(screen.getByText('theme: light')).toBeInTheDocument()
  })

  it('leaves storage untouched until something is actually chosen', () => {
    stubMatchMedia(true)
    renderProbe()

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('refuses to be used outside its provider', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Probe />)).toThrow(/ThemeProvider/)

    logged.mockRestore()
  })
})
