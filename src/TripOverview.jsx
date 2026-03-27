import { useEffect, useState, useRef } from 'react'
import {
  listParticipatedTrips as _listParticipatedTrips,
  getCoordinatorParticipant as _getCoordinatorParticipant,
  getUserById as _getUserById
} from './backend'
import { colors, fonts, borders } from './theme'

export default function TripOverview ({
  trip,
  user,
  listParticipatedTrips = _listParticipatedTrips,
  getCoordinatorParticipant = _getCoordinatorParticipant,
  getUserById = _getUserById
}) {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!trip) return
    listParticipatedTrips(user.$id)
      .then(({ documents }) => {
        if (!mountedRef.current) return
        const tripParticipants = documents.filter((p) => p.tripId === trip.$id)
        const userIds = tripParticipants.map((p) => p.userId)
        return Promise.all(userIds.map((id) => getUserById(id)))
          .then((users) => ({ tripParticipants, users }))
      })
      .then(({ tripParticipants, users }) => {
        if (!mountedRef.current || !users) return
        const withRoles = users.map((u, i) => ({
          ...u,
          role: tripParticipants[i]?.role,
          userId: tripParticipants[i]?.userId
        }))
        setParticipants(withRoles)
      })
      .catch((err) => console.error('Failed to load participants:', err))
      .finally(() => { if (mountedRef.current) setLoading(false) })
  }, [trip, user.$id])

  if (!trip) return null

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Trip Details</h3>
        <div style={styles.details}>
          {trip.code && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Code</span>
              <span style={styles.mono}>{trip.code}</span>
            </div>
          )}
          {trip.description && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Description</span>
              <span style={styles.detailValue}>{trip.description}</span>
            </div>
          )}
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Participants ({participants.length})</h3>
        {loading
          ? <p style={styles.loading}>Loading participants…</p>
          : (
            <ul style={styles.participantList}>
              {participants.map((p) => (
                <li key={p.$id || p.email} style={styles.participantItem}>
                  <span style={styles.participantName}>
                    {p.name || p.email}
                    {p.userId === user.$id && ' (me)'}
                  </span>
                  <span style={styles.participantRole}>{p.role}</span>
                </li>
              ))}
            </ul>
            )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '40px 48px',
    maxWidth: '960px',
    margin: '0 auto',
    fontFamily: fonts.body,
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  card: {
    background: colors.bgCard,
    border: borders.card,
    borderRadius: '12px',
    padding: '24px'
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: '18px',
    fontWeight: '600',
    color: colors.textPrimary,
    margin: '0 0 20px',
    paddingBottom: '12px',
    borderBottom: borders.subtle
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  detailRow: {
    display: 'flex',
    gap: '16px'
  },
  detailLabel: {
    fontFamily: fonts.body,
    fontSize: '12px',
    fontWeight: '500',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    minWidth: '100px'
  },
  detailValue: {
    fontFamily: fonts.body,
    fontSize: '14px',
    color: colors.textData
  },
  mono: {
    fontFamily: fonts.mono,
    fontSize: '13px',
    color: colors.accent,
    letterSpacing: '0.05em'
  },
  participantList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  participantItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: borders.subtle
  },
  participantName: {
    fontFamily: fonts.body,
    fontSize: '14px',
    color: colors.textData
  },
  participantRole: {
    fontFamily: fonts.body,
    fontSize: '12px',
    color: colors.textSecondary,
    textTransform: 'capitalize'
  },
  loading: {
    color: colors.textSecondary,
    fontSize: '14px'
  }
}
