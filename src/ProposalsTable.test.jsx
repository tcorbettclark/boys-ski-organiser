import { render, screen } from '@testing-library/react'
import { describe, it, expect, mock } from 'bun:test'
import ProposalsTable from './ProposalsTable'

const sampleProposal = {
  $id: 'p-1',
  userId: 'user-1',
  state: 'DRAFT',
  resortName: "Val d'Isère",
  country: 'France',
  altitudeRange: '1850m - 3456m',
  nearestAirport: 'GVA',
  transferTime: '2h 30m',
  accommodationName: 'Chalet Belle Vue',
  accommodationUrl: '',
  approximateCost: '£1200pp',
  description: 'Great powder skiing'
}

function renderProposalsTable (props = {}) {
  const defaults = {
    proposals: [],
    userId: 'user-1',
    onUpdated: mock(() => {}),
    onDeleted: mock(() => {}),
    onSubmitted: mock(() => {}),
    updateProposal: mock(() => Promise.resolve()),
    deleteProposal: mock(() => Promise.resolve()),
    submitProposal: mock(() => Promise.resolve())
  }
  return render(<ProposalsTable {...defaults} {...props} />)
}

describe('ProposalsTable', () => {
  it('shows the empty message when there are no proposals', () => {
    renderProposalsTable()
    expect(screen.getByText('No proposals yet. Create one above.')).toBeInTheDocument()
  })

  it('shows a custom empty message when provided', () => {
    renderProposalsTable({ emptyMessage: 'Nothing here yet.' })
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument()
  })

  it('renders a row for each proposal', () => {
    const proposals = [
      { ...sampleProposal, $id: 'p-1', resortName: 'Val d\'Isère' },
      { ...sampleProposal, $id: 'p-2', resortName: 'Chamonix' }
    ]
    renderProposalsTable({ proposals })
    expect(screen.getByText("Val d'Isère")).toBeInTheDocument()
    expect(screen.getByText('Chamonix')).toBeInTheDocument()
  })

  it('renders the table headers', () => {
    renderProposalsTable({ proposals: [sampleProposal] })
    expect(screen.getByText('Resort Name')).toBeInTheDocument()
    expect(screen.getByText('Country')).toBeInTheDocument()
    expect(screen.getByText('Altitude Range')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('does not render a table when proposals is empty', () => {
    renderProposalsTable()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
