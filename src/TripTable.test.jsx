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

const noop = () => {}

function renderTable (trips) {
  return render(<TripTable trips={trips} onUpdated={noop} onDeleted={noop} />)
}

describe('TripTable', () => {
  it('shows an empty message when there are no trips', () => {
    renderTable([])
    expect(screen.getByText('No trips yet. Add one above.')).toBeInTheDocument()
  })

  it('renders a row for each trip', () => {
    renderTable(sampleTrips)
    expect(screen.getByText('Ski Alps')).toBeInTheDocument()
    expect(screen.getByText('Whistler')).toBeInTheDocument()
  })

  it('does not render the empty message when trips exist', () => {
    renderTable(sampleTrips)
    expect(screen.queryByText('No trips yet.')).not.toBeInTheDocument()
  })
})
