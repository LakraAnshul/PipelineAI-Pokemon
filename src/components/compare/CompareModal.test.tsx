import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CompareProvider } from '@/contexts/CompareContext'
import { getPokemonDetails } from '@/services/pokemonApi'
import { charizard, pikachu } from '@/test/fixtures'
import type { Pokemon } from '@/types/pokemon'
import { CompareModal } from './CompareModal'

vi.mock('@/services/pokemonApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/pokemonApi')>()
  return { ...actual, getPokemonDetails: vi.fn() }
})

const mockedDetails = vi.mocked(getPokemonDetails)

/** The tray persists, so seeding storage is how a real reload arrives here. */
function seedTray() {
  localStorage.setItem(
    'pokemon-explorer:compare',
    JSON.stringify([
      { id: pikachu.id, name: pikachu.name },
      { id: charizard.id, name: charizard.name },
    ]),
  )
}

function renderCompare() {
  const onClose = vi.fn()

  render(
    <CompareProvider>
      <CompareModal open onClose={onClose} />
    </CompareProvider>,
  )

  return { onClose }
}

/** The cell for one stat and one Pokémon, found the way a reader would find it. */
function cell(stat: string, column: number): HTMLElement {
  const header = screen.getByRole('rowheader', { name: stat })
  const row = header.closest('tr') as HTMLElement
  return within(row).getAllByRole('cell')[column]
}

describe('CompareModal', () => {
  beforeEach(() => {
    localStorage.clear()
    seedTray()
    mockedDetails.mockResolvedValue([pikachu, charizard])
  })

  it('heads a column with each Pokémon and a row with each stat', async () => {
    renderCompare()

    expect(
      await screen.findByRole('columnheader', { name: /Pikachu/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Charizard/ })).toBeInTheDocument()

    for (const stat of ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed']) {
      expect(screen.getByRole('rowheader', { name: stat })).toBeInTheDocument()
    }
  })

  it('shows both values in every stat row', async () => {
    renderCompare()
    await screen.findByRole('table')

    expect(cell('HP', 0)).toHaveTextContent('35')
    expect(cell('HP', 1)).toHaveTextContent('78')
    expect(cell('Speed', 0)).toHaveTextContent('90')
    expect(cell('Speed', 1)).toHaveTextContent('100')
    expect(cell('Total', 0)).toHaveTextContent('320')
    expect(cell('Total', 1)).toHaveTextContent('534')
  })

  it('marks the higher value in each row as the winner', async () => {
    renderCompare()
    await screen.findByRole('table')

    // Charizard beats Pikachu on every base stat, ties included — so this proves
    // the marker appears, and the two tests below prove it is not just always on.
    expect(cell('Attack', 0)).toHaveAttribute('data-winner', 'false')
    expect(cell('Attack', 1)).toHaveAttribute('data-winner', 'true')
    expect(cell('Speed', 0)).toHaveAttribute('data-winner', 'false')
    expect(cell('Speed', 1)).toHaveAttribute('data-winner', 'true')
    expect(cell('Total', 1)).toHaveAttribute('data-winner', 'true')
  })

  it('follows the value rather than the column, when the first one leads', async () => {
    mockedDetails.mockResolvedValue([
      { ...pikachu, stats: { ...pikachu.stats, attack: 200 } },
      charizard,
    ])
    renderCompare()
    await screen.findByRole('table')

    expect(cell('Attack', 0)).toHaveAttribute('data-winner', 'true')
    expect(cell('Attack', 1)).toHaveAttribute('data-winner', 'false')
  })

  it('calls no winner on a tie', async () => {
    // Charizard's defense and HP are both 78 — a genuine tie in the real data.
    mockedDetails.mockResolvedValue([charizard, { ...pikachu, stats: charizard.stats }])
    renderCompare()
    await screen.findByRole('table')

    expect(cell('HP', 0)).toHaveAttribute('data-winner', 'false')
    expect(cell('HP', 1)).toHaveAttribute('data-winner', 'false')
  })

  it('closes from the header button and from Escape', async () => {
    const { onClose } = renderCompare()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Close comparison' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('is a modal dialog named by its heading', async () => {
    renderCompare()
    await screen.findByRole('table')

    const dialog = screen.getByRole('dialog', { name: 'Base stat comparison' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('asks for a second Pokémon rather than showing a one-column table', async () => {
    localStorage.setItem(
      'pokemon-explorer:compare',
      JSON.stringify([{ id: pikachu.id, name: pikachu.name }]),
    )
    mockedDetails.mockResolvedValue([pikachu])
    renderCompare()

    expect(
      await screen.findByText('Pick at least two Pokémon to compare.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('announces the wait while stats load', async () => {
    let release: (value: Pokemon[]) => void = () => {}
    mockedDetails.mockReturnValue(
      new Promise((resolve) => {
        release = resolve
      }),
    )
    renderCompare()

    expect(screen.getByRole('status')).toHaveTextContent('Loading stats…')

    release([pikachu, charizard])
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
  })
})
