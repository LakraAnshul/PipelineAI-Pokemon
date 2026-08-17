import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { pikachu } from '@/test/fixtures'
import { PokemonCard } from './PokemonCard'

function renderCard(overrides: Partial<ComponentProps<typeof PokemonCard>> = {}) {
  const onToggleFavorite = vi.fn()
  const onToggleCompare = vi.fn()

  render(
    <MemoryRouter>
      <PokemonCard
        pokemon={pikachu}
        isFavorite={false}
        isComparing={false}
        compareDisabled={false}
        onToggleFavorite={onToggleFavorite}
        onToggleCompare={onToggleCompare}
        {...overrides}
      />
    </MemoryRouter>,
  )

  return { onToggleFavorite, onToggleCompare }
}

describe('PokemonCard', () => {
  it('shows the name, padded dex number, type, and artwork', () => {
    renderCard()

    expect(screen.getByText('Pikachu')).toBeInTheDocument()
    expect(screen.getByText('#025')).toBeInTheDocument()
    expect(screen.getByText('electric')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /pikachu/i })).toBeInTheDocument()
  })

  it('links the whole card to the detail route', () => {
    renderCard()

    const link = screen.getByRole('link', { name: /pikachu/i })
    expect(link).toHaveAttribute('href', '/pokemon/pikachu')
  })

  it('reports favourite state and the action the button will take', async () => {
    const { onToggleFavorite } = renderCard()

    await userEvent.click(
      screen.getByRole('button', { name: 'Add Pikachu to favourites' }),
    )
    expect(onToggleFavorite).toHaveBeenCalledWith(pikachu)
  })

  it('shows the removal label once favourited', () => {
    renderCard({ isFavorite: true })

    const button = screen.getByRole('button', {
      name: 'Remove Pikachu from favourites',
    })
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('toggles comparison', async () => {
    const { onToggleCompare } = renderCard()

    await userEvent.click(screen.getByRole('button', { name: 'Add Pikachu to compare' }))
    expect(onToggleCompare).toHaveBeenCalledWith(pikachu)
  })

  it('explains why comparison is unavailable when the tray is full', async () => {
    const { onToggleCompare } = renderCard({ compareDisabled: true })

    const button = screen.getByRole('button', { name: 'Compare tray is full' })
    await userEvent.click(button)

    expect(button).toBeDisabled()
    expect(onToggleCompare).not.toHaveBeenCalled()
  })
})
