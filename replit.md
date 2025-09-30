# ESSENCE - Voice Preservation Platform

## Overview

ESSENCE is a beautifully designed, emotionally-driven web application that captures and preserves a person's voice to create lasting audio memories for future generations. The platform allows users to record training phrases to build voice models and generate custom AI-powered spoken messages in their voice. The application features a warm, intimate interface with careful attention to emotional design principles, making the voice preservation process both meaningful and accessible.

## User Preferences

Preferred communication style: Simple, everyday language.

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

- **Users**: User accounts with email, hashed password, name, and age
- **Profiles**: User voice profiles with metadata (name, relation, notes, voice model status) - scoped to userId
- **Voice Recordings**: Individual training phrase recordings linked to profiles - scoped to userId
- **Messages**: Generated AI voice messages with content and audio data - scoped to userId

The schema includes:
- Foreign key relationships with cascading deletes for data integrity
- userId fields on all user-generated content (profiles, recordings, messages)
- Enums for voice model status tracking and message categorization
- Unique constraints to prevent duplicate recordings per profile/act combination
- PostgreSQL session store for authentication persistence

### Component Architecture
The application is built around five main interactive components:

- **WelcomeOnboarding**: Entry point with feature introduction
- **VoiceRecorder**: 3-act voice training system with meaningful passage recording
- **MessageCreator**: Text-to-speech generation interface
- **PlaybackLibrary**: Audio message management and playback
- **UserProfiles**: Multi-user profile management system

### 3-Act Voice Training System
The voice training system has been redesigned to capture three essential dimensions of a person's voice instead of 20 generic phrases:

- **Act 1 - Speaking Voice**: Natural conversational tone with everyday language and cadence
- **Act 2 - Storytelling**: Narrative voice with memory recall and descriptive language
- **Act 3 - Emotional Range**: Deep emotional expression including vulnerability, love, and hope

Each act consists of one meaningful multi-sentence passage (not short phrases) that captures specific vocal characteristics. The system uses direct 1:1 mapping where recording index 0 = Act 1, index 1 = Act 2, and index 2 = Act 3. Progress tracking shows "X / 3" throughout the UI, with passage navigation displaying "1 of 3", "2 of 3", "3 of 3".

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