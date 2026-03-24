import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockAccountGet = mock(() => Promise.reject(new Error('Not authenticated')))
const mockDeleteSession = mock(() => Promise.resolve())
const mockCreateEmailPasswordSession = mock(() => Promise.resolve())

mock.module('./appwrite', () => ({
  account: {
    get: mockAccountGet,
    deleteSession: mockDeleteSession,
    createEmailPasswordSession: mockCreateEmailPasswordSession
  }
}))

mock.module('./database', () => ({
  listTrips: mock(() => Promise.resolve({ documents: [] })),
  listParticipatedTrips: mock(() => Promise.resolve([])),
  createTrip: mock(() => Promise.resolve()),
  updateTrip: mock(() => Promise.resolve()),
  deleteTrip: mock(() => Promise.resolve()),
  getTripByCode: mock(() => Promise.resolve({ documents: [] })),
  joinTrip: mock(() => Promise.resolve()),
  leaveTrip: mock(() => Promise.resolve()),
  getUserById: mock(() => Promise.resolve({ name: 'Test User', email: 'test@example.com' }))
}))

const { default: App } = await import('./App')

const sampleUser = { $id: 'user-1', name: 'Test User', email: 'test@example.com' }

describe('App', () => {
  beforeEach(() => {
    mockAccountGet.mockClear()
    mockDeleteSession.mockClear()
    mockAccountGet.mockImplementation(() => Promise.reject(new Error('Not authenticated')))
  })

  it('shows the login form when not authenticated', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    })
  })

  it('shows the trips interface when authenticated', async () => {
    mockAccountGet.mockImplementation(() => Promise.resolve(sampleUser))
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  it('shows the Sign Out button when authenticated', async () => {
    mockAccountGet.mockImplementation(() => Promise.resolve(sampleUser))
    render(<App />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    })
  })

  it('shows the signup form when the Sign up link is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    })
  })

  it('returns to the login form from the signup form', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => screen.getByRole('button', { name: /sign up/i }))
    await user.click(screen.getByRole('button', { name: /sign up/i }))
    await waitFor(() => screen.getByRole('heading', { name: /create account/i }))
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    })
  })

  it('shows the email when the user has no name', async () => {
    mockAccountGet.mockImplementation(() =>
      Promise.resolve({ $id: 'user-2', name: '', email: 'nameless@example.com' })
    )
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('nameless@example.com')).toBeInTheDocument()
    })
  })

  it('returns to the login form after signing out', async () => {
    mockAccountGet.mockImplementation(() => Promise.resolve(sampleUser))
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(mockDeleteSession).toHaveBeenCalledWith('current')
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    })
  })
})
