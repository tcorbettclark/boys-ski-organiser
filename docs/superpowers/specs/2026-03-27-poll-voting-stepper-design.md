# Poll Voting: Replace Drag-and-Drop with Stepper

**Date:** 2026-03-27

## Summary

Replace the drag-and-drop voting token UI in `PollVoting.jsx` with a simple per-proposal stepper (`−` count `+`). Remove all token graphics, the unallocated token pool, drag handling, animation, and the `FlyingToken` component.

## Motivation

The drag-and-drop interaction is complex to maintain and the token metaphor adds visual noise without clarity. A plain numeric stepper communicates the same information more directly.

## Scope

- `src/PollVoting.jsx` — rewritten in place (approach A)
- `src/PollVoting.test.jsx` — old tests deleted, new tests written
- No changes to `Poll.jsx`, `PollResults.jsx`, `backend.js`, or any other file

## Component Design

### Props (unchanged)

```js
PollVoting({ poll, proposals, myVote, userId, onVoteSaved, upsertVote });
```

- `poll` — active poll document; `poll.proposalIds` is the ordered list of proposal IDs
- `proposals` — array of proposal documents (used for resort name display)
- `myVote` — the current user's existing vote document, or `null`
- `userId` — current user ID
- `onVoteSaved(vote)` — callback after successful save
- `upsertVote` — injected backend function (default `_upsertVote`)

### State

```js
allocations; // { [proposalId]: number } — initialised from myVote or all-zeros
saving; // bool
saveError; // string
saved; // bool
```

No drag refs, no ghost refs, no flying token state, no pile zone refs, no layout effects.

### Derived values

```js
maxTokens = poll.proposalIds.length
totalUsed = sum of allocations values
remaining = maxTokens - totalUsed
```

### Render

1. **Proposal list** — for each `proposalId` in `poll.proposalIds`:
   - Row: resort name (left) + stepper (right)
   - Stepper: `[−]  {count}  [+]`
   - `−` button disabled when `allocations[proposalId] === 0`
   - `+` button disabled when `remaining === 0`

2. **Footer** — `"{totalUsed} of {maxTokens} votes placed"` + **Save Vote** button
   - Save button disabled while `saving`

3. **Status line** — `"Vote saved"` (accent colour) or error text below footer, shown conditionally

### Save logic

On save: collect `nonZeroIds` and their counts, call `upsertVote(poll.$id, poll.tripId, userId, nonZeroIds, counts)`. On success call `onVoteSaved(result)` and set `saved = true`. On error set `saveError`.

## Deleted

- All pointer event handlers (`onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`)
- `dragRef`, `ghostRef`, `suppressClickRef`, `pileZoneRef`, `zoneRefs`
- `flyingTokens`, `flightTrigger`, `flyIdRef`, `pendingFlightRef`
- `handlePileZoneClick`, `handleProposalClick`, `startDrag`, `capturePileTokenRect`, `captureZoneTokenRect`
- Both `useLayoutEffect` hooks
- `FlyingToken` component
- Token pile zone render block
- All token-related styles (`token`, `tokenSmall`, `tokenSelected`, `pileZone`, `pileZoneHighlight`, `dropZone`, `dropZoneHint`, etc.)

## Tests

File: `src/PollVoting.test.jsx`

| Test                                    | What it checks                        |
| --------------------------------------- | ------------------------------------- |
| renders proposal names                  | resort names appear                   |
| initialises from myVote                 | allocations pre-populated correctly   |
| + increments count                      | clicking + increases displayed count  |
| − decrements count                      | clicking − decreases displayed count  |
| + disabled when no remaining            | all tokens used → + buttons disabled  |
| − disabled when count is zero           | count at 0 → − button disabled        |
| save calls upsertVote with correct args | non-zero allocations passed correctly |
| save shows "Vote saved" on success      | saved state displayed                 |
| save shows error on failure             | error message displayed               |
