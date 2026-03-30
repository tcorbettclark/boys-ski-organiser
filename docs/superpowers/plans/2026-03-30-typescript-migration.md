# TypeScript Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all `src/` files from JavaScript to strict TypeScript, replacing StandardJS + Prettier with Biome.

**Architecture:** Three phases — (1) tooling config, (2) shared types + utilities, (3) components + tests. Each phase is a commit. Types defined in `src/types.ts` in Phase 2 are the source of truth for all domain shapes used in Phases 3+.

**Tech Stack:** TypeScript 5, React 18, Appwrite SDK (already typed), Biome, Bun

---

## File Map

**Created:**

- `src/types.ts` — domain interfaces (Trip, Participant, Proposal, Poll, Vote, ProposalFormData, TripFormData)
- `tsconfig.json` — strict TS config for Bun
- `biome.json` — code style matching current conventions

**Renamed (all in `src/`):**

- All `.jsx` → `.tsx`, all `.js` → `.ts` (except `server.js`)

**Modified:**

- `package.json` — swap standard/prettier for biome, update scripts + lint-staged
- `AGENTS.md` — update language and linting guidance

---

## Task 1: Install dependencies

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install TypeScript + React types + Biome**

```bash
bun add -d typescript @types/react @types/react-dom @biomejs/biome
```

- [ ] **Step 2: Remove StandardJS and Prettier**

```bash
bun remove standard prettier
```

- [ ] **Step 3: Verify node_modules updated**

```bash
bun pm ls | grep -E "typescript|biome|standard|prettier"
```

Expected: `typescript`, `@types/react`, `@types/react-dom`, `@biomejs/biome` present. `standard` and `prettier` absent.

---

## Task 2: Create tsconfig.json

**Files:**

- Create: `tsconfig.json`

- [ ] **Step 1: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Verify tsc is available**

```bash
bun run tsc --version
```

Expected: `Version 5.x.x`

---

## Task 3: Create biome.json

**Files:**

- Create: `biome.json`

- [ ] **Step 1: Initialise Biome config**

```bash
bun biome init
```

- [ ] **Step 2: Replace generated biome.json with project config**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "asNeeded"
    }
  },
  "files": {
    "ignore": ["node_modules", "dist", ".agents"]
  }
}
```

---

## Task 4: Update package.json scripts and lint-staged

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Update scripts and lint-staged in package.json**

Replace the `"scripts"` and `"lint-staged"` sections:

```json
"scripts": {
  "dev": "bun build src/main.tsx --outdir dist --target browser --env 'PUBLIC_*' --watch & bun server.js",
  "build": "bun build src/main.tsx --outdir dist --target browser --env 'PUBLIC_*' --minify && cp index.html dist/",
  "preview": "bun server.js",
  "test": "bun test --max-concurrency 1",
  "test:watch": "bun test --watch --max-concurrency 1",
  "typecheck": "bun run tsc --noEmit",
  "lint": "biome check --write .",
  "prepare": "husky"
},
"lint-staged": {
  "*.{js,jsx,ts,tsx}": "biome check --write",
  "*.{md,json,jsonc}": "biome check --write"
}
```

- [ ] **Step 2: Verify dev script resolves**

```bash
bun run typecheck 2>&1 | head -5
```

Expected: Either no output (clean) or type errors from JS files not yet converted (acceptable at this stage).

- [ ] **Step 3: Commit Phase 1 tooling**

```bash
git add package.json tsconfig.json biome.json bun.lock
git commit -m "chore: add TypeScript and Biome, remove StandardJS and Prettier"
```

---

## Task 5: Rename all src/ files

**Files:**

- Rename all `.jsx` → `.tsx` and `.js` → `.ts` in `src/`

- [ ] **Step 1: Rename component files**

```bash
cd src && for f in *.jsx; do mv "$f" "${f%.jsx}.tsx"; done
```

- [ ] **Step 2: Rename utility and test files**

```bash
cd src && for f in *.js; do mv "$f" "${f%.js}.ts"; done
```

- [ ] **Step 3: Verify all files renamed**

```bash
ls src/*.js src/*.jsx 2>&1
```

Expected: `No such file or directory` (no .js or .jsx files remain).

```bash
ls src/*.ts src/*.tsx | wc -l
```

Expected: 45 (or close — verify the count matches your file list).

- [ ] **Step 4: Commit renames**

```bash
git add -A src/
git commit -m "chore: rename all src/ files to .ts/.tsx"
```

---

## Task 6: Create src/types.ts

**Files:**

- Create: `src/types.ts`

- [ ] **Step 1: Write domain interfaces**

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

export type ProposalFormData = Pick<
  Proposal,
  | "resortName"
  | "country"
  | "altitudeRange"
  | "nearestAirport"
  | "transferTime"
  | "accommodationName"
  | "accommodationUrl"
  | "approximateCost"
  | "description"
>;

export type TripFormData = Pick<Trip, "description">;
```

- [ ] **Step 2: Type check**

```bash
bun run tsc --noEmit 2>&1 | grep "src/types.ts" | head -10
```

Expected: No errors for `src/types.ts`.

---

## Task 7: Convert src/theme.ts

**Files:**

- Modify: `src/theme.ts`

- [ ] **Step 1: Add CSSProperties imports and type annotations**

Replace the contents of `src/theme.ts`:

```ts
import type { CSSProperties } from "react";

export const colors = {
  accent: "#3bbde8",
  bgPrimary: "#07111f",
  bgCard: "#0d1e30",
  bgInput: "#060f1b",
  textPrimary: "#edf6fc",
  textSecondary: "#6a94ae",
  textData: "#b0cedf",
  error: "#ff6b6b",
};

export const fonts = {
  body: "'DM Sans', sans-serif",
  display: "'Cormorant Garamond', Georgia, serif",
  mono: "monospace",
};

export const borders = {
  subtle: "1px solid rgba(100,190,230,0.1)",
  card: "1px solid rgba(100,190,230,0.12)",
  muted: "1px solid rgba(100,190,230,0.15)",
  accent: "1px solid rgba(59,189,232,0.3)",
};

export const formStyles: Record<string, CSSProperties> = {
  error: {
    color: colors.error,
    fontFamily: fonts.body,
    fontSize: "13px",
    margin: 0,
  },
  primaryButton: {
    marginTop: "4px",
    padding: "14px",
    borderRadius: "8px",
    border: "none",
    background: colors.accent,
    color: colors.bgPrimary,
    fontFamily: fonts.body,
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    letterSpacing: "0.02em",
  },
  cancelButton: {
    padding: "10px 16px",
    borderRadius: "7px",
    border: "none",
    background: "transparent",
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: "14px",
    cursor: "pointer",
  },
  saveButton: {
    padding: "10px 24px",
    borderRadius: "7px",
    border: "none",
    background: colors.accent,
    color: colors.bgPrimary,
    fontFamily: fonts.body,
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export const authStyles: Record<string, CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(160deg, #040c18 0%, #081626 35%, #0c1e32 65%, #07111f 100%)",
    padding: "24px",
  },
  card: {
    background: colors.bgCard,
    borderRadius: "16px",
    padding: "48px 44px",
    width: "100%",
    maxWidth: "420px",
    border: borders.card,
    boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,189,232,0.04)",
  },
  eyebrow: {
    fontFamily: fonts.body,
    fontSize: "11px",
    fontWeight: "500",
    letterSpacing: "0.14em",
    color: colors.accent,
    textTransform: "uppercase",
    marginBottom: "14px",
  },
  title: {
    fontFamily: fonts.display,
    marginBottom: "32px",
    fontSize: "38px",
    fontWeight: "600",
    color: colors.textPrimary,
    lineHeight: "1.1",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  switchText: {
    marginTop: "28px",
    fontFamily: fonts.body,
    fontSize: "13px",
    color: colors.textSecondary,
    textAlign: "center",
  },
  switchLink: {
    background: "none",
    border: "none",
    color: colors.accent,
    fontFamily: fonts.body,
    fontWeight: "500",
    cursor: "pointer",
    fontSize: "13px",
    padding: "0",
  },
};

interface FieldStyleSet {
  field: CSSProperties;
  label: CSSProperties;
  input: CSSProperties;
}

export const fieldStyles: Record<string, FieldStyleSet> = {
  default: {
    field: {
      display: "flex",
      flexDirection: "column",
      gap: "7px",
    },
    label: {
      fontFamily: fonts.body,
      fontSize: "11px",
      fontWeight: "500",
      color: colors.textSecondary,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
    input: {
      padding: "10px 14px",
      borderRadius: "7px",
      border: borders.card,
      background: colors.bgInput,
      color: colors.textPrimary,
      fontFamily: fonts.body,
      fontSize: "14px",
      outline: "none",
    },
  },
  auth: {
    field: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      textAlign: "left",
    },
    label: {
      fontFamily: fonts.body,
      fontSize: "11px",
      fontWeight: "500",
      color: colors.textSecondary,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
    input: {
      padding: "12px 16px",
      borderRadius: "8px",
      border: borders.card,
      background: colors.bgInput,
      color: colors.textPrimary,
      fontFamily: fonts.body,
      fontSize: "15px",
      outline: "none",
    },
  },
};
```

- [ ] **Step 2: Type check theme**

```bash
bun run tsc --noEmit 2>&1 | grep "src/theme.ts" | head -10
```

Expected: No errors.

---

## Task 8: Convert src/randomProposal.ts

**Files:**

- Modify: `src/randomProposal.ts`

- [ ] **Step 1: Add type annotation**

Add `import type { ProposalFormData } from './types'` at the top, and type the return:

```ts
import type { ProposalFormData } from "./types";

const PROPOSALS: ProposalFormData[] = [
  // ... existing array contents unchanged
];

export function randomProposal(): ProposalFormData {
  return PROPOSALS[Math.floor(Math.random() * PROPOSALS.length)];
}
```

The PROPOSALS array contents are unchanged — only the `ProposalFormData[]` type annotation is added to the const, and the return type is added to the function.

- [ ] **Step 2: Type check**

```bash
bun run tsc --noEmit 2>&1 | grep "src/randomProposal.ts" | head -10
```

Expected: No errors.

---

## Task 9: Convert src/test-setup.ts

**Files:**

- Modify: `src/test-setup.ts`

- [ ] **Step 1: Update imports to use .ts extension awareness**

The file uses top-level await and dynamic imports. TypeScript needs `"module": "ESNext"` for this (already set). The content stays the same, just verify TypeScript accepts it:

```ts
/* global localStorage */
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterEach, expect } from "bun:test";

