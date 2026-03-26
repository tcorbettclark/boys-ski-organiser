import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'bun:test'
import PollResults from './PollResults'

const poll = { $id: 'poll-1', proposalIds: ['p-1', 'p-2', 'p-3'] }
const proposals = [
  { $id: 'p-1', resortName: 'Chamonix' },
  { $id: 'p-2', resortName: 'Verbier' },
  { $id: 'p-3', resortName: 'Zermatt' }
]

describe('PollResults', () => {
  it('renders all proposal names', () => {
    render(<PollResults poll={poll} proposals={proposals} votes={[]} />)
    expect(screen.getByText('Chamonix')).toBeInTheDocument()
    expect(screen.getByText('Verbier')).toBeInTheDocument()
    expect(screen.getByText('Zermatt')).toBeInTheDocument()
  })

  it('shows "0 votes" when there are no votes', () => {
    render(<PollResults poll={poll} proposals={proposals} votes={[]} />)
    expect(screen.getByText('0 votes')).toBeInTheDocument()
  })

  it('shows "1 vote" singular', () => {
    const votes = [{ $id: 'v-1', proposalIds: ['p-1'], tokenCounts: [1] }]
    render(<PollResults poll={poll} proposals={proposals} votes={votes} />)
    expect(screen.getByText('1 vote')).toBeInTheDocument()
  })

  it('shows "2 votes" plural', () => {
    const votes = [
      { $id: 'v-1', proposalIds: ['p-1'], tokenCounts: [2] },
      { $id: 'v-2', proposalIds: ['p-2'], tokenCounts: [1] }
    ]
    render(<PollResults poll={poll} proposals={proposals} votes={votes} />)
    expect(screen.getByText('2 votes')).toBeInTheDocument()
  })

  it('shows correct total tokens per proposal', () => {
    const votes = [
      { $id: 'v-1', proposalIds: ['p-1', 'p-2'], tokenCounts: [2, 1] },
      { $id: 'v-2', proposalIds: ['p-1'], tokenCounts: [1] }
    ]
    render(<PollResults poll={poll} proposals={proposals} votes={votes} />)
    // p-1 total = 3, p-2 total = 1, p-3 total = 0
    const totals = screen.getAllByText('3')
    expect(totals.length).toBeGreaterThan(0)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('ignores token allocations for proposalIds not in the poll', () => {
    const votes = [{ $id: 'v-1', proposalIds: ['p-99'], tokenCounts: [5] }]
    render(<PollResults poll={poll} proposals={proposals} votes={votes} />)
    // p-99 is not in poll, totals should all be 0
    const zeros = screen.getAllByText('0')
    expect(zeros).toHaveLength(3)
  })
})
