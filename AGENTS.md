# AGENTS.md

## Purpose

This file records project decisions and engineering preferences that are important for future contributors and AI agents, but are not always obvious from reading the code alone.

Do not treat this file as a replacement for understanding the codebase. Prefer discovering behavior, APIs, and implementation details from the code itself. Use this file for architectural intent, coding standards, and non-obvious product constraints.

## Product Context

- This project is a web app for analyzing historical stock price action.
- The charting experience is a core product surface, built around `lightweight-charts`.
- The entire app is auth-protected. Signed-out users must not be able to use the scanner or charts.

## Priorities

When making design or implementation decisions, prioritize in this order:

1. Maintainability
2. Extensibility
3. Feature correctness
4. Human readability
5. UI consistency with the chosen design direction
6. Development speed

Avoid cleverness that makes the code look abstractly clean while making it harder to understand or change.

## What "Code Quality" Means Here

Code quality in this project does not mean maximum DRYness, abstraction, or framework cleverness.

It means:

- small, obvious modules
- explicit naming
- clear runtime boundaries
- predictable data flow
- local reasoning over hidden indirection
- straightforward extension points
- avoiding code organization that turns into a junk drawer over time

Prefer a little duplication over an abstraction that hides intent.

## Architecture Principles

### General

- Organize primarily by feature and responsibility, not by framework convention alone.
- Keep route-specific code close to the route.
- Move code into shared libraries only when it is genuinely shared.
- Keep business logic out of UI components when possible.
- Favor plain TypeScript modules for parsing, formatting, transforms, calculations, and query assembly.

### Runtime Boundaries

- Server-only code belongs in `$lib/server/**`.
- Client-only browser/chart code belongs in `$lib/client/**`.
- Do not mix DOM/chart lifecycle code with server concerns.
- Keep authentication, market data, and user-specific persisted state conceptually separate.

### Data Responsibilities

- Market data lives in Drizzle + SQLite/libsql.
- User-specific app data, such as persisted drawings, lives in Convex.
- Clerk provides identity and access control.
- Do not blur these boundaries without a strong reason.

### State Management

- Start with SvelteKit built-ins, route data, and local Svelte state.
- Use cross-route or shared client state only when local state and route data are no longer sufficient.

## Charting Philosophy

- `lightweight-charts` is an imperative library. Do not fight that reality.
- Keep chart integration isolated in a dedicated controller/module layer rather than spreading imperative chart lifecycle logic across route components.
- UI components should orchestrate chart behavior, not implement low-level chart lifecycle details directly.
- Indicator calculations and chart data transforms should live in plain TypeScript modules.
- User drawing behavior should remain isolated and explicit, not mixed into unrelated page code.

## UI and Styling Rules

- Prefer `shadcn-svelte` components as much as possible.
- Prefer Tailwind CSS as much as possible.
- If a UI change is needed, first see if it can be achieved by composing or customizing existing `shadcn-svelte` components.
- If necessary, modify the reusable component files rather than creating one-off bespoke variants in route code.
- Use custom CSS only as a last resort.
- If custom CSS is required, keep it tightly scoped and minimal.
- Avoid ad hoc handmade components when existing reusable components can express the same intent.

## Readability Rules

- Keep route files thin enough to skim comfortably.
- Avoid large monolithic `+page.svelte` files when the UI naturally divides into understandable parts.
- Prefer route-local helper files over giant global `utils` folders.
- Avoid generic helpers with vague names.
- Name modules after what they do, not after abstract patterns.
- A future reader should be able to understand where data comes from, where state lives, and where side effects happen without tracing through unnecessary layers.

## Dependency and Tooling Preferences

- Use `bun` for package management and local script execution.
- Keep application code portable and standards-based.
- Do not rely on Bun-specific runtime behavior unless explicitly intended and verified.
- The deployment target is Vercel, so server behavior should remain compatible with that environment.

## Anti-Goals

Avoid these unless there is a clear and documented reason:

- clever abstractions introduced mainly to reduce line count
- generic base components introduced too early
- giant shared dumping grounds like catch-all `helpers` or `utils`
- hidden state flow through global stores when local state is enough
- styling large surfaces with custom CSS when Tailwind and shared components would work
- continuing the previous pattern of shipping fast by accumulating messy structure

## Decision Heuristics

When multiple approaches are viable, prefer the one that:

1. is easier for a human to understand quickly
2. keeps responsibilities more local and explicit
3. preserves clean server/client boundaries
4. is easier to extend later without reworking unrelated code
5. uses existing shared UI primitives instead of inventing new ones

If an approach feels "smart" but would require explanation to be maintainable, it is probably the wrong default for this project.
