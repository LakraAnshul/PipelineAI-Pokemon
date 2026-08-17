import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/services/pokemonApi'
import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it('shows the standard failure copy and calls onRetry', async () => {
    const onRetry = vi.fn()
    render(<ErrorState error={new ApiError('network', 'boom')} onRetry={onRetry} />)

    expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
    expect(screen.getByText("We couldn't load the Pokémon.")).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Try Again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('is announced as an alert', () => {
    render(<ErrorState error={new ApiError('network', 'boom')} onRetry={vi.fn()} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('names the connection as the cause for a network failure', () => {
    render(<ErrorState error={new ApiError('network', 'boom')} onRetry={vi.fn()} />)
    expect(screen.getByText(/check your connection/i)).toBeInTheDocument()
  })

  it('quotes the status code for an HTTP failure', () => {
    render(
      <ErrorState
        error={new ApiError('http', 'boom', { status: 503 })}
        onRetry={vi.fn()}
      />,
    )
    expect(screen.getByText(/\(503\)/)).toBeInTheDocument()
  })

  it('still explains itself when handed something that is not an ApiError', () => {
    render(<ErrorState error={new Error('nope')} onRetry={vi.fn()} />)
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument()
  })

  it('keeps the retry action in the inline variant', async () => {
    const onRetry = vi.fn()
    render(
      <ErrorState
        error={new ApiError('network', 'boom')}
        onRetry={onRetry}
        variant="inline"
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Try Again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
