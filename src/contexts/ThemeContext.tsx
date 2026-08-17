import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * Dark mode.
 *
 * The class on `<html>` is the single source of truth, and index.html sets it
 * before React boots so a dark-mode visitor never sees a white flash. This
 * context resumes from whatever that script decided, which is why it reads the
 * DOM on mount instead of re-deriving the theme from scratch.
 *
 * The stored value is a bare string, not JSON, so the inline boot script can
 * read it without a parser — hence no `useLocalStorage` here.
 */

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'pokemon-explorer:theme'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'dark' || stored === 'light' ? stored : null
  } catch {
    return null
  }
}

function readInitialTheme(): Theme {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return 'dark'
  }
  const stored = readStoredTheme()
  if (stored) return stored
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme)

  /**
   * Whether the visitor has chosen for themselves. Storage holds choices only —
   * writing the resolved default there too would silently opt everyone out of
   * following their system, since a stored value is indistinguishable from a
   * decision after the fact.
   */
  const [hasChoice, setHasChoice] = useState(() => readStoredTheme() !== null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    setHasChoice(true)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private mode — the class is applied, the choice just will not persist.
    }
  }, [])

  const toggleTheme = useCallback(
    () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    [setTheme, theme],
  )

  // Follow the OS, but only while the visitor has not overruled it.
  useEffect(() => {
    if (hasChoice) return

    let query: MediaQueryList
    try {
      query = window.matchMedia('(prefers-color-scheme: dark)')
    } catch {
      return
    }

    const onChange = (event: MediaQueryListEvent) =>
      setThemeState(event.matches ? 'dark' : 'light')

    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [hasChoice])

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider')
  return context
}
