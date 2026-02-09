# API_MAP (ESSENCE)

Last updated: 2026-02-09  
Purpose: Migration guide mapping **current Express routes** to **Next.js App Router route handlers**, with behavior notes.  
Audience: You (product/PM) and any developer onboarding into the migration.

This document answers:
- What endpoints exist today?
- What do they do?
- Where do they live in the new Next.js app?
- What logic must be preserved?

---

## Conventions

**Current**
- Express routes live in `server/routes.ts`
- Auth enforced via `requireAuth`
- Sessions via Passport + express-session
- Audio stored as Base64 in Postgres

**Target**
- Next.js App Router
- Server logic in `app/api/**/route.ts`
- Auth via Supabase Auth + RLS
- Audio stored in Supabase Storage (paths stored in DB)

---

## Authentication

| Express route | Method | New Next.js route | Purpose | Auth required | Notes |
|---|---|---|---|---|---|
| `/api/signup` | POST | `app/api/auth/signup/route.ts` | Create user account | No | In target, likely replaced by Supabase Auth signup |
| `/api/login` | POST | `app/api/auth/login/route.ts` | Authenticate user | No | Likely removed if using Supabase Auth UI/helpers |
| `/api/logout` | POST | `app/api/auth/logout/route.ts` | End session | Yes | Supabase handles logout client-side |
| `/api/user` | GET | `app/api/auth/me/route.ts` | Get current user | No | Supabase provides session directly |

**Migration note:**  
If Supabase Auth is adopted, most custom auth routes disappear. Authorization moves to DB via RLS.

---

## Profiles

| Express route | Method | New Next.js route | Purpose | Auth | DB tables | Notes |
|---|---|---|---|---|---|---|
| `/api/profiles` | GET | `app/api/profiles/route.ts` (GET) | List profiles + counts | Yes | `profiles`, `voice_recordings`, `messages` | Counts may move to SQL views |
| `/api/profiles` | POST | `app/api/profiles/route.ts` (POST) | Create profile | Yes | `profiles` | Avatar upload may be added |
| `/api/profiles/:id` | PUT | `app/api/profiles/[id]/route.ts` (PUT/PATCH) | Update profile | Yes | `profiles` | Only safe fields allowed |
| `/api/profiles/:id` | DELETE | `app/api/profiles/[id]/route.ts` (DELETE) | Delete profile + cleanup voice | Yes | `profiles`, related tables | Must delete ElevenLabs voice + storage files |

---

## Voice Training Recordings

| Express route | Method | New Next.js route | Purpose | Auth | DB tables | Vendor calls |
|---|---|---|---|---|---|---|
| `/api/profiles/:profileId/recordings` | GET | `app/api/profiles/[profileId]/recordings/route.ts` (GET) | List recordings | Yes | `voice_recordings` | None |
| `/api/profiles/:profileId/recordings` | POST | `app/api/profiles/[profileId]/recordings/route.ts` (POST) | Save recording, update status | Yes | `voice_recordings`, `profiles` | ElevenLabs voice creation at 25 |
| `/api/profiles/:profileId/recordings/:phraseIndex` | DELETE | `app/api/profiles/[profileId]/recordings/[phraseIndex]/route.ts` | Delete recording + cleanup | Yes | `voice_recordings`, `profiles` | ElevenLabs voice deletion |

### Critical behavior to preserve
- Auto-create ElevenLabs voice when recordings hit 25
- Delete ElevenLabs voice if recordings drop below threshold
- `voiceModelStatus` transitions: `not_submitted → training → ready`

---

## Voice Creation Retry

| Express route | Method | New Next.js route | Purpose | Auth | DB tables | Vendor calls |
|---|---|---|---|---|---|---|
| `/api/profiles/:profileId/retry-voice-creation` | POST | `app/api/profiles/[profileId]/voice/retry/route.ts` | Manual voice creation retry | Yes | `voice_recordings`, `profiles` | ElevenLabs `/voices/add` |

**Why this exists:**  
Protects against partial failures or ElevenLabs outages during automatic creation.

---

## Text-to-Speech Preview (No Save)

| Express route | Method | New Next.js route | Pu
