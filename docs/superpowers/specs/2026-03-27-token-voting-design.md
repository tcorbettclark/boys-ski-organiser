# Token Voting — Design Spec

**Date:** 2026-03-27
**File:** `src/PollVoting.jsx`

## Overview

Replace the current slider-based voting UI with a draggable token system. Users have N tokens (one per proposal in the poll) and distribute them across proposals by dragging or tapping. Supports mouse (desktop) and touch (mobile) without any additional dependencies.

## Decisions

| Question          | Decision                                                   |
| ----------------- | ---------------------------------------------------------- |
| Interaction model | Pile of tokens + proposal drop zones                       |
| Pile position     | Top — pile first, proposals below                          |
| Reallocation      | Direct drag/place between proposals (no pile detour)       |
| Mobile support    | Tap-select + tap-place runs in parallel with drag-and-drop |

## Layout

```
┌─────────────────────────────────┐
│  YOUR TOKENS · N remaining      │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│    🪙  🪙  🪙  (pile zone)      │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Whistler Blackcomb   2  │    │
│  │ [🪙][🪙]               │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ Park City            0  │    │
│  │ [drop here]             │    │
│  └─────────────────────────┘    │
│                                 │
│  4 tokens · 2 placed  [Save]    │
└─────────────────────────────────┘
```

## State

No change to the existing `allocations` shape: `{ [proposalId]: number }`. The component reads and writes this map exactly as before. Save logic is unchanged.

New local state:

- `selectedToken` — `{ source: 'pile' | proposalId } | null` — which token is currently tap-selected (mobile mode)

## Interaction Model

### Drag-and-drop (desktop + touch via pointer events)

Uses the [Pointer Events API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) (`onPointerDown`, `onPointerMove`, `onPointerUp`) rather than HTML5 drag events or separate touch handlers. Pointer events work for both mouse and touch with a single code path.

**Flow:**

1. `pointerdown` on a token — capture pointer, record drag source (`pile` or a `proposalId`), show ghost element following cursor/finger
2. `pointermove` — move ghost, highlight drop zone under pointer using `document.elementFromPoint`
3. `pointerup` — identify drop target, update `allocations`, clear ghost

**Reallocation via direct drag:** When drag source is a `proposalId`, decrement that proposal and increment the target. If dropped back on same proposal or on the pile zone, no change.

### Tap-select + tap-place (mobile-friendly)

Runs simultaneously — no mode switch needed.

1. Tap a token in the pile or on a proposal → set `selectedToken` (token glows with ring highlight)
2. Tap a proposal card → move token from its source to that proposal, clear `selectedToken`
3. Tap the pile zone while a token is selected → return token to pile, clear `selectedToken`
4. Tap the same token again → deselect (cancel), clear `selectedToken`

### Visual feedback

| State                                | Visual                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------- |
| Token in pile                        | 38×38 circle, `rgba(59,189,232,0.15)` fill, `rgba(59,189,232,0.6)` border |
| Token selected                       | Larger ring `box-shadow: 0 0 0 3px rgba(59,189,232,0.3)`, scale 1.15      |
| Token being dragged                  | Ghost follows pointer; original token at 0.4 opacity                      |
| Token placed on proposal             | 28×28 smaller coin, same styling                                          |
| Drop zone with active drag/selection | Brightened border + subtle background tint                                |
| Pile empty                           | Text: "All tokens placed"                                                 |
| Count badge                          | `0` shown in muted colour; `> 0` shown in accent                          |

## Component Structure

`PollVoting.jsx` handles all state and interaction. No sub-components extracted — the token and zone rendering is simple enough to inline and splitting would add indirection without benefit.

**Props:** unchanged — `{ poll, proposals, myVote, userId, onVoteSaved, upsertVote }`

**Internal helpers (plain functions, not components):**

- `renderToken(key, source, index)` — returns a token `<div>` with pointer and tap handlers
- `renderDropZone(proposalId)` — returns placed-token coins + tap handler on the card

## Testing

Existing tests cover save logic and allocation initialisation — these remain valid. New tests needed:

- Tap-select a pile token → `selectedToken` set
- Tap a proposal while token selected → allocation updated, `selectedToken` cleared
- Tap the same token → `selectedToken` cleared (deselect)
- Tap pile zone while token selected → token returned to pile
- Pointer drag from pile to proposal → allocation updated
- Pointer drag from proposal A to proposal B → A decremented, B incremented
- Pointer drag and drop on same proposal → no change
- All tokens placed → pile shows "All tokens placed"

## Token Flight Animation

When a token is placed (drag-drop or tap-select), it animates from its source position to its destination. Uses the **FLIP technique** (First → Last → Invert → Play):

1. **First** — record the token's `getBoundingClientRect()` before the state update
2. **Last** — apply the state update (token appears at destination), record the new rect in a `useLayoutEffect`
3. **Invert** — apply a CSS `transform: translate(dx, dy) scale(ratio)` that puts the token back at its source visually
4. **Play** — remove the transform in a `requestAnimationFrame`, triggering a CSS transition that flies it to its natural position

**Implementation:** A `flyingTokens` state holds `[{ id, fromRect, toRef }]` entries. Each entry renders an absolutely-positioned clone that animates independently. The clone is removed once its `transitionend` fires.

**Duration:** 280ms ease-out. Fast enough to feel snappy, slow enough to follow.

**Ghost during drag:** The drag ghost (pointer drag mode) is already a visual proxy — no FLIP needed while dragging. FLIP fires only on drop/place.

## Out of Scope

- Accessibility (keyboard nav, ARIA) — existing component has none; not regressing
- Multi-token drag (drag more than one at a time)