GlobalRegistrator.register();

const matchers = await import("@testing-library/jest-dom/matchers");
const { cleanup } = await import("@testing-library/react");

expect.extend(matchers.default);

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  localStorage.clear();
});
```

Note: `matchers` may need `.default` since it's a dynamic import. Check if the existing tests still pass after this change.

- [ ] **Step 2: Run tests to verify setup still works**

```bash
bun run test 2>&1 | tail -5
```

Expected: Tests pass (or fail only due to not-yet-converted files, not setup errors).

---

## Task 10: Convert src/backend.ts

**Files:**

- Modify: `src/backend.ts`

- [ ] **Step 1: Write typed backend.ts**

```ts
import {
  Client,
  Account,
  Databases,
  ID,
  Permission,
  Query,
  Role,
} from "appwrite";
import type { Models } from "appwrite";
import adjectives from "threewords/data/adjectives.json";
import nouns from "threewords/data/nouns.json";
import type {
  Trip,
  Participant,
  Proposal,
  Poll,
  Vote,
  ProposalFormData,
  TripFormData,
} from "./types";

const client = new Client()
  .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT as string)
  .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID as string);

export const account = new Account(client);
export const databases = new Databases(client);
export default client;

function randomThreeWords(): string {
  const ints = new Uint32Array(3);
  crypto.getRandomValues(ints);
  const one = (adjectives as string[])[ints[0] % adjectives.length];
  const two = (adjectives as string[])[ints[1] % adjectives.length];
  const three = (nouns as string[])[ints[2] % nouns.length];
  return `${one}-${two}-${three}`.toLowerCase();
}

const DATABASE_ID = process.env.PUBLIC_APPWRITE_DATABASE_ID as string;
const TRIPS_COLLECTION_ID = process.env
  .PUBLIC_APPWRITE_TRIPS_COLLECTION_ID as string;
const PARTICIPANTS_COLLECTION_ID = process.env
  .PUBLIC_APPWRITE_PARTICIPANTS_COLLECTION_ID as string;
const PROPOSALS_COLLECTION_ID = process.env
  .PUBLIC_APPWRITE_PROPOSALS_COLLECTION_ID as string;
const POLLS_COLLECTION_ID = process.env
  .PUBLIC_APPWRITE_POLLS_COLLECTION_ID as string;
const VOTES_COLLECTION_ID = process.env
  .PUBLIC_APPWRITE_VOTES_COLLECTION_ID as string;

export function getCoordinatorParticipant(
  tripId: string,
  db: Databases = databases,
): Promise<Models.DocumentList<Participant>> {
  return db.listDocuments<Participant>(
    DATABASE_ID,
    PARTICIPANTS_COLLECTION_ID,
    [
      Query.equal("tripId", tripId),
      Query.equal("role", "coordinator"),
      Query.limit(1),
    ],
  );
}

export function listTripParticipants(
  tripId: string,
  db: Databases = databases,
): Promise<Models.DocumentList<Participant>> {
  return db.listDocuments<Participant>(
    DATABASE_ID,
    PARTICIPANTS_COLLECTION_ID,
    [
      Query.equal("tripId", tripId),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ],
  );
}

export async function listTrips(
  ParticipantUserId: string,
  db: Databases = databases,
): Promise<{ documents: Trip[]; coordinatorUserIds: Record<string, string> }> {
  const { documents: coordinatorParticipants } =
    await db.listDocuments<Participant>(
      DATABASE_ID,
      PARTICIPANTS_COLLECTION_ID,
      [
        Query.equal("ParticipantUserId", ParticipantUserId),
        Query.equal("role", "coordinator"),
        Query.orderDesc("$createdAt"),
        Query.limit(50),
      ],
    );
  if (coordinatorParticipants.length === 0) {
    return { documents: [], coordinatorUserIds: {} };
  }
  const tripIds = coordinatorParticipants.map((p) => p.tripId);
  const coordinatorUserIds = Object.fromEntries(
    coordinatorParticipants.map((p) => [p.tripId, p.ParticipantUserId]),
  );
  const { documents: trips } = await db.listDocuments<Trip>(
    DATABASE_ID,
    TRIPS_COLLECTION_ID,
    [Query.equal("$id", tripIds)],
  );
  const tripMap = Object.fromEntries(trips.map((t) => [t.$id, t]));
  const orderedTrips = tripIds
    .map((id) => tripMap[id])
    .filter((t): t is Trip => Boolean(t));
  return { documents: orderedTrips, coordinatorUserIds };
}

export function getTrip(
  tripId: string,
  db: Databases = databases,
): Promise<Trip> {
  return db.getDocument<Trip>(DATABASE_ID, TRIPS_COLLECTION_ID, tripId);
}

export function getTripByCode(
  code: string,
  db: Databases = databases,
): Promise<Models.DocumentList<Trip>> {
  return db.listDocuments<Trip>(DATABASE_ID, TRIPS_COLLECTION_ID, [
    Query.equal("code", code),
    Query.limit(1),
  ]);
}

async function findUniqueCode(db: Databases = databases): Promise<string> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = randomThreeWords();
    const existing = await db.listDocuments<Trip>(
      DATABASE_ID,
      TRIPS_COLLECTION_ID,
      [Query.equal("code", code), Query.limit(1)],
    );
    if (existing.documents.length === 0) return code;
  }
  throw new Error("Could not generate a unique trip code after 100 attempts.");
}

export async function createTrip(
  ParticipantUserId: string,
  ParticipantUserName: string,
  data: TripFormData,
  db: Databases = databases,
): Promise<Trip> {
  const code = await findUniqueCode(db);
  const trip = await db.createDocument<Trip>(
    DATABASE_ID,
    TRIPS_COLLECTION_ID,
    ID.unique(),
    { code, ...data },
    [
      Permission.read(Role.users()),
      Permission.write(Role.user(ParticipantUserId)),
    ],
  );
  await db.createDocument<Participant>(
    DATABASE_ID,
    PARTICIPANTS_COLLECTION_ID,
    ID.unique(),
    {
      ParticipantUserId,
      ParticipantUserName,
      tripId: trip.$id,
      role: "coordinator",
    },
    [
      Permission.read(Role.user(ParticipantUserId)),
      Permission.write(Role.user(ParticipantUserId)),
    ],
  );
  return trip;
}

export async function updateTrip(
  tripId: string,
  data: Partial<TripFormData>,
  ParticipantUserId: string,
  db: Databases = databases,
): Promise<Trip> {
  const { documents } = await getCoordinatorParticipant(tripId, db);
  if (
    documents.length === 0 ||
    documents[0].ParticipantUserId !== ParticipantUserId
  ) {
    throw new Error("Only the coordinator can edit this trip.");
  }
  return db.updateDocument<Trip>(
    DATABASE_ID,
    TRIPS_COLLECTION_ID,
    tripId,
    data,
  );
}

export async function deleteTrip(
  tripId: string,
  ParticipantUserId: string,
  db: Databases = databases,
): Promise<unknown> {
  const { documents: coordinatorDocs } = await getCoordinatorParticipant(
    tripId,
    db,
  );
  if (
    coordinatorDocs.length === 0 ||
    coordinatorDocs[0].ParticipantUserId !== ParticipantUserId
  ) {
    throw new Error("Only the coordinator can delete this trip.");
  }
  const { documents } = await db.listDocuments<Participant>(
    DATABASE_ID,
    PARTICIPANTS_COLLECTION_ID,
    [Query.equal("tripId", tripId), Query.limit(100)],
  );
  await Promise.allSettled(
    documents.map((p) =>
      db.deleteDocument(DATABASE_ID, PARTICIPANTS_COLLECTION_ID, p.$id),
    ),
  );
  return db.deleteDocument(DATABASE_ID, TRIPS_COLLECTION_ID, tripId);
}

