import { Container } from '@/components/layout/Container'

/**
 * Provenance, kept to one line. The data is somebody else's work and the names
 * are somebody else's trademarks; saying so is the least a catalogue can do.
 */
export function Footer() {
  return (
    <footer className="mt-16 border-t border-border py-8">
      <Container>
        <div className="flex flex-col gap-2 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Data from{' '}
            <a
              href="https://pokeapi.co"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-text underline decoration-border underline-offset-3 transition-colors hover:decoration-brand"
            >
              PokéAPI
            </a>
            .
          </p>
          <p>Pokémon and Pokémon character names are trademarks of Nintendo.</p>
        </div>
      </Container>
    </footer>
  )
}
