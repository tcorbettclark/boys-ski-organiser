import TripRow from './TripRow'

export default function TripTable({ trips, onUpdated, onDeleted }) {
  if (trips.length === 0) {
    return <p style={styles.empty}>No trips yet.</p>
  }

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Name</th>
          <th style={styles.th}>Description</th>
          <th style={styles.th}></th>
        </tr>
      </thead>
      <tbody>
        {trips.map(trip => (
          <TripRow key={trip.$id} trip={trip} onUpdated={onUpdated} onDeleted={onDeleted} />
        ))}
      </tbody>
    </table>
  )
}

const styles = {
  empty: {
    color: '#666',
    padding: '40px',
    textAlign: 'center',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    textAlign: 'left',
    padding: '10px 14px',
    background: '#f5f5f5',
    borderBottom: '2px solid #e0e0e0',
    fontWeight: '600',
    color: '#444',
  },
}
