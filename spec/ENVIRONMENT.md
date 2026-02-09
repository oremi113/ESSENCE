# ENVIRONMENT (ESSENCE)

Last updated: 2026-02-09  
Purpose: Single place to track environment variable **names** (never values), where they are used in code, and where they should be configured during migration.

Rules:
- Do **not** commit `.env` files with secrets.
- Only store variable **names** in this doc.
- Client-exposed keys must be explicitly marked and intentionally safe.

---

## Current (Replit / Express + Neon)

### Required
| Variable name | Used in | Purpose | Where configured |
|---|---|---|---|
| `ELEVENLABS_API_KEY` | `server/elevenlabs.ts` | Authenticate server-side requests to ElevenLabs | Replit Secrets |
| `DATABASE_URL` | `server/db.ts`, `drizzle.config.ts` | Connect to Neon Postgres | Replit Secrets |
| `SESSION_SECRET` | `server/auth.ts` | Sign session cookies for Passport/express-session | Replit Secrets |
| `NODE_ENV` | `server/index.ts`, `server/routes.ts`, `server/auth.ts` | Toggle dev vs production behavior (cookies/logging/dev fallbacks) | Replit runtime |
| `PORT` | `server/index.ts` | Port Express listens on (default 5000) | Replit runtime |

### Notes
- Current auth uses cookie-based sessions stored in Postgres (connect-pg-simple).
- ElevenLabs is server-only. API key must never be used from the browser.

---

## Target (Vercel / Next.js + Supabase + Stripe)

### Required (server-only)
| Variable name | Used in (target) | Purpose | Where configured |
|---|---|---|---|
| `ELEVENLABS_API_KEY` | `app/api/**` server route handlers + ElevenLabs service | Authenticate ElevenLabs calls | Vercel Project → Environment Variables |
| `SUPABASE_URL` | server + client initialization | Supabase project URL | Vercel Project → Environment Variables |
| `SUPABASE_ANON_KEY` | client-safe | Public key for client reads/writes guarded by RLS | Vercel Project → Environment Variables |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only | Elevated server access for admin tasks (never in client) | Vercel Project → Environment Variables |
| `STRIPE_SECRET_KEY` | server-only | Create checkout sessions, manage billing | Vercel Project → Environment Variables |
| `STRIPE_WEBHOOK_SECRET` | server-only | Verify Stripe webhook signatures | Vercel Project → Environment Variables |

### Optional / likely
| Variable name | Used in (target) | Purpose | Where configured |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | client + server | Canonical app URL for redirects/webhooks | Vercel Project → Environment Variables |
| `STRIPE_PRICE_ID_ESSENTIAL` | server-only | Price ID for Essential plan | Vercel Project → Environment Variables |
| `STRIPE_PRICE_ID_FAMILY` | server-only | Price ID for Family Archive plan | Vercel Project → Environment Variables |

### Client-exposed variables (must be explicitly safe)
Only variables prefixed with `NEXT_PUBLIC_` should ever be referenced in client code.

| Variable name | Safe to expose? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` (if used) | Yes | Client Supabase initialization |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (if used) | Yes | Client Supabase initialization |
| Anything else with `NEXT_PUBLIC_` | Depends | Must be reviewed before adding |

Recommendation:
- Prefer non-public `SUPABASE_URL` + `SUPABASE_ANON_KEY` for server usage and `NEXT_PUBLIC_SUPABASE_*` for client usage to make intent obvious.

---

## Mapping: current → target changes

### Variables likely removed after migration
| Variable name | Why removed |
|---|---|
| `PORT` | Vercel manages server runtime; no fixed port config required |
| `SESSION_SECRET` | If moving from Passport sessions to Supabase Auth |
| `DATABASE_URL` | If using Supabase connection settings and/or Supabase client (may still exist if keeping Drizzle migrations) |

### Variables staying
| Variable name | Why stays |
|---|---|
| `ELEVENLABS_API_KEY` | Vendor still used, still server-only |
| `NODE_ENV` | Still relevant but managed automatically by platform/runtime |

---

## Configuration locations (Target)

### Vercel
Set all environment variables in:
- Vercel Project → Settings → Environment Variables
- Configure values for:
  - Development
  - Preview
  - Production

### Supabase
Supabase has its own project settings for:
- Auth providers
- Storage bucket policies
- RLS policies

Important:
- Supabase keys (`URL`, `ANON`, `SERVICE_ROLE`) are created in Supabase Project Settings.
- Only ANON keys can be used in client code.

### Stripe
Stripe provides:
- Secret key
- Webhook signing secret
- Price IDs (per plan)

---

## Security checklist (quick)
- [ ] No secrets committed to git (scan repo for `ELEVENLABS_API_KEY`, `DATABASE_URL`, etc.)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never referenced in client code
- [ ] Stripe webhook handler verifies signatures using `STRIPE_WEBHOOK_SECRET`
- [ ] Any `NEXT_PUBLIC_*` variable is reviewed and intentionally safe

---

## Where to look in the repo
Common places env vars appear:
- `process.env.*` (server)
- Next.js runtime configs (server route handlers)
- `NEXT_PUBLIC_*` (client)

Search patterns:
- `process.env`
- `NEXT_PUBLIC_`
- `.env`
- `vercel.json` (if used)
