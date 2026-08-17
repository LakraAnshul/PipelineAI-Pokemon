/**
 * The first tab stop on the page: a way past the header for anyone who reaches
 * the grid by keyboard. Invisible until focused, then a real button in the
 * top-left corner.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lift"
    >
      Skip to Pokémon
    </a>
  )
}
