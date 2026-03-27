import { useState, useEffect, useRef } from 'react'
import {
  getUserById as _getUserById,
  getCoordinatorParticipant as _getCoordinatorParticipant
} from './backend'
import { colors, fonts } from './theme'

export default function TripRow ({
  trip,
  userId,
  onSelectTrip,
  getUserById = _getUserById,
  getCoordinatorParticipant = _getCoordinatorParticipant,
  copyRevertDelay = 1500
}) {
  const [coordinator, setCoordinator] = useState(null)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const [hovered, setHovered] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    getCoordinatorParticipant(trip.$id)
      .then(({ documents }) => {
        if (!mountedRef.current || documents.length === 0) return
        return getUserById(documents[0].userId)
      })
      .then((c) => { if (mountedRef.current && c) setCoordinator(c) })
      .catch((err) => console.error('Failed to fetch coordinator:', err))
  }, [trip.$id, userId])

  function handleCopy () {
    if (!trip.code) return
    navigator.clipboard.writeText(trip.code).then(() => {
      if (!mountedRef.current) return
      setCopied(true)
      setCopyError('')
      setTimeout(() => { if (mountedRef.current) setCopied(false) }, copyRevertDelay)
    }).catch(() => {
      if (!mountedRef.current) return
      setCopyError('Failed to copy')
    })
  }

  return (
    <tr
      style={{ ...styles.tr, ...(hovered ? styles.trHovered : {}) }}
      onClick={() => onSelectTrip(trip.$id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td style={styles.codeCell}>
        <span style={styles.codeWrapper}>
          {trip.code || '—'}
          {trip.code && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy() }}
              style={styles.copyButton}
              title='Copy code'
              aria-label='Copy trip code'
            >
              {copied ? '✓' : '⧉'}
            </button>
          )}
          {copyError
            ? <span style={styles.copyError}>{copyError}</span>
            : null}
        </span>
      </td>
      <td style={{ ...styles.td, color: colors.textSecondary }}>{trip.description || '—'}</td>
      <td style={{ ...styles.td, color: colors.textSecondary }} title={coordinator?.email || undefined}>
        {coordinator?.name || coordinator?.email || '—'}
      </td>
    </tr>
  )
}

const styles = {
  codeCell: {
    padding: '14px 16px',
    color: colors.textSecondary,
    verticalAlign: 'top',
    fontFamily: fonts.mono,
    fontSize: '13px',
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap'
  },
  codeWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  copyError: {
    color: colors.error,
    fontFamily: fonts.body,
    fontSize: '11px'
  },
  copyButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: colors.textSecondary,
    fontSize: '13px',
    padding: '0 2px',
    lineHeight: 1,
    opacity: 0.6
  },
  tr: {
    borderBottom: '1px solid rgba(100,190,230,0.07)',
    cursor: 'pointer'
  },
  trHovered: {
    background: 'rgba(59,189,232,0.06)'
  },
  td: {
    padding: '14px 16px',
    color: colors.textData,
    verticalAlign: 'top',
    fontFamily: fonts.body,
    fontSize: '14px',
    lineHeight: '1.5'
  }
}
