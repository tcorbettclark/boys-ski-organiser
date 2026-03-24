import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockCreateTrip = mock(() =>
  Promise.resolve({ $id: 'new-id', name: 'Test Trip', description: '' })
)

mock.module('./database', () => ({
  createTrip: mockCreateTrip
}))

const { default: CreateTripForm } = await import('./CreateTripForm')

const noop = () => {}

const testUser = { $id: 'user-1', name: 'Test User', email: 'test@example.com' }

function renderForm (props = {}) {
  return render(<CreateTripForm user={testUser} onCreated={noop} onDismiss={noop} {...props} />)
}

describe('CreateTripForm', () => {
  beforeEach(() => mockCreateTrip.mockClear())

  it('shows the description field', () => {
    renderForm()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('calls createTrip and onCreated when a valid form is submitted', async () => {
    const user = userEvent.setup()
    const handleCreated = mock(() => {})
    renderForm({ onCreated: handleCreated })

    await user.type(screen.getByRole('textbox'), 'A trip to the Alps in February')
    await user.click(screen.getByRole('button', { name: /save trip/i }))

    await waitFor(() => {
      expect(mockCreateTrip).toHaveBeenCalledWith('user-1', { description: 'A trip to the Alps in February' })
      expect(handleCreated).toHaveBeenCalledTimes(1)
    })
  })

  it('calls onDismiss after successful submission', async () => {
    const user = userEvent.setup()
    const handleDismiss = mock(() => {})
    renderForm({ onDismiss: handleDismiss })

    await user.type(screen.getByRole('textbox'), 'A trip to the Alps in February')
    await user.click(screen.getByRole('button', { name: /save trip/i }))

    await waitFor(() => {
      expect(handleDismiss).toHaveBeenCalledTimes(1)
    })
  })

  it('calls onDismiss when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const handleDismiss = mock(() => {})
    renderForm({ onDismiss: handleDismiss })

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(handleDismiss).toHaveBeenCalledTimes(1)
  })

  it('displays an error message when the API call fails', async () => {
    mockCreateTrip.mockImplementationOnce(() => Promise.reject(new Error('API error')))
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByRole('textbox'), 'A trip to the Alps in February')
    await user.click(screen.getByRole('button', { name: /save trip/i }))

    await waitFor(() => {
      expect(screen.getByText('API error')).toBeInTheDocument()
    })
  })
})
