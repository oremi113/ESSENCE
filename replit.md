# ESSENCE - Voice Preservation Platform

## Overview

ESSENCE is a beautifully designed, emotionally-driven web application that captures and preserves a person's voice to create lasting audio memories for future generations. The platform allows users to record training phrases to build voice models and generate custom AI-powered spoken messages in their voice. The application features a warm, intimate interface with careful attention to emotional design principles, making the voice preservation process both meaningful and accessible.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Improvements (October 2025)

### Code Quality & Cleanup
- **Removed unused example components**: Cleaned up unused files from client/src/components/examples/ directory
- **Debug logging cleanup**: Removed all console.log/console.debug statements from client code while preserving error logging
- **Improved code organization**: Streamlined codebase for better maintainability

### Performance Optimizations
- **Database indexing**: Added indexes on all foreign key columns (profiles.userId, voice_recordings.userId, voice_recordings.profileId, messages.userId, messages.profileId) for significantly faster query performance
- **Optimized queries**: Common operations like fetching user profiles, recordings, and messages now execute much faster

### Error Handling & Reliability
- **ElevenLabs retry logic**: Implemented exponential backoff retry mechanism for API failures (max 3 retries, 1s → 2s → 4s delays)
- **Rate limit handling**: Added proper 429 error handling with Retry-After header support for graceful rate limit recovery
- **Improved error messages**: Enhanced error propagation throughout the ElevenLabs service for better debugging and user feedback
- **Robust API calls**: Both voice creation and speech generation now include retry logic to handle transient failures

### New Features
- **Audio export functionality**: Users can now export saved messages as audio files with sanitized filenames
- **Batch export support**: PlaybackLibrary component supports exporting individual messages or multiple messages

### Testing & Validation
- **Architect review**: All improvements validated by architect with no regressions detected
- **Security review**: No security issues found in code changes
- **Performance validation**: Database indexes successfully applied and tested

