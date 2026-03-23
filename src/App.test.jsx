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
  createTrip: mock(() => Promise.resolve()),
  updateTrip: mock(() => Promise.resolve()),
  deleteTrip: mock(() => Promise.resolve())
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
