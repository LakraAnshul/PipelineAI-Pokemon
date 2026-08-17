import { configure, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { CompareProvider } from '@/contexts/CompareContext'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { POKEMON_TYPES, type Pokemon } from '@/types/pokemon'
import { charizard, pikachu } from './fixtures'

/**
 * The whole app, driven by keyboard only.
 *
 * Unit tests can prove each control is labelled; only a journey like this proves
 * they are labelled *and* reachable *and* in an order that makes sense — and that
 * opening a Pokémon hands focus over and gives it back.
 */

// This file mounts the entire app while seventeen other suites share the CPU, so
// the default one-second wait measures machine load rather than behaviour.
configure({ asyncUtilTimeout: 5_000 })

vi.mock('@/services/pokemonApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/pokemonApi')>()
  return {
    ...actual,
    getAllPokemonRefs: vi.fn(),
    getPokemonRefsByType: vi.fn(),
    getPokemonDetailsSettled: vi.fn(),
    getPokemonDetail: vi.fn(),
  }
})

const ROSTER: Pokemon[] = [charizard, pikachu]

beforeEach(async () => {
  const api = await import('@/services/pokemonApi')

  vi.mocked(api.getAllPokemonRefs).mockResolvedValue(
    ROSTER.map(({ id, name }) => ({ id, name })),
  )
  vi.mocked(api.getPokemonRefsByType).mockResolvedValue([])
  vi.mocked(api.getPokemonDetailsSettled).mockImplementation(async (refs) => ({
    pokemon: refs
      .map((ref) => ROSTER.find((entry) => entry.id === ref.id))
      .filter((entry): entry is Pokemon => entry !== undefined),
    firstError: null,
  }))
  vi.mocked(api.getPokemonDetail).mockImplementation(async (nameOrId) => {
    const found = ROSTER.find((entry) => entry.name === String(nameOrId))
    if (!found) throw new Error(`unexpected request for ${String(nameOrId)}`)
    return found
  })
})

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <ThemeProvider>
        <FavoritesProvider>
          <CompareProvider>
            <App />
          </CompareProvider>
        </FavoritesProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

/** Resolves once the first page of cards has replaced the skeletons. */
async function waitForGrid() {
  return screen.findByRole('link', { name: /Charizard/ })
}

describe('keyboard journey', () => {
  it(
    'reaches every control in an order that follows the page',
    async () => {
      const user = userEvent.setup()
      renderApp()
      const card = await waitForGrid()

      // Every type is a stop of its own, in dex order. Asserted once, from the
      // nodes themselves, rather than by re-querying each name inside the loop —
      // resolving a control by accessible name scans the whole tree, and doing
      // that nineteen times mid-journey is what made this test slow.
      const chips = screen.getAllByRole('radio')
      expect(chips).toHaveLength(POKEMON_TYPES.length + 1)
      chips.forEach((chip, index) => {
        expect(chip).toHaveAccessibleName(index === 0 ? 'All' : POKEMON_TYPES[index - 1])
      })

      // The header carries only the brand and the theme switch, so search is the
      // first stop inside `main` rather than the last stop in the header.
      const stops = [
        screen.getByRole('link', { name: 'Skip to Pokémon' }),
        screen.getByRole('link', { name: /Pokémon Explorer/ }),
        screen.getByRole('button', { name: /Switch to (dark|light) theme/ }),
        screen.getByRole('searchbox', { name: /Search Pokémon/ }),
        screen.getByRole('combobox', { name: 'Sort Pokémon' }),
        screen.getByRole('button', { name: /^Favourites/ }),
        ...chips,
        card,
      ]

      for (const stop of stops) {
        await user.tab()
        expect(stop).toHaveFocus()
      }
    },
    20_000,
  )

  it('skips the header entirely when the skip link is used', async () => {
    const user = userEvent.setup()
    renderApp()
    await waitForGrid()

    await user.tab()
    const skip = screen.getByRole('link', { name: 'Skip to Pokémon' })
    expect(skip).toHaveAttribute('href', '#main')
    expect(document.querySelector('main')).toHaveAttribute('id', 'main')
  })

  it('opens a Pokémon with Enter, and gives focus back on Escape', async () => {
    const user = userEvent.setup()
    renderApp()
    const card = await waitForGrid()

    card.focus()
    await user.keyboard('{Enter}')

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    // Focus lands on the panel, not its first button, so the dialog is named
    // before anything inside it is announced.
    expect(dialog).toHaveFocus()
    await waitFor(() => {
      expect(dialog).toHaveAccessibleName('Charizard')
    })

    await user.keyboard('{Escape}')

    expect(card).toHaveFocus()
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('walks the dex with the arrow keys while the dialog stays open', async () => {
    const user = userEvent.setup()
    renderApp()
    const card = await waitForGrid()

    card.focus()
    await user.keyboard('{Enter}')
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => {
      expect(dialog).toHaveAccessibleName('Charizard')
    })

    await user.keyboard('{ArrowRight}')
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveAccessibleName('Pikachu')
    })

    await user.keyboard('{ArrowLeft}')
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveAccessibleName('Charizard')
    })
  })
})

describe('semantics', () => {
  it('lays the page out as landmarks, with one first-level heading', async () => {
    renderApp()
    await waitForGrid()

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('names the grid and says when it is still filling', async () => {
    renderApp()
    await waitForGrid()

    const grid = screen.getByRole('list', { name: 'Pokémon' })
    expect(grid).toHaveAttribute('aria-busy', 'false')
    expect(within(grid).getAllByRole('listitem')).toHaveLength(ROSTER.length)
  })

  it('states the match count in a live region', async () => {
    renderApp()
    await waitForGrid()

    // Scoped by its text rather than by role: the offline notice is a live region
    // too, and it is mounted from the first paint so it can announce later.
    const readout = screen.getByText(/matches/)
    expect(readout).toHaveAttribute('role', 'status')
    expect(readout).toHaveTextContent('2 matches')
  })

  it('gives each card an action-shaped label rather than just a name', async () => {
    renderApp()
    const card = await waitForGrid()

    expect(card).toHaveAccessibleName('Charizard, #006 — view details')
  })
})
