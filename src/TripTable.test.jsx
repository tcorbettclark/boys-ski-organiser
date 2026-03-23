import { describe, it, expect, mock } from 'bun:test'
import { render, screen } from '@testing-library/react'

mock.module('./database', () => ({
  updateTrip: mock(() => Promise.resolve()),
  deleteTrip: mock(() => Promise.resolve())
}))

const { default: TripTable } = await import('./TripTable')

const sampleTrips = [
  { $id: '1', name: 'Ski Alps', description: 'Alpine trip' },
  { $id: '2', name: 'Whistler', description: 'Canada trip' }
]

describe('TripTable', () => {
  it('shows an empty message when there are no trips', () => {
    render(<TripTable trips={[]} onUpdated={() => {}} onDeleted={() => {}} />)
    expect(screen.getByText('No trips yet.')).toBeInTheDocument()
  })

  it('renders a row for each trip', () => {
    render(<TripTable trips={sampleTrips} onUpdated={() => {}} onDeleted={() => {}} />)
    expect(screen.getByText('Ski Alps')).toBeInTheDocument()
    expect(screen.getByText('Whistler')).toBeInTheDocument()
  })

  it('does not render the empty message when trips exist', () => {
    render(<TripTable trips={sampleTrips} onUpdated={() => {}} onDeleted={() => {}} />)
    expect(screen.queryByText('No trips yet.')).not.toBeInTheDocument()
  })
})
