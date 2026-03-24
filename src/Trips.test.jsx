import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockListTrips = mock(() => Promise.resolve({ documents: [] }))
const mockListParticipatedTrips = mock(() => Promise.resolve([]))
const mockCreateTrip = mock(() =>
  Promise.resolve({ $id: 'new-trip', description: 'Alps in February', code: 'aaa-bbb-ccc', userId: 'user-1' })
)
const mockJoinTrip = mock(() => Promise.resolve())
const mockGetTripByCode = mock(() => Promise.resolve({ documents: [] }))
const mockLeaveTrip = mock(() => Promise.resolve())
const mockGetUserById = mock(() => Promise.resolve({ name: 'Test User', email: 'test@example.com' }))

mock.module('./database', () => ({
  listTrips: mockListTrips,
  listParticipatedTrips: mockListParticipatedTrips,
  createTrip: mockCreateTrip,
  joinTrip: mockJoinTrip,
  getTripByCode: mockGetTripByCode,
  leaveTrip: mockLeaveTrip,
  getUserById: mockGetUserById
}))

const { default: Trips } = await import('./Trips')

const testUser = { $id: 'user-1', name: 'Test User', email: 'test@example.com' }

function renderTrips (props = {}) {
  return render(<Trips user={testUser} {...props} />)
}

describe('Trips', () => {
  beforeEach(() => {
    mockListTrips.mockClear()
    mockListParticipatedTrips.mockClear()
    mockCreateTrip.mockClear()
    mockGetUserById.mockClear()
    mockListTrips.mockImplementation(() => Promise.resolve({ documents: [] }))
    mockListParticipatedTrips.mockImplementation(() => Promise.resolve([]))
  })

  it('shows a loading message while fetching', () => {
    // Don't resolve — keep it pending
    mockListTrips.mockImplementation(() => new Promise(() => {}))
    renderTrips()
    expect(screen.getByText(/loading trips/i)).toBeInTheDocument()
  })

  it('shows an error when the API call fails', async () => {
    mockListTrips.mockImplementation(() => Promise.reject(new Error('Server error')))
    await act(async () => { renderTrips() })
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  it('shows the Trips heading with New Trip and Join Trip buttons after loading', async () => {
    await act(async () => { renderTrips() })
    await waitFor(() => {
      expect(screen.getByText('Trips')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /\+ new trip/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /\+ join trip/i })).toBeInTheDocument()
    })
  })

  it('renders a row for each coordinated trip', async () => {
    mockListTrips.mockImplementation(() =>
      Promise.resolve({
        documents: [
          { $id: 't-1', description: 'Val d\'Isere week', code: 'aaa-bbb-ccc', userId: 'user-1' },
          { $id: 't-2', description: 'Chamonix weekend', code: 'ddd-eee-fff', userId: 'user-1' }
        ]
      })
    )
    await act(async () => { renderTrips() })
    await waitFor(() => {
      expect(screen.getByText('Val d\'Isere week')).toBeInTheDocument()
      expect(screen.getByText('Chamonix weekend')).toBeInTheDocument()
    })
  })

  it('renders a row for each joined trip', async () => {
    mockListParticipatedTrips.mockImplementation(() =>
      Promise.resolve([
        { $id: 't-3', description: 'Whistler trip', code: 'ggg-hhh-iii', userId: 'user-2' }
      ])
    )
    await act(async () => { renderTrips() })
    await waitFor(() => {
      expect(screen.getByText('Whistler trip')).toBeInTheDocument()
    })
  })

  it('adds a newly created trip to the coordinating list', async () => {
    const user = userEvent.setup()
    await act(async () => { renderTrips() })
    await waitFor(() => screen.getByRole('button', { name: /new trip/i }))

    await user.click(screen.getByRole('button', { name: /new trip/i }))
    await user.type(screen.getByRole('textbox'), 'Alps in February')
    await user.click(screen.getByRole('button', { name: /save trip/i }))

    await waitFor(() => {
      expect(screen.getByText('Alps in February')).toBeInTheDocument()
    })
  })
})
