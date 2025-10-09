# ESSENCE - Voice Preservation Platform

## Overview

ESSENCE is an emotionally-driven web application designed to capture and preserve a person's voice, creating lasting audio memories. The platform enables users to record training phrases to build voice models and generate custom AI-powered spoken messages in their voice. It features an intimate interface focused on emotional design, making voice preservation meaningful and accessible.

## User Preferences

Preferred communication style: Simple, everyday language.

## Comprehensive Testing & Audit Results (October 2025)

### Testing Summary
- ✅ Signup Flow: User registration with email/password validation working correctly
- ✅ 3-Stage Training Flow: All API endpoints functional, recordings trigger voice model updates
- ✅ Recording Index Mapping: Prompt IDs (1-25) correctly convert to indices (0-24)
- ✅ Progress Tracking: User progress (completedPrompts, stage completion) saves correctly
- ✅ Voice Model Creation: Automatically triggered when 25 recordings are saved
- ✅ TypeScript Safety: Fixed null checks in VoiceTrainingFlow component

### Security Audit

**CRITICAL FINDING - Development Mode Bypass Vulnerability:**
- `requireAuth` middleware in `server/auth.ts` (lines 82-98) bypasses authentication when `NODE_ENV === 'development'`
- **Risk**: If NODE_ENV accidentally set to 'development' in production, all authentication is bypassed
- **Recommendations**: Remove DEV bypass or gate behind explicit flag, add startup check

**Security Strengths:**
- ✅ Bcrypt hashing (10 salt rounds), passwords never exposed
- ✅ Passport.js authentication, all routes protected with requireAuth
- ✅ getUserId() used 55 times, userId scoping in all storage methods (28 instances)
- ✅ Drizzle ORM with parameterized queries (no SQL injection)
- ✅ Environment variables for secrets (ELEVENLABS_API_KEY, SESSION_SECRET, DATABASE_URL)
- ✅ PostgreSQL session store, secure cookies in production

### Performance Audit

**N+1 Query Problem** (routes.ts lines 142-149):
- Profiles page: 1 + 2N queries (10 profiles = 21 queries)
- **Recommendation**: Use JOIN queries or batch queries
- **Status**: Not blocking for current scale, needs optimization for production

**Unbounded Queries** (no pagination):
- `getAllProfiles(userId)`, `getMessagesByProfile()` - no limits
- **Recommendation**: Add LIMIT/OFFSET or cursor-based pagination
- **Status**: Required for production scaling

**Indexing**: ✅ All foreign keys properly indexed

### Error Handling Audit
- ✅ 53 HTTP status codes, extensive try/catch blocks
- ✅ Toast notifications, onError handlers, loading states
- ⚠️ No React error boundary (unexpected errors cause blank screens)
- ⚠️ Limited page-level error handling (only 2 try/catch in pages)
- ⚠️ No retry logic for transient failures (except ElevenLabs)

### Code Quality Review
- Console statements: 68 total (29 error/warn OK, 16+ debug logs to remove)
- Type safety: 7 'any' types to fix (App.tsx, VoiceTrainingFlow.tsx, etc.)
- ✅ No TODO/FIXME comments, no dead code

### Production Readiness Checklist
- 🔴 CRITICAL: Remove DEV mode authentication bypass
- 🟡 HIGH: Add global error boundary, fix N+1 queries, add pagination
- 🟡 MEDIUM: Remove debug console.logs, fix 'any' types, add monitoring
- 🟢 LOW: Add automated tests, extend retry logic

## System Architecture

### Frontend Architecture
The application uses a React-based frontend with TypeScript and Vite. It employs a component-based design with React Query for server state management and Wouter for client-side routing. Styling is handled by Tailwind CSS with custom design tokens, leveraging shadcn/ui components.

### Backend Architecture
The backend is built on Node.js and Express.js, using TypeScript and ES modules. It features Drizzle ORM for type-safe PostgreSQL interactions and Passport.js with LocalStrategy for authentication. Express sessions with a PostgreSQL store manage persistent user sessions.

### Authentication & Security
Comprehensive authentication is provided by Passport.js using bcrypt for password hashing. All API endpoints are protected by `requireAuth` middleware, and data is scoped to the authenticated user via `userId` fields to prevent unauthorized access. Sessions are PostgreSQL-backed for persistence.

### Database Design
The application uses PostgreSQL with four core entities: Users, Profiles, Voice Recordings, and Messages. The schema includes foreign key relationships, `userId` fields on all user-generated content, enums for status tracking, and unique constraints. A PostgreSQL session store maintains authentication persistence.

### Component Architecture
The application is structured around five main interactive components: WelcomeOnboarding, VoiceRecorder (a 25-prompt, 3-stage voice training system), MessageCreator, PlaybackLibrary, and UserProfiles for multi-user profile management.

### 25-Prompt Voice Training System
The voice training system captures a comprehensive vocal signature through 25 absurd and engaging prompts across 3 acts (Welcome to the Weirdness, Tales from the Weird Side, Getting Real (But Make It Weird)). This system is optimized for ElevenLabs' 25-sample limit and aims for high voice quality through varied, personalized content that encourages natural vocal variety and emotion. Progress is tracked via `recordingIndex` (0-24), and personalized content uses user context (name, city, age).

### Design System
The UI adheres to the "Skylight Serenity" theme, characterized by a hopeful pastel color palette, a consistent 16px border radius, Playfair Display for headings, and Inter for body text. It leverages Radix UI primitives with custom styling for accessibility.

### Audio Processing Strategy
Audio is handled via the browser's MediaRecorder API for recording, with base64-encoded audio blobs stored in PostgreSQL. The Web Audio API is used for real-time level monitoring, and the HTML5 Audio API for message playback.

## External Dependencies

-   **AI Integration**: ElevenLabs (voice cloning, text-to-speech, with retry logic and rate limit handling)
-   **Database**: PostgreSQL (`@neondatabase/serverless` for connection, Drizzle ORM for interactions)
-   **Frontend Frameworks**: React, React DOM, React Query, Wouter
-   **UI Libraries**: Tailwind CSS, Radix UI, Lucide React
-   **Backend Frameworks**: Express.js, Passport.js, bcryptjs, connect-pg-simple
-   **Development Tools**: TypeScript, Vite, ESBuild, PostCSS, Date-fns