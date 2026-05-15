# Spike Study

Spike Study is a SvelteKit app for studying historical stock price action.

All routes are auth-projected.

It includes an scanner, interactive 1-minute charts, replay mode, technical indicators, and
persisted chart drawings.

## Features

- Interactive 1-minute charts powered by [Lightweight Charts](https://www.tradingview.com/lightweight-charts/)
- 1-minute replay mode with simulated trading
- SMA, EMA, and VWAP overlays
- Drawing tools with persisted user state
- Auth-protected chart and scanner workflows

## Stack

- SvelteKit + Svelte 5
- TypeScript
- Tailwind CSS + shadcn-svelte
- Clerk for auth
- Convex for user drawing data
- Drizzle + SQLite/libSQL for market data
- Massive for market data ingestion

## Local Setup

The app depends on several third-party services and a pre-populated market data
database. To run locally, you will need these two files:

- `.env`
- `local.db`

After cloning the repository, place both files in the project root:

```text
spike-study/
  .env
  local.db
  package.json
```

Then install dependencies:

```bash
npm install
```

## Run Locally

Start the SvelteKit app:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

The app is auth-protected, so sign in with a Google account.

## Structure

```text
src/
  routes/        App routes and route-local chart code
  lib/           Shared UI and runtime-specific modules
  jobs/          Data-fetching and backfill jobs
convex/          User data and persistence functions
drizzle/         Database migrations
```
