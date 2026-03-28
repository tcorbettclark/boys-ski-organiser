# ParticipantList Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the participants list from `TripOverview` into a self-contained `ParticipantList` component that fetches and displays all participants for a trip.

**Architecture:** Add a `listTripParticipants(tripId)` backend helper that queries the participants collection by trip. Create `ParticipantList.jsx` that fetches and renders participants using dependency injection. Update `TripOverview` to delegate to `ParticipantList`, removing its own participant-fetching logic.

**Tech Stack:** React (functional components + hooks), Bun test runner, React Testing Library, `@testing-library/user-event`, `@testing-library/jest-dom`, Appwrite SDK

---

## File Map

| Action | File                           | Responsibility                                        |
| ------ | ------------------------------ | ----------------------------------------------------- |
| Modify | `src/backend.js`               | Add `listTripParticipants(tripId)`                    |
| Create | `src/ParticipantList.jsx`      | Fetch + render all participants for a trip            |
| Create | `src/ParticipantList.test.jsx` | Tests for `ParticipantList`                           |
| Modify | `src/TripOverview.jsx`         | Use `<ParticipantList>`, remove old participant logic |
| Modify | `src/TripOverview.test.jsx`    | Remove `listParticipatedTrips` mock                   |

---

### Task 1: Add `listTripParticipants` to `backend.js`

**Files:**

- Modify: `src/backend.js` (after `getCoordinatorParticipant`, around line 35)

- [ ] **Step 1: Add the function**

In `src/backend.js`, add after `getCoordinatorParticipant`:

```js
export function listTripParticipants(tripId, db = databases) {
  return db.listDocuments(DATABASE_ID, PARTICIPANTS_COLLECTION_ID, [
    Query.equal("tripId", tripId),
    Query.orderDesc("$createdAt"),
    Query.limit(100),
  ]);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/backend.js
git commit -m "feat: add listTripParticipants backend helper"
```

---

### Task 2: Create `ParticipantList` with failing tests

**Files:**

- Create: `src/ParticipantList.test.jsx`
- Create: `src/ParticipantList.jsx` (stub only in this task)

- [ ] **Step 1: Write the failing tests**

Create `src/ParticipantList.test.jsx`:

```jsx
import { describe, it, expect } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import ParticipantList from "./ParticipantList";

describe("ParticipantList", () => {
  it("shows loading state initially", () => {
    render(
      <ParticipantList
        tripId="trip-1"
        listTripParticipants={() => new Promise(() => {})}
      />,
    );
    expect(screen.getByText("Loading participants…")).toBeInTheDocument();
  });

  it("renders participant names and roles", async () => {
    render(
      <ParticipantList
        tripId="trip-1"
        listTripParticipants={() =>
          Promise.resolve({
            documents: [
              { $id: "p1", ParticipantUserName: "Alice", role: "coordinator" },
              { $id: "p2", ParticipantUserName: "Bob", role: "participant" },
            ],
          })
        }
      />,
    );
    await waitFor(() =>
      expect(
        screen.queryByText("Loading participants…"),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("coordinator")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("participant")).toBeInTheDocument();
  });

  it("renders an empty list when there are no participants", async () => {
    render(
      <ParticipantList
        tripId="trip-1"
        listTripParticipants={() => Promise.resolve({ documents: [] })}
      />,
    );
    await waitFor(() =>
      expect(
        screen.queryByText("Loading participants…"),
      ).not.toBeInTheDocument(),
    );
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Create a stub so the test file can import it**

Create `src/ParticipantList.jsx` with just:

```jsx
export default function ParticipantList() {
  return null;
}
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
bun run test src/ParticipantList.test.jsx
```

Expected: all three tests FAIL (loading text not found, names not found, etc.)

---

### Task 3: Implement `ParticipantList`

**Files:**

- Modify: `src/ParticipantList.jsx`

- [ ] **Step 1: Replace stub with full implementation**

```jsx
import { useEffect, useState } from "react";
import { listTripParticipants as _listTripParticipants } from "./backend";
import { colors, fonts, borders } from "./theme";

export default function ParticipantList({
  tripId,
  listTripParticipants = _listTripParticipants,
}) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;
    listTripParticipants(tripId)
      .then(({ documents }) => {
        setParticipants(
          documents.map((p) => ({
            id: p.$id,
            name: p.ParticipantUserName,
            role: p.role,
          })),
        );
      })
      .finally(() => setLoading(false));
  }, [tripId]);

  if (loading) return <p style={styles.loading}>Loading participants…</p>;

  return (
    <ul style={styles.list}>
      {participants.map((p) => (
        <li key={p.id} style={styles.item}>
          <span style={styles.name}>{p.name}</span>
          <span style={styles.role}>{p.role}</span>
        </li>
      ))}
    </ul>
  );
}

