# ESSENCE Stack Inventory (Current → Migration Target)

Last updated: 2026-02-09  
Source of truth: `/spec` and `/prototypes` define UX. This doc defines the technical stack used to implement it.

---

## Frontend

### Framework
**Current (Replit prototype):**
- React 18.3 + TypeScript 5.6

**Target (Migration / production-ready):**
- Next.js (App Router) + React + TypeScript

### Router
**Current:**
- Wouter 3.3 (client-side routing in a single SPA)

**Target:**
- Next.js App Router (file-based routing under `/app`)

### UI kit
**Current:**
- shadcn/ui (Radix UI primitives)  
- Icons: lucide-react + react-icons  
- Animations: framer-motion + tailwindcss-animate

**Target:**
- Keep shadcn/ui + Radix  
- Keep Tailwind CSS  
- Keep framer-motion for cinematic transitions  
- Replace styling tokens to match canonical prototypes (Mineral & Warmth)

### State mgmt
**Current:**
- TanStack Query v5 (server state / caching)
- React Hook Form (forms)
- Zod (validation)

**Target:**
- Keep TanStack Query + RHF + Zod

---

## Backend

### Server runtime
**Current:**
- Node.js (Express server, always-on, listens on `PORT`)

**Target:**
- Next.js server runtime (Route Handlers in App Router)
- Deployed on Vercel (serverless functions by default)

### API framework
**Current:**
- Express 4.21
- Route definitions in `server/routes.ts`
- Auth middleware: `requireAuth`

**Target:**
- Next.js Route Handlers (`app/api/**/route.ts`)
- Shared server-only service layer for:
  - DB operations (profiles, recordings, messages)
  - ElevenLabs calls + retry/429 handling
  - Storage signed URLs (for private audio)

### Where it’s hosted
**Current:**
- Replit (serves API + static frontend from one project)

**Target:**
- Vercel (Next.js hosting for UI + API routes)
- Supabase (DB + Auth + Storage)

---

## Database

### Which DB
**Current:**
- PostgreSQL hosted on Neon
- Connected via `DATABASE_URL`

**Target:**
- PostgreSQL hosted on Supabase
- Use Supabase connection details (and/or a DB URL if using Drizzle migrations)

### ORM
**Current:**
- Drizzle ORM
- Validation schemas shared via `@shared/schema`

**Target:**
- Prefer: keep Drizzle for schema/migrations (optional)
- Alternative: use Supabase client directly for queries
- Decision needed: Drizzle vs Supabase client for long-term maintainability

---

## Storage

### Where audio files live
**Current:**
- Stored in Postgres as Base64 strings (TEXT columns)
  - Training recordings: `voice_recordings.audioData`
  - Generated messages: `messages.audioData`

**Target:**
- Supabase Storage buckets (object storage)
  - `avatars/` (optional)
  - `training_clips/`
  - `message_audio/`
- DB stores metadata + storage paths (not raw Base64)
- Playback via signed URLs (private by default)

---

## Vendors

### ElevenLabs
**Current:**
- Server-side integration only (API key never in client)
- Implementation: `server/elevenlabs.ts`
- Used for:
  - Voice creation from 25 training samples
  - Text-to-speech generation
  - Voice status checks
  - Voice deletion on cleanup
- Behavior to preserve:
  - Custom retry logic + 429 handling
  - Auto voice creation on 25 recordings
  - Cleanup rules when recordings drop below threshold

**Target:**
- Keep server-side only calls
- Move integration to server service called from Next.js route handlers
- Store `elevenlabs_voice_id` in `profiles` (same concept)

### Stripe
**Current:**
- Not implemented

**Target:**
- Stripe Checkout + Webhooks
- Webhook endpoint: `app/api/stripe/webhook/route.ts`
- Subscription status persisted in DB, used for feature gating

### Any other AI
**Current:**
- None (no OpenAI, no transcription vendor)

**Target:**
- None required for first robust test build
- Optional later: transcription provider (if transcript modal becomes real)

---

## Auth

### Provider
**Current:**
- Passport.js (passport-local) + bcryptjs
- Sessions via express-session stored in Postgres (connect-pg-simple)
- Endpoints:
  - `POST /api/signup`
  - `POST /api/login`
  - `POST /api/logout`
  - `GET /api/user`

**Target:**
- Supabase Auth (recommended)
- Authorization enforced via Supabase RLS (row-level security)
- Result: remove need for `SESSION_SECRET` and custom session store
- Auth becomes consistent across client, server routes, and DB policies

### How sessions work
**Current:**
- Cookie-based session created by Express; session persisted in Postgres

**Target:**
- Supabase issues JWT-based sessions (typically cookie-managed by Supabase helpers)
- Requests include authenticated user context; DB enforces ownership via RLS

---

## Ops

### Logging
**Current:**
- Console logging in routes and ElevenLabs service

**Target:**
- Keep basic console logs initially
- Add structured logging later if needed (only after you’re testing with real users)

### Analytics
**Current:**
- None identified

**Target:**
- Optional for test phase (PostHog or similar)
- Start only when you need funnel insights across onboarding/training completion

### Monitoring
**Current:**
- None identified

**Target:**
- Optional for test phase
- Add error monitoring when testing expands (Sentry or similar)

---

## Environment variables (Current)
Do not store values in git. Store only names in docs.

**Current env vars:**
- `ELEVENLABS_API_KEY`
- `DATABASE_URL`
- `SESSION_SECRET`
- `NODE_ENV`
- `PORT`

**Target env vars (expected):**
- `ELEVENLABS_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_*` (as needed)

---

## API footprint summary (Current)
High-level list (full mapping lives elsewhere if needed):
- Auth: `/api/signup`, `/api/login`, `/api/logout`, `/api/user`
- Profiles: `GET/POST /api/profiles`, `PUT/DELETE /api/profiles/:id`
- Training recordings: `GET/POST /api/profiles/:profileId/recordings`, `DELETE /api/profiles/:profileId/recordings/:phraseIndex`
- Voice creation retry: `POST /api/profiles/:profileId/retry-voice-creation`
- TTS preview: `POST /api/profiles/:profileId/tts`
- Messages: `GET/POST /api/profiles/:profileId/messages`, `DELETE /api/messages/:id`

---

## Repo docs to add (recommended)
Add these files to keep migrations clean and dev handoffs fast:

- `spec/SOURCE_OF_TRUTH.md`  
  Declares `/prototypes` + `/spec` as canonical UX and product truth.

- `spec/ENVIRONMENT.md`  
  Lists env var names (no values), where used, and where configured (Vercel/Supabase).

- `spec/API_MAP.md`  
  Express route → Next.js route handler mapping table (migration guide).

- `spec/DATA_MODEL.md`  
  Tables and fields (profiles, training_clips, messages, subscriptions), including RLS intent.

- `spec/STORAGE_PLAN.md`  
  Buckets, file naming conventions, retention/cleanup rules, signed URL strategy.

- `spec/DECISIONS.md`  
  Lightweight log of open/closed technical decisions (ex: Drizzle vs Supabase client).

- `spec/LAUNCH_CHECKLIST.md`  
  “Robust test build” checklist: auth, record/upload/playback, error states, logging, basic rate limiting.
