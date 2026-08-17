import { Link } from 'react-router-dom'
import { Container } from '@/components/layout/Container'
import { FavoritesLink } from '@/components/layout/FavoritesLink'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { PokeBallMark } from '@/components/ui/PokeBallMark'
import { Seam } from '@/components/ui/Seam'

/**
 * The masthead.
 *
 * Set like the header plate of a catalogue rather than an app bar: a mono
 * eyebrow naming what is catalogued, the title beneath it, and the Poké Ball
 * seam as the bottom edge — the same device that splits every card. Nothing else
 * lives here but the favourites count and the theme switch; searching and
 * filtering belong next to the grid they change.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-xl">
      <Container>
        <div className="flex h-16 items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-xl transition-opacity hover:opacity-80"
          >
            <PokeBallMark size={30} className="motion-safe:transition-transform" />
            <span className="flex flex-col gap-1 leading-none">
              <span className="font-mono text-[9px] tracking-[0.22em] text-text-muted uppercase">
                National Dex
              </span>
              <span className="font-display text-[17px] font-bold tracking-[-0.01em]">
                Pokémon Explorer
              </span>
            </span>
          </Link>

          <div className="ms-auto flex items-center gap-2">
            <FavoritesLink />
            <ThemeToggle />
          </div>
        </div>
      </Container>

      <Seam />
    </header>
  )
}