export async function listParticipatedTrips(
  ParticipantUserId: string,
  db: Databases = databases,
): Promise<{ documents: Trip[] }> {
  const { documents } = await db.listDocuments<Participant>(
    DATABASE_ID,
    PARTICIPANTS_COLLECTION_ID,
    [
      Query.equal("ParticipantUserId", ParticipantUserId),
      Query.orderDesc("$createdAt"),
      Query.limit(50),
    ],
  );
  if (documents.length === 0) return { documents: [] };
  const tripIds = documents.map((p) => p.tripId);
  const { documents: trips } = await db.listDocuments<Trip>(
    DATABASE_ID,
    TRIPS_COLLECTION_ID,
    [Query.equal("$id", tripIds)],
  );
  return { documents: trips };
}

export async function joinTrip(
  ParticipantUserId: string,
  ParticipantUserName: string,
  tripId: string,
  db: Databases = databases,
): Promise<Participant> {
  try {
    await db.getDocument<Trip>(DATABASE_ID, TRIPS_COLLECTION_ID, tripId);
  } catch {
    throw new Error("Trip not found.");
  }
  const { documents } = await db.listDocuments<Participant>(
    DATABASE_ID,
    PARTICIPANTS_COLLECTION_ID,
    [
      Query.equal("ParticipantUserId", ParticipantUserId),
      Query.equal("tripId", tripId),
      Query.limit(1),
    ],
  );
  if (documents.length > 0)
    throw new Error("You have already joined this trip.");
  return db.createDocument<Participant>(
    DATABASE_ID,
    PARTICIPANTS_COLLECTION_ID,
    ID.unique(),
    { ParticipantUserId, ParticipantUserName, tripId, role: "participant" },
    [
      Permission.read(Role.user(ParticipantUserId)),
      Permission.write(Role.user(ParticipantUserId)),
    ],
  );
}

export async function leaveTrip(
  ParticipantUserId: string,
  tripId: string,
  db: Databases = databases,
): Promise<unknown> {
  const { documents } = await db.listDocuments<Participant>(
    DATABASE_ID,
    PARTICIPANTS_COLLECTION_ID,
    [
      Query.equal("ParticipantUserId", ParticipantUserId),
      Query.equal("tripId", tripId),
      Query.limit(1),
    ],
  );
  if (documents.length === 0)
    throw new Error("Participation record not found.");
  return db.deleteDocument(
    DATABASE_ID,
    PARTICIPANTS_COLLECTION_ID,
    documents[0].$id,
  );
}

async function _verifyParticipant(
  tripId: string,
  ParticipantUserId: string,
  db: Databases,
): Promise<void> {
  const { documents } = await db.listDocuments<Participant>(
    DATABASE_ID,
    PARTICIPANTS_COLLECTION_ID,
    [
      Query.equal("tripId", tripId),
      Query.equal("ParticipantUserId", ParticipantUserId),
      Query.limit(1),
    ],
  );
  if (documents.length === 0)
    throw new Error("You must be a participant to access proposals.");
}

export async function createProposal(
  tripId: string,
  ProposerUserId: string,
  ProposerUserName: string,
  data: ProposalFormData,
  db: Databases = databases,
): Promise<Proposal> {
  await _verifyParticipant(tripId, ProposerUserId, db);
  return db.createDocument<Proposal>(
    DATABASE_ID,
    PROPOSALS_COLLECTION_ID,
    ID.unique(),
    { tripId, ProposerUserId, ProposerUserName, state: "DRAFT", ...data },
    [
      Permission.read(Role.users()),
      Permission.write(Role.user(ProposerUserId)),
    ],
  );
}

export async function listProposals(
  tripId: string,
  ParticipantUserId: string,
  db: Databases = databases,
): Promise<Models.DocumentList<Proposal>> {
  await _verifyParticipant(tripId, ParticipantUserId, db);
  return db.listDocuments<Proposal>(DATABASE_ID, PROPOSALS_COLLECTION_ID, [
    Query.equal("tripId", tripId),
    Query.orderDesc("$createdAt"),
    Query.limit(50),
  ]);
}

export async function getProposal(
  proposalId: string,
  ParticipantUserId: string,
  db: Databases = databases,
): Promise<Proposal> {
  const proposal = await db.getDocument<Proposal>(
    DATABASE_ID,
    PROPOSALS_COLLECTION_ID,
    proposalId,
  );
  await _verifyParticipant(proposal.tripId, ParticipantUserId, db);
  return proposal;
}

export async function updateProposal(
  proposalId: string,
  ProposerUserId: string,
  data: ProposalFormData,
  db: Databases = databases,
): Promise<Proposal> {
  const proposal = await db.getDocument<Proposal>(
    DATABASE_ID,
    PROPOSALS_COLLECTION_ID,
    proposalId,
  );
  if (proposal.ProposerUserId !== ProposerUserId)
    throw new Error("Only the creator can edit this proposal.");
  if (proposal.state !== "DRAFT")
    throw new Error("Only draft proposals can be edited.");
  const {
    state: _state,
    tripId: _tripId,
    ProposerUserId: _puid,
    ...safeData
  } = data as Partial<Proposal>;
  return db.updateDocument<Proposal>(
    DATABASE_ID,
    PROPOSALS_COLLECTION_ID,
    proposalId,
    safeData,
  );
}

export async function deleteProposal(
  proposalId: string,
  ProposerUserId: string,
  db: Databases = databases,
): Promise<unknown> {
  const proposal = await db.getDocument<Proposal>(
    DATABASE_ID,
    PROPOSALS_COLLECTION_ID,
    proposalId,
  );
  if (proposal.ProposerUserId !== ProposerUserId)
    throw new Error("Only the creator can delete this proposal.");
  if (proposal.state !== "DRAFT")
    throw new Error("Only draft proposals can be deleted.");
  return db.deleteDocument(DATABASE_ID, PROPOSALS_COLLECTION_ID, proposalId);
}

export async function submitProposal(
  proposalId: string,
  ProposerUserId: string,
  db: Databases = databases,
): Promise<Proposal> {
  const proposal = await db.getDocument<Proposal>(
    DATABASE_ID,
    PROPOSALS_COLLECTION_ID,
    proposalId,
  );
  if (proposal.ProposerUserId !== ProposerUserId)
    throw new Error("Only the creator can submit this proposal.");
  if (proposal.state !== "DRAFT")
    throw new Error("Only draft proposals can be submitted.");
  return db.updateDocument<Proposal>(
    DATABASE_ID,
    PROPOSALS_COLLECTION_ID,
    proposalId,
    {
      state: "SUBMITTED",
    },
  );
}

export async function rejectProposal(
  proposalId: string,
  PollCreatorUserId: string,
  db: Databases = databases,
): Promise<Proposal> {
  const proposal = await db.getDocument<Proposal>(
    DATABASE_ID,
    PROPOSALS_COLLECTION_ID,
    proposalId,
  );
  if (proposal.state !== "SUBMITTED") {
    throw new Error("Only submitted proposals can be rejected.");
  }
  const { documents } = await getCoordinatorParticipant(proposal.tripId, db);
  if (
    documents.length === 0 ||
    documents[0].ParticipantUserId !== PollCreatorUserId
  ) {
    throw new Error("Only the coordinator can reject this proposal.");
  }
  return db.updateDocument<Proposal>(
    DATABASE_ID,
    PROPOSALS_COLLECTION_ID,
    proposalId,
    {
      state: "REJECTED",
    },
  );
}

export async function createPoll(
  tripId: string,
  PollCreatorUserId: string,
  PollCreatorUserName: string,
  db: Databases = databases,
): Promise<Poll> {
  const { documents: coordDocs } = await getCoordinatorParticipant(tripId, db);
  if (
    coordDocs.length === 0 ||
    coordDocs[0].ParticipantUserId !== PollCreatorUserId
  ) {
    throw new Error("Only the coordinator can create a poll.");
  }
  const { documents: openPolls } = await db.listDocuments<Poll>(
    DATABASE_ID,
    POLLS_COLLECTION_ID,
    [
      Query.equal("tripId", tripId),
      Query.equal("state", "OPEN"),
      Query.limit(1),
    ],
  );
  if (openPolls.length > 0) {
    throw new Error("A poll is already open for this trip.");
  }
  const { documents: proposals } = await db.listDocuments<Proposal>(
    DATABASE_ID,
    PROPOSALS_COLLECTION_ID,
    [
      Query.equal("tripId", tripId),
      Query.equal("state", "SUBMITTED"),
      Query.limit(100),
    ],
  );
  if (proposals.length === 0) {
    throw new Error("No submitted proposals to poll on.");
  }
  const proposalIds = proposals.map((p) => p.$id);
  return db.createDocument<Poll>(
    DATABASE_ID,
    POLLS_COLLECTION_ID,
    ID.unique(),
    {
      tripId,
      PollCreatorUserId,
      PollCreatorUserName,
      state: "OPEN",
      proposalIds,
    },
    [
      Permission.read(Role.users()),
      Permission.write(Role.user(PollCreatorUserId)),
    ],
  );
}

