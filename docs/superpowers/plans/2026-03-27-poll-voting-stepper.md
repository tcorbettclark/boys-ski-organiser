# Poll Voting Stepper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the drag-and-drop token voting UI in `PollVoting.jsx` with a simple per-proposal `−` count `+` stepper, removing all token graphics, animation, and drag machinery.

**Architecture:** Rewrite `PollVoting.jsx` in place — same props, same save logic, gutted internals. Delete `FlyingToken` component and all drag/animation state. Replace token tests with stepper-behaviour tests.

**Tech Stack:** React (hooks only), Bun test runner, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom

---

## Files

- Modify: `src/PollVoting.jsx` — full rewrite; same props/save logic, stepper UI replaces drag UI
- Modify: `src/PollVoting.test.jsx` — full rewrite; new tests for stepper behaviour

---

### Task 1: Write the new tests (they will fail against the current implementation)

**Files:**

- Modify: `src/PollVoting.test.jsx`

- [ ] **Step 1: Replace the entire test file**

```jsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, mock } from "bun:test";
import PollVoting from "./PollVoting";

const poll = {
  $id: "poll-1",
  tripId: "trip-1",
  proposalIds: ["p-1", "p-2", "p-3"],
};
const proposals = [
  { $id: "p-1", resortName: "Chamonix" },
  { $id: "p-2", resortName: "Verbier" },
  { $id: "p-3", resortName: "Zermatt" },
];

function renderPollVoting(props = {}) {
  const defaults = {
    poll,
    proposals,
    myVote: null,
    userId: "user-1",
    onVoteSaved: mock(() => {}),
    upsertVote: mock(() => Promise.resolve({ $id: "v-new" })),
  };
  return render(<PollVoting {...defaults} {...props} />);
}

describe("PollVoting", () => {
  it("renders proposal names", () => {
    renderPollVoting();
    expect(screen.getByText("Chamonix")).toBeInTheDocument();
    expect(screen.getByText("Verbier")).toBeInTheDocument();
    expect(screen.getByText("Zermatt")).toBeInTheDocument();
  });

  it("initialises all counts to 0 with no myVote", () => {
    renderPollVoting();
    expect(screen.getByTestId("count-p-1").textContent).toBe("0");
    expect(screen.getByTestId("count-p-2").textContent).toBe("0");
    expect(screen.getByTestId("count-p-3").textContent).toBe("0");
  });

  it("initialises from myVote", () => {
    const myVote = { proposalIds: ["p-1", "p-3"], tokenCounts: [2, 1] };
    renderPollVoting({ myVote });
    expect(screen.getByTestId("count-p-1").textContent).toBe("2");
    expect(screen.getByTestId("count-p-2").textContent).toBe("0");
    expect(screen.getByTestId("count-p-3").textContent).toBe("1");
  });

  it("+ increments count", async () => {
    const user = userEvent.setup();
    renderPollVoting();
    await user.click(
      screen.getByRole("button", { name: /add vote to Chamonix/i }),
    );
    expect(screen.getByTestId("count-p-1").textContent).toBe("1");
  });

  it("− decrements count", async () => {
    const user = userEvent.setup();
    const myVote = { proposalIds: ["p-1"], tokenCounts: [1] };
    renderPollVoting({ myVote });
    await user.click(
      screen.getByRole("button", { name: /remove vote from Chamonix/i }),
    );
    expect(screen.getByTestId("count-p-1").textContent).toBe("0");
  });

  it("+ disabled when no tokens remaining", async () => {
    const user = userEvent.setup();
    renderPollVoting();
    await user.click(
      screen.getByRole("button", { name: /add vote to Chamonix/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /add vote to Verbier/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /add vote to Zermatt/i }),
    );
    expect(
      screen.getByRole("button", { name: /add vote to Chamonix/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /add vote to Verbier/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /add vote to Zermatt/i }),
    ).toBeDisabled();
  });

  it("− disabled when count is zero", () => {
    renderPollVoting();
    expect(
      screen.getByRole("button", { name: /remove vote from Chamonix/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /remove vote from Verbier/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /remove vote from Zermatt/i }),
    ).toBeDisabled();
  });

  it("save calls upsertVote with correct args and calls onVoteSaved", async () => {
    const user = userEvent.setup();
    const savedVote = { $id: "v-new" };
    const upsertVote = mock(() => Promise.resolve(savedVote));
    const onVoteSaved = mock(() => {});
    renderPollVoting({ upsertVote, onVoteSaved });
    await user.click(
      screen.getByRole("button", { name: /add vote to Chamonix/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /add vote to Chamonix/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /add vote to Verbier/i }),
    );
    await user.click(screen.getByRole("button", { name: /save vote/i }));
    await waitFor(() => {
      expect(upsertVote).toHaveBeenCalledWith(
        "poll-1",
        "trip-1",
        "user-1",
        ["p-1", "p-2"],
        [2, 1],
      );
      expect(onVoteSaved).toHaveBeenCalledWith(savedVote);
    });
  });

  it('shows "Vote saved" on success', async () => {
    const user = userEvent.setup();
    renderPollVoting();
    await user.click(screen.getByRole("button", { name: /save vote/i }));
    await waitFor(() => {
      expect(screen.getByText(/vote saved/i)).toBeInTheDocument();
    });
  });

  it("shows error on failure", async () => {
    const user = userEvent.setup();
    renderPollVoting({
      upsertVote: mock(() => Promise.reject(new Error("Vote failed"))),
    });
    await user.click(screen.getByRole("button", { name: /save vote/i }));
    await waitFor(() => {
      expect(screen.getByText("Vote failed")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the tests — verify they fail**

```bash
bun run test src/PollVoting.test.jsx
```

Expected: multiple failures — tests reference buttons/testids that don't exist in the current implementation (e.g. `add vote to Chamonix`, `remove vote from Chamonix`).

---

### Task 2: Rewrite `PollVoting.jsx`

**Files:**

- Modify: `src/PollVoting.jsx`

- [ ] **Step 1: Replace the entire file**

```jsx
import { useState } from "react";
import { upsertVote as _upsertVote } from "./backend";
import { colors, fonts, borders } from "./theme";

