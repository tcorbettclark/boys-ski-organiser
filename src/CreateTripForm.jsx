import { useState } from "react";
import { createTrip } from "./database";
import Field from "./Field";

const EMPTY_FORM = { name: "", description: "" };

export default function CreateTripForm({ userId, onCreated }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const trip = await createTrip(userId, form);
      onCreated(trip);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.toolbar}>
        <h2 style={styles.heading}>My Trips</h2>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setError("");
          }}
          style={styles.newButton}
        >
          {showForm ? "Cancel" : "+ New Trip"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <Field
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <Field
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={saving} style={styles.saveButton}>
            {saving ? "Saving…" : "Save Trip"}
          </button>
        </form>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    marginBottom: "8px",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  heading: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#111",
    margin: 0,
  },
  newButton: {
    padding: "8px 18px",
    borderRadius: "8px",
    border: "none",
    background: "#fd366e",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  form: {
    background: "#f9f9f9",
    border: "1px solid #eee",
    borderRadius: "10px",
    padding: "24px",
    marginBottom: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  error: {
    color: "#e53e3e",
    fontSize: "13px",
    margin: 0,
  },
  saveButton: {
    alignSelf: "flex-start",
    padding: "9px 22px",
    borderRadius: "8px",
    border: "none",
    background: "#fd366e",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