export async function closePoll(
  pollId: string,
  PollCreatorUserId: string,
  db: Databases = databases,
): Promise<Poll> {
  const poll = await db.getDocument<Poll>(
    DATABASE_ID,
    POLLS_COLLECTION_ID,
    pollId,
  );
  if (poll.state !== "OPEN") throw new Error("Only open polls can be closed.");
  const { documents } = await getCoordinatorParticipant(poll.tripId, db);
  if (
    documents.length === 0 ||
    documents[0].ParticipantUserId !== PollCreatorUserId
  ) {
    throw new Error("Only the coordinator can close a poll.");
  }
  return db.updateDocument<Poll>(DATABASE_ID, POLLS_COLLECTION_ID, pollId, {
    state: "CLOSED",
  });
}

export async function listPolls(
  tripId: string,
  ParticipantUserId: string,
  db: Databases = databases,
): Promise<Models.DocumentList<Poll>> {
  await _verifyParticipant(tripId, ParticipantUserId, db);
  return db.listDocuments<Poll>(DATABASE_ID, POLLS_COLLECTION_ID, [
    Query.equal("tripId", tripId),
    Query.orderDesc("$createdAt"),
    Query.limit(50),
  ]);
}

export async function upsertVote(
  pollId: string,
  tripId: string,
  VoterUserId: string,
  proposalIds: string[],
  tokenCounts: number[],
  db: Databases = databases,
): Promise<Vote> {
  await _verifyParticipant(tripId, VoterUserId, db);
  const poll = await db.getDocument<Poll>(
    DATABASE_ID,
    POLLS_COLLECTION_ID,
    pollId,
  );
  if (poll.state !== "OPEN") {
    throw new Error("Voting is only allowed on open polls.");
  }
  const total = tokenCounts.reduce((a, b) => a + b, 0);
  if (total > poll.proposalIds.length) {
    throw new Error(`Total tokens cannot exceed ${poll.proposalIds.length}.`);
  }
  const { documents } = await db.listDocuments<Vote>(
    DATABASE_ID,
    VOTES_COLLECTION_ID,
    [
      Query.equal("pollId", pollId),
      Query.equal("VoterUserId", VoterUserId),
      Query.limit(1),
    ],
  );
  if (documents.length > 0) {
    return db.updateDocument<Vote>(
      DATABASE_ID,
      VOTES_COLLECTION_ID,
      documents[0].$id,
      {
        proposalIds,
        tokenCounts,
      },
    );
  }
  return db.createDocument<Vote>(
    DATABASE_ID,
    VOTES_COLLECTION_ID,
    ID.unique(),
    { pollId, tripId, VoterUserId, proposalIds, tokenCounts },
    [Permission.read(Role.users()), Permission.write(Role.user(VoterUserId))],
  );
}

export async function listVotes(
  pollId: string,
  tripId: string,
  ParticipantUserId: string,
  db: Databases = databases,
): Promise<Models.DocumentList<Vote>> {
  await _verifyParticipant(tripId, ParticipantUserId, db);
  return db.listDocuments<Vote>(DATABASE_ID, VOTES_COLLECTION_ID, [
    Query.equal("pollId", pollId),
    Query.limit(200),
  ]);
}
```

- [ ] **Step 2: Type check backend**

```bash
bun run tsc --noEmit 2>&1 | grep "src/backend.ts" | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit Phase 2 shared types**

```bash
git add src/types.ts src/backend.ts src/theme.ts src/randomProposal.ts src/test-setup.ts
git commit -m "feat: add domain types, convert backend and utilities to TypeScript"
```

---

## Task 11: Convert src/backend.test.ts

**Files:**

- Modify: `src/backend.test.ts`

- [ ] **Step 1: Add types to makeDb and test fixtures**

The key change is typing the `makeDb` helper. Add imports and cast the return:

```ts
import { describe, it, expect, mock } from "bun:test";
import type { Databases } from "appwrite";
import {
  listTrips,
  getTrip,
  getTripByCode,
  createTrip,
  updateTrip,
  deleteTrip,
  joinTrip,
  listParticipatedTrips,
  leaveTrip,
  createProposal,
  listProposals,
  getProposal,
  updateProposal,
  deleteProposal,
  submitProposal,
  rejectProposal,
  createPoll,
  closePoll,
  listPolls,
  upsertVote,
  listVotes,
} from "./backend";

function makeDb(overrides: Record<string, unknown> = {}): Databases {
  return {
    listDocuments: mock(() => Promise.resolve({ documents: [] })),
    createDocument: mock(() =>
      Promise.resolve({ $id: "new-id", name: "New Trip" }),
    ),
    updateDocument: mock(() =>
      Promise.resolve({ $id: "1", name: "Updated Trip" }),
    ),
    deleteDocument: mock(() => Promise.resolve()),
    getDocument: mock(() =>
      Promise.resolve({ $id: "trip-1", name: "Ski Alps" }),
    ),
    ...overrides,
  } as unknown as Databases;
}
```

All test bodies remain unchanged. Only the `makeDb` function signature and the import block change.

- [ ] **Step 2: Run backend tests**

```bash
bun run test src/backend.test.ts
```

Expected: All tests pass.

---

## Task 12: Convert src/ErrorBoundary.tsx

**Files:**

- Modify: `src/ErrorBoundary.tsx`

- [ ] **Step 1: Add TypeScript class component types**

```ts
import { Component, type CSSProperties } from 'react'
import { colors, fonts } from './theme'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <p style={styles.emoji}>⚠️</p>
          <h2 style={styles.heading}>Something went wrong</h2>
          <p style={styles.message}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} style={styles.button}>
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: '80px 48px',
    maxWidth: '960px',
    margin: '0 auto',
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  emoji: { fontSize: '48px', margin: '0 0 16px' },
  heading: {
    fontFamily: fonts.display,
    fontSize: '24px',
    fontWeight: '600',
    color: colors.textPrimary,
    margin: '0 0 12px',
  },
  message: { fontSize: '14px', color: colors.textSecondary, margin: '0 0 24px' },
  button: {
    padding: '9px 22px',
    borderRadius: '7px',
    border: 'none',
    background: colors.accent,
    color: colors.bgPrimary,
    fontFamily: fonts.body,
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
}

export default ErrorBoundary
```

- [ ] **Step 2: Type check**

```bash
bun run tsc --noEmit 2>&1 | grep "src/ErrorBoundary.tsx" | head -10
```

Expected: No errors.

---

## Task 13: Convert src/Field.tsx + Field.test.tsx

**Files:**

- Modify: `src/Field.tsx`
- Modify: `src/Field.test.tsx`

- [ ] **Step 1: Type Field.tsx**

```ts
import type { CSSProperties } from 'react'
import { fieldStyles } from './theme'

interface FieldProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  required?: boolean
  placeholder?: string
  variant?: string
  minLength?: number
}

export default function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  variant = 'default',
  minLength,
}: FieldProps) {
  const styles = fieldStyles[variant] || fieldStyles.default

  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        style={styles.input}
        minLength={minLength}
      />
    </div>
  )
}
```

- [ ] **Step 2: Update Field.test.tsx imports — add React type for ChangeEvent**

Open `src/Field.test.tsx`. The tests don't need changes beyond the file rename (already done). Verify they pass:

```bash
bun run test src/Field.test.tsx
```

Expected: All tests pass.

---

## Task 14: Convert src/Header.tsx

**Files:**

- Modify: `src/Header.tsx`

- [ ] **Step 1: Type Header.tsx**

```ts
import type { CSSProperties } from "react";
import { colors, fonts, borders } from "./theme";

interface HeaderProps {
  view: string;
  tripName: string;
  tripDetailTab: string;
  onViewAllTrips: () => void;
  onTripDetailTabChange: (tab: string) => void;
  userName: string;
  onLogout: () => void;
}

export default function Header({
  view,
  tripName,
  tripDetailTab,
  onViewAllTrips,
  onTripDetailTabChange,
  userName,
  onLogout,
}: HeaderProps) {
  // ... JSX body unchanged
}

const headerStyles: Record<string, CSSProperties> = {
  // ... style object unchanged
};
```

The JSX body and style object are unchanged from the JS version. Only add the `HeaderProps` interface, the parameter type annotation, and `Record<string, CSSProperties>` on `headerStyles`.

- [ ] **Step 2: Type check**

```bash
bun run tsc --noEmit 2>&1 | grep "src/Header.tsx" | head -10
```

Expected: No errors.

---

## Task 15: Convert src/AuthForm.tsx + AuthForm.test.tsx

