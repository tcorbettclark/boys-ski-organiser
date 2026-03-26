import { useState } from 'react'
import { upsertVote as _upsertVote } from './backend'
import { colors, fonts } from './theme'

export default function PollVoting ({
  poll,
  proposals,
  myVote,
  userId,
  onVoteSaved,
  upsertVote = _upsertVote
}) {
  const proposalMap = Object.fromEntries(proposals.map((p) => [p.$id, p]))

  const [allocations, setAllocations] = useState(() => {
    const init = {}
    poll.proposalIds.forEach((id) => {
      init[id] = 0
    })
    if (myVote) {
      myVote.proposalIds.forEach((id, i) => {
        init[id] = myVote.tokenCounts[i] || 0
      })
    }
    return init
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)

  const maxTokens = poll.proposalIds.length
  const totalUsed = Object.values(allocations).reduce((a, b) => a + b, 0)
  const remaining = maxTokens - totalUsed

  function handleSlider (proposalId, value) {
    setSaved(false)
    setAllocations((prev) => ({ ...prev, [proposalId]: value }))
  }

  async function handleSave () {
    setSaving(true)
    setSaveError('')
    setSaved(false)
    const nonZeroIds = poll.proposalIds.filter((id) => allocations[id] > 0)
    const proposalIds = nonZeroIds
    const tokenCounts = nonZeroIds.map((id) => allocations[id])
    try {
      const result = await upsertVote(
        poll.$id,
        poll.tripId,
        userId,
        proposalIds,
        tokenCounts
      )
      setSaved(true)
      onVoteSaved(result)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>Your Vote</div>
      {poll.proposalIds.map((proposalId) => {
        const proposal = proposalMap[proposalId]
        const value = allocations[proposalId]
        const sliderMax = value + remaining
        return (
          <div key={proposalId} style={styles.row}>
            <div style={styles.rowHeader}>
              <span style={styles.proposalName}>
                {proposal?.resortName || proposalId}
              </span>
              <span style={styles.tokenCount}>{value}</span>
            </div>
            <input
              type='range'
              min={0}
              max={sliderMax}
              value={value}
              onChange={(e) => handleSlider(proposalId, Number(e.target.value))}
              style={styles.slider}
            />
          </div>
        )
      })}
      <div style={styles.footer}>
        <span style={styles.remaining}>
          {maxTokens} tokens · {remaining} remaining
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? 'Saving…' : 'Save Vote'}
        </button>
      </div>
      {saved && <p style={styles.savedText}>Vote saved</p>}
      {saveError && <p style={styles.errorText}>{saveError}</p>}
    </div>
  )
}

const styles = {
  container: { fontFamily: fonts.body },
  header: {
    fontSize: '11px',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '12px'
  },
  row: { marginBottom: '14px' },
  rowHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px'
  },
  proposalName: { fontSize: '14px', color: colors.textData },
  tokenCount: { fontSize: '14px', color: colors.accent, fontWeight: '600' },
  slider: { width: '100%', accentColor: colors.accent },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px'
  },
  remaining: {
    fontSize: '11px',
    color: colors.textSecondary
  },
  saveButton: {
    padding: '7px 20px',
    borderRadius: '6px',
    border: 'none',
    background: colors.accent,
    color: colors.bgPrimary,
    fontFamily: fonts.body,
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  savedText: {
    color: colors.accent,
    fontFamily: fonts.body,
    fontSize: '12px',
    margin: '8px 0 0'
  },
  errorText: {
    color: colors.error,
    fontFamily: fonts.body,
    fontSize: '12px',
    margin: '8px 0 0'
  }
}
