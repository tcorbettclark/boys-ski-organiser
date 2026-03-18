export default function Field({ label, name, value, onChange, type = 'text', required }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        style={styles.input}
      />
    </div>
  )
}

const styles = {
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#555',
  },
  input: {
    padding: '8px 12px',
    borderRadius: '7px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
  },
}
