# DATA_MODEL (ESSENCE)

Last updated: 2026-02-09  
Purpose: Define the core tables and fields for ESSENCE, aligned to `/prototypes` and `/spec`, and describe Row Level Security (RLS) intent for Supabase.

This is not final schema SQL. It is a human-readable model for planning, migrations, and developer handoff.

---

## Guiding principles

1) **Store files in Storage, not Postgres**
- Audio and images live in Supabase Storage.
- Postgres stores metadata + storage paths.

2) **Every row is owned**
- All user-private rows include `user_id`.
- RLS ensures users can only access their own data.

3) **Profiles represent a “voice identity”**
- A Profile = one person/voice you are preserving (self, parent, etc.).
- One profile can have training clips and many generated messages.

4) **Status fields are server-controlled**
- Training and voice model status should not be client-writable except through allowed transitions.

---

## Entity Relationship Overview

- `users` (managed by Supabase Auth)  
  1 → many `profiles`

- `profiles`  
  1 → many `training_clips`  
  1 → many `messages`

- `subscriptions`  
  1 per `user_id` (or many, if you keep history)

---

## 1) Users (Auth)

**Source:** Supabase Auth (built-in)  
Supabase provides an `auth.users` table. You typically also maintain a public `profiles_user` table for app-specific fields if needed.

### Optional: `users_public` (app-facing user profile)
Use only if you need app-specific fields beyond auth.

Fields:
- `id` (uuid, PK) same as auth user id
- `email` (text, optional cached)
- `name` (text, optional)
- `created_at` (timestamptz)

RLS intent:
- Users can read/update their own row only.

---

## 2) Profiles (Voice Identities)

Table: `profiles`

Purpose:
- Represents a single “voice identity” being preserved.
- Stores training progress status and the ElevenLabs voice id.

Recommended fields:
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth user)
- `name` (text, required)  
- `relation` (text, required)  
- `notes` (text, optional)

Voice + training status:
- `voice_model_status` (enum: `not_submitted`, `training`, `ready`) default `not_submitted`
- `elevenlabs_voice_id` (text, nullable)
- `training_completed_at` (timestamptz, nullable)
- `voice_ready_at` (timestamptz, nullable)

Counts (optional, derived):
- Do not store counts if you can compute them. If you need speed later, add:
  - `training_clip_count` (int, cached)
  - `message_count` (int, cached)

Avatar (optional):
- `avatar_storage_path` (text, nullable)
- `avatar_updated_at` (timestamptz, nullable)

System fields:
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `deleted_at` (timestamptz, nullable) if you want soft delete

Indexes:
- (`user_id`)
- (`user_id`, `created_at`)
- (`elevenlabs_voice_id`) optional

RLS intent:
- Select: user can read only where `user_id = auth.uid()`
- Insert: user can insert only with `user_id = auth.uid()`
- Update: user can update only safe fields on their own profiles  
  - Restrict updates to `elevenlabs_voice_id` and `voice_model_status` to server-only paths if needed
- Delete: user can delete only their own profiles  
  - Server cleanup should delete storage files + ElevenLabs voice

---

## 3) Training Clips (Voice Training Recordings)

Table: `training_clips` (replaces current `voice_recordings` base64 model)

Purpose:
- Stores the 25 recorded clips used to train voice.
- Each row references a stored audio file path and its metadata.

Recommended fields:
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `profile_id` (uuid, FK to `profiles.id`)

Prompt metadata:
- `prompt_index` (int, required) 0–24
- `prompt_text` (text, required)
- `stage` (int, optional) 1/2/3

Storage pointers:
- `audio_storage_path` (text, required)  
  Example: `training_clips/{user_id}/{profile_id}/{prompt_index}.webm`
- `mime_type` (text, required)
- `size_bytes` (int, optional)
- `duration_ms` (int, optional)

Quality metadata (optional):
- `quality_status` (enum: `good`, `redo_suggested`, `unknown`) default `unknown`
- `created_by` (enum: `user`, `system`) default `user`

System fields:
- `created_at` (timestamptz)