export default function PollVoting({
  poll,
  proposals,
  myVote,
  userId,
  onVoteSaved,
  upsertVote = _upsertVote,
}) {
  const proposalMap = Object.fromEntries(proposals.map((p) => [p.$id, p]));

  const [allocations, setAllocations] = useState(() => {
    const init = {};
    poll.proposalIds.forEach((id) => {
      init[id] = 0;
    });
    if (myVote) {
      myVote.proposalIds.forEach((id, i) => {
        init[id] = myVote.tokenCounts[i] || 0;
      });
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const maxTokens = poll.proposalIds.length;
  const totalUsed = Object.values(allocations).reduce((a, b) => a + b, 0);
  const remaining = maxTokens - totalUsed;

  function handleAdd(proposalId) {
    setSaved(false);
    setAllocations((prev) => ({ ...prev, [proposalId]: prev[proposalId] + 1 }));
  }

  function handleRemove(proposalId) {
    setSaved(false);
    setAllocations((prev) => ({ ...prev, [proposalId]: prev[proposalId] - 1 }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    setSaved(false);
    const nonZeroIds = poll.proposalIds.filter((id) => allocations[id] > 0);
    try {
      const result = await upsertVote(
        poll.$id,
        poll.tripId,
        userId,
        nonZeroIds,
        nonZeroIds.map((id) => allocations[id]),
      );
      setSaved(true);
      onVoteSaved(result);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.proposals}>
        {poll.proposalIds.map((proposalId) => {
          const count = allocations[proposalId];
          const proposal = proposalMap[proposalId];
          const name = proposal?.resortName || proposalId;
          return (
            <div key={proposalId} style={styles.proposalCard}>
              <span style={styles.proposalName}>{name}</span>
              <div style={styles.stepper}>
                <button
                  aria-label={`Remove vote from ${name}`}
                  onClick={() => handleRemove(proposalId)}
                  disabled={count === 0}
                  style={{
                    ...styles.stepperButton,
                    ...(count === 0 ? styles.stepperButtonDisabled : {}),
                  }}
                >
                  −
                </button>
                <span
                  data-testid={`count-${proposalId}`}
                  style={count > 0 ? styles.count : styles.countZero}
                >
                  {count}
                </span>
                <button
                  aria-label={`Add vote to ${name}`}
                  onClick={() => handleAdd(proposalId)}
                  disabled={remaining === 0}
                  style={{
                    ...styles.stepperButton,
                    ...(remaining === 0 ? styles.stepperButtonDisabled : {}),
                  }}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.footer}>
        <span style={styles.footerText}>
          {totalUsed} of {maxTokens} votes placed
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? "Saving…" : "Save Vote"}
        </button>
      </div>
      {saved && <p style={styles.savedText}>Vote saved</p>}
      {saveError && <p style={styles.errorText}>{saveError}</p>}
    </div>
  );
}

const styles = {
  container: { fontFamily: fonts.body },
  proposals: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "16px",
  },
  proposalCard: {
    padding: "12px 14px",
    background: colors.bgCard,
    border: "1px solid rgba(100,190,230,0.12)",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  proposalName: { fontSize: "14px", color: colors.textData },
  stepper: { display: "flex", alignItems: "center", gap: "10px" },
  stepperButton: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "1.5px solid rgba(59,189,232,0.5)",
    background: "rgba(59,189,232,0.08)",
    color: colors.accent,
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
    fontFamily: fonts.body,
  },
  stepperButtonDisabled: {
    opacity: 0.3,
    cursor: "default",
  },
  count: {
    fontSize: "14px",
    color: colors.accent,
    fontWeight: "600",
    minWidth: "16px",
    textAlign: "center",
  },
  countZero: {
    fontSize: "14px",
    color: "rgba(106,148,174,0.4)",
    fontWeight: "600",
    minWidth: "16px",
    textAlign: "center",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "14px",
    borderTop: borders.subtle,
  },
  footerText: { fontSize: "12px", color: colors.textSecondary },
  saveButton: {
    padding: "7px 20px",
    borderRadius: "6px",
    border: "none",
    background: colors.accent,
    color: colors.bgPrimary,
    fontFamily: fonts.body,
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  savedText: {
    color: colors.accent,
    fontFamily: fonts.body,
    fontSize: "12px",
    margin: "8px 0 0",
  },
  errorText: {
    color: colors.error,
    fontFamily: fonts.body,
    fontSize: "12px",
    margin: "8px 0 0",
  },
};
```

- [ ] **Step 2: Run the tests — verify they pass**

```bash
bun run test src/PollVoting.test.jsx
```

Expected: all 9 tests pass.

- [ ] **Step 3: Run the full test suite to check for regressions**

```bash
bun run test
```

Expected: all tests pass.

- [ ] **Step 4: Lint and format**

```bash
bun run lint && bun run format
```

Expected: no errors. If lint auto-fixes anything, that's fine.

- [ ] **Step 5: Commit**

```bash
git add src/PollVoting.jsx src/PollVoting.test.jsx
git commit -m "refactor: replace drag-and-drop token voting with simple stepper"
```
