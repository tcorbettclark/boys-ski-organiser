---
date: 2026-04-01T10:50:07+01:00
git_commit: 05a6d7a2cc994ba3856bf6423ec5508ad4d7e06d
branch: main
repository: ski-tripper
topic: "Research: DEBT-001 documents naming refactoring"
tags: [research, codebase, backend, frontend, refactoring]
last_updated: 2026-04-01
---

## Ticket Synopsis

DEBT-001 is a refactoring task to replace generic `documents` property names in function return types with specific names matching the data type (e.g., `documents: TripRow[]` → `trips: TripRow[]`).

## Summary

The `documents` property is used consistently across `src/backend.ts` as the generic wrapper for array returns from Appwrite queries. All 5 affected return types and their callers need updating per the naming convention in the ticket.

## Detailed Findings

### Core Backend (`src/backend.ts`)

**Affected return types (lines with Promise return signatures):**

| Function | Current Return Type | Proposed |
|----------|---------------------|----------|
| `getCoordinatorParticipant` (line 113) | `Promise<{ documents: ParticipantRow[] }>` | `Promise<{ participants: ParticipantRow[] }>` |
| `listTripParticipants` (line 130) | `Promise<{ documents: ParticipantRow[] }>` | `Promise<{ participants: ParticipantRow[] }>` |
| `listTrips` (line 148) | `{ documents: TripRow[], coordinatorUserIds }` | `{ trips: TripRow[], coordinatorUserIds }` |
| `getTripByCode` (line 200) | `Promise<{ documents: TripRow[] }>` | `Promise<{ trips: TripRow[] }>` |
| `listParticipatedTrips` (line 329) | `Promise<{ documents: TripRow[] }>` | `Promise<{ trips: TripRow[] }>` |
| `listProposals` (line 487) | `Promise<{ documents: ProposalRow[] }>` | `Promise<{ proposals: ProposalRow[] }>` |
| `listPolls` (line 728) | `Promise<{ documents: PollRow[] }>` | `Promise<{ polls: PollRow[] }>` |
| `listVotes` (line 809) | `Promise<{ documents: VoteRow[] }>` | `Promise<{ votes: VoteRow[] }>` |

**Helper function that needs updating:**
- `fetchRows<T>` (line 83): `Promise<{ documents: T[] }>` → `Promise<{ documents: T[] }>` (rename parameter or make generic)

**Local variable destructuring patterns in backend.ts:**
- Line 151-152: `const { documents: coordinatorParticipants } = await fetchRows<ParticipantRow>(...)`
- Line 172: `const { documents: trips } = await fetchRows<TripRow>(...)`
- Line 213: `const { documents } = await fetchRows<TripRow>(...)`
- Line 271: `const { documents } = await getCoordinatorParticipant(tripId, db)`
- Line 293: `const { documents: coordinatorDocs } = await getCoordinatorParticipant(...)`
- Line 303: `const { documents } = await fetchRows<ParticipantRow>(...)`
- Line 330: `const { documents } = await fetchRows<ParticipantRow>(...)`
- Line 343: `const { documents: trips } = await fetchRows<TripRow>(...)`
- Line 368: `const { documents } = await fetchRows<ParticipantRow>(...)`
- Line 405: `const { documents } = await fetchRows<ParticipantRow>(...)`
- Line 429: `const { documents } = await fetchRows<ParticipantRow>(...)`
- Line 615: `const { documents } = await getCoordinatorParticipant(proposal.tripId, db)`
- Line 638: `const { documents: coordDocs } = await getCoordinatorParticipant(tripId, db)`
- Line 645: `const { documents: openPolls } = await fetchRows<PollRow>(...)`
- Line 659: `const { documents: proposals } = await fetchRows<ProposalRow>(...)`
- Line 707: `const { documents } = await getCoordinatorParticipant(poll.tripId, db)`
- Line 766: `const { documents } = await fetchRows<VoteRow>(...)`

### Backend Tests (`src/backend.test.ts`)

Test assertions using `result.documents`:
- Line 68-69: `result.documents`, `.toHaveLength(1)`, `.documents[0].description`
- Line 78: `result.documents.toHaveLength(0)`
- Line 123: `result.documents[0].code`
- Line 129: `result.documents.toHaveLength(0)`
- Line 337: `{ documents: [] }`
- Line 357-358: `result.documents`, `result.documents[0].$id`
- Line 442-443: `result.documents`, `result.documents[0].$id`
- Line 953-954: `result.documents`, `result.documents[0].$id`
- Line 1083-1084: `result.documents`, `result.documents[0].$id`

