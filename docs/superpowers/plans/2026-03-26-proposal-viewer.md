# Proposal Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a swipeable, read-only centered modal to browse all proposal fields, opened via a "View" button in each proposals table row.

**Architecture:** `ProposalsRow` gains an `onView` prop and "View" button. `ProposalsTable` owns `viewingIndex` state and renders a new `ProposalViewer` modal component. `ProposalViewer` handles keyboard (← → Esc), touch swipe, arrow buttons, dot indicators, and creator name fetching.

**Tech Stack:** React hooks, React Testing Library, Bun test runner, inline styles via `theme.js`.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/ProposalViewer.jsx` | Create | Modal overlay, all field display, all navigation |
| `src/ProposalViewer.test.jsx` | Create | Tests for ProposalViewer |
| `src/ProposalsRow.jsx` | Modify | Add `onView` prop + "View" button |
| `src/ProposalsRow.test.jsx` | Modify | Tests for "View" button |
| `src/ProposalsTable.jsx` | Modify | Add `viewingIndex` state, render ProposalViewer |
| `src/ProposalsTable.test.jsx` | Modify | Tests for viewer open/close via table |

---

## Task 1: Add "View" button to ProposalsRow

**Files:**
- Modify: `src/ProposalsRow.jsx`
- Modify: `src/ProposalsRow.test.jsx`

- [ ] **Step 1: Write the failing tests**

Add these tests inside the existing `describe('ProposalsRow', ...)` block in `src/ProposalsRow.test.jsx`. Add `onView: mock(() => {})` to the `defaults` object in `renderProposalsRow`, and add `onView = () => {}` to the prop list.

```jsx
// Add to defaults object in renderProposalsRow:
onView: mock(() => {}),
```

```jsx
it('shows a View button for all users regardless of ownership', async () => {
  await renderProposalsRow({ userId: 'user-2' })
  expect(screen.getByRole('button', { name: /^view$/i })).toBeInTheDocument()
})

it('shows a View button for submitted proposals', async () => {
  await renderProposalsRow({ proposal: { ...sampleProposal, state: 'SUBMITTED' } })
  expect(screen.getByRole('button', { name: /^view$/i })).toBeInTheDocument()
})

