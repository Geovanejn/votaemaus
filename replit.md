# Emaus Vota - Election Management System (DeoGlory)

## Overview
Emaus Vota (também conhecido como DeoGlory) is a full-stack web application designed for managing elections within the UMP Emaus church youth group. It provides email-based authentication, role-based access control, secure voting mechanisms, and real-time result displays to ensure transparency and fairness. Key features include the generation of shareable results images and PDF audit reports. The project has evolved into a comprehensive UMP Emaus portal, integrating a gamified study system (Duolingo-style), achievements, daily missions, and more.

## Recent Changes (December 2024)

### WebSocket with Authentication (Socket.IO)
- **Server**: JWT authentication in connection handshake
- **Production**: Requires JWT_SECRET env var; rejects unauthenticated connections
- **Development**: Allows limited access for easier testing
- **Client**: Singleton pattern prevents multiple parallel connections
- **Events**: `join:election`, `leave:election`, `join:study`, `leave:study`
- **Authorization**: Admins/members can join elections; users can only join their own study room
- **Memory management**: Automatic cleanup of disconnected sockets

### Theme System
- **ThemeProvider**: Supports light/dark/system modes with localStorage persistence
- **ThemeToggle**: Animated icon toggle component
- **useTheme hook**: Access current theme and toggle function

### Animations & UX
- **AnimatedPage**: Framer Motion wrapper for page transitions
- **ConnectionStatus**: Real-time WebSocket connection indicator
- Loading states with smooth transitions

## User Preferences
- Preferred communication style: Simple, everyday language (Portuguese - Brazil)
- Language: Portuguese (pt-BR)
- Branding: UMP Emaús with primary orange #FFA500

## System Architecture

