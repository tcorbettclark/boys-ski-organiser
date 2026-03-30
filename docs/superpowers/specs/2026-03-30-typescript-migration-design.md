# TypeScript Migration Design

**Date:** 2026-03-30
**Scope:** Migrate the entire `src/` directory from JavaScript to strict TypeScript, replace StandardJS + Prettier with Biome.

---

## Approach

Layer-by-layer migration in three phases, each a reviewable commit:

1. **Tooling** — config files, dependency changes, file renames
2. **Shared types + utilities** — `types.ts`, `backend.ts`, `theme.ts`, `randomProposal.ts`
3. **Components + tests** — all `.tsx` components and `.test.tsx` test files

---

## Phase 1: Tooling

### Dependencies

**Add:**

- `typescript`
- `@types/react`
- `@types/react-dom`
- `@biomejs/biome`

**Remove:**

- `standard`
- `prettier`

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

Key flags: `strict: true` (enables all strict checks), `noEmit: true` (Bun handles the build, tsc is type-check only), `moduleResolution: bundler` (correct for Bun).

### `biome.json`

Configured to match current code style:

- No semicolons
- Single quotes
- 2-space indent
- Trailing commas

Replaces both StandardJS and Prettier.

### `package.json` script changes

| Script          | Before                                      | After                              |
| --------------- | ------------------------------------------- | ---------------------------------- |
| `lint`          | `bun run standard --fix --ignore .agents .` | `biome check --write .`            |
| `format`        | `bun run prettier --write .`                | removed (Biome handles formatting) |
| `test`          | unchanged                                   | unchanged                          |
| `dev` / `build` | `src/main.jsx`                              | `src/main.tsx`                     |

`lint-staged` updated to use `biome check --write`.

### File renames

All files in `src/` renamed:

- `.jsx` → `.tsx`
- `.js` → `.ts`

`server.js` is excluded — it is a standalone Node server outside `src/`, not part of the browser build.

---

## Phase 2: Domain Types + Shared Utilities

### `src/types.ts` (new file)

All Appwrite document shapes extend `Models.Document` (provides `$id`, `$createdAt`, `$updatedAt`, `$permissions`, `$collectionId`, `$databaseId`).

```ts
import type { Models } from "appwrite";

export interface Trip extends Models.Document {
  code: string;
  description?: string;
}

export interface Participant extends Models.Document {
  tripId: string;
  ParticipantUserId: string;
  ParticipantUserName: string;
  role: "coordinator" | "participant";
}

export interface Proposal extends Models.Document {
  tripId: string;
  ProposerUserId: string;
  ProposerUserName: string;
  state: "DRAFT" | "SUBMITTED" | "REJECTED";
  resortName: string;
  country: string;
  altitudeRange: string;
  nearestAirport: string;
  transferTime: string;
  accommodationName: string;
  accommodationUrl: string;
  approximateCost: string;
  description: string;
}

export interface Poll extends Models.Document {
  tripId: string;
  PollCreatorUserId: string;
  PollCreatorUserName: string;
  state: "OPEN" | "CLOSED";
  proposalIds: string[];
}

export interface Vote extends Models.Document {
  pollId: string;
  tripId: string;
  VoterUserId: string;
  proposalIds: string[];
  tokenCounts: number[];
}
```

### `src/backend.ts`

Each exported function gets explicit parameter and return types using the domain interfaces above. The `db` dependency injection parameter becomes `db: Databases = databases` — fully typed. Return types use Appwrite's `Models.DocumentList<T>` generics where lists are returned.

Example signatures:

```ts
export function getTrip(tripId: string, db?: Databases): Promise<Trip>;
export function listTrips(
  userId: string,
  db?: Databases,
): Promise<{ documents: Trip[]; coordinatorUserIds: Record<string, string> }>;
export function upsertVote(
  pollId: string,
  tripId: string,
  voterId: string,
  proposalIds: string[],
  tokenCounts: number[],
  db?: Databases,
): Promise<Vote>;
```

### `src/theme.ts`

Style constant objects typed as `React.CSSProperties` for single style objects, and `Record<string, React.CSSProperties>` for grouped style objects (e.g. `fieldStyles.default`).

### `src/randomProposal.ts`

Return type typed as `Partial<Proposal>` (the fields it generates, without the Appwrite-managed fields).

---

## Phase 3: Components + Tests

### Component prop interfaces

Each component file defines its props interface at the top of the file:

```ts
interface AppProps {
  accountGet?: () => Promise<Models.User<Models.Preferences>>;
  listTrips?: (
    userId: string,
  ) => Promise<{
    documents: Trip[];
    coordinatorUserIds: Record<string, string>;
  }>;
  deleteTrip?: (tripId: string, userId: string) => Promise<void>;
  // ...
}
```

Props interfaces are co-located with the component — no separate `Props` type file needed at this scale.

The `user` prop passed through many components is typed as `Models.User<Models.Preferences>`.

### Test files

- Renamed `.test.jsx` → `.test.tsx`, `.test.js` → `.test.ts`
- Mock functions typed with `Mock<typeof realFunction>` from `bun:test`
- The existing dependency injection pattern aligns directly with typed prop interfaces — minimal changes beyond adding types

### Style objects in components

Inline `const [name]Styles` objects at the bottom of each component file typed as `React.CSSProperties` (single) or `Record<string, React.CSSProperties>` (grouped).

---

## Error Handling

No changes to the error handling strategy. The codebase already propagates errors to `ErrorBoundary`. TypeScript strict mode will surface `unknown` error types in `.catch()` handlers — these are typed as `unknown` and cast to `Error` only where a message property is accessed.

No `@ts-ignore` or `@ts-expect-error` suppressions. If a third-party module has no types, a minimal `.d.ts` declaration is added instead.

---

## Out of Scope

- `server.js` — standalone Node server, excluded from migration
- Adding new features or refactoring component logic
- CSS or styling changes
- Changing any runtime behaviour

---

## AGENTS.md Update

The "No TypeScript" constraint in AGENTS.md will be updated to reflect TypeScript as the project language, and StandardJS/Prettier references updated to Biome.