### Voice Training System Optimization (October 2025)
- **Condensed to 25 prompts**: Reduced from 51 to 25 prompts (11 stages) for faster completion (5-6 minutes)
- **ElevenLabs optimization**: Now uses all 25 recordings directly (matches ElevenLabs' 25-sample limit)
- **Removed auto-retry logic**: Simplified voice creation flow (no edge case handling needed)
- **Enhanced signup flow**: Added required age and city fields for better personalization
- **Improved personalization**: Voice training prompts now properly use user's age and city data

### 3-Stage Voice Training System (October 2025)
- **Staged training flow**: 25 prompts organized into 3 stages (5/12/8 prompts) with save & resume functionality
- **Real audio recording**: Implemented MediaRecorder API for actual microphone capture (replaced placeholder)
- **Backend state sync**: Stage selection updates backend currentStage before recording begins
- **Progress tracking**: User-level progress with completed prompts array and stage completion flags
- **Milestone celebrations**: Modal celebrations between stages to maintain user engagement
- **State management**: Proper cleanup between prompts, no setState during render, useEffect for edge cases
- **New API endpoints**: 
  - GET /api/voice/training/current - Returns current prompt with progress
  - POST /api/voice/training/save-progress - Saves recording and updates progress
  - POST /api/voice/training/set-stage - Updates user's current stage
  - GET /api/voice/training/stages - Returns all stage statuses
- **Components**: StageSelector, MilestoneCelebration, VoiceTrainingFlow orchestrator
- **Flow**: Stage selection → Recording with review → Save to DB → Progress update → Next prompt/celebration

### Recommendations for Production
1. **End-to-end testing**: Test complete flow (signup → recording → TTS → playback/export) with real user data
2. **API monitoring**: Track ElevenLabs API response times and retry rates to validate improvements
3. **Future enhancements**: Consider adding automated tests for export functionality and API failure scenarios

## System Architecture

### Frontend Architecture
The application uses a modern React-based frontend with TypeScript and Vite for development tooling. The architecture follows a component-based design with:

- **UI Framework**: React with TypeScript for type safety and developer experience
- **Styling**: Tailwind CSS with custom design tokens following the shadcn/ui component library
- **State Management**: React Query (TanStack Query) for server state management and local React state for UI interactions
- **Routing**: Wouter for lightweight client-side routing
- **Build System**: Vite for fast development and optimized production builds

### Backend Architecture
The server-side architecture uses a Node.js/Express foundation with:

- **Runtime**: Node.js with TypeScript and ES modules
- **Web Framework**: Express.js for REST API endpoints and middleware
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL session store for persistent authentication
- **Authentication**: Passport.js with LocalStrategy and bcrypt for secure password hashing
- **Audio Processing**: MediaRecorder API on frontend with base64 encoding for audio storage

### Authentication & Security
The application implements comprehensive user authentication and data security:

- **User Authentication**: Passport.js with LocalStrategy for email/password authentication
- **Password Security**: Bcrypt hashing with salt rounds for secure password storage
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple for persistence across server restarts
- **Protected Routes**: All API endpoints requiring authentication use requireAuth middleware
- **Data Scoping**: Every profile, recording, and message is scoped to the authenticated user's ID
- **Cross-User Protection**: Storage layer enforces userId filtering to prevent unauthorized data access
- **Password Safety**: Hashed passwords are never exposed in API responses or client-side code
- **Session Secret**: Required SESSION_SECRET environment variable (no hardcoded fallback)

Authentication flow:
1. Unauthenticated users see login/signup pages
2. After signup or login, users are automatically authenticated
3. Authenticated users proceed to onboarding/main application
4. All data operations are scoped to the authenticated user
5. Sessions persist until explicit logout or session expiration

### Database Design
The application uses PostgreSQL with four core entities:

- **Users**: User accounts with email, hashed password, name, age, and city
- **Profiles**: User voice profiles with metadata (name, relation, notes, voice model status) - scoped to userId
- **Voice Recordings**: Individual training phrase recordings linked to profiles - scoped to userId
- **Messages**: Generated AI voice messages with content and audio data - scoped to userId

The schema includes:
- Foreign key relationships with cascading deletes for data integrity
- userId fields on all user-generated content (profiles, recordings, messages)
- Enums for voice model status tracking and message categorization
- Unique constraints to prevent duplicate recordings per profile/recording index combination
- PostgreSQL session store for authentication persistence
- Recording index field (0-24) for the 25-prompt voice training system

### Component Architecture
The application is built around five main interactive components:

- **WelcomeOnboarding**: Entry point with feature introduction
- **VoiceRecorder**: 25-prompt voice training system with personalized prompts across 11 stages
- **MessageCreator**: Text-to-speech generation interface
- **PlaybackLibrary**: Audio message management and playback
- **UserProfiles**: Multi-user profile management system

### 25-Prompt Voice Training System
The voice training system captures a comprehensive vocal signature through 25 absurd and engaging prompts organized across 3 acts (optimized for ElevenLabs' 25-sample limit and voice quality):

**3 Training Acts (Recording time: 5-6 minutes):**
1. **Welcome to the Weirdness** - Absurd introductions establishing baseline personality (5 prompts)
   - Strange talk show hosting, superhero origins, conspiracies, useless talents
2. **Tales from the Weird Side** - Absurd adventures and storytelling to capture emotional range (10 prompts)
   - Gerald the Penguin saga, fake inventions, nature documentaries, terrible advice, passionate rants
3. **Getting Real (But Make It Weird)** - Heartfelt moments with humor for natural emotional expression (10 prompts)
   - Genuine advice, childhood memories, gratitude, love messages, hopes, goodbyes

**Voice Quality Optimizations:**
- Absurd, engaging content encourages natural vocal variety and emotion
- Balances humor with heartfelt moments to capture full emotional range
- Long-form storytelling (Gerald saga) captures sustained speech patterns
- Counting and contact info prompts ensure clear enunciation of numbers
- Relationship-based personalization for authentic emotional delivery

The system uses **personalized content** based on user context (name, city, generation, relationship, time of day). Recording indices map directly from 0-24, with progress tracking showing "X / 25" throughout the UI. The database stores recordings using `recordingIndex` (integer 0-24) for efficient lookup and management.

### Design System
The UI follows the **Skylight Serenity** theme, a carefully crafted design system with:

- **Design Theme**: Skylight Serenity - hopeful pastel color palette conveying warmth and comfort
- **Border Radius**: Consistent 16px border radius (rounded-2xl) across all components (Card, Button, Badge)
- **Typography**: Playfair Display for headings (serif) and Inter for body text (sans-serif)
- **Color Palette**: Warm pastel colors with light/dark mode support
- **Spacing**: Consistent Tailwind spacing units (2, 4, 6, 8, 12, 16)
- **Components**: Radix UI primitives with custom styling for accessibility

### Audio Processing Strategy
The application handles audio through:

- **Recording**: Browser MediaRecorder API with microphone access
- **Storage**: Base64-encoded audio blobs stored in PostgreSQL
- **Analysis**: Web Audio API for real-time audio level monitoring
- **Playback**: HTML5 Audio API for message playback

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React, React DOM, React Query for state management
- **TypeScript**: Full TypeScript support across frontend and backend
- **Vite**: Development server and build tooling with HMR support

### UI Component Libraries
- **Radix UI**: Accessible component primitives for dialogs, dropdowns, navigation
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe component variant management

### Backend Infrastructure
- **Express.js**: Web application framework with middleware support
- **Passport.js**: Authentication middleware with LocalStrategy for email/password login
- **bcryptjs**: Secure password hashing with salt rounds
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **@neondatabase/serverless**: PostgreSQL database connection for serverless environments
- **Connect PG Simple**: PostgreSQL session store for persistent user sessions
- **Express Session**: Session management with secure cookie configuration

### Development Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration
- **Date-fns**: Date utility library for timestamp formatting

### Database
- **PostgreSQL**: Primary database with support for JSON, enums, and full-text search
- **Connection**: Configured through DATABASE_URL environment variable
- **Migrations**: Managed through Drizzle Kit push commands

### Future AI Integration Points
The application is architected with placeholder integration points for:

- **Voice Cloning APIs**: ElevenLabs, Resemble.ai, or PlayHT for voice model training
- **Audio Processing**: External services for voice quality enhancement
- **Text-to-Speech**: AI-powered speech synthesis in trained voices

The codebase includes comprehensive comments indicating where these external AI services would be integrated, making it straightforward to add production voice cloning capabilities.