const styles = {
  loading: {
    color: colors.textSecondary,
    fontSize: "14px",
    margin: 0,
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: borders.subtle,
  },
  name: {
    fontFamily: fonts.body,
    fontSize: "14px",
    color: colors.textData,
  },
  role: {
    fontFamily: fonts.body,
    fontSize: "12px",
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
};
```

- [ ] **Step 2: Run tests to confirm they pass**

```bash
bun run test src/ParticipantList.test.jsx
```

Expected: all 3 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/ParticipantList.jsx src/ParticipantList.test.jsx
git commit -m "feat: add ParticipantList component with tests"
```

---

### Task 4: Update `TripOverview` to use `ParticipantList`

**Files:**

- Modify: `src/TripOverview.jsx`
- Modify: `src/TripOverview.test.jsx`

- [ ] **Step 1: Update `TripOverview.jsx`**

Replace the full file content of `src/TripOverview.jsx` with:

```jsx
import { useEffect, useState, useRef } from "react";
import {
  getCoordinatorParticipant as _getCoordinatorParticipant,
  updateTrip as _updateTrip,
  deleteTrip as _deleteTrip,
  leaveTrip as _leaveTrip,
} from "./backend";
import EditTripForm from "./EditTripForm";
import ParticipantList from "./ParticipantList";
import { colors, fonts, borders } from "./theme";

export default function TripOverview({
  trip,
  user,
  getCoordinatorParticipant = _getCoordinatorParticipant,
  updateTrip = _updateTrip,
  deleteTrip = _deleteTrip,
  leaveTrip = _leaveTrip,
  onLeft,
  onUpdated,
  onDeleted,
}) {
  const [coordinator, setCoordinator] = useState(null);
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [codeCopyError, setCodeCopyError] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!trip) return;
    getCoordinatorParticipant(trip.$id)
      .then(({ documents }) => {
        if (!mountedRef.current || documents.length === 0) return;
        const cid = documents[0].ParticipantUserId;
        if (mountedRef.current) {
          setIsCoordinator(cid === user.$id);
          setCoordinator({ name: documents[0].ParticipantUserName });
        }
      })
      .catch((err) => console.error("Failed to load coordinator:", err));
  }, [trip, user.$id]);

  function handleCopyCode() {
    if (!trip.code) return;
    navigator.clipboard
      .writeText(trip.code)
      .then(() => {
        if (!mountedRef.current) return;
        setCodeCopied(true);
        setCodeCopyError("");
        setTimeout(() => {
          if (mountedRef.current) setCodeCopied(false);
        }, 1500);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setCodeCopyError("Failed to copy");
      });
  }

  async function handleLeave() {
    setLeaveError("");
    setLeaving(true);
    try {
      await leaveTrip(user.$id, trip.$id);
      onLeft?.();
    } catch (err) {
      setLeaveError(err.message);
      setLeaving(false);
    }
  }

  if (!trip) return null;

  if (isEditing) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Edit Trip</h3>
          <EditTripForm
            trip={trip}
            userId={user.$id}
            onUpdated={(updated) => {
              setIsEditing(false);
              onUpdated?.(updated);
            }}
            onDeleted={() => onDeleted?.()}
            onCancel={() => setIsEditing(false)}
            updateTrip={updateTrip}
            deleteTrip={deleteTrip}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>Trip Details</h3>
          <div style={styles.actions}>
            {!isCoordinator && (
              <button
                onClick={handleLeave}
                disabled={leaving}
                style={styles.leaveButton}
              >
                {leaving ? "Leaving…" : "Leave Trip"}
              </button>
            )}
            {isCoordinator && (
              <button
                onClick={() => setIsEditing(true)}
                style={styles.editButton}
              >
                Edit
              </button>
            )}
          </div>
        </div>
        {leaveError && <p style={styles.leaveError}>{leaveError}</p>}
        <div style={styles.details}>
          {trip.description && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Description</span>
              <span style={styles.detailValue}>{trip.description}</span>
            </div>
          )}
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Coordinator</span>
            <span style={styles.detailValue}>
              {coordinator ? `${coordinator.name || coordinator.email}` : "…"}
            </span>
          </div>
          {trip.code && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Code</span>
              <span style={styles.codeWithCopy}>
                <span style={styles.mono}>{trip.code}</span>
                <button
                  onClick={handleCopyCode}
                  style={styles.copyButton}
                  title="Copy invite code"
                  aria-label="Copy invite code"
                >
                  {codeCopied ? "✓" : "⧉"}
                </button>
                <span style={styles.copyFeedback}>
                  {codeCopied
                    ? "Copied!"
                    : codeCopyError ||
                      "(share this code with others so they can join)"}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Participants</h3>
        <ParticipantList tripId={trip.$id} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "40px 48px",
    maxWidth: "960px",
    margin: "0 auto",
    fontFamily: fonts.body,
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  card: {
    background: colors.bgCard,
    border: borders.card,
    borderRadius: "12px",
    padding: "24px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: "18px",
    fontWeight: "600",
    color: colors.textPrimary,
    margin: 0,
  },
  editButton: {
    padding: "6px 16px",
    borderRadius: "5px",
    border: borders.muted,
    background: "transparent",
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    letterSpacing: "0.03em",
  },
  leaveButton: {
    padding: "6px 16px",
    borderRadius: "5px",
    border: "1px solid rgba(255,107,107,0.3)",
    background: "transparent",
    color: colors.error,
    fontFamily: fonts.body,
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    letterSpacing: "0.03em",
  },
  leaveError: {
    color: colors.error,
    fontFamily: fonts.body,
    fontSize: "12px",
    margin: "0 0 12px",
  },
  details: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  detailRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  detailLabel: {
    fontFamily: fonts.body,
    fontSize: "12px",
    fontWeight: "500",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    minWidth: "100px",
  },
  detailValue: {
    fontFamily: fonts.body,
    fontSize: "14px",
    color: colors.textData,
  },
  mono: {
    fontFamily: fonts.mono,
    fontSize: "13px",
    color: colors.accent,
    letterSpacing: "0.05em",
  },
  codeWithCopy: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    flex: 1,
  },
  copyButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: colors.accent,
    fontSize: "14px",
    padding: "0 2px",
    lineHeight: 1,
    opacity: 0.7,
  },
  copyFeedback: {
    fontFamily: fonts.body,
    fontSize: "11px",
    color: colors.textSecondary,
    marginLeft: "4px",
    textAlign: "right",
    flex: 1,
  },
};
```

- [ ] **Step 2: Update `TripOverview.test.jsx`**

Remove the `listParticipatedTrips` mock from the `renderOverview` helper and the `waitFor` that waits for loading to disappear (since loading is now internal to `ParticipantList`). Replace the full file with:

```jsx
import { describe, it, expect, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TripOverview from "./TripOverview";

const trip = { $id: "trip-1", code: "abc-123", description: "Old description" };
const currentUser = {
  $id: "user-1",
  name: "Alice",
  email: "alice@example.com",
};
const updatedTrip = {
  $id: "trip-1",
  code: "abc-123",
  description: "New description",
};

const noop = () => {};

async function renderOverview(props = {}) {
  render(
    <TripOverview
      trip={trip}
      user={currentUser}
      getCoordinatorParticipant={() =>
        Promise.resolve({
          documents: [
            {
              ParticipantUserId: "user-1",
              role: "coordinator",
              ParticipantUserName: "Alice",
            },
          ],
        })
      }
      updateTrip={() => Promise.resolve(updatedTrip)}
      deleteTrip={() => Promise.resolve()}
      leaveTrip={() => Promise.resolve()}
      onLeft={noop}
      onUpdated={noop}
      {...props}
    />,
  );
  await waitFor(() =>
    expect(screen.getByText("Trip Details")).toBeInTheDocument(),
  );
}

describe("TripOverview", () => {
  it("shows the trip description", async () => {
    await renderOverview();
    expect(screen.getByText("Old description")).toBeInTheDocument();
  });

  it("shows the Edit button for the coordinator", async () => {
    await renderOverview();
    expect(screen.getByRole("button", { name: /^edit$/i })).toBeInTheDocument();
  });

  it("shows EditTripForm when Edit is clicked", async () => {
    const ue = userEvent.setup();
    await renderOverview();
    await ue.click(screen.getByRole("button", { name: /^edit$/i }));
    expect(screen.getByRole("button", { name: /^save$/i })).toBeInTheDocument();
  });

  it("calls onUpdated with the updated trip after saving", async () => {
    const ue = userEvent.setup();
    const handleUpdated = mock(() => {});
    await renderOverview({ onUpdated: handleUpdated });

    await ue.click(screen.getByRole("button", { name: /^edit$/i }));

    const descInput = screen.getByRole("textbox");
    await ue.clear(descInput);
    await ue.type(descInput, "New description");
    await ue.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(handleUpdated).toHaveBeenCalledWith(updatedTrip);
    });
  });

  it("exits edit mode after saving", async () => {
    const ue = userEvent.setup();
    await renderOverview();

    await ue.click(screen.getByRole("button", { name: /^edit$/i }));
    await ue.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /^save$/i }),
      ).not.toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 3: Run all affected tests**

```bash
bun run test src/TripOverview.test.jsx src/ParticipantList.test.jsx
```

Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/TripOverview.jsx src/TripOverview.test.jsx
git commit -m "refactor: extract ParticipantList from TripOverview"
```
