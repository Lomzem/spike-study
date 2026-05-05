# Spike Study

Spike Study is a SvelteKit app for reviewing historical intraday stock action.

## Features

- Interactive minute charts powered by Lightweight Charts
- Intraday replay mode with simulated trading
- SMA, EMA, and VWAP overlays
- Drawing tools with persisted user state
- Auth-protected chart and scanner workflows

## Stack

- SvelteKit + Svelte 5
- TypeScript
- Tailwind CSS + shadcn-svelte
- Clerk for auth
- Convex for user drawing data
- Drizzle + libsql/Turso for market data
- Bun for package management and scripts

## Setup

```bash
bun install
cp .env.example .env.local
```

Fill in the required env vars for Clerk, Convex, market data, and libsql/Turso.

## Run

```bash
bun run dev
```

## Useful Commands

| Command         | Description                           |
| --------------- | ------------------------------------- |
| `bun run dev`   | Start the app and Convex dev workflow |
| `bun run build` | Build the app and run checks          |
| `bun run check` | Run `svelte-check`                    |
| `bun run test`  | Run Vitest                            |
| `bun run lint`  | Run ESLint and checks                 |

## Structure

```text
src/
  routes/        App routes and route-local chart code
  lib/           Shared UI and runtime-specific modules
  jobs/          Data-fetching and backfill jobs
convex/          User data and persistence functions
drizzle/         Database migrations
```