**Files:**

- Modify: `src/AuthForm.tsx`
- Modify: `src/AuthForm.test.tsx`

- [ ] **Step 1: Type AuthForm.tsx**

```ts
import { useState } from "react";
import { ID } from "appwrite";
import type { Models } from "appwrite";
import { account as _account } from "./backend";
import Field from "./Field";
import { authStyles, formStyles } from "./theme";

interface AuthFormProps {
  mode?: "login" | "signup";
  onSuccess: (user: Models.User<Models.Preferences>) => void;
  onSwitchMode: () => void;
  accountCreate?: (
    id: string,
    email: string,
    password: string,
    name: string,
  ) => Promise<Models.User<Models.Preferences>>;
  createEmailPasswordSession?: (
    email: string,
    password: string,
  ) => Promise<Models.Session>;
  accountGet?: () => Promise<Models.User<Models.Preferences>>;
  generateId?: () => string;
}

export default function AuthForm({
  mode = "login",
  onSuccess,
  onSwitchMode,
  accountCreate = (id, email, password, name) =>
    _account.create(id, email, password, name),
  createEmailPasswordSession = (email, password) =>
    _account.createEmailPasswordSession(email, password),
  accountGet = () => _account.get(),
  generateId = () => ID.unique(),
}: AuthFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        await accountCreate(generateId(), email, password, name);
      }
      await createEmailPasswordSession(email, password);
      const user = await accountGet();
      onSuccess(user);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // JSX body unchanged
}
```

The `bannerStyles` const at the bottom gets typed as `React.CSSProperties`.

- [ ] **Step 2: Run AuthForm tests**

```bash
bun run test src/AuthForm.test.tsx
```

Expected: All tests pass.

---

## Task 16: Convert src/ParticipantList.tsx + ParticipantList.test.tsx

**Files:**

- Modify: `src/ParticipantList.tsx`
- Modify: `src/ParticipantList.test.tsx`

- [ ] **Step 1: Type ParticipantList.tsx**

```ts
import { useEffect, useState } from 'react'
import type { Models } from 'appwrite'
import { listTripParticipants as _listTripParticipants } from './backend'
import type { Participant } from './types'
import { colors, fonts, borders } from './theme'
import type { CSSProperties } from 'react'

interface ParticipantListProps {
  tripId: string
  listTripParticipants?: (tripId: string) => Promise<Models.DocumentList<Participant>>
}

interface ParticipantRow {
  id: string
  name: string
  role: string
}

export default function ParticipantList({
  tripId,
  listTripParticipants = _listTripParticipants,
}: ParticipantListProps) {
  const [participants, setParticipants] = useState<ParticipantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    if (!tripId) return
    async function load() {
      try {
        const { documents } = await listTripParticipants(tripId)
        setParticipants(
          documents.map((p) => ({
            id: p.$id,
            name: p.ParticipantUserName,
            role: p.role,
          })),
        )
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tripId])

  if (error) throw error
  if (loading) return <p style={styles.loading}>Loading participants…</p>

  return (
    <ul style={styles.list}>
      {participants.map((p) => (
        <li key={p.id} style={styles.item}>
          <span style={styles.name}>{p.name}</span>
          <span style={styles.role}>{p.role}</span>
        </li>
      ))}
    </ul>
  )
}

const styles: Record<string, CSSProperties> = {
  // unchanged
}
```

- [ ] **Step 2: Run tests**

```bash
bun run test src/ParticipantList.test.tsx
```

Expected: All tests pass.

---

## Task 17: Convert src/TripRow.tsx + TripRow.test.tsx

**Files:**

- Modify: `src/TripRow.tsx`
- Modify: `src/TripRow.test.tsx`

- [ ] **Step 1: Type TripRow.tsx**

```ts
import { useState, useEffect, useRef } from 'react'
import type { Models } from 'appwrite'
import { getCoordinatorParticipant as _getCoordinatorParticipant } from './backend'
import type { Trip, Participant } from './types'
import { colors, fonts } from './theme'
import type { CSSProperties } from 'react'

interface TripRowProps {
  trip: Trip
  onSelectTrip: (tripId: string) => void
  getCoordinatorParticipant?: (tripId: string) => Promise<Models.DocumentList<Participant>>
}

export default function TripRow({
  trip,
  onSelectTrip,
  getCoordinatorParticipant = _getCoordinatorParticipant,
}: TripRowProps) {
  const [coordinator, setCoordinator] = useState<{ name: string } | null>(null)
  const [hovered, setHovered] = useState(false)
  const mountedRef = useRef(true)

  // ... hooks + JSX unchanged

  return (
    <tr
      style={{ ...styles.tr, ...(hovered ? styles.trHovered : {}) }}
      onClick={() => onSelectTrip(trip.$id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td style={{ ...styles.td, color: colors.textSecondary }}>{trip.description || '—'}</td>
      <td style={{ ...styles.td, color: colors.textSecondary }}>
        {coordinator?.name || '—'}
      </td>
    </tr>
  )
}

const styles: Record<string, CSSProperties> = { /* unchanged */ }
```

Note: The `.catch((err) => console.error(...))` — `err` becomes `unknown`. Fix to `console.error('Failed to fetch coordinator:', err)` with `err` typed as `unknown` (no property access needed here, so no cast required).

- [ ] **Step 2: Run tests**

```bash
bun run test src/TripRow.test.tsx
```

Expected: All tests pass.

---

## Task 18: Convert src/TripTable.tsx + TripTable.test.tsx

**Files:**

- Modify: `src/TripTable.tsx`
- Modify: `src/TripTable.test.tsx`

- [ ] **Step 1: Type TripTable.tsx**

```ts
import type { Models } from "appwrite";
import TripRow from "./TripRow";
import type { Trip, Participant } from "./types";
import { colors, fonts, borders } from "./theme";
import type { CSSProperties } from "react";

interface TripTableProps {
  trips: Trip[];
  onSelectTrip: (tripId: string) => void;
  emptyMessage?: string;
  getCoordinatorParticipant?: (
    tripId: string,
  ) => Promise<Models.DocumentList<Participant>>;
}

export default function TripTable({
  trips,
  onSelectTrip,
  emptyMessage = "No trips yet. Add one above.",
  getCoordinatorParticipant,
}: TripTableProps) {
  // ... JSX unchanged
}

const styles: Record<string, CSSProperties> = {
  /* unchanged */
};
```

- [ ] **Step 2: Run tests**

```bash
bun run test src/TripTable.test.tsx
```

Expected: All tests pass.

---

## Task 19: Convert src/CreateTripForm.tsx, src/JoinTripForm.tsx, src/EditTripForm.tsx + their tests

**Files:**

- Modify: `src/CreateTripForm.tsx`, `src/CreateTripForm.test.tsx`
- Modify: `src/JoinTripForm.tsx`, `src/JoinTripForm.test.tsx`
- Modify: `src/EditTripForm.tsx`, `src/EditTripForm.test.tsx`

- [ ] **Step 1: Type CreateTripForm.tsx**

```ts
import { useState } from "react";
import type { Models } from "appwrite";
import { createTrip as _createTrip, account as _account } from "./backend";
import type { Trip, TripFormData } from "./types";
import Field from "./Field";
import { colors, borders, formStyles } from "./theme";
import type { CSSProperties } from "react";

interface CreateTripFormProps {
  user: Models.User<Models.Preferences>;
  onCreated: (trip: Trip) => void;
  onDismiss: () => void;
  createTrip?: (
    userId: string,
    userName: string,
    data: TripFormData,
  ) => Promise<Trip>;
  accountGet?: () => Promise<Models.User<Models.Preferences>>;
}

const EMPTY_FORM: TripFormData = { description: "" };

export default function CreateTripForm({
  user,
  onCreated,
  onDismiss,
  createTrip = _createTrip,
  accountGet = _account.get.bind(_account),
}: CreateTripFormProps) {
  const [form, setForm] = useState<TripFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const userAccount = await accountGet();
      const trip = await createTrip(user.$id, userAccount.name, form);
      onCreated(trip);
      setForm(EMPTY_FORM);
      onDismiss();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // JSX unchanged
}

const styles: Record<string, CSSProperties> = {
  /* unchanged */
};
```

- [ ] **Step 2: Type JoinTripForm.tsx**

