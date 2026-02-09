# STORAGE_PLAN (ESSENCE)

Last updated: 2026-02-09  
Purpose: Define how ESSENCE stores files (audio + images), naming conventions, retention/cleanup rules, and signed URL strategy for private playback.

Target platform: Supabase Storage (private buckets by default).

---

## Principles

1) **Postgres stores metadata, Storage stores files**
- DB holds paths, MIME types, sizes, durations, status.
- Storage holds the actual audio/image bytes.

2) **Default private**
- Audio and avatars are private objects.
- Playback and downloads require signed URLs.

3) **Predictable naming**
- Deterministic paths prevent duplicates and simplify cleanup.

4) **Cleanup is part of feature behavior**
- If a profile is deleted, its files must be deleted.
- If recordings drop below training threshold, voice may be deleted (vendor), but clip files stay unless user deletes them.

---

## Buckets (Target)

### 1) `avatars` (optional)
Purpose:
- Profile photo/avatar images.

Visibility:
- Private (recommended)

Paths:
- `avatars/{user_id}/{profile_id}/avatar.jpg` (or `.png`)

DB pointer:
- `profiles.avatar_storage_path`

---

### 2) `training_clips`
Purpose:
- The 25 voice training recordings per profile.

Visibility:
- Private (required)

Paths (recommended deterministic format):
- `training_clips/{user_id}/{profile_id}/{prompt_index}.{ext}`

Examples:
- `training_clips/uuid-user/uuid-profile/00.webm`
- `training_clips/uuid-user/uuid-profile/24.webm`

DB pointer:
- `training_clips.audio_storage_path`

---

### 3) `message_audio`
Purpose:
- Generated message audio files (TTS outputs).

Visibility:
- Private (required)

Paths:
- `message_audio/{user_id}/{profile_id}/{message_id}.{ext}`

Examples:
- `message_audio/uuid-user/uuid-profile/uuid-message.mp3`

DB pointer:
- `messages.audio_storage_path`

---

## File formats and MIME types

### Training clips (capture)
Preferred (web-friendly):
- `audio/webm` (Opus) from MediaRecorder when available
- Fallback: `audio/mp4` or `audio/mpeg` depending on browser support

Store:
- raw user-captured file as-is when possible
- optionally normalize on server later if vendor requires

Metadata captured per file:
- `mime_type`
- `size_bytes`
- `duration_ms` (optional but useful)

### Generated messages (output)
Preferred:
- `audio/mpeg` (`.mp3`) from ElevenLabs

Store:
- vendor output bytes directly as file
- do not store Base64 in DB

---

## Signed URL strategy (private access)

### Playback model
- Client never reads private objects directly by permanent URL.
- Server generates a signed URL and returns it to the client.

Signed URL TTL (recommended defaults):
- Playback: 10 minutes
- Download/export (if implemented later): 30–60 minutes

When to sign:
- On-demand for playback (each time user opens playback modal)
- Optionally pre-sign a small batch for list views if performance demands (later)

Where signing happens:
- Next.js server route handler (server-only)
- Uses Supabase service role key (never exposed to client)

---

## Upload strategy options

### Option A (simple): upload via server (good for early testing)
Flow:
1) Client uploads file to your server endpoint
2) Server streams file into Supabase Storage
3) Server writes DB row with storage path

Pros:
- easiest to implement
- server can validate size/type and enforce auth

Cons:
- server bandwidth cost
- slower uploads

### Option B (scalable): direct-to-storage signed upload (recommended later)
Flow:
1) Client requests signed upload URL from server
2) Client uploads directly to Storage
3) Client notifies server to create DB row (or server pre-creates row)

Pros:
- faster, scalable
- less server bandwidth

Cons:
- slightly more complex

Recommendation:
- Start with Option A for robust internal testing.
- Move to Option B before broader public beta.

---

## Retention and cleanup rules

### Profile deletion
When user deletes a profile:
1) Delete ElevenLabs voice (if exists)
2) Delete all training clip files under:
   - `training_clips/{user_id}/{profile_id}/`
3) Delete all message audio files under:
   - `message_audio/{user_id}/{profile_id}/`
4) Delete avatar under:
   - `avatars/{user_id}/{profile_id}/` (if used)
5) Delete DB rows:
   - `training_clips`, `messages`, then `profiles`

Notes:
- If a file deletion fails, continue DB deletion but log the error for later cleanup.

### Deleting a single recording
When a user deletes one training clip:
- Delete that single file path
- Delete DB row
- Recompute recording count and update:
  - `profiles.voice_model_status`
- If recordings drop below threshold and a voice exists:
  - delete ElevenLabs voice
  - set `profiles.elevenlabs_voice_id = null`
  - set status back to `training` (or `not_submitted` if 0)

### Deleting a message
When deleting a message:
- Delete `message_audio` file
- Delete DB row

### Orphan cleanup (recommended future)
Orphans happen when:
- DB write succeeds but upload fails
- Upload succeeds but DB write fails

Later add:
- a scheduled cleanup job (weekly) to detect orphaned paths

---

## File naming conventions

### IDs and ordering
- `user_id` and `profile_id` always included for ownership and cleanup by prefix
- `prompt_index` is zero-padded (`00`–`24`) for sorting

### Extensions
- Training clips:
  - prefer `.webm` if recorded as webm/opus
  - otherwise `.m4a` or `.mp3` based on capture format
- Messages:
  - `.mp3` (audio/mpeg)

---

## Security and access policies

Bucket policies:
- Keep buckets private
- Only allow read/write via signed URLs and server logic
- RLS applies to DB; Storage policies control file access

Client rules:
- Client should never receive service role key
- Client should not store signed URLs long-term

---

## What to store in DB for each file

### training_clips
- `audio_storage_path`
- `mime_type`
- `size_bytes`
- `duration_ms` (optional)

### messages
- `audio_storage_path`
- `mime_type`
- `size_bytes`
- `duration_ms`
- `status` (`generating`, `ready`, `failed`)

### profiles (avatar)
- `avatar_storage_path`

---

## Open decisions (track in `spec/DECISIONS.md`)
- Whether to normalize all training clips to a single format before sending to ElevenLabs
- Whether to pre-sign URLs for list rendering or only on playback open
- Whether to implement export/download (longer TTL signed URLs)
