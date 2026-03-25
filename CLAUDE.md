# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

A ski trip management web application to support trip proposals and voting so that a group can agree on a ski holiday.

## Project Type

React + Appwrite application. Bun is the package manager, the bundler, and dev server.

## Development Commands

```bash
# Install dependencies
bun install

# Start the development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Run tests (serial — max-concurrency 1)
bun test

# Run tests in watch mode
bun run test:watch

# Lint (StandardJS — auto-fixes)
bun run lint

# Format (Prettier)
bun run format
```

## Architecture

### Tech Stack

- **React** with hooks for UI and state management
- **Appwrite** as the backend (auth + database)
- **JavaScript** only — no TypeScript

### File Structure

```
src/
  main.jsx          — Entry point, mounts App into the DOM
  backend.js        — Appwrite client init + all database helper functions (CRUD operations)
  test-setup.js     — Test setup: registers happy-dom globals and RTL jest-dom matchers
  App.jsx           — Root component, auth flow, routing between Login/Signup/Trips
  Login.jsx         — Login form
  Signup.jsx        — Signup form
  Trips.jsx         — Trip list and management container
  CreateTripForm.jsx — Form for creating new trips
  EditTripForm.jsx  — Form for editing existing trips
  Field.jsx         — Reusable form field component
  TripTable.jsx     — Table display component
  TripRow.jsx       — Individual trip row component
  JoinTripForm.jsx  — Form for joining an existing trip via trip code
  theme.js          — Shared style constants (colours, spacing, etc.)
```

### State Management

- React hooks only (`useState`, `useEffect`) — no Context API or external libraries
- Data flows via callback props (`onCreated`, `onUpdated`, `onDeleted`) to update parent state
- Form components use an `EMPTY_FORM` constant for resetting form state

### Styling

- Inline JavaScript style objects throughout — no CSS classes or CSS modules
- Shared style constants live in `src/theme.js`
- Base styles only in `src/index.css`
- Primary brand colour: `#fd366e` (pink) for buttons and accents
- When modifying styles, update the inline style objects in the component file

### Appwrite Prerequisites

The app requires an Appwrite instance configured with:

- A Database with a Trips collection
- Document-level permissions set per user (read/write scoped to `userId`)
- These must be created manually in the Appwrite console — nothing is auto-created

### Environment Variables

```
PUBLIC_APPWRITE_ENDPOINT=                   # Appwrite API endpoint (exposed to frontend)
PUBLIC_APPWRITE_PROJECT_ID=                 # Appwrite project ID (exposed to frontend)
PUBLIC_APPWRITE_DATABASE_ID=                # Appwrite database ID
PUBLIC_APPWRITE_TRIPS_COLLECTION_ID=        # Trips collection ID
PUBLIC_APPWRITE_PARTICIPANTS_COLLECTION_ID= # Participants collection ID
APPWRITE_API_KEY=                           # Server-side API key (not prefixed, not exposed to frontend)
```

Restart the dev server after changing `.env` values.

## Testing

- Tests use Bun's test runner + React Testing Library (`@testing-library/react`)
- Run tests: `bun test` (always serial — `--max-concurrency 1`)
- Test files live alongside source files (`src/*.test.jsx`, `src/backend.test.js`)
- Each component test uses a `render*` helper with default no-op props; override only what the test cares about

## Notable Dependencies

- **`threewords`** — generates human-readable three-word trip codes (e.g. for the copy-to-clipboard feature in TripRow)
- **`standard`** — linter (StandardJS, not ESLint); enforces no-semicolon style. Run via `bun run lint`
- **`node-appwrite`** — server-side Appwrite SDK (devDependency); used for admin/server operations with `APPWRITE_API_KEY`

## Do NOT

- Use TypeScript
- Add CSS files or CSS modules
- Use external state management libraries (Redux, Zustand, etc.)
- Add server-side rendering or API routes

## Troubleshooting

- **Env vars not loading**: Restart dev server after `.env` changes; frontend vars must use `PUBLIC_` prefix (Bun's `--env 'PUBLIC_*'` flag exposes them to the bundle)
- **403 Permission errors**: Verify document-level permissions in Appwrite console match the current user's `userId`
- **Appwrite import errors**: All Appwrite client and DB helpers are exported from `backend.js`; check imports there
