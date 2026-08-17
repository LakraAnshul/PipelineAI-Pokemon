import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IconToggle } from '@/components/ui/IconToggle'
import { FavoritesProvider, useFavorites } from '@/contexts/FavoritesContext'

const STORAGE_KEY = 'pokemon-explorer:favorites'

/** Stands in for a card: the real toggle, driven by the real store. */
function Probe({ ids = [25] }: { ids?: number[] }) {
  const { isFavorite, toggleFavorite, favoriteIds, count } = useFavorites()

  return (
    <>
      {ids.map((id) => (
        <IconToggle
          key={id}
          active={isFavorite(id)}
          label={isFavorite(id) ? `Remove ${id} from favourites` : `Add ${id} to favourites`}
          onClick={() => toggleFavorite(id)}
        >
          <span aria-hidden="true">*</span>
        </IconToggle>
      ))}
      <p>order: {favoriteIds.join(',')}</p>
      <p>count: {count}</p>
    </>
  )
}

function renderProbe(ids?: number[]) {
  return render(
    <FavoritesProvider>
      <Probe ids={ids} />
    </FavoritesProvider>,
  )
}

describe('FavoritesContext', () => {
  beforeEach(() => localStorage.clear())

  it('toggles aria-pressed and persists across remounts', async () => {
    const { unmount } = renderProbe()

    const button = screen.getByRole('button', { name: 'Add 25 to favourites' })
    expect(button).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(button)
    expect(
      screen.getByRole('button', { name: 'Remove 25 from favourites' }),
    ).toHaveAttribute('aria-pressed', 'true')

    unmount()
    renderProbe()

    expect(
      screen.getByRole('button', { name: 'Remove 25 from favourites' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('un-favourites on a second press', async () => {
    renderProbe()

    await userEvent.click(screen.getByRole('button', { name: 'Add 25 to favourites' }))
    await userEvent.click(screen.getByRole('button', { name: 'Remove 25 from favourites' }))

    expect(screen.getByText('count: 0')).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]')
  })

  it('keeps the newest favourite first, so the view reads as recent activity', async () => {
    renderProbe([1, 4, 7])

    await userEvent.click(screen.getByRole('button', { name: 'Add 1 to favourites' }))
    await userEvent.click(screen.getByRole('button', { name: 'Add 4 to favourites' }))
    await userEvent.click(screen.getByRole('button', { name: 'Add 7 to favourites' }))

    expect(screen.getByText('order: 7,4,1')).toBeInTheDocument()
  })

  it('starts empty rather than crashing on an unreadable stored value', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    renderProbe()

    expect(screen.getByText('count: 0')).toBeInTheDocument()
  })

  it('refuses to be used outside its provider', () => {
    // React logs the thrown error on its way out; the point of the test is that
    // the failure is explicit, so the log itself is noise.
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Probe />)).toThrow(/FavoritesProvider/)

    logged.mockRestore()
  })
})