it('calls onView when View is clicked', async () => {
  const user = userEvent.setup()
  const onView = mock(() => {})
  await renderProposalsRow({ onView })
  await user.click(screen.getByRole('button', { name: /^view$/i }))
  expect(onView).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
bun test src/ProposalsRow.test.jsx
```

Expected: 3 failures mentioning "View" button not found or `onView` is not a function.

- [ ] **Step 3: Add `onView` prop and "View" button to ProposalsRow**

In `src/ProposalsRow.jsx`, add `onView = () => {}` to the destructured props:

```jsx
export default function ProposalsRow ({
  proposal,
  userId,
  onUpdated,
  onDeleted,
  onSubmitted,
  onView = () => {},
  updateProposal = _updateProposal,
  deleteProposal = _deleteProposal,
  submitProposal = _submitProposal,
  getUserById = _getUserById
}) {
```

In the `<td>` that contains the actions (the last `<td>`), add the "View" button before the `{canAct && ...}` block:

```jsx
<td style={{ ...styles.td, whiteSpace: 'nowrap' }}>
  <div style={styles.actions}>
    <button onClick={onView} style={styles.viewButton}>
      View
    </button>
    {canAct && (
      <>
        <button onClick={() => setIsEditing(true)} style={styles.editButton}>
          Edit
        </button>
        <button onClick={handleSubmit} disabled={submitting} style={styles.submitButton}>
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
        {submitError && <p style={styles.errorText}>{submitError}</p>}
      </>
    )}
  </div>
</td>
```

Add the `viewButton` style to the `styles` object at the bottom of the file (copy from `editButton`):

```js
viewButton: {
  padding: '5px 16px',
  borderRadius: '5px',
  border: borders.muted,
  background: 'transparent',
  color: colors.textSecondary,
  fontFamily: fonts.body,
  fontSize: '12px',
  fontWeight: '500',
  cursor: 'pointer',
  letterSpacing: '0.03em'
},
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
bun test src/ProposalsRow.test.jsx
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/ProposalsRow.jsx src/ProposalsRow.test.jsx
git commit -m "feat: add View button to ProposalsRow"
```

---

## Task 2: Build ProposalViewer — fields, close, and navigation

**Files:**
- Create: `src/ProposalViewer.jsx`
- Create: `src/ProposalViewer.test.jsx`

- [ ] **Step 1: Write the failing tests**

Create `src/ProposalViewer.test.jsx`:

```jsx
import { render, screen, waitFor, act, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, mock } from 'bun:test'
import ProposalViewer from './ProposalViewer'

const p1 = {
  $id: 'p-1',
  userId: 'user-1',
  state: 'SUBMITTED',
  resortName: "Val d'Isère",
  country: 'France',
  altitudeRange: '1850m - 3456m',
  nearestAirport: 'GVA',
  transferTime: '2h 30m',
  accommodationName: 'Chalet Belle Vue',
  accommodationUrl: 'https://example.com/chalet',
  approximateCost: '£1200pp',
  description: 'Great powder skiing'
}

const p2 = {
  $id: 'p-2',
  userId: 'user-2',
  state: 'DRAFT',
  resortName: 'Chamonix',
  country: 'France',
  altitudeRange: '1035m - 3842m',
  nearestAirport: 'GVA',
  transferTime: '1h 15m',
  accommodationName: 'Hotel Mont Blanc',
  accommodationUrl: '',
  approximateCost: '£1500pp',
  description: 'World famous resort'
}

const p3 = {
  $id: 'p-3',
  userId: 'user-3',
  state: 'DRAFT',
  resortName: 'Verbier',
  country: 'Switzerland',
  altitudeRange: '1500m - 3300m',
  nearestAirport: 'GVA',
  transferTime: '2h 00m',
  accommodationName: 'Le Chalet',
  accommodationUrl: '',
  approximateCost: '£2000pp',
  description: 'Challenging off-piste terrain'
}

async function renderViewer (props = {}) {
  const defaults = {
    proposals: [p1, p2, p3],
    initialIndex: 0,
    onClose: mock(() => {}),
    getUserById: mock(() => Promise.resolve({ name: 'Alice', email: 'alice@example.com' }))
  }
  let result
  await act(async () => {
    result = render(<ProposalViewer {...defaults} {...props} />)
  })
  return { ...defaults, ...props, ...result }
}

describe('ProposalViewer', () => {
  it('renders all proposal fields', async () => {
    await renderViewer()
    expect(screen.getByText("Val d'Isère")).toBeInTheDocument()
    expect(screen.getByText('France')).toBeInTheDocument()
    expect(screen.getByText('1850m - 3456m')).toBeInTheDocument()
    expect(screen.getByText('GVA')).toBeInTheDocument()
    expect(screen.getByText('2h 30m')).toBeInTheDocument()
    expect(screen.getByText('Chalet Belle Vue')).toBeInTheDocument()
    expect(screen.getByText('£1200pp')).toBeInTheDocument()
    expect(screen.getByText('Great powder skiing')).toBeInTheDocument()
  })

  it('shows an accommodation link when accommodationUrl is set', async () => {
    await renderViewer()
    const link = screen.getByRole('link', { name: /link/i })
    expect(link).toHaveAttribute('href', 'https://example.com/chalet')
  })

  it('does not show an accommodation link when accommodationUrl is empty', async () => {
    await renderViewer({ initialIndex: 1 })
    expect(screen.queryByRole('link', { name: /link/i })).not.toBeInTheDocument()
  })

  it('shows SUBMITTED status badge', async () => {
    await renderViewer()
    expect(screen.getByText('SUBMITTED')).toBeInTheDocument()
  })

  it('shows DRAFT status badge', async () => {
    await renderViewer({ initialIndex: 1 })
    expect(screen.getByText('DRAFT')).toBeInTheDocument()
  })

  it('shows the N of M counter', async () => {
    await renderViewer()
    expect(screen.getByText('1 of 3')).toBeInTheDocument()
  })

  it('shows creator name from getUserById', async () => {
    await renderViewer()
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
  })

  it('falls back to — when getUserById fails', async () => {
    await renderViewer({ getUserById: mock(() => Promise.reject(new Error('fail'))) })
    await waitFor(() => {
      // The creator field shows — when fetch fails
      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getAllByText('—').length).toBeGreaterThan(0)
    })
  })

  it('calls onClose when × button is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = await renderViewer()
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', async () => {
    const { onClose } = await renderViewer()
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when the card itself is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = await renderViewer()
    // Click the resort name (inside the card)
    await user.click(screen.getByText("Val d'Isère"))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('prev button is disabled on the first proposal', async () => {
    await renderViewer({ initialIndex: 0 })
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
  })

  it('next button is disabled on the last proposal', async () => {
    await renderViewer({ initialIndex: 2 })
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('clicking next shows the next proposal', async () => {
    const user = userEvent.setup()
    await renderViewer({ initialIndex: 0 })
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('Chamonix')).toBeInTheDocument()
    expect(screen.getByText('2 of 3')).toBeInTheDocument()
  })

  it('clicking prev shows the previous proposal', async () => {
    const user = userEvent.setup()
    await renderViewer({ initialIndex: 1 })
    await user.click(screen.getByRole('button', { name: /previous/i }))
    expect(screen.getByText("Val d'Isère")).toBeInTheDocument()
    expect(screen.getByText('1 of 3')).toBeInTheDocument()
  })

  it('pressing Escape calls onClose', async () => {
    const { onClose } = await renderViewer()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('pressing ArrowRight navigates to next proposal', async () => {
    await renderViewer({ initialIndex: 0 })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('Chamonix')).toBeInTheDocument()
  })

  it('pressing ArrowLeft navigates to previous proposal', async () => {
    await renderViewer({ initialIndex: 1 })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText("Val d'Isère")).toBeInTheDocument()
  })

  it('ArrowLeft does nothing on the first proposal', async () => {
    await renderViewer({ initialIndex: 0 })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText('1 of 3')).toBeInTheDocument()
  })

  it('ArrowRight does nothing on the last proposal', async () => {
    await renderViewer({ initialIndex: 2 })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('3 of 3')).toBeInTheDocument()
  })

  it('renders a dot for each proposal with the active dot highlighted', async () => {
    await renderViewer({ initialIndex: 1 })
    // 3 dots for 3 proposals — check by aria-label or testid not available,
    // so verify the counter matches the active position
    expect(screen.getByText('2 of 3')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
bun test src/ProposalViewer.test.jsx
```

Expected: All tests fail with "Cannot find module './ProposalViewer'".

- [ ] **Step 3: Create ProposalViewer.jsx**

Create `src/ProposalViewer.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { getUserById as _getUserById } from './backend'
import { colors, fonts, borders } from './theme'

export default function ProposalViewer ({
  proposals,
  initialIndex,
  onClose,
  getUserById = _getUserById
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [creator, setCreator] = useState(null)
  const [touchStartX, setTouchStartX] = useState(null)

  const proposal = proposals[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === proposals.length - 1
  const isDraft = proposal.state === 'DRAFT'

  useEffect(() => {
    setCreator(null)
    if (proposal.userId) {
      getUserById(proposal.userId)
        .then(setCreator)
        .catch(() => {})
    }
  }, [proposal.$id])

  useEffect(() => {
    function handleKeyDown (e) {
      if (e.key === 'ArrowLeft') setCurrentIndex(i => Math.max(0, i - 1))
      else if (e.key === 'ArrowRight') setCurrentIndex(i => Math.min(proposals.length - 1, i + 1))
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [proposals.length, onClose])

  function handleTouchStart (e) {
    setTouchStartX(e.touches[0].clientX)
  }

  function handleTouchEnd (e) {
    if (touchStartX === null) return
    const delta = e.changedTouches[0].clientX - touchStartX
    if (delta > 50) setCurrentIndex(i => Math.max(0, i - 1))
    else if (delta < -50) setCurrentIndex(i => Math.min(proposals.length - 1, i + 1))
    setTouchStartX(null)
  }

  return (
    <div
      role='dialog'
      aria-modal='true'
      onClick={onClose}
      style={styles.backdrop}
    >
      <button
        aria-label='Previous proposal'
        onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => Math.max(0, i - 1)) }}
        disabled={isFirst}
        style={{ ...styles.arrowButton, ...(isFirst ? styles.arrowDisabled : {}) }}
      >
        ‹
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={styles.card}
      >
        <div style={styles.headerRow}>
          <div>
            <div style={styles.counter}>{currentIndex + 1} of {proposals.length}</div>
            <div style={styles.resortName}>{proposal.resortName || '—'}</div>
            <div style={styles.subHeader}>
              {proposal.country || '—'}
              {proposal.country && proposal.state && ' · '}
              <span style={isDraft ? styles.badgeDraft : styles.badgeSubmitted}>
                {proposal.state}
              </span>
            </div>
          </div>
          <button
            aria-label='Close'
            onClick={onClose}
            style={styles.closeButton}
          >
            ×
          </button>
        </div>

        <div style={styles.grid}>
          <Field label='Altitude Range' value={proposal.altitudeRange} />
          <Field label='Nearest Airport' value={proposal.nearestAirport} />
          <Field label='Transfer Time' value={proposal.transferTime} />
          <Field label='Approx. Cost' value={proposal.approximateCost} />
          <div style={{ gridColumn: '1/-1' }}>
            <div style={styles.fieldLabel}>Accommodation</div>
            <div style={styles.fieldValue}>
              {proposal.accommodationName || '—'}
              {proposal.accommodationUrl && (
                <>
                  {' '}
                  <a
                    href={proposal.accommodationUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    style={styles.link}
                  >
                    ↗ link
                  </a>
                </>
              )}
            </div>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label='Description' value={proposal.description} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <div style={styles.fieldLabel}>Proposed By</div>
            <div style={styles.fieldValue}>
              {creator?.name || creator?.email || '—'}
            </div>
          </div>
        </div>

        <div style={styles.dots}>
          {proposals.map((_, i) => (
            <div key={i} style={i === currentIndex ? styles.dotActive : styles.dotInactive} />
          ))}
        </div>
      </div>

      <button
        aria-label='Next proposal'
        onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => Math.min(proposals.length - 1, i + 1)) }}
        disabled={isLast}
        style={{ ...styles.arrowButton, ...(isLast ? styles.arrowDisabled : {}) }}
      >
        ›
      </button>
    </div>
  )
}

function Field ({ label, value }) {
  return (
    <div>
      <div style={styles.fieldLabel}>{label}</div>
      <div style={styles.fieldValue}>{value || '—'}</div>
    </div>
  )
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(4,12,24,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    gap: '16px'
  },
  arrowButton: {
    background: 'rgba(13,30,48,0.9)',
    border: borders.accent,
    color: colors.accent,
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    fontSize: '22px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontFamily: fonts.body
  },
  arrowDisabled: {
    opacity: 0.25,
    cursor: 'default'
  },
  card: {
    background: colors.bgCard,
    border: borders.card,
    borderRadius: '14px',
    padding: '28px 32px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px'
  },
  counter: {
    fontFamily: fonts.body,
    fontSize: '11px',
    color: colors.textSecondary,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: '6px'
  },
  resortName: {
    fontFamily: fonts.display,
    fontSize: '24px',
    fontWeight: '600',
    color: colors.textPrimary
  },
  subHeader: {
    fontFamily: fonts.body,
    fontSize: '13px',
    color: colors.textSecondary,
    marginTop: '4px'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: colors.textSecondary,
    fontSize: '22px',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '4px',
    fontFamily: fonts.body
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px 24px',
    marginBottom: '20px'
  },
  fieldLabel: {
    fontFamily: fonts.body,
    fontSize: '10px',
    color: colors.textSecondary,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: '4px'
  },
  fieldValue: {
    fontFamily: fonts.body,
    fontSize: '14px',
    color: colors.textData,
    lineHeight: '1.5'
  },
  link: {
    color: colors.accent,
    fontSize: '12px',
    textDecoration: 'none'
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    paddingTop: '4px'
  },
  dotActive: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: colors.accent
  },
  dotInactive: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'rgba(59,189,232,0.25)'
  },
  badgeDraft: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.08em',
    color: colors.textSecondary,
    background: 'rgba(106,148,174,0.15)',
    border: '1px solid rgba(106,148,174,0.2)'
  },
  badgeSubmitted: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.08em',
    color: colors.accent,
    background: 'rgba(59,189,232,0.12)',
    border: '1px solid rgba(59,189,232,0.25)'
  }
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
bun test src/ProposalViewer.test.jsx
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/ProposalViewer.jsx src/ProposalViewer.test.jsx
git commit -m "feat: add ProposalViewer modal component"
```

---

## Task 3: Wire ProposalsTable to open ProposalViewer

**Files:**
- Modify: `src/ProposalsTable.jsx`
- Modify: `src/ProposalsTable.test.jsx`

- [ ] **Step 1: Write the failing tests**

Add these tests inside the existing `describe('ProposalsTable', ...)` block in `src/ProposalsTable.test.jsx`. Add the `within` import:

```jsx
import { render, screen, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
```

```jsx
it('clicking View on a row opens the viewer for that proposal', async () => {
  const user = userEvent.setup()
  const proposals = [
    { ...sampleProposal, $id: 'p-1', resortName: "Val d'Isère" },
    { ...sampleProposal, $id: 'p-2', resortName: 'Chamonix' }
  ]
  await renderProposalsTable({ proposals })
  const viewButtons = screen.getAllByRole('button', { name: /^view$/i })
  await act(async () => {
    await user.click(viewButtons[1])
  })
  const dialog = screen.getByRole('dialog')
  expect(within(dialog).getByText('Chamonix')).toBeInTheDocument()
  expect(within(dialog).getByText('2 of 2')).toBeInTheDocument()
})

it('closing the viewer hides it', async () => {
  const user = userEvent.setup()
  const proposals = [{ ...sampleProposal, $id: 'p-1', resortName: "Val d'Isère" }]
  await renderProposalsTable({ proposals })
  await act(async () => {
    await user.click(screen.getByRole('button', { name: /^view$/i }))
  })
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  await act(async () => {
    await user.click(screen.getByRole('button', { name: /close/i }))
  })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
bun test src/ProposalsTable.test.jsx
```

Expected: 2 failures — "View" button not found, or dialog not rendered.

- [ ] **Step 3: Update ProposalsTable.jsx**

Replace the full content of `src/ProposalsTable.jsx`:

```jsx
import { useState } from 'react'
import ProposalsRow from './ProposalsRow'
import ProposalViewer from './ProposalViewer'
import {
  updateProposal as _updateProposal,
  deleteProposal as _deleteProposal,
  submitProposal as _submitProposal,
  getUserById as _getUserById
} from './backend'
import { colors, fonts, borders } from './theme'

export default function ProposalsTable ({
  proposals,
  userId,
  onUpdated,
  onDeleted,
  onSubmitted,
  emptyMessage = 'No proposals yet. Create one above.',
  updateProposal = _updateProposal,
  deleteProposal = _deleteProposal,
  submitProposal = _submitProposal,
  getUserById = _getUserById
}) {
  const [viewingIndex, setViewingIndex] = useState(null)

  if (proposals.length === 0) {
    return <p style={styles.empty}>{emptyMessage}</p>
  }

  return (
    <>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Resort Name</th>
            <th style={styles.th}>Country</th>
            <th style={styles.th}>Altitude Range</th>
            <th style={styles.th}>Creator</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th} />
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal, index) => (
            <ProposalsRow
              key={proposal.$id}
              proposal={proposal}
              userId={userId}
              onUpdated={onUpdated}
              onDeleted={onDeleted}
              onSubmitted={onSubmitted}
              onView={() => setViewingIndex(index)}
              updateProposal={updateProposal}
              deleteProposal={deleteProposal}
              submitProposal={submitProposal}
              getUserById={getUserById}
            />
          ))}
        </tbody>
      </table>
      {viewingIndex !== null && (
        <ProposalViewer
          proposals={proposals}
          initialIndex={viewingIndex}
          onClose={() => setViewingIndex(null)}
          getUserById={getUserById}
        />
      )}
    </>
  )
}

const styles = {
  empty: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    padding: '60px 40px',
    textAlign: 'center',
    fontSize: '15px',
    fontStyle: 'italic'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: fonts.body,
    fontSize: '14px'
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    background: colors.bgCard,
    borderBottom: borders.subtle,
    fontFamily: fonts.body,
    fontSize: '11px',
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: '0.1em',
    textTransform: 'uppercase'
  }
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
bun test src/ProposalsTable.test.jsx
```

Expected: All tests pass.

- [ ] **Step 5: Run the full test suite**

```bash
bun test
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/ProposalsTable.jsx src/ProposalsTable.test.jsx
git commit -m "feat: wire ProposalsTable to open ProposalViewer on View click"
```
