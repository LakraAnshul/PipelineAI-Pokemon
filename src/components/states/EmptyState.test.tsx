import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('uses the not-found copy for a search miss and echoes the query', () => {
    render(<EmptyState variant="search" query="zzzz" onReset={vi.fn()} />)

    expect(screen.getByText('Pokémon not found.')).toBeInTheDocument()
    expect(screen.getByText('Try searching for another Pokémon.')).toBeInTheDocument()
    expect(screen.getByText(/zzzz/)).toBeInTheDocument()
  })

  it('uses the generic empty copy for a filter with no results', () => {
    render(<EmptyState variant="filter" onReset={vi.fn()} />)

    expect(screen.getByText('No Pokémon found.')).toBeInTheDocument()
    expect(
      screen.getByText('Try searching for a different Pokémon.'),
    ).toBeInTheDocument()
  })

  it('invites the first favourite rather than reporting a failure', () => {
    render(<EmptyState variant="favorites" onReset={vi.fn()} />)
    expect(screen.getByText('No favourites yet.')).toBeInTheDocument()
  })

  it('offers a way out of every variant', async () => {
    const onReset = vi.fn()
    const { unmount } = render(<EmptyState variant="search" onReset={onReset} />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    unmount()

    render(<EmptyState variant="filter" onReset={onReset} />)
    await userEvent.click(screen.getByRole('button', { name: 'Show all Pokémon' }))

    expect(onReset).toHaveBeenCalledTimes(2)
  })
})
