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
The voice training system captures a comprehensive vocal signature through 25 personalized prompts organized across 11 distinct stages (optimized for ElevenLabs' 25-sample limit):

**11 Training Stages (Recording time: 5-6 minutes):**
1. **Meet Your Voice** - Introduction and baseline vocal patterns (3 prompts)
2. **Tongue Twister Warm-Up** - Articulation and speech clarity (2 prompts)
3. **Movie Trailer Voice** - Dramatic vocal range (1 prompt)
4. **The Absurd Storyteller** - Creative narrative voice (2 prompts)
5. **Character Voices** - Vocal versatility across different personas (3 prompts)
6. **Emotional Moments** - Emotional expression range (5 prompts)
7. **Wisdom & Advice** - Heartfelt guidance and encouragement (2 prompts)
8. **A Little Humor** - Dad jokes and personality (1 prompt)
9. **Memory & Heart** - Personal nostalgia and meaningful places (2 prompts)
10. **Numbers & Dates** - Clear enunciation for practical content (3 prompts)
11. **The Big Finish** - Final goodbye message (1 prompt)

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