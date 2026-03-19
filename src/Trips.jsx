import { useEffect, useState } from "react";
import { listTrips } from "./database";
import CreateTripForm from "./CreateTripForm";
import TripTable from "./TripTable";

export default function Trips({ user }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listTrips(user.$id)
      .then((res) => setTrips(res.documents))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user.$id]);

  function handleCreated(trip) {
    setTrips((t) => [trip, ...t]);
  }

  function handleUpdated(updated) {
    setTrips((t) =>
      t.map((trip) => (trip.$id === updated.$id ? updated : trip)),
    );
  }

  function handleDeleted(id) {
    setTrips((t) => t.filter((trip) => trip.$id !== id));
  }

  if (loading) return <p style={styles.message}>Loading trips…</p>;
  if (error)
    return <p style={{ ...styles.message, color: "#e53e3e" }}>{error}</p>;

  return (
    <div style={styles.container}>
      <CreateTripForm userId={user.$id} onCreated={handleCreated} />
      <TripTable
        trips={trips}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    fontFamily: "sans-serif",
    maxWidth: "900px",
    margin: "0 auto",
  },
  message: {
    color: "#666",
    fontFamily: "sans-serif",
    padding: "40px",
    textAlign: "center",
  },
};
