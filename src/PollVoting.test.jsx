import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, mock } from 'bun:test'
import PollVoting from './PollVoting'

const poll = {
  $id: 'poll-1',
  tripId: 'trip-1',
  proposalIds: ['p-1', 'p-2', 'p-3']
}
const proposals = [
  { $id: 'p-1', resortName: 'Chamonix' },
  { $id: 'p-2', resortName: 'Verbier' },
  { $id: 'p-3', resortName: 'Zermatt' }
]

function renderPollVoting (props = {}) {
  const defaults = {
    poll,
    proposals,
    myVote: null,
    userId: 'user-1',
    onVoteSaved: mock(() => {}),
    upsertVote: mock(() => Promise.resolve({ $id: 'v-new' }))
  }
  return render(<PollVoting {...defaults} {...props} />)
}

describe('PollVoting', () => {
  it('renders a slider for each proposal', () => {
    renderPollVoting()
    expect(screen.getAllByRole('slider')).toHaveLength(3)
  })

  it('shows proposal names', () => {
    renderPollVoting()
    expect(screen.getByText('Chamonix')).toBeInTheDocument()
    expect(screen.getByText('Verbier')).toBeInTheDocument()
    expect(screen.getByText('Zermatt')).toBeInTheDocument()
  })

  it('shows max tokens and remaining tokens', () => {
    renderPollVoting()
    expect(screen.getByText(/3 tokens/i)).toBeInTheDocument()
    expect(screen.getByText(/3 remaining/i)).toBeInTheDocument()
  })

  it('renders Save Vote button', () => {
    renderPollVoting()
    expect(
      screen.getByRole('button', { name: /save vote/i })
    ).toBeInTheDocument()
  })

  it('initializes sliders from myVote when provided', () => {
    const myVote = { proposalIds: ['p-1', 'p-3'], tokenCounts: [2, 1] }
    renderPollVoting({ myVote })
    const sliders = screen.getAllByRole('slider')
    expect(sliders[0].value).toBe('2') // p-1
    expect(sliders[1].value).toBe('0') // p-2 not in vote
    expect(sliders[2].value).toBe('1') // p-3
  })

  it('calls upsertVote with non-zero allocations and calls onVoteSaved', async () => {
    const user = userEvent.setup()
    const savedVote = { $id: 'v-new', proposalIds: [], tokenCounts: [] }
    const upsertVote = mock(() => Promise.resolve(savedVote))
    const onVoteSaved = mock(() => {})
    renderPollVoting({ upsertVote, onVoteSaved })
    await user.click(screen.getByRole('button', { name: /save vote/i }))
    await waitFor(() => {
      expect(upsertVote).toHaveBeenCalledWith(
        'poll-1',
        'trip-1',
        'user-1',
        [],
        []
      )
      expect(onVoteSaved).toHaveBeenCalledWith(savedVote)
    })
  })

  it('shows "Vote saved" after successful save', async () => {
    const user = userEvent.setup()
    renderPollVoting()
    await user.click(screen.getByRole('button', { name: /save vote/i }))
    await waitFor(() => {
      expect(screen.getByText(/vote saved/i)).toBeInTheDocument()
    })
  })

  it('shows error message when upsertVote fails', async () => {
    const user = userEvent.setup()
    renderPollVoting({
      upsertVote: mock(() => Promise.reject(new Error('Vote failed')))
    })
    await user.click(screen.getByRole('button', { name: /save vote/i }))
    await waitFor(() => {
      expect(screen.getByText('Vote failed')).toBeInTheDocument()
    })
  })
})