```ts
import { useState } from "react";
import type { Models } from "appwrite";
import {
  getTripByCode as _getTripByCode,
  joinTrip as _joinTrip,
  account as _account,
} from "./backend";
import type { Trip, Participant } from "./types";
import Field from "./Field";
import { colors, borders, formStyles } from "./theme";
import type { CSSProperties } from "react";

interface JoinTripFormProps {
  user: Models.User<Models.Preferences>;
  onJoined: (trip: Trip) => void;
  onDismiss: () => void;
  getTripByCode?: (code: string) => Promise<Models.DocumentList<Trip>>;
  joinTrip?: (
    userId: string,
    userName: string,
    tripId: string,
  ) => Promise<Participant>;
  accountGet?: () => Promise<Models.User<Models.Preferences>>;
}

export default function JoinTripForm({
  user,
  onJoined,
  onDismiss,
  getTripByCode = _getTripByCode,
  joinTrip = _joinTrip,
  accountGet = _account.get.bind(_account),
}: JoinTripFormProps) {
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await getTripByCode(code.trim().toLowerCase());
      if (res.documents.length === 0)
        throw new Error("No trip found with that code.");
      const trip = res.documents[0];
      const userAccount = await accountGet();
      await joinTrip(user.$id, userAccount.name, trip.$id);
      onJoined(trip);
      setCode("");
      onDismiss();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // JSX unchanged
}

const styles: Record<string, CSSProperties> = {
  /* unchanged */
};
```

- [ ] **Step 3: Type EditTripForm.tsx**

```ts
import { useState } from "react";
import {
  updateTrip as _updateTrip,
  deleteTrip as _deleteTrip,
} from "./backend";
import type { Trip, TripFormData } from "./types";
import Field from "./Field";
import { colors, borders, formStyles } from "./theme";
import type { CSSProperties } from "react";

interface EditTripFormProps {
  trip: Trip;
  userId: string;
  onUpdated: (trip: Trip) => void;
  onDeleted: () => void;
  onCancel: () => void;
  updateTrip?: (
    tripId: string,
    data: Partial<TripFormData>,
    userId: string,
  ) => Promise<Trip>;
  deleteTrip?: (tripId: string, userId: string) => Promise<unknown>;
}

export default function EditTripForm({
  trip,
  userId,
  onUpdated,
  onDeleted,
  onCancel,
  updateTrip = _updateTrip,
  deleteTrip = _deleteTrip,
}: EditTripFormProps) {
  const [form, setForm] = useState<TripFormData>({
    description: trip.description || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const updated = await updateTrip(trip.$id, form, userId);
      onUpdated(updated);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this trip?")) return;
    setSaving(true);
    try {
      await deleteTrip(trip.$id, userId);
      onDeleted();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  // JSX unchanged
}

const styles: Record<string, CSSProperties> = {
  /* unchanged */
};
```

- [ ] **Step 4: Run all three form tests**

```bash
bun run test src/CreateTripForm.test.tsx src/JoinTripForm.test.tsx src/EditTripForm.test.tsx
```

Expected: All tests pass.

---

## Task 20: Convert src/TripOverview.tsx + TripOverview.test.tsx

**Files:**

- Modify: `src/TripOverview.tsx`
- Modify: `src/TripOverview.test.tsx`

- [ ] **Step 1: Type TripOverview.tsx**

```ts
import { useEffect, useState, useRef } from "react";
import type { Models } from "appwrite";
import {
  listTripParticipants as _listTripParticipants,
  getCoordinatorParticipant as _getCoordinatorParticipant,
  updateTrip as _updateTrip,
  deleteTrip as _deleteTrip,
  leaveTrip as _leaveTrip,
} from "./backend";
import type { Trip, Participant, TripFormData } from "./types";
import EditTripForm from "./EditTripForm";
import ParticipantList from "./ParticipantList";
import { colors, fonts, borders } from "./theme";
import type { CSSProperties } from "react";

interface TripOverviewProps {
  trip: Trip | null;
  user: Models.User<Models.Preferences>;
  listTripParticipants?: (
    tripId: string,
  ) => Promise<Models.DocumentList<Participant>>;
  getCoordinatorParticipant?: (
    tripId: string,
  ) => Promise<Models.DocumentList<Participant>>;
  updateTrip?: (
    tripId: string,
    data: Partial<TripFormData>,
    userId: string,
  ) => Promise<Trip>;
  deleteTrip?: (tripId: string, userId: string) => Promise<unknown>;
  leaveTrip?: (userId: string, tripId: string) => Promise<unknown>;
  onLeft?: () => void;
  onUpdated?: (trip: Trip) => void;
  onDeleted?: () => void;
}
```

State types:

- `coordinator`: `{ name: string } | null`
- `isCoordinator`: `boolean`
- `isEditing`, `leaving`, `codeCopied`: `boolean`
- `leaveError`, `codeCopyError`: `string`

The `.catch` handlers that access `err.message` cast: `(err as Error).message`.

- [ ] **Step 2: Run TripOverview tests**

```bash
bun run test src/TripOverview.test.tsx
```

Expected: All tests pass.

---

## Task 21: Convert src/Trips.tsx + Trips.test.tsx

**Files:**

- Modify: `src/Trips.tsx`
- Modify: `src/Trips.test.tsx`

- [ ] **Step 1: Type Trips.tsx**

```ts
import { useState, useCallback } from "react";
import type { Models } from "appwrite";
import {
  createTrip as _createTrip,
  getTripByCode as _getTripByCode,
  joinTrip as _joinTrip,
  updateTrip as _updateTrip,
  deleteTrip as _deleteTrip,
  leaveTrip as _leaveTrip,
  getCoordinatorParticipant as _getCoordinatorParticipant,
} from "./backend";
import type { Trip, Participant, TripFormData } from "./types";
import CreateTripForm from "./CreateTripForm";
import JoinTripForm from "./JoinTripForm";
import TripTable from "./TripTable";
import { colors, fonts, borders } from "./theme";
import type { CSSProperties } from "react";

interface TripsProps {
  user: Models.User<Models.Preferences>;
  trips: Trip[];
  onSelectTrip: (tripId: string) => void;
  onJoinedTrip?: () => void;
  createTrip?: (
    userId: string,
    userName: string,
    data: TripFormData,
  ) => Promise<Trip>;
  getTripByCode?: (code: string) => Promise<Models.DocumentList<Trip>>;
  joinTrip?: (
    userId: string,
    userName: string,
    tripId: string,
  ) => Promise<Participant>;
  updateTrip?: (
    tripId: string,
    data: Partial<TripFormData>,
    userId: string,
  ) => Promise<Trip>;
  deleteTrip?: (tripId: string, userId: string) => Promise<unknown>;
  leaveTrip?: (userId: string, tripId: string) => Promise<unknown>;
  getCoordinatorParticipant?: (
    tripId: string,
  ) => Promise<Models.DocumentList<Participant>>;
}
```

The `handleCreated` and `handleJoined` callbacks accept `Trip` parameter. `styles` is `Record<string, CSSProperties>`.

- [ ] **Step 2: Run tests**

```bash
bun run test src/Trips.test.tsx
```

Expected: All tests pass.

---

## Task 22: Convert src/ProposalViewer.tsx + ProposalViewer.test.tsx

**Files:**

- Modify: `src/ProposalViewer.tsx`
- Modify: `src/ProposalViewer.test.tsx`

- [ ] **Step 1: Type ProposalViewer.tsx**

Note: `ProposalViewer` has an internal `Field` component (not the same as `src/Field.tsx`). Keep it typed separately:

```ts
import { useState, useEffect } from 'react'
import type { Proposal } from './types'
import { colors, fonts, borders } from './theme'
import type { CSSProperties } from 'react'

interface ProposalViewerProps {
  proposals: Proposal[]
  initialIndex: number
  onClose: () => void
}

export default function ProposalViewer({ proposals, initialIndex, onClose }: ProposalViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  // handleKeyDown: e is KeyboardEvent
  // handleTouchStart: e is React.TouchEvent<HTMLDivElement>
  // handleTouchEnd: e is React.TouchEvent<HTMLDivElement>
  // ... JSX unchanged
}

interface InternalFieldProps {
  label: string
  value: string
}

function Field({ label, value }: InternalFieldProps) {
  return (
    <div>
      <div style={styles.fieldLabel}>{label}</div>
      <div style={styles.fieldValue}>{value || '—'}</div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = { /* unchanged */ }
```

