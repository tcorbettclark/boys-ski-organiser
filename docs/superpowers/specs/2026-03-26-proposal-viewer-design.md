# Proposal Viewer Design

**Date:** 2026-03-26

## Overview

A swipeable, read-only modal for viewing all fields of a proposal. Opened via a "View" button in each row of the proposals table. Supports keyboard navigation (← → Esc), left/right arrow buttons, touch swipe, and dot indicators.

## Components

### `ProposalViewer.jsx` (new)

Renders the modal overlay and handles all navigation.

**Props:**

- `proposals` — the full list of proposals (same array rendered in the table)
- `initialIndex` — index of the proposal to open on
- `onClose` — callback to close the modal
- `getUserById` — injectable async function to fetch creator name (default: from `backend.js`)

**Internal state:**

- `currentIndex` — tracks which proposal is being viewed

**Layout:**

- Full-screen fixed backdrop (`position: fixed; inset: 0`), semi-transparent dark overlay. Clicking the backdrop calls `onClose`.
- Modal card centered via `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%)`. Max-width 560px. Scrollable if content overflows viewport height.
- Circular prev/next arrow buttons flanking the card. Disabled (dimmed) when at the first or last proposal. No wrap-around.
- Dot indicators centered below the card.

**Header:**

- Resort name in serif display font (`fonts.display`), large.
- Country and status badge (`DRAFT` / `SUBMITTED`) on a second line.
- "N of M" counter in small uppercase above the resort name.
- × close button top-right.

**Fields (all read-only):**

- 2-column grid: Altitude Range, Nearest Airport, Transfer Time, Approximate Cost.
- Full-width row: Accommodation Name + URL (rendered as a link if present).
- Full-width row: Description.
- Full-width row: Proposed By (fetched via `getUserById`, falls back to `—` on error).

**Navigation:**

- Keyboard: `useEffect` adds a `keydown` listener while modal is open. `ArrowLeft` → prev, `ArrowRight` → next, `Escape` → close. Listener removed on unmount.
- Touch: `onTouchStart` / `onTouchEnd` handlers on the modal card. Swipe left → next, swipe right → prev. Threshold: 50px horizontal delta.
- Arrow buttons: standard `onClick` handlers.

### `ProposalsTable.jsx` (modified)

Adds viewer state and renders `ProposalViewer`.

**New state:**

- `viewingIndex` — `null` (closed) or a numeric index into `proposals`.

**Changes:**

- Passes `onView={(index) => setViewingIndex(index)}` to each `ProposalsRow`.
- Renders `<ProposalViewer>` below the table when `viewingIndex !== null`, with `onClose={() => setViewingIndex(null)}`.
- Passes `getUserById` through to `ProposalViewer`.

### `ProposalsRow.jsx` (modified)

Adds a "View" button visible to all users (not gated on ownership or state).

**New prop:**

- `onView` — called with no arguments when the button is clicked. `ProposalsTable` supplies the index.

**Button style:** matches the existing `editButton` style (muted border, secondary text color, `12px` font).

## Styling

Follows existing inline-style conventions. No new CSS files. Modal uses `colors`, `fonts`, `borders` from `theme.js`. Backdrop uses `rgba(4,12,24,0.85)`. Card uses `colors.bgCard` with `borders.card` and a `box-shadow`.

## Testing

**`ProposalViewer.test.jsx` (new):**

- Renders all proposal fields correctly.
- Prev button disabled on first proposal; next button disabled on last.
- Clicking next advances to the next proposal.
- Clicking prev moves to the previous proposal.
- Pressing `Escape` calls `onClose`.
- Pressing `ArrowLeft` / `ArrowRight` navigates.
- Clicking the backdrop calls `onClose`.
- Creator name shown via `getUserById`.

**`ProposalsRow.test.jsx` (additions):**

- "View" button is rendered for all users (owner and non-owner, draft and submitted).
- Clicking "View" calls `onView`.

**`ProposalsTable.test.jsx` (additions):**

- Clicking "View" on a row opens `ProposalViewer` at the correct proposal.
- Closing the viewer hides it.

Touch swipe is not tested (not reliably simulatable in happy-dom).

## Not in scope

- Edit or Submit actions inside the viewer.
- Wrap-around navigation (arrows clamp at ends).
- Animations or transition effects.