### UI/UX Decisions
The system features a responsive, Portuguese UI optimized for clarity and ease of use, incorporating UMP Emaús branding (primary orange #FFA500) and a mobile-first Material Design approach. It includes real-time results with automatic polling, smart sorting, and visual hierarchies. Administrative tools facilitate the export of election result images and the generation of PDF audit reports. The study system utilizes a Duolingo-inspired gamified design with Framer Motion animations and also adheres to UMP Emaus branding.

### Technical Implementations

**Frontend**: 
- React 18 + TypeScript + Vite
- Wouter for routing
- TanStack Query v5 for server state management
- shadcn/ui on Radix UI primitives
- Tailwind CSS for styling
- Framer Motion for animations
- Zustand for global state (installed)
- Authentication via React Context API with JWT tokens in localStorage
- React Hook Form + Zod for form validation

**Backend**: 
- Express.js + Node.js + TypeScript
- Better-SQLite3 for development
- Drizzle ORM configured for PostgreSQL (Neon)
- JWT-based authentication with email verification codes
- User roles: `isAdmin`, `isMember`
- node-cron for scheduled tasks (birthdays, lesson releases)

**Study System (Duolingo-style)**: 
- 3-stage lesson structure (Estude, Medite, Responda)
- "3 Verses = +1 Heart" recovery system
- AI integration via OpenAI/Google Gemini for PDF content extraction
- Admin controls for lesson locking, unlocking, and scheduling

**Daily Missions System**: 
- 4-5 missions per day, refreshing every 24 hours
- Types: complete_lesson, read_daily_verse, timed_challenge, quick_quiz, bible_character, etc.
- XP and badge rewards

### Feature Specifications

**Core Election Features (100% Complete)**:
- Email/password authentication with JWT
- 6-digit verification codes
- Role-based access (admin/member)
- Comprehensive election management
- 3-round scrutiny system (absolute/simple majority)
- Attendance control per position
- Real-time results display
- PDF audit reports generation
- Shareable results images export
- Automated birthday email system

**Study System Features (100% Complete)**:
- Gamified lesson map (Duolingo-style)
- XP, levels, and progression
- Hearts system (5 max, 6h recovery)
- Streak tracking (consecutive days)
- Ranking/Leaderboard (weekly/monthly/all-time)
- Multiple exercise types: text, verse, meditation, reflection, multiple_choice, true_false, fill_blank
- AI-powered content generation from PDFs

**Gamification System (100% Complete)**:
- 35+ achievements organized by categories
- Daily missions with varied challenges
- Sound feedback system (8 sound types)
- PWA support with offline caching
- Push notifications infrastructure
- In-app notification center

### System Design Choices
The architecture is designed for expandability, supporting future modules for:
- [ ] Secretariats management
- [ ] Devotionals (CRUD)
- [ ] Prayer Requests
- [ ] Events & Schedule
- [ ] Current Board display
- [ ] Instagram Integration
- [ ] Revamped Home Page
- [ ] Expanded tiered permissions

Christian meditation content is strictly defined to focus on reflection on God's Word and prayer, avoiding secular mindfulness practices.

## External Dependencies

### Email Service
- **Resend** - Transactional emails and verification codes

### UI Libraries
- **@radix-ui/** - Accessible, unstyled UI components
- **lucide-react** - Icon library
- **react-easy-crop** - Interactive image cropping
- **framer-motion** - Fluid animations

### Database
- **better-sqlite3** - Local SQLite for development
- **@neondatabase/serverless** - PostgreSQL for production
- **drizzle-orm** - Type-safe ORM
- **drizzle-kit** - Schema migrations

### AI Integration
- **OpenAI API** - Content generation and extraction
- **Google Gemini API** - Alternative AI provider

### Validation & Forms
- **Zod** - Runtime schema validation
- **drizzle-zod** - Generate Zod schemas from Drizzle tables
- **react-hook-form** - Form handling

### Utilities
- **node-cron** - Task scheduling
- **pdf-parse** - PDF text extraction
- **jspdf** + **jspdf-autotable** - PDF generation
- **html2canvas** - Image export
- **qrcode** - QR code generation

## Database Schema

### Election Tables (10 tables)
- `users` - System users with roles
- `positions` - Available positions/roles
- `elections` - Election instances
- `election_positions` - Positions per election
- `election_attendance` - Attendance per position
- `election_winners` - Election winners
- `candidates` - Registered candidates
- `votes` - Cast votes
- `verification_codes` - Email verification codes
- `pdf_verifications` - PDF audit verification

### Study System Tables (13 tables)
- `study_profiles` - Gamification profile (XP, level, hearts, streak)
- `study_weeks` - Weekly study content
- `study_lessons` - Individual lessons
- `study_units` - Units/exercises within lessons
- `bible_verses` - Verses for reading/recovery
- `user_lesson_progress` - User progress per lesson
- `user_unit_progress` - User progress per unit
- `verse_readings` - Verse reading records
- `xp_transactions` - XP transaction log
- `daily_activity` - Daily activity tracking
- `achievements` - Available achievements
- `user_achievements` - User unlocked achievements
- `leaderboard_entries` - Ranking entries

### Daily Missions Tables (3 tables)
- `daily_missions` - Mission templates
- `user_daily_missions` - User mission assignments
- `daily_mission_content` - AI-generated daily content

## API Endpoints Summary

### Authentication (6 endpoints)
- `POST /api/auth/login` - Initial login
- `POST /api/auth/request-code` - Request verification code
- `POST /api/auth/verify-code` - Verify code
- `POST /api/auth/set-password` - Set password
- `POST /api/auth/login-password` - Login with password

### Elections (25+ endpoints)
- CRUD for elections, candidates, votes
- Scrutiny management
- Attendance control
- Results and audit endpoints

### Study System (20+ endpoints)
- Profile, weeks, lessons, units management
- Progress tracking
- Verse reading
- Achievements and rankings

### Daily Missions (5 endpoints)
- `GET /api/missions/daily` - Get today's missions
- `GET /api/missions/:id/detail` - Mission details
- `POST /api/missions/:id/complete` - Complete mission
- `GET /api/missions/content` - Daily AI content

## Recent Changes (December 2024)

### Achievement System Implementation
- Added 35+ predefined achievements organized by categories: streak, lessons, xp, special
- Created dedicated achievements page (/study/achievements) with category filtering
- Integrated real achievement data into profile page with XP, streak, hearts display
- Added AchievementNotification component for unlock celebrations
- Implemented preview mode support with mock data for unauthenticated users

### Preview Mode Support
- Profile and Achievements pages detect preview routes (/study-preview/*)
- API calls are disabled in preview mode to prevent 401 errors
- Mock data provides realistic preview experience for demos
- Navigation between pages works correctly in both authenticated and preview modes

### PWA (Progressive Web App) Implementation
- Complete PWA support with manifest.json, service worker, and offline caching
- Three caching strategies: cache-first (images/static), network-first (API), stale-while-revalidate (documents)
- Automatic service worker registration with update detection
- Mobile-optimized with theme colors matching UMP Emaus branding (#FFA500)

### Sound Feedback System
- Optional sound effects for user interactions (success, error, achievements, etc.)
- Web Audio API implementation with 8 distinct sound types
- User preference toggle with localStorage persistence
- Integrated with achievement notification system

### Push Notifications System
- Complete push notification infrastructure with VAPID keys
- `usePushNotifications` hook for managing subscriptions
- Backend routes for subscribe/unsubscribe at `/api/notifications/*`
- Service worker push event handlers with routing
- NotificationSettings component in user profile

### In-App Notification Center
- NotificationCenter component in study page header
- Full CRUD operations for notifications
- Unread count badge with real-time updates
- Mark as read, mark all, delete functionality

### Performance Optimizations
- React.lazy for lazy loading all pages
- Suspense with animated fallback loader
- Skeleton loading components for various page types
- Page transition animations with Framer Motion

### UX Improvements
- LoadingButton with state management (loading/success/error)
- Enhanced loading states (Spinner, PulseLoader, FullPageLoader)
- StatusMessage component for feedback
- ProgressIndicator with animations

## Technical Improvements (December 2024)

### WebSocket Implementation
- Real-time updates for elections and study progress
- Socket.IO integration for bidirectional communication
- Automatic reconnection and fallback to polling

### Theme System
- Light/Dark mode with system preference detection
- Custom theme colors support
- Smooth transitions between themes
- LocalStorage persistence

### Enhanced Animations
- Page transitions with Framer Motion
- Interactive element animations
- Loading state animations
- Celebration effects

## Key Files Reference

### Backend
- `server/routes.ts` - All API routes (~3000 lines)
- `server/storage.ts` - Storage layer (~3000 lines)
- `shared/schema.ts` - Database schema (~800 lines)
- `server/ai.ts` - AI integration (OpenAI/Gemini)
- `server/email.ts` - Email service (Resend)
- `server/scheduler.ts` - Task scheduler (birthdays, etc.)
- `server/seed-study-data.ts` - Data seeding

### Frontend - Components
- `client/src/components/study/` - 24+ gamification components
- `client/src/components/ui/` - 50+ Shadcn UI components
- `client/src/components/NotificationCenter.tsx` - Notification center
- `client/src/components/PageTransition.tsx` - Page transitions
- `client/src/components/ThemeProvider.tsx` - Theme management

### Frontend - Pages
- `client/src/pages/study/` - Study system pages
- `client/src/pages/admin.tsx` - Election admin panel
- `client/src/pages/login.tsx` - Authentication
- `client/src/pages/vote.tsx` - Voting interface
- `client/src/pages/results.tsx` - Election results

### Frontend - Hooks
- `client/src/hooks/use-sounds.ts` - Sound feedback
- `client/src/hooks/use-push-notifications.ts` - Push notifications
- `client/src/hooks/use-theme.ts` - Theme management

### Configuration
- `client/public/manifest.json` - PWA manifest
- `client/public/sw.js` - Service worker
- `vite.config.ts` - Vite configuration
- `tailwind.config.ts` - Tailwind configuration

## Performance Metrics

### Expected Response Times
- `getElectionResults`: < 100ms
- `getPresentCount`: < 10ms
- `getVoterAttendance`: < 50ms
- Initial load: < 2s
- Page navigation: < 500ms

### Database Indexes
- `idx_election_attendance_lookup` - Attendance queries
- `idx_election_positions_status` - Position status
- `idx_votes_lookup` - Vote counting
- `idx_candidates_position` - Candidate lookups

---

*Last updated: December 04, 2025*
*Version: 2.1 - Technical Improvements Update*