The `handleTouchStart` and `handleTouchEnd` are `React.TouchEvent` handlers. The `window.addEventListener('keydown', handleKeyDown)` handler: `handleKeyDown` takes `KeyboardEvent` (not `React.KeyboardEvent` — it's a native DOM event).

- [ ] **Step 2: Run tests**

```bash
bun run test src/ProposalViewer.test.tsx
```

Expected: All tests pass.

---

## Task 23: Convert src/ProposalsRow.tsx + ProposalsRow.test.tsx

**Files:**

- Modify: `src/ProposalsRow.tsx`
- Modify: `src/ProposalsRow.test.tsx`

- [ ] **Step 1: Type ProposalsRow.tsx**

```ts
import { useState } from "react";
import {
  updateProposal as _updateProposal,
  deleteProposal as _deleteProposal,
  submitProposal as _submitProposal,
  rejectProposal as _rejectProposal,
} from "./backend";
import type { Proposal, ProposalFormData } from "./types";
import EditProposalForm from "./EditProposalForm";
import { colors, fonts, borders } from "./theme";
import type { CSSProperties } from "react";

interface ProposalsRowProps {
  proposal: Proposal;
  userId: string;
  isCoordinator?: boolean;
  onUpdated: (proposal: Proposal) => void;
  onDeleted: (proposalId: string) => void;
  onSubmitted: (proposal: Proposal) => void;
  onRejected?: (proposal: Proposal) => void;
  onView?: () => void;
  updateProposal?: (
    proposalId: string,
    userId: string,
    data: ProposalFormData,
  ) => Promise<Proposal>;
  deleteProposal?: (proposalId: string, userId: string) => Promise<unknown>;
  submitProposal?: (proposalId: string, userId: string) => Promise<Proposal>;
  rejectProposal?: (proposalId: string, userId: string) => Promise<Proposal>;
}
```

The `.catch` handlers: `(err as Error).message`.

- [ ] **Step 2: Run tests**

```bash
bun run test src/ProposalsRow.test.tsx
```

Expected: All tests pass.

---

## Task 24: Convert src/ProposalsTable.tsx + ProposalsTable.test.tsx

**Files:**

- Modify: `src/ProposalsTable.tsx`
- Modify: `src/ProposalsTable.test.tsx`

- [ ] **Step 1: Type ProposalsTable.tsx**

```ts
import { useState } from "react";
import ProposalsRow from "./ProposalsRow";
import ProposalViewer from "./ProposalViewer";
import {
  updateProposal as _updateProposal,
  deleteProposal as _deleteProposal,
  submitProposal as _submitProposal,
  rejectProposal as _rejectProposal,
} from "./backend";
import type { Proposal, ProposalFormData } from "./types";
import { colors, fonts, borders } from "./theme";
import type { CSSProperties } from "react";

interface ProposalsTableProps {
  proposals: Proposal[];
  userId: string;
  isCoordinator?: boolean;
  onUpdated: (proposal: Proposal) => void;
  onDeleted: (proposalId: string) => void;
  onSubmitted: (proposal: Proposal) => void;
  onRejected?: (proposal: Proposal) => void;
  emptyMessage?: string;
  updateProposal?: (
    proposalId: string,
    userId: string,
    data: ProposalFormData,
  ) => Promise<Proposal>;
  deleteProposal?: (proposalId: string, userId: string) => Promise<unknown>;
  submitProposal?: (proposalId: string, userId: string) => Promise<Proposal>;
  rejectProposal?: (proposalId: string, userId: string) => Promise<Proposal>;
}
```

`viewingIndex` state: `number | null`.

- [ ] **Step 2: Run tests**

```bash
bun run test src/ProposalsTable.test.tsx
```

Expected: All tests pass.

---

## Task 25: Convert src/CreateProposalForm.tsx + CreateProposalForm.test.tsx

**Files:**

- Modify: `src/CreateProposalForm.tsx`
- Modify: `src/CreateProposalForm.test.tsx`

- [ ] **Step 1: Type CreateProposalForm.tsx**

```ts
import { useState } from "react";
import type { Models } from "appwrite";
import {
  createProposal as _createProposal,
  account as _account,
} from "./backend";
import type { Proposal, ProposalFormData } from "./types";
import Field from "./Field";
import { colors, fonts, borders, formStyles, fieldStyles } from "./theme";
import type { CSSProperties } from "react";

interface CreateProposalFormProps {
  tripId: string;
  userId: string;
  onCreated: (proposal: Proposal) => void;
  onDismiss: () => void;
  createProposal?: (
    tripId: string,
    userId: string,
    userName: string,
    data: ProposalFormData,
  ) => Promise<Proposal>;
  accountGet?: () => Promise<Models.User<Models.Preferences>>;
}

const EMPTY_FORM: ProposalFormData = {
  resortName: "",
  country: "",
  altitudeRange: "",
  nearestAirport: "",
  transferTime: "",
  accommodationName: "",
  accommodationUrl: "",
  approximateCost: "",
  description: "",
};
```

`form` state: `ProposalFormData`. `handleChange`: `React.ChangeEvent<HTMLInputElement>`. `handleSubmit`: `React.FormEvent`.

- [ ] **Step 2: Run tests**

```bash
bun run test src/CreateProposalForm.test.tsx
```

Expected: All tests pass.

---

## Task 26: Convert src/EditProposalForm.tsx + EditProposalForm.test.tsx

**Files:**

- Modify: `src/EditProposalForm.tsx`
- Modify: `src/EditProposalForm.test.tsx`

- [ ] **Step 1: Type EditProposalForm.tsx**

```ts
import { useState } from "react";
import {
  updateProposal as _updateProposal,
  deleteProposal as _deleteProposal,
} from "./backend";
import type { Proposal, ProposalFormData } from "./types";
import Field from "./Field";
import { colors, fonts, borders, formStyles, fieldStyles } from "./theme";
import type { CSSProperties } from "react";

interface EditProposalFormProps {
  proposal: Proposal;
  userId: string;
  onUpdated: (proposal: Proposal) => void;
  onDeleted: (proposalId: string) => void;
  onCancel: () => void;
  updateProposal?: (
    proposalId: string,
    userId: string,
    data: ProposalFormData,
  ) => Promise<Proposal>;
  deleteProposal?: (proposalId: string, userId: string) => Promise<unknown>;
}
```

`form` state: `ProposalFormData`. The `textarea` onChange: `React.ChangeEvent<HTMLTextAreaElement>`. Note the existing `handleChange` uses `e.target.name` and `e.target.value` for both inputs and textareas — union the type: `React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>`.

- [ ] **Step 2: Run tests**

```bash
bun run test src/EditProposalForm.test.tsx
```

Expected: All tests pass.

---

## Task 27: Convert src/Proposals.tsx + Proposals.test.tsx

**Files:**

- Modify: `src/Proposals.tsx`
- Modify: `src/Proposals.test.tsx`

- [ ] **Step 1: Type Proposals.tsx**

```ts
import { useEffect, useState, useCallback, useRef } from "react";
import type { Models } from "appwrite";
import {
  listProposals as _listProposals,
  createProposal as _createProposal,
  updateProposal as _updateProposal,
  deleteProposal as _deleteProposal,
  submitProposal as _submitProposal,
  rejectProposal as _rejectProposal,
  getCoordinatorParticipant as _getCoordinatorParticipant,
} from "./backend";
import type { Proposal, Participant, ProposalFormData } from "./types";
import CreateProposalForm from "./CreateProposalForm";
import { randomProposal } from "./randomProposal";
import ProposalsTable from "./ProposalsTable";
import { colors, fonts, borders } from "./theme";
import type { CSSProperties } from "react";

interface ProposalsProps {
  user: Models.User<Models.Preferences>;
  tripId: string;
  onRefresh?: () => void;
  listProposals?: (
    tripId: string,
    userId: string,
  ) => Promise<Models.DocumentList<Proposal>>;
  createProposal?: (
    tripId: string,
    userId: string,
    userName: string,
    data: ProposalFormData,
  ) => Promise<Proposal>;
  updateProposal?: (
    proposalId: string,
    userId: string,
    data: ProposalFormData,
  ) => Promise<Proposal>;
  deleteProposal?: (proposalId: string, userId: string) => Promise<unknown>;
  submitProposal?: (proposalId: string, userId: string) => Promise<Proposal>;
  rejectProposal?: (proposalId: string, userId: string) => Promise<Proposal>;
  getCoordinatorParticipant?: (
    tripId: string,
  ) => Promise<Models.DocumentList<Participant>>;
}
```

`proposals` state: `Proposal[]`. All `.catch` handlers: `(err as Error).message`.

- [ ] **Step 2: Run tests**

```bash
bun run test src/Proposals.test.tsx
```

Expected: All tests pass.

---

## Task 28: Convert src/PollResults.tsx + PollResults.test.tsx

**Files:**

- Modify: `src/PollResults.tsx`
- Modify: `src/PollResults.test.tsx`

- [ ] **Step 1: Type PollResults.tsx**

```ts
import type { Poll, Proposal, Vote } from "./types";
import { colors, fonts } from "./theme";
import type { CSSProperties } from "react";

interface PollResultsProps {
  poll: Poll;
  proposals: Proposal[];
  votes: Vote[];
}

export default function PollResults({
  poll,
  proposals,
  votes,
}: PollResultsProps) {
  const proposalMap = Object.fromEntries(proposals.map((p) => [p.$id, p]));

  const totals: Record<string, number> = {};
  poll.proposalIds.forEach((id) => {
    totals[id] = 0;
  });
  votes.forEach((vote) => {
    vote.proposalIds.forEach((proposalId, i) => {
      if (totals[proposalId] !== undefined) {
        totals[proposalId] += vote.tokenCounts[i] || 0;
      }
    });
  });

  // ... rest of JSX unchanged
}

const styles: Record<string, CSSProperties> = {
  /* unchanged */
};
```

- [ ] **Step 2: Run tests**

For the test file, test fixtures use partial objects — cast them: `const poll = { ... } as unknown as Poll`. Same for `Vote` fixtures.

```bash
bun run test src/PollResults.test.tsx
```

Expected: All tests pass.

---

## Task 29: Convert src/PollVoting.tsx + PollVoting.test.tsx

**Files:**

- Modify: `src/PollVoting.tsx`
- Modify: `src/PollVoting.test.tsx`

- [ ] **Step 1: Type PollVoting.tsx**

```ts
import { useState } from "react";
import { upsertVote as _upsertVote } from "./backend";
import type { Poll, Proposal, Vote } from "./types";
import { colors, fonts, borders } from "./theme";
import type { CSSProperties } from "react";

interface PollVotingProps {
  poll: Poll;
  proposals: Proposal[];
  myVote: Vote | null;
  userId: string;
  onVoteSaved: (vote: Vote) => void;
  upsertVote?: (
    pollId: string,
    tripId: string,
    userId: string,
    proposalIds: string[],
    tokenCounts: number[],
  ) => Promise<Vote>;
}

export default function PollVoting({
  poll,
  proposals,
  myVote,
  userId,
  onVoteSaved,
  upsertVote = _upsertVote,
}: PollVotingProps) {
  const proposalMap = Object.fromEntries(proposals.map((p) => [p.$id, p]));

  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    // ... init logic unchanged
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ... rest unchanged, but cast err: (err as Error).message
}

const styles: Record<string, CSSProperties> = {
  /* unchanged */
};
```

In the test file, cast partial fixtures: `const poll = { ... } as unknown as Poll`.

- [ ] **Step 2: Run tests**

```bash
bun run test src/PollVoting.test.tsx
```

Expected: All tests pass.

---

## Task 30: Convert src/Poll.tsx + Poll.test.tsx

**Files:**

- Modify: `src/Poll.tsx`
- Modify: `src/Poll.test.tsx`

- [ ] **Step 1: Type Poll.tsx**

Poll has an internal `PastPoll` component. Type it explicitly:

```ts
import { useEffect, useState, useCallback, useRef } from "react";
import type { Models } from "appwrite";
import {
  listPolls as _listPolls,
  listProposals as _listProposals,
  listVotes as _listVotes,
  createPoll as _createPoll,
  closePoll as _closePoll,
  upsertVote as _upsertVote,
  getCoordinatorParticipant as _getCoordinatorParticipant,
} from "./backend";
import type { Poll, Proposal, Vote, Participant } from "./types";
import PollVoting from "./PollVoting";
import PollResults from "./PollResults";
import { colors, fonts, borders } from "./theme";
import type { CSSProperties } from "react";

interface PollProps {
  user: Models.User<Models.Preferences>;
  tripId: string;
  listPolls?: (
    tripId: string,
    userId: string,
  ) => Promise<Models.DocumentList<Poll>>;
  listProposals?: (
    tripId: string,
    userId: string,
  ) => Promise<Models.DocumentList<Proposal>>;
  listVotes?: (
    pollId: string,
    tripId: string,
    userId: string,
  ) => Promise<Models.DocumentList<Vote>>;
  createPoll?: (
    tripId: string,
    userId: string,
    userName: string,
  ) => Promise<Poll>;
  closePoll?: (pollId: string, userId: string) => Promise<Poll>;
  upsertVote?: (
    pollId: string,
    tripId: string,
    userId: string,
    proposalIds: string[],
    tokenCounts: number[],
  ) => Promise<Vote>;
  getCoordinatorParticipant?: (
    tripId: string,
  ) => Promise<Models.DocumentList<Participant>>;
}

interface PastPollProps {
  poll: Poll;
  proposals: Proposal[];
  tripId: string;
  userId: string;
  listVotes: (
    pollId: string,
    tripId: string,
    userId: string,
  ) => Promise<Models.DocumentList<Vote>>;
}
```

Internal state types: `activePoll: Poll | null`, `pastPolls: Poll[]`, `proposals: Proposal[]`, `votes: Vote[]`. All error handlers: `(err as Error).message`.

- [ ] **Step 2: In Poll.test.tsx, cast partial fixtures**

Test fixtures like `openPoll` and `sampleProposals` use partial objects. Add casts where they're passed as typed props:

```ts
const openPoll = {
  $id: "poll-1",
  tripId: "trip-1",
  state: "OPEN",
  proposalIds: ["p-1"],
} as unknown as Poll;
```

- [ ] **Step 3: Run tests**

```bash
bun run test src/Poll.test.tsx
```

Expected: All tests pass.

---

## Task 31: Convert src/App.tsx + App.test.tsx + src/main.tsx

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Type App.tsx**

```ts
import { useEffect, useState, useCallback } from "react";
import type { Models } from "appwrite";
import {
  account as _account,
  listTrips as _listTrips,
  listParticipatedTrips as _listParticipatedTrips,
  listTripParticipants as _listTripParticipants,
  updateTrip as _updateTrip,
  deleteTrip as _deleteTrip,
  leaveTrip as _leaveTrip,
  getCoordinatorParticipant as _getCoordinatorParticipant,
} from "./backend";
import type { Trip, Participant, TripFormData } from "./types";
import AuthForm from "./AuthForm";
import Header from "./Header";
import Trips from "./Trips";
import Proposals from "./Proposals";
import Poll from "./Poll";
import TripOverview from "./TripOverview";
import ErrorBoundary from "./ErrorBoundary";
import { colors, fonts } from "./theme";

interface AppProps {
  accountGet?: () => Promise<Models.User<Models.Preferences>>;
  deleteSession?: () => Promise<void>;
  listTrips?: (
    userId: string,
  ) => Promise<{
    documents: Trip[];
    coordinatorUserIds: Record<string, string>;
  }>;
  listParticipatedTrips?: (userId: string) => Promise<{ documents: Trip[] }>;
  listTripParticipants?: (
    tripId: string,
  ) => Promise<Models.DocumentList<Participant>>;
  updateTrip?: (
    tripId: string,
    data: Partial<TripFormData>,
    userId: string,
  ) => Promise<Trip>;
  deleteTrip?: (tripId: string, userId: string) => Promise<unknown>;
  leaveTrip?: (userId: string, tripId: string) => Promise<unknown>;
  getCoordinatorParticipant?: (
    tripId: string,
  ) => Promise<Models.DocumentList<Participant>>;
}
```

State types: `user: Models.User<Models.Preferences> | null`, `checking: boolean`, `page: 'login' | 'signup'`, `view: 'tripList' | 'tripDetail'`, `tripDetailTab: string`, `trips: Trip[]`, `selectedTripId: string | null`, `refreshProposalsKey: number`.

The `.catch` handlers that use `err` but don't access properties: type as `unknown` with no cast needed (just pass to `console.error`).

- [ ] **Step 2: Fix main.tsx CSS import**

Add a declaration file so TypeScript accepts the CSS import:

Create `src/css.d.ts`:

```ts
declare module "*.css";
```

Then update `src/main.tsx`:

```ts
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

Note: `getElementById('root')` returns `HTMLElement | null` — the `!` non-null assertion is correct here since the element is guaranteed by `index.html`.

- [ ] **Step 3: Run App tests**

```bash
bun run test src/App.test.tsx
```

Expected: All tests pass.

---

## Task 32: Full type check + test suite

**Files:** None (verification only)

- [ ] **Step 1: Run full type check**

```bash
bun run tsc --noEmit 2>&1
```

Expected: No errors. If errors appear, fix them before proceeding.

- [ ] **Step 2: Run full test suite**

```bash
bun run test
```

Expected: All tests pass.

- [ ] **Step 3: Run linter**

```bash
bun run lint
```

Expected: No errors (or only auto-fixable style issues).

- [ ] **Step 4: Commit Phase 3**

```bash
git add src/
git commit -m "feat: convert all components and tests to TypeScript"
```

---

## Task 33: Update AGENTS.md

**Files:**

- Modify: `AGENTS.md`

- [ ] **Step 1: Update the language and linting guidance**

Find and replace the "Code Style" section. Change:

- `No TypeScript, no CSS modules` → `TypeScript only (strict mode). No CSS modules.`
- Remove the `standard` lint command references, replace with Biome
- Update the lint command table entry: `lint` → `bun run lint` (Biome check + write)
- Add: `typecheck` → `bun run tsc --noEmit`

Update the note about no TypeScript — it should now say TypeScript is required.

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md for TypeScript and Biome migration"
```

---

## Self-Review

**Spec coverage:**

- ✅ Phase 1: Tooling (Tasks 1-5)
- ✅ Phase 2: Domain types + backend + utilities (Tasks 6-11)
- ✅ Phase 3: All 23 component/test files (Tasks 12-31)
- ✅ AGENTS.md update (Task 33)
- ✅ `server.js` explicitly excluded
- ✅ Full type check + test verification (Task 32)

**Placeholder scan:** No TBDs. All prop interface types are fully specified from reading the actual source. Test fixture casts explicitly called out.

**Type consistency:** `ProposalFormData` and `TripFormData` are defined once in `types.ts` and used consistently in `backend.ts` signatures and all form components. `Models.DocumentList<T>` used for all list returns. `Partial<TripFormData>` used for `updateTrip` (coordinator can update partial data).