### Frontend Components

**Prop type definitions using `documents`:**
- `src/App.tsx` (lines 23, 32, 35, 49): `documents: Array<{...}>`
- `src/Trips.tsx` (lines 29, 37): `documents: Trip[]`, `documents: Array<{ParticipantUserName}>`
- `src/TripOverview.tsx` (lines 24, 31): `documents: Array<{...}>`
- `src/TripRow.tsx` (line 13): `documents: Array<{ParticipantUserName}>`
- `src/TripTable.tsx` (line 16): `documents: Array<{ParticipantUserName}>`
- `src/Proposals.tsx` (lines 34, 62): `documents: Proposal[]`, `documents: Array<{ParticipantUserId}>`
- `src/Poll.tsx` (lines 42, 46, 51, 67): `documents: PollDoc[]`, `documents: Proposal[]`, `documents: Vote[]`, `documents: Array<{ParticipantUserId}>`
- `src/JoinTripForm.tsx` (line 15): `documents: unknown[]`
- `src/ParticipantList.tsx` (line 14): `documents: Array<{...}>`

**Property access patterns:**
- `src/TripOverview.tsx` (lines 79-84): `.then(({ documents }) => { documents.length ... documents[0] ... })`
- `src/TripRow.tsx` (lines 34-36): `.then(({ documents }) => { documents.length ... documents[0] ... })`
- `src/Proposals.tsx` (lines 109-112): `proposalsResult.documents`, `coordResult.documents`
- `src/Poll.tsx` (lines 125-136): `coordResult.documents`, `proposalsResult.documents`, `pollsResult.documents`, `votesResult.documents`
- `src/JoinTripForm.tsx` (lines 42-44): `res.documents.length`, `res.documents[0]`
- `src/ParticipantList.tsx` (lines 34-36): `const { documents } = await listTripParticipants(tripId)` + `.map()`
- `src/App.tsx` (lines 101-131): `ownRes.documents.map()`, `participatedRes.documents`

### Component Tests

Mock returns using `{ documents: ... }` pattern:
- `src/App.test.tsx`: lines 27-33, 44-50, 182, 190, 196-198
- `src/Trips.test.tsx`: lines 25, 32
- `src/TripOverview.test.tsx`: lines 27, 36
- `src/TripRow.test.tsx`: line 25
- `src/TripTable.test.tsx`: line 20
- `src/Proposals.test.tsx`: lines 28, 38, 46, 61, 103, 117, 139, 155, 159, 177, 181
- `src/Poll.test.tsx`: lines 26-28, 32, 44, 61, 76, 88, 91, 107, 109, 124
- `src/JoinTripForm.test.tsx`: lines 21, 45, 61, 78, 109
- `src/ParticipantList.test.tsx`: lines 22, 45

## Code References

- `src/backend.ts:81-86` - `fetchRows<T>` helper function - core of the issue
- `src/backend.ts:148-181` - `listTrips` function - most complex example with destructuring
- `src/backend.ts:766-785` - `upsertVote` function - example of `documents[0].$id` access
- `src/App.tsx:101-131` - Frontend usage with `.map()` and `.filter()` on `documents`
- `src/Poll.tsx:125-136` - Multiple property accesses in single function

## Architecture Insights

1. **Single source of truth**: The `fetchRows<T>` helper at line 81-86 is the origin of all `documents` returns. Changing its return type template would cascade to all callers.

2. **Destructuring convention**: Backend code already uses rename syntax (`const { documents: trips }`) in some places - this pattern should be applied consistently.

3. **Prop type vs return type**: Frontend components define their own prop types that mirror backend return types. Both need updating.

4. **Test mocking pattern**: All component tests use `{ documents: [] }` as mock return values - these need updating alongside implementation.

## Historical Context (from thoughts/)

- `thoughts/tickets/debt-documents-naming.md` - The ticket being researched

## Related Research

(None yet)

## Open Questions

1. Should `fetchRows<T>` be renamed to `fetchDocuments<T>` or kept as internal helper? - No
2. The `Trip[]`, `Proposal[]`, `Poll[]`, `Vote[]` types used in frontend prop definitions - should these also be renamed to `TripRow[]`, etc. for consistency with backend types? - No (the backend types will be renamed Trip, Proposal etc in the future)
