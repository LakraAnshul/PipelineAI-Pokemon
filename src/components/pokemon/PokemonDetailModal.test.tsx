import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CompareProvider } from '@/contexts/CompareContext'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { usePokemonDetail, type Detail } from '@/hooks/usePokemonDetail'
import { ApiError } from '@/services/pokemonApi'
import { pikachu } from '@/test/fixtures'
import { PokemonDetailModal } from './PokemonDetailModal'

// The network is the hook's business, tested in its own file. What matters here
// is what each of the hook's four states puts on screen.
vi.mock('@/hooks/usePokemonDetail', () => ({ usePokemonDetail: vi.fn() }))

const mockedDetail = vi.mocked(usePokemonDetail)

function detail(overrides: Partial<Detail> = {}): Detail {
  return { pokemon: null, status: 'idle', error: null, retry: vi.fn(), ...overrides }
}

function renderModal(
  props: Partial<Parameters<typeof PokemonDetailModal>[0]> = {},
) {
  const onClose = vi.fn()
  const onNavigate = vi.fn()

  render(
    <FavoritesProvider>
      <CompareProvider>
        <PokemonDetailModal
          nameOrId="pikachu"
          onClose={onClose}
          onNavigate={onNavigate}
          hasPrevious
          hasNext
          {...props}
        />
      </CompareProvider>
    </FavoritesProvider>,
  )

  return { onClose, onNavigate }
}

describe('PokemonDetailModal', () => {
  beforeEach(() => {
    localStorage.clear()
    mockedDetail.mockReturnValue(detail({ pokemon: pikachu, status: 'ready' }))
  })

  it('is a modal dialog named after the Pokémon', () => {
    renderModal()

    const dialog = screen.getByRole('dialog', { name: 'Pikachu' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('renders identity, measurements, abilities, every base stat, and moves', () => {
    renderModal()

    expect(screen.getByText('#025')).toBeInTheDocument()
    expect(screen.getByText('electric')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /pikachu/i })).toBeInTheDocument()

    // Decimetres and hectograms, converted.
    expect(screen.getByText('0.4 m')).toBeInTheDocument()
    expect(screen.getByText('6.0 kg')).toBeInTheDocument()
    expect(screen.getByText('112')).toBeInTheDocument()

    expect(screen.getByText('Static')).toBeInTheDocument()
    expect(screen.getByText('Lightning Rod')).toBeInTheDocument()
    expect(screen.getByText('(hidden)')).toBeInTheDocument()

    expect(screen.getAllByRole('meter')).toHaveLength(6)
    expect(screen.getByRole('meter', { name: 'Speed' })).toHaveAttribute(
      'aria-valuenow',
      '90',
    )
    expect(screen.getByText('320')).toBeInTheDocument()

    expect(screen.getByText('Thunder Shock')).toBeInTheDocument()
    expect(screen.getByText('Quick Attack')).toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    const { onClose } = renderModal()

    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on a backdrop click but not on a click inside the panel', async () => {
    const { onClose } = renderModal()

    const panel = screen.getByRole('dialog')
    await userEvent.click(panel)
    expect(onClose).not.toHaveBeenCalled()

    // The backdrop is deliberately unreachable by role — it is decorative
    // chrome, and its only job is to be the thing outside the panel.
    fireEvent.click(panel.previousElementSibling as Element)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('walks the grid with the arrow keys', async () => {
    const { onNavigate } = renderModal()

    await userEvent.keyboard('{ArrowRight}')
    expect(onNavigate).toHaveBeenCalledWith(1)

    await userEvent.keyboard('{ArrowLeft}')
    expect(onNavigate).toHaveBeenCalledWith(-1)
  })

  it('stays put at the ends of the loaded grid', async () => {
    const { onNavigate } = renderModal({ hasPrevious: false, hasNext: false })

    await userEvent.keyboard('{ArrowLeft}{ArrowRight}')
    expect(onNavigate).not.toHaveBeenCalled()

    expect(screen.getByRole('button', { name: 'Previous Pokémon' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next Pokémon' })).toBeDisabled()
  })

  it('favourites the Pokémon through the shared store', async () => {
    renderModal()

    await userEvent.click(
      screen.getByRole('button', { name: 'Add Pikachu to favourites' }),
    )
    expect(
      screen.getByRole('button', { name: 'Remove Pikachu from favourites' }),
    ).toBeInTheDocument()
  })

  it('sends an unknown name to the search-miss copy, not a generic error', () => {
    mockedDetail.mockReturnValue(
      detail({
        status: 'error',
        error: new ApiError('notFound', 'No PokéAPI resource at /pokemon/mewthree.', {
          status: 404,
        }),
      }),
    )
    const { onClose } = renderModal({ nameOrId: 'mewthree' })

    expect(screen.getByRole('alert')).toHaveTextContent('Pokémon not found.')
    expect(screen.getByText('Try searching for another Pokémon.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Back to all Pokémon' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('announces loading without leaking the skeleton to assistive tech', () => {
    mockedDetail.mockReturnValue(detail({ status: 'loading' }))
    renderModal()

    expect(screen.getByRole('status')).toHaveTextContent('Loading Pokémon details')
    expect(screen.getByRole('dialog', { name: 'Pokémon details' })).toBeInTheDocument()
  })

  it('renders nothing when no Pokémon is selected', () => {
    mockedDetail.mockReturnValue(detail())
    renderModal({ nameOrId: null })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
