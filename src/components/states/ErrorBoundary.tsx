import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * The last net under the component tree.
 *
 * A render-time bug in one card should not leave a blank page with no
 * explanation. This catches what the data layer's error handling cannot: bugs in
 * our own render code. Reloading is the honest offer — the component tree cannot
 * be trusted to re-render its way out of a crash it just caused.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // The only console call in the app: a crash the user cannot see the cause of
    // is exactly what a developer needs in the console.
    console.error('Pokémon Explorer crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div
        role="alert"
        className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 text-center"
      >
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Something went wrong.
        </h1>
        <p className="mt-2 text-text-muted">
          The app hit an unexpected error and stopped.
        </p>
        <p className="tabular mt-3 text-xs text-text-muted/80">
          {this.state.error.message}
        </p>
        <Button
          variant="primary"
          size="lg"
          className="mt-7"
          onClick={() => window.location.reload()}
        >
          Reload
        </Button>
      </div>
    )
  }
}
