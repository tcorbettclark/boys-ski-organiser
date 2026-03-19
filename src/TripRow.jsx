import { useState } from "react";
import EditTripForm from "./EditTripForm";

export default function TripRow({ trip, onUpdated, onDeleted }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <tr style={styles.editingTr}>
        <td style={styles.editingTd} colSpan={3}>
          <EditTripForm
            trip={trip}
            onUpdated={(updated) => {
              onUpdated(updated);
              setIsEditing(false);
            }}
            onDeleted={() => onDeleted(trip.$id)}
            onCancel={() => setIsEditing(false)}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr style={styles.tr}>
      <td style={styles.td}>{trip.name}</td>
      <td style={styles.td}>{trip.description || "—"}</td>
      <td style={{ ...styles.td, whiteSpace: "nowrap" }}>
        <button onClick={() => setIsEditing(true)} style={styles.editButton}>
          Edit
        </button>
      </td>
    </tr>
  );
}

const styles = {
  tr: {
    borderBottom: "1px solid #eee",
  },
  td: {
    padding: "10px 14px",
    color: "#333",
    verticalAlign: "top",
  },
  editingTr: {
    borderBottom: "1px solid #fbc8d4",
    borderTop: "1px solid #fbc8d4",
    background: "#fff5f7",
  },
  editingTd: {
    padding: "16px 20px",
    verticalAlign: "top",
    borderLeft: "3px solid #fd366e",
  },
  editButton: {
    padding: "5px 14px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    background: "#fff",
    color: "#444",
    fontSize: "13px",
    cursor: "pointer",
  },
};