Constraints:
- Unique: (`profile_id`, `prompt_index`)
- Check: `prompt_index between 0 and 24`

Indexes:
- (`user_id`)
- (`profile_id`)
- (`profile_id`, `prompt_index`)

RLS intent:
- Select/Insert/Update/Delete allowed only where `user_id = auth.uid()`
- Optional: enforce that `profile_id` belongs to same `user_id` (via FK + RLS or a policy)

---

## 4) Messages (Generated Legacy Messages)

Table: `messages`

Purpose:
- Stores generated message text and references the generated audio file.

Recommended fields:
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `profile_id` (uuid, FK to profiles)

Message metadata:
- `title` (text, required)
- `category` (text, required)  
  Example: `birthday`, `encouragement`, `apology`, `gratitude`, `other`
- `recipient_label` (text, nullable)  
  Example: “My daughter”, “Future self”
- `moment_label` (text, nullable)  
  Example: “When you need courage”

Prompt + generation fields:
- `prompt_text` (text, required) (the instruction used)
- `generated_text` (text, required) (final message text)

Audio pointers:
- `audio_storage_path` (text, nullable initially, required once generated)
- `mime_type` (text, default `audio/mpeg`)
- `duration_ms` (int, optional)
- `size_bytes` (int, optional)

Lifecycle:
- `status` (enum: `draft`, `generating`, `ready`, `failed`) default `ready` or `draft`
- `error_message` (text, nullable)

Playback analytics (optional, later):
- `play_count` (int, default 0)
- `last_played_at` (timestamptz, nullable)

System fields:
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

Indexes:
- (`user_id`)
- (`profile_id`)
- (`profile_id`, `created_at`)
- (`user_id`, `last_played_at`) optional

RLS intent:
- User can read/write only their own messages
- Optional: allow update only to certain fields when `status` is `draft` (server controls transitions)

---

## 5) Subscriptions (Plan + Preservation State)

Table: `subscriptions`

Purpose:
- Track user plan state and support gating for “protected” features.

Recommended fields:
- `id` (uuid, PK)
- `user_id` (uuid, FK, unique if only one active record)
- `plan` (enum: `free`, `essential`, `family_archive`) default `free`
- `status` (enum: `active`, `trialing`, `canceled`, `past_due`) default `active` or `trialing`
- `current_period_end` (timestamptz, nullable)
- `cancel_at_period_end` (boolean, default false)

Stripe linkage:
- `stripe_customer_id` (text, nullable)
- `stripe_subscription_id` (text, nullable)
- `stripe_price_id` (text, nullable)

System fields:
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

Indexes:
- unique (`user_id`)
- (`stripe_customer_id`)
- (`stripe_subscription_id`)

RLS intent:
- User can read their own subscription row
- User cannot write subscription status fields directly
- Only server webhook route (service role) updates Stripe fields + status

---

## RLS Policy Intent Summary (Supabase)

### General pattern
- All private tables have `user_id`.
- Policies use `auth.uid()`.

Recommended:
- Enable RLS on: `profiles`, `training_clips`, `messages`, `subscriptions`, `users_public` (if used)

Example policy intent (not SQL):
- Profiles: `user_id = auth.uid()`
- Training clips: `user_id = auth.uid()`
- Messages: `user_id = auth.uid()`
- Subscriptions: select allowed for owner; updates restricted to service role

---

## Migration notes (from current DB model)

Current:
- `voice_recordings.audioData` base64 in Postgres
- `messages.audioData` base64 in Postgres

Target:
- Replace with:
  - `training_clips.audio_storage_path`
  - `messages.audio_storage_path`

Migration approach (conceptual):
1) Add storage buckets
2) For each base64 row: decode → upload file → store path + metadata
3) Remove base64 columns after verified

---

## Open decisions (track in `spec/DECISIONS.md`)
- Keep Drizzle migrations vs rely on Supabase SQL editor
- Use direct-to-storage uploads vs server-proxied uploads
- Whether to store transcripts now or later (likely later)
- Whether to keep cached counts on profiles (likely later)
