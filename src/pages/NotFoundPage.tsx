import { Link } from 'react-router-dom'
import { Container } from '@/components/layout/Container'
import { PokeBallMark } from '@/components/ui/PokeBallMark'

/**
 * An unknown route. Phrased in the app's own vocabulary rather than as an HTTP
 * status, and the way out is the only action on screen.
 */
export function NotFoundPage() {
  return (
    <Container>
      <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-24 text-center">
        <PokeBallMark size={48} className="opacity-40" />

        <p className="tabular mt-8 text-xs tracking-[0.2em] text-text-muted uppercase">
          404
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
          This page isn&apos;t in the Pokédex.
        </h1>
        <p className="mt-3 text-text-muted">
          The link may be out of date, or the address mistyped.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-brand px-6 text-[15px] font-medium text-white shadow-card transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
        >
          Back to the Pokédex
        </Link>
      </div>
    </Container>
  )
}
