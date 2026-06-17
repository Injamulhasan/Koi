# KOI — Friends Hangout Management Platform

A private social platform for a close group of friends to organize hangouts, vote on locations, chat, track expenses, and manage lending.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/koi run dev` — run the frontend (port 22585)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — auto-provisioned by Clerk setup

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, framer-motion, wouter
- Auth: Clerk (Replit-managed)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- DB schema: `lib/db/src/schema/` — one file per entity
- API contract: `lib/api-spec/openapi.yaml`
- Generated hooks: `lib/api-client-react/src/generated/`
- Generated Zod schemas: `lib/api-zod/src/generated/`
- Frontend pages: `artifacts/koi/src/pages/`
- API routes: `artifacts/api-server/src/routes/`
- Clerk proxy middleware: `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts`
- Auth middleware: `artifacts/api-server/src/middlewares/requireAuth.ts`

## Architecture decisions

- Contract-first: OpenAPI spec gates all codegen. Re-run `codegen` after any spec change.
- Clerk auth is cookie-based for web. No bearer tokens in browser API calls — Clerk session cookie handles auth automatically.
- `/users/sync` endpoint bootstraps a DB user record on first login (call it after sign-in on the client).
- Notifications are fan-fanned out to all other users on every action (vote, message, contribution, lending).
- Dashboard summary is a single aggregated endpoint hitting all tables in parallel for low-latency rendering.
- One vote per user enforced at DB level via unique constraint on `(user_id)` in votes table.

## Product

- **Dashboard** — leading vote location, hangout countdown, recent chat preview, budget total, active loans count
- **Voting** — 6 fixed locations (Rafir Chaad, Ratul er Basha, Saif er Chaad, Mushfiq er Chaad, Rejar Chaad, 300 Feet), one vote per user, change anytime
- **Group Chat** — messages with emoji reactions (❤️ 😂 👍 🔥 😮), image support, auto-polling
- **Schedule** — set hangout date/time with live countdown
- **Contributions** — each member declares planned spend, total budget shown
- **Lending** — track who lent money to whom, mark repaid (lender only)
- **Notifications** — activity feed for all group actions
- **Profile** — update name and avatar

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always call `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`
- `requireDbUser` middleware requires a synced DB user. The frontend should call `POST /api/users/sync` after first Clerk sign-in.
- Clerk development keys show a warning in console — this is expected and intentional.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for auth setup and customization details
