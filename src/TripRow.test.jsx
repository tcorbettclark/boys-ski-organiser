import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TripRow from './TripRow'

const sampleTrip = { $id: 'trip-1', code: 'ABC12', name: 'Ski Alps', description: 'A great trip' }
const defaultUser = { name: 'Test User', email: 'test@example.com' }

const noop = () => {}

async function renderRow (trip, props = {}) {
  await act(async () => {
    render(
      <table>
        <tbody>
          <TripRow
            trip={trip}
            userId={props.userId || 'user-1'}
            onSelectTrip={props.onSelectTrip || noop}
            getUserById={() => Promise.resolve(defaultUser)}
            getCoordinatorParticipant={() =>
              Promise.resolve({ documents: [{ userId: props.coordinatorUserId || 'user-1' }] })}
            copyRevertDelay={props.copyRevertDelay}
          />
        </tbody>
      </table>
    )
  })
}

describe('TripRow', () => {
  let mockWriteText

  beforeEach(() => {
    mockWriteText = mock(() => Promise.resolve())
    navigator.clipboard.writeText = mockWriteText
  })

  it('displays the trip description', async () => {
    await renderRow(sampleTrip)
    expect(screen.getByText('A great trip')).toBeInTheDocument()
  })

  it('shows the trip code', async () => {
    await renderRow(sampleTrip)
    expect(screen.getByText('ABC12')).toBeInTheDocument()
  })

  it('shows a dash when trip code is absent', async () => {
    await renderRow({ ...sampleTrip, code: undefined })
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('shows the coordinator name', async () => {
    await renderRow(sampleTrip)
    expect(screen.getByText(/Test User/)).toBeInTheDocument()
  })

  it('shows a dash when description is empty', async () => {
    await renderRow({ ...sampleTrip, description: '' })
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('calls onSelectTrip when row is clicked', async () => {
    const user = userEvent.setup()
    const handleSelectTrip = mock(() => {})
    await renderRow(sampleTrip, { onSelectTrip: handleSelectTrip })
    await user.click(screen.getByText('A great trip'))
    expect(handleSelectTrip).toHaveBeenCalledWith('trip-1')
  })

  it('shows a copy button when the trip has a code', async () => {
    await renderRow(sampleTrip)
    expect(screen.getByRole('button', { name: /copy trip code/i })).toBeInTheDocument()
  })

  it('does not show a copy button when the trip has no code', async () => {
    await renderRow({ ...sampleTrip, code: undefined })
    expect(screen.queryByRole('button', { name: /copy trip code/i })).not.toBeInTheDocument()
  })

  it('copies the trip code to the clipboard when the copy button is clicked', async () => {
    const user = userEvent.setup()
    await renderRow(sampleTrip)
    await user.click(screen.getByRole('button', { name: /copy trip code/i }))
    expect(mockWriteText).toHaveBeenCalledWith('ABC12')
  })

  it('shows a confirmation tick after copying and reverts after delay', async () => {
    const user = userEvent.setup({ delay: null })
    await renderRow(sampleTrip, { copyRevertDelay: 50 })
    await user.click(screen.getByRole('button', { name: /copy trip code/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /copy trip code/i })).toHaveTextContent('✓'))
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)) })
    expect(screen.getByRole('button', { name: /copy trip code/i })).toHaveTextContent('⧉')
  })
})
