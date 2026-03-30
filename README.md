# Spike Study

A stock market analysis application for studying intraday price spikes. View interactive candlestick charts with minute-level data for any stock symbol and date.

## Key Features

- Interactive intraday candlestick charts (1-minute bars) powered by Lightweight Charts
- Daily stock data with calculated metrics: gap, range, and change
- Symbol search and date picker for navigating chart data
- User authentication via Clerk
- Real-time backend with Convex
- Background data jobs for fetching and backfilling market data

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19)
- **Routing**: [TanStack Router](https://tanstack.com/router) (file-based)
- **Backend**: [Convex](https://convex.dev) (serverless, real-time)
- **Database**: [Turso](https://turso.tech) (LibSQL) with [Drizzle ORM](https://orm.drizzle.team)
- **Auth**: [Clerk](https://clerk.com) (integrated with Convex)
- **Charts**: [Lightweight Charts](https://tradingview.github.io/lightweight-charts/)
- **UI**: [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com) v4
- **Market Data**: Massive API
- **Build Tool**: [Vite](https://vite.dev) 7
- **Language**: TypeScript 5.9

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org)
- [pnpm](https://pnpm.io)

### Installation

```bash
pnpm install
```

### Environment Setup

Copy the example env file and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable             | Description                 | Where to get it                                        |
| -------------------- | --------------------------- | ------------------------------------------------------ |
| `CONVEX_DEPLOYMENT`  | Convex deployment ID        | [convex.dev](https://convex.dev) - create a project    |
| `CLERK_SECRET_KEY`   | Clerk authentication secret | [clerk.com](https://clerk.com) - create an application |
| `MASSIVE_API_KEY`    | Market data API key         | [Massive API](https://massivealgo.com)                 |
| `TURSO_DATABASE_URL` | Turso database URL          | [turso.tech](https://turso.tech) - create a database   |
| `TURSO_AUTH_TOKEN`   | Turso auth token            | Generated via `turso db tokens create`                 |

You will also need to configure Clerk as an auth provider in Convex by following the [Convex + Clerk docs](https://docs.convex.dev/auth/clerk).

### Running the App

```bash
# Start both the web dev server and Convex backend
pnpm dev
```

This runs `convex dev --once` to sync your schema, then starts the Vite dev server and Convex watcher concurrently.

The app will be available at `http://localhost:3000`.

### Other Scripts

| Command           | Description                                 |
| ----------------- | ------------------------------------------- |
| `pnpm dev:web`    | Run only the Vite dev server                |
| `pnpm dev:convex` | Run only the Convex dev server              |
| `pnpm build`      | Build for production + type check           |
| `pnpm start`      | Run the production build                    |
| `pnpm db:push`    | Push Drizzle schema changes to Turso        |
| `pnpm db:studio`  | Open Drizzle Studio to inspect the database |
| `pnpm lint`       | Run ESLint and TypeScript type checking     |
| `pnpm format`     | Format code with Prettier                   |

## Project Structure

```
src/
  routes/           File-based routes (TanStack Router)
  components/ui/    shadcn UI components
  hooks/            React hooks (e.g., useChart)
  jobs/             Background data-fetching jobs
  market-data/      Database schema and client (Drizzle + Turso)
convex/
  schema.ts         Convex database schema
  fetchStockData.ts Convex functions for market data
  auth.config.ts    Clerk auth configuration
```
