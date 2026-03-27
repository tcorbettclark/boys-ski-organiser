import { useEffect, useState, useCallback } from 'react'
import {
  account as _account,
  listTrips as _listTrips,
  listParticipatedTrips as _listParticipatedTrips
} from './backend'
import AuthForm from './AuthForm'
import Header from './Header'
import Trips from './Trips'
import Proposals from './Proposals'
import Poll from './Poll'
import TripOverview from './TripOverview'
import ErrorBoundary from './ErrorBoundary'
import { colors, fonts } from './theme'

const defaultAccountGet = _account.get.bind(_account)
const defaultDeleteSession = _account.deleteSession.bind(_account, 'current')
const defaultListTrips = _listTrips.bind(_listTrips)
const defaultListParticipatedTrips = _listParticipatedTrips.bind(_listParticipatedTrips)

function App ({
  accountGet = defaultAccountGet,
  deleteSession = defaultDeleteSession,
  listTrips = defaultListTrips,
  listParticipatedTrips = defaultListParticipatedTrips
}) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [page, setPage] = useState('login')
  const [view, setView] = useState('tripList')
  const [tripDetailTab, setTripDetailTab] = useState('overview')
  const [trips, setTrips] = useState([])
  const [selectedTripId, setSelectedTripId] = useState(null)
  const [refreshProposalsKey, setRefreshProposalsKey] = useState(0)

  const handleJoinedTrip = useCallback(() => {
    setRefreshProposalsKey((k) => k + 1)
  }, [])

  useEffect(() => {
    accountGet()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false))
  }, [accountGet])

  useEffect(() => {
    if (!user) return
    Promise.all([
      listTrips(user.$id),
      listParticipatedTrips(user.$id)
    ])
      .then(([ownRes, participatedRes]) => {
        const coordinatedIds = new Set(ownRes.documents.map((t) => t.$id))
        const allTrips = [
          ...ownRes.documents,
          ...participatedRes.documents.filter((t) => !coordinatedIds.has(t.$id))
        ]
        setTrips(allTrips)
      })
      .catch((err) => console.error('Failed to load trips:', err))
  }, [user, listTrips, listParticipatedTrips])

  async function handleLogout () {
    await deleteSession()
    setUser(null)
  }

  function handleSelectTrip (tripId) {
    setSelectedTripId(tripId)
    setView('tripDetail')
    setTripDetailTab('overview')
  }

  function handleViewAllTrips () {
    setView('tripList')
    setSelectedTripId(null)
    setTripDetailTab('overview')
  }

  const selectedTrip = trips.find((t) => t.$id === selectedTripId) || null

  if (checking) return null

  if (!user) {
    return (
      <AuthForm
        mode={page}
        onSuccess={setUser}
        onSwitchMode={() => setPage(page === 'login' ? 'signup' : 'login')}
      />
    )
  }

  return (
    <div style={{ fontFamily: fonts.body, background: colors.bgPrimary, minHeight: '100vh' }}>
      <Header
        view={view}
        tripName={selectedTrip?.description || selectedTrip?.code || ''}
        tripDetailTab={tripDetailTab}
        onViewAllTrips={handleViewAllTrips}
        onTripDetailTabChange={setTripDetailTab}
        userName={user.name || user.email}
        onLogout={handleLogout}
      />

      {view === 'tripList' && (
        <ErrorBoundary>
          <Trips
            user={user}
            trips={trips}
            onSelectTrip={handleSelectTrip}
            onJoinedTrip={handleJoinedTrip}
          />
        </ErrorBoundary>
      )}

      {view === 'tripDetail' && selectedTripId && (
        <>
          {tripDetailTab === 'overview' && (
            <ErrorBoundary>
              <TripOverview
                trip={selectedTrip}
                user={user}
              />
            </ErrorBoundary>
          )}
          {tripDetailTab === 'proposals' && (
            <ErrorBoundary>
              <Proposals
                user={user}
                tripId={selectedTripId}
                key={refreshProposalsKey}
                onRefresh={() => setRefreshProposalsKey((k) => k + 1)}
              />
            </ErrorBoundary>
          )}
          {tripDetailTab === 'poll' && (
            <ErrorBoundary>
              <Poll
                user={user}
                tripId={selectedTripId}
              />
            </ErrorBoundary>
          )}
        </>
      )}
    </div>
  )
}

export default App
