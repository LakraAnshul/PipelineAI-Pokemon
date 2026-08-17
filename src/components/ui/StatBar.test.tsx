import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { STAT_MAX } from '@/utils/formatters'
import { StatBar } from './StatBar'

describe('StatBar', () => {
  it('labels the stat, prints the number, and exposes a bounded meter', () => {
    render(<StatBar stat="hp" value={70} color="#4bc46a" />)

    expect(screen.getByText('HP')).toBeInTheDocument()
    expect(screen.getByText('70')).toBeInTheDocument()

    const meter = screen.getByRole('meter', { name: 'HP' })
    expect(meter).toHaveAttribute('aria-valuenow', '70')
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', String(STAT_MAX))
  })

  it('uses the shared 255 ceiling so bars compare across Pokémon', () => {
    render(<StatBar stat="speed" value={255} color="#000" />)

    expect(screen.getByRole('meter', { name: 'Speed' })).toHaveAttribute(
      'aria-valuemax',
      '255',
    )
  })
})
