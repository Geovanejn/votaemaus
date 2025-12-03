# Emaus Vota - Election Management System

## Overview
Emaus Vota is a full-stack web application designed to manage elections for the UMP Emaus church youth group. It provides email-based authentication, role-based access, secure voting, and real-time results, emphasizing transparency and fairness. The system streamlines the electoral process, offers features like shareable results images and PDF audit reports, and aims to foster trust among participants. Future plans involve expanding it into a comprehensive UMP Emaus portal with integrated modules for devotionals, prayer requests, events, and an updated member area, maintaining the voting system as a core component.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is built with React 18 and TypeScript, utilizing Vite for fast development, Wouter for routing, and TanStack Query for efficient server state management. UI components are derived from shadcn/ui on Radix UI primitives, styled with Tailwind CSS, and follow a mobile-first Material Design approach with custom UMP Emaús branding (primary orange color #FFA500). State management relies on the React Context API for authentication and local storage for tokens. Forms are managed using React Hook Form with Zod for validation. Recent enhancements include Duolingo-style visual improvements across various components like LessonNode, LessonMap, BottomNav, LevelBadge, Celebration, RewardModal, Ranking Page, and Study Home Page.

### Backend
The backend is developed using Express.js on Node.js with TypeScript, providing RESTful API endpoints. Authentication is email-based, utilizing 6-digit verification codes and JWTs. User roles (admin/member) are managed via `isAdmin` and `isMember` flags. The API is organized by domains (e.g., `/api/auth`, `/api/admin`). The database uses Better-SQLite3 for development and Drizzle ORM configured for PostgreSQL, with a schema enforcing election rules such as one active election and one vote per user per position, and implementing a three-round scrutiny system.

### UI/UX Decisions
The system features a responsive UI optimized for clarity and ease of use, with a Portuguese interface and strong UMP Emaús branding. Key design elements include real-time results with automatic polling, smart sorting, and visual hierarchies. Administrative tools allow for the export of professional election result images and the generation of comprehensive PDF audit reports. Member photo uploads are facilitated with a circular crop tool.

### Feature Specifications
Core functionalities include:
- Email/password authentication with JWT and session management.
- Role-based access control for admins and members.
- Comprehensive election creation, management, and archiving.
- Secure candidate registration and voting with duplicate prevention.
- Real-time display of election results with vote counts and percentages.
- Admin panel for member management, attendance tracking, and active status.
- Automated majority-based position closing and a three-round scrutiny system with tie-resolution.
- Generation of shareable election results images and detailed PDF audit reports.
- Automated birthday email system.
- Full mobile optimization.
- Tracking of active/inactive members to manage election participation.

### System Design Choices
The architecture supports an expandable portal vision with planned modules for:
- **Secretariats System:** Management and assignment of members to different church secretariats.
- **Devotionals:** CRUD functionality for spiritual content, accessible by specific secretariats.
- **Prayer Requests:** Public submission and member-managed tracking of prayer requests.
- **Events & Schedule:** CRUD for events with calendar integration.
- **Current Board:** Public display of the church board with synced member data.
- **Instagram Integration:** Automatic syncing and display of Instagram posts.
- **Renewed Home Page:** A central landing page integrating various portal modules.
- **Expanded Permissions:** A tiered access system for Visitors, Members, Secretariat Members, and Admins.

## Duolingo-Style Study System

### Overview
A gamified study module replicating Duolingo's visual design while maintaining UMP Emaus branding. The system uses React with Framer Motion for animations and features vertical-only scrolling with a mobile-first approach. Complete design documentation available at `docs/STUDY_SYSTEM_DESIGN.md`.

### Content Management System
- Admin uploads PDF magazines (e.g., "Nao jogue sua vida fora" from "Nossa Fe" series)
- AI extracts magazine title, lesson titles, and content automatically using Google Gemini API
- PDF upload support with automatic text extraction (pdf-parse library)
- Lessons are released weekly (one per Sunday) via scheduled jobs
- Admin can manually adjust release dates and review extracted content

### AI Configuration
- Uses Google Gemini API (free tier) for content generation
- Requires GEMINI_API_KEY secret to be configured
- Features:
  - Generate study weeks from text or PDF files
  - Create multiple choice, true/false, and fill-in-the-blank exercises
  - Generate meditation content and reflection questions
  - Text summarization for lesson content

### Components (client/src/components/study/)
- **LearningPath**: Main container with two-column layout (icon rail + lesson cards) and vertical guide line
- **UnitCard**: Card component for learning path units with progress dots, icons, and completion states
- **PracticeCard**: Dumbbell-themed practice entry point card
- **UserProfileHeader**: Yellow header component with user avatar, greeting, streak badge, and XP display
- **LessonNode**: Circular 3D lesson buttons with green completion states, shadows, and animations
- **LessonMap**: Serpentine lesson path with SVG connectors and treasure chest rewards
- **SectionHeader**: Orange banner with "SECAO X, UNIDADE Y" format
- **StartButton**: Pill-shaped "COMECAR" button for available lessons
- **DailyMissions**: Progress bar-based daily objectives with time countdown
- **StreakCelebration**: Full-screen celebration for streak milestones
- **LessonComplete**: Completion screen with colorful stat boxes (XP, accuracy, time)
- **BottomNav**: 4-tab navigation (Inicio, Explorar, Ranking, Perfil)
- **HeartsDisplay/XPDisplay/StreakBadge/LevelBadge**: Gamification stat displays
- **FeedbackOverlay**: Correct/incorrect answer feedback with explanations
- **StudyHeader**: Progress bar header with hearts display for lesson pages

### Study Home Page Layout
- **Yellow Header**: #FFC800 gradient background with user profile, streak, and XP badges
- **Daily Goal Section**: "Meta Diaria" progress bar showing lesson completion progress
- **Learning Path Section**: "Seu Caminho" with two-column layout:
  - Left column: Icon rail (72px) with lesson icons OUTSIDE the cards
  - Right column: Lesson cards with title, subtitle, and progress dots
  - Vertical guide line: Centered with icons, z-index behind icons
  - Completed lessons: Green checkmark icon
  - Current lesson: Green border + "ATUAL" badge
  - Locked lessons: Gray lock icon with reduced opacity

### Color System
- Primary Orange: #FFA500 (section headers, branding)
- Header Yellow: #FFC800 (study home header gradient)
- Duolingo Green: #58CC02 (completed lessons, correct answers, XP badges)
- Duolingo Blue: #1CB0F6 (continue buttons, active states)
- Streak Orange: #FF9600 (streak badges and displays)
- Hearts Red: #FF4B4B (heart icons)

### Preview Page
Access `/study-preview` without authentication to test all study components.

### Backend API Routes (server/routes.ts)
The study system has the following API endpoints (all require authentication):

**Profile & Progress:**
- `GET /api/study/profile` - Get or create study profile (XP, level, streak, hearts)
- `GET /api/study/weeks` - Get all published study weeks
- `GET /api/study/weeks/:weekId` - Get week with lessons and progress
- `GET /api/study/lessons/:lessonId` - Get lesson with units (exercises)

**Lesson Flow:**
- `POST /api/study/lessons/:lessonId/start` - Start a lesson (checks hearts)
- `POST /api/study/units/:unitId/answer` - Submit answer (loses heart if wrong)
- `POST /api/study/lessons/:lessonId/complete` - Complete lesson (grants XP, updates streak)

**Hearts Recovery:**
- `GET /api/study/verses` - Get all Bible verses for heart recovery
- `POST /api/study/verses/:verseId/read` - Read verse to recover 1 heart

**Gamification:**
- `GET /api/study/achievements` - Get all achievements with unlock status
- `GET /api/study/leaderboard` - Get weekly/monthly/yearly leaderboard

**Admin:**
- `POST /api/study/seed` - Seed test data (verses, achievements, lessons, exercises)

### Database Schema (server/db.ts)
Study system tables:
- `study_profiles` - User XP, level, streak, hearts
- `study_weeks` - Weekly study content from magazines
- `study_lessons` - Individual lessons within weeks
- `study_units` - Exercises/questions within lessons (multiple_choice, true_false, fill_blank)
- `bible_verses` - Verses for heart recovery with reflections
- `user_lesson_progress` - User's progress on each lesson
- `user_unit_progress` - User's answers and attempts on each unit
- `xp_transactions` - XP history log
- `daily_activity` - Daily study tracking
- `achievements` - Available achievements
- `user_achievements` - Unlocked achievements per user
- `leaderboard_entries` - Weekly/monthly rankings
- `verse_readings` - Log of verses read for heart recovery

### Seed Data
The `/api/study/seed` endpoint creates:
- 15 Bible verses with reflections (Joao 3:16, Salmos 23:1, Filipenses 4:13, etc.)
- 15 achievements (first_lesson, streak_3, streak_7, perfect_lesson, level_5, etc.)
- 1 study week: "Nao Jogue Sua Vida Fora"
- 5 lessons: O Valor da Vida, Proposito Divino, Decisoes que Importam, Vivendo com Proposito, Desafio da Semana
- 23 exercises with real Bible content (multiple choice, true/false, fill blank)

### Storage Functions (server/storage.ts)
Key functions for the study system:
- `getOrCreateStudyProfile(userId)` - Get or create user's study profile
- `addXp(userId, amount, source)` - Add XP and calculate level
- `loseHeart(userId)` / `recoverHeart(userId)` - Heart management
- `readVerseAndRecoverHeart(userId, verseId)` - Read verse and recover heart
- `startLesson(userId, lessonId)` - Start a lesson
- `completeLesson(userId, lessonId, xp, mistakes, time)` - Complete lesson
- `submitUnitAnswer(userId, unitId, answer, isCorrect)` - Submit answer
- `updateStreak(userId)` - Update daily streak
- `getLessonsWithProgress(userId, weekId)` - Get lessons with unlock status

## External Dependencies

### Email Service
- **Resend**: Used for sending transactional emails and verification codes.

### UI Component Libraries
- **@radix-ui/**: Provides accessible, unstyled components for building UI.
- **lucide-react**: An icon library.
- **react-easy-crop**: For interactive image cropping functionality.

### Database
- **better-sqlite3**: Employed for local SQLite database development.
- **@neondatabase/serverless**: Used for PostgreSQL deployment.

### Development Tools
- **Drizzle Kit**: For database migration and schema management.
- **tsx**: Facilitates direct TypeScript execution.
- **node-cron**: For scheduling automated tasks.

### Validation
- **Zod**: Utilized for runtime schema validation.
- **drizzle-zod**: For generating Zod schemas directly from Drizzle tables.