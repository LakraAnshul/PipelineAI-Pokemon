import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { FavoritesLink } from './FavoritesLink'

const STORAGE_KEY = 'pokemon-explorer:favorites'

function renderLink(url = '/') {
  render(
    <MemoryRouter initialEntries={[url]}>
      <FavoritesProvider>
        <FavoritesLink />
      </FavoritesProvider>
    </MemoryRouter>,
  )
}

describe('FavoritesLink', () => {
  beforeEach(() => localStorage.clear())

  it('stays out of the header until there is something to count', () => {
    renderLink()

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows the count and switches the favourites filter on', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([25, 6]))
    renderLink()

    const link = screen.getByRole('link')
    expect(link).toHaveTextContent('2')
    expect(link).toHaveAttribute('href', '/?favorites=1')
  })

  it('keeps the rest of the query string when crossing filters', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([25]))
    renderLink('/?type=electric&sort=name-asc')

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/?type=electric&sort=name-asc&favorites=1',
    )
  })

  it('switches the filter back off once it is on', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([25]))
    renderLink('/?favorites=1&type=electric')

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/?type=electric')
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('offers a way out of an emptied favourites view', () => {
    renderLink('/?favorites=1')

    expect(screen.getByRole('link')).toHaveAttribute('href', '/')
  })
})
