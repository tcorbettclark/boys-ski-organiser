import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockUpdateTrip = mock(() =>
  Promise.resolve({ $id: 'trip-1', name: 'Updated', description: '' })
)
const mockDeleteTrip = mock(() => Promise.resolve())

mock.module('./database', () => ({
  updateTrip: mockUpdateTrip,
  deleteTrip: mockDeleteTrip
}))

const { default: EditTripForm } = await import('./EditTripForm')

const sampleTrip = { $id: 'trip-1', name: 'Ski Alps', description: 'A great trip' }

describe('EditTripForm', () => {
  beforeEach(() => {
    mockUpdateTrip.mockClear()
    mockDeleteTrip.mockClear()
  })

  it('pre-fills the name and description fields from the trip prop', () => {
    render(
      <EditTripForm
        trip={sampleTrip}
        onUpdated={() => {}}
        onDeleted={() => {}}
        onCancel={() => {}}
      />
    )
    const inputs = screen.getAllByRole('textbox')
    expect(inputs[0]).toHaveValue('Ski Alps')
    expect(inputs[1]).toHaveValue('A great trip')
  })

  it('calls updateTrip and onUpdated when the form is saved', async () => {
    const user = userEvent.setup()
    const handleUpdated = mock(() => {})
    render(
      <EditTripForm
        trip={sampleTrip}
        onUpdated={handleUpdated}
        onDeleted={() => {}}
        onCancel={() => {}}
      />
    )

    const nameInput = screen.getAllByRole('textbox')[0]
    await user.clear(nameInput)
    await user.type(nameInput, 'New Name')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(mockUpdateTrip).toHaveBeenCalledWith('trip-1', {
        name: 'New Name',
        description: 'A great trip'
      })
      expect(handleUpdated).toHaveBeenCalledTimes(1)
    })
  })

  it('calls deleteTrip and onDeleted when delete is confirmed', async () => {
    window.confirm = mock(() => true)
    const user = userEvent.setup()
    const handleDeleted = mock(() => {})
    render(
      <EditTripForm
        trip={sampleTrip}
        onUpdated={() => {}}
        onDeleted={handleDeleted}
        onCancel={() => {}}
      />
    )

    await user.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(mockDeleteTrip).toHaveBeenCalledWith('trip-1')
      expect(handleDeleted).toHaveBeenCalledTimes(1)
    })
  })

  it('does not delete when confirm is cancelled', async () => {
    window.confirm = mock(() => false)
    const user = userEvent.setup()
    render(
      <EditTripForm
        trip={sampleTrip}
        onUpdated={() => {}}
        onDeleted={() => {}}
        onCancel={() => {}}
      />
    )

    await user.click(screen.getByRole('button', { name: /delete/i }))
    expect(mockDeleteTrip).not.toHaveBeenCalled()
  })

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const handleCancel = mock(() => {})
    render(
      <EditTripForm
        trip={sampleTrip}
        onUpdated={() => {}}
        onDeleted={() => {}}
        onCancel={handleCancel}
      />
    )

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(handleCancel).toHaveBeenCalledTimes(1)
  })

  it('shows an error message when save fails', async () => {
    mockUpdateTrip.mockImplementationOnce(() => Promise.reject(new Error('Save failed')))
    const user = userEvent.setup()
    render(
      <EditTripForm
        trip={sampleTrip}
        onUpdated={() => {}}
        onDeleted={() => {}}
        onCancel={() => {}}
      />
    )

    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument()
    })
  })
})
