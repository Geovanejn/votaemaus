# Site UMP Emaús

## Overview
This project is a comprehensive web system for the União de Mocidade Presbiteriana (UMP) of the Emaús Presbyterian Church. It includes a public-facing website, a members-only area, and an administrative panel. The system aims to enhance community engagement, streamline event management, and provide spiritual resources. Key capabilities include daily devotionals, event scheduling, member management, and integration with social media. The DeoGlory study system is a significant component, offering an interactive learning experience with gamification, achievements, and real-time progress tracking.

## User Preferences
- I prefer simple and direct language.
- I want iterative development with frequent, small updates rather than large, infrequent ones.
- Ask for my confirmation before implementing any major architectural changes or refactoring.
- I prefer detailed explanations for complex features or decisions.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.

## System Architecture

### UI/UX Decisions
The front-end is built with React, featuring a responsive design. The DeoGlory study system incorporates gamified elements like a ranking podium for the top 3 users, animated streak and crystal gain feedback, and golden styling for completed sections. Consistent card layouts and color schemes (e.g., `bg-orange-50` for quiz sections) are used throughout. Accessibility features include text-to-speech normalization for various content formats.

### Technical Implementations
- **Frontend**: React
- **Backend**: Express.js
- **Database**: PostgreSQL (managed with Drizzle ORM)
- **Authentication**: JWT for API security, session-based for general access.
- **Scheduled Tasks**: Background tasks for Instagram synchronization and other periodic operations.
- **Real-time Features**: Push notifications for member engagement, WebSocket-based online status.
- **Notification System**: 
    - Push notifications and in-app notifications for all active members.
    - Email notifications sent to ALL members (active and inactive) for: new devotionals, new events, new prayer requests, new seasons/magazines.
    - NotificationCenter component integrated in study page header for viewing notification history.
    - Notifications for: new lessons unlocked, encouragement messages, achievements, streak reminders, inactivity reminders, birthday announcements, devotional comments.
    - **Event Deadline Notifications**: Scheduler runs hourly, sends notifications at 24h/5h/1h before event ends. Uses cache system with lowerBound thresholds to prevent duplicate notifications.
    - **Devotional Comment Notifications**: When someone comments on a devotional, the author (createdBy) is notified.
    - **Architecture Pattern**: All notification functions use `sendPushToAllMembers()` for batch processing. Push notifications are sent first, then in-app notifications in a separate loop. Each iteration has its own error handling to prevent one failure from blocking others.
    - **Payload Standard**: All notifications include `icon: "/logo.png"` explicitly in the payload for consistent display across devices.
- **AI Integration**: Used for generating exercises and questions from topics or PDF content, with improved prompts for better quality. Includes quota tracking with 5-minute cooldown to preserve quota for high-priority operations (PDF study generation) when low-priority schedulers hit rate limits.
  - **Models**: Prioritizes gemini-3-flash-preview, gemini-2.5-flash and gemini-2.5-lite for all AI operations.
  - **Quota Management**: Schedulers (daily missions, recovery verses) use local fallback data when quota is exhausted, ensuring manual study generation has available quota.
  - **Question Validation**: All AI-generated questions (multiple_choice, fill_blank) are validated server-side:
    - Must have exactly 4 unique options (no duplicates)
    - multiple_choice: correctIndex must be 0-3
    - fill_blank: correctAnswer must be present in options
    - Invalid questions are filtered out before saving; minimum counts enforced after filtering
    - Events use retry with different API keys on validation failure
- **Study System (DeoGlory)**:
    - **XP System**: Tracks experience points, with corrections to prevent duplication and ensure accurate daily XP calculation. Penalties for incorrect answers and hints are implemented.
    - **Daily Missions**: Each mission awards 10XP. Completing all 5 daily missions gives a 25XP bonus (total 75XP maximum per day from missions).
    - **Ranking System**:
        - **General**: Shows total XP from all sources (lessons, achievements, missions, etc.)
        - **Annual**: Shows XP earned within a specific calendar year (Jan 1 00:00 to Dec 31 23:59), with year selector.
        - **Revista (Seasonal)**: Shows only lesson XP from that specific season/magazine, not including missions or achievements.
    - **Crystal System**: Rewards members based on specific criteria like perfect lessons, consecutive perfect lessons, daily lessons, and weekly streaks.
    - **Achievements**: Automatic unlocking of achievements based on predefined JSON criteria (streak, lessons, XP, special).
    - **Quiz Mechanics**: Includes multiple-choice, true/false, and fill-in-the-blank questions. Questions are randomized, and "Against the Clock" missions require 100% accuracy within a time limit.
    - **Content Generation**: AI-powered generation of study materials, exercises, and practice questions.

### Feature Specifications
- **Public Site**: Home banner with highlighted Instagram posts, daily devotionals, event agenda, "Who We Are" page, and directory.
- **Member Area**: User profiles, push notifications, event participation, and access to the DeoGlory study system.
- **Devotional Mobile Crop**: Allows admin to select a specific area of devotional cover images optimized for mobile display. Uses `mobileCropData` field (JSON) storing x, y, width, height as percentages (0-100). The frontend applies responsive CSS `background-position` for mobile viewports when crop data exists.
- **Admin Panel**:
    - **General**: User and event management, devotional creation, directory management.
    - **Marketing**: Instagram post synchronization and highlighting, location input for addresses.
    - **DeoGlory Admin**: Full lesson management (AI generation or PDF upload), status tracking (Draft/Published), and control over lesson availability.
    - **Multi-Panel Dashboard**: Admins have a selection page to access different administrative panels (Emaus Vota, Espiritualidade, Marketing, DeoGlory, Site Institucional).
- **Special Events System**:
    - Events with 5 AI-generated lessons and collectible cards with 4 rarity levels.
    - Event image upload via `/admin/study/eventos/:id` with ImageUpload component (16:9 aspect ratio).
    - Images stored as base64 in database (Neon PostgreSQL) for production compatibility.
    - Event statistics displayed in Dashboard, Users, and Reports admin screens.
    - Cards displayed in member profiles with animated modal and social sharing (WhatsApp, Twitter/X, Facebook).
    - **Countdown Timers**: "Inicia em" countdown for events starting within 1 day, "Encerra em" countdown for active events ending within 1 day (displays in corner of event card).

### System Design Choices
- **Modular Project Structure**: Clear separation of client, server, and shared codebases.
- **Database Schema**: Managed with Drizzle, allowing for `db:push` command for schema synchronization.
- **Environment Configuration**: Utilizes environment variables (`secrets`) for sensitive information and API keys.
- **Root Administrator**: Automatic creation and promotion of a root admin user based on environment variables.
- **Render Deployment**: Server binds to port FIRST before database initialization. Uses lazy db initialization with Proxy pattern to ensure Render detects the port before any DATABASE_URL validation. If initialization fails, process exits with code 1 after port is bound.
- **Performance Optimizations**:
    - **Leaderboard Queries**: Optimized from 500+ N+1 queries to single SQL queries using LEFT JOIN LATERAL subqueries. General, annual, and seasonal leaderboards all use optimized single-query patterns.
    - **Weekly Goal Scheduler**: Batch fetches all profiles and progress in 2 queries instead of N+1, uses Map lookup for O(1) access.
    - **AI Rate Limiting**: Daily missions scheduler uses sequential AI calls with 1s delay between each to avoid API rate limiting.
- **Admin API Validation**: All admin UPDATE endpoints use dedicated Zod schemas with `.strict()` to whitelist allowed fields and prevent privilege escalation (e.g., users cannot promote themselves to admin via PATCH requests).
- **Error Handling**: Centralized error handling with `handleApiError()` and `AppError` class in `server/utils/logger.ts`. Production mode filters internal error details.
- **Type Consistency**: All icon prop types use `LucideIcon` instead of `typeof IconName` for consistency across components.

## Deployment (Render)
- **Build Command**: `npm run build`
- **Start Command**: `node ./dist/index.js`
- **Environment Variables Required**:
  - `DATABASE_URL`: PostgreSQL connection string (format: `postgresql://user:password@host:port/database`)
  - `NODE_ENV`: Set to `production`
  - `PORT`: Will be set automatically by Render
  - `ADMIN_EMAIL` / `ADMIN_PASSWORD`: For root admin creation
  - Optional: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (push notifications)
  - Optional: `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID` (Instagram integration)
  - Optional: `GEMINI_API_KEY` or `AI_INTEGRATIONS_OPENAI_API_KEY` (AI features)

## External Dependencies
- **PostgreSQL**: Primary database for the application.
- **Instagram Graph API**: Used for fetching and displaying posts from the @umpemaus account. Requires `INSTAGRAM_ACCESS_TOKEN` and `INSTAGRAM_USER_ID`.
- **Web Push Notifications (VAPID)**: For sending push notifications to members. Requires `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.
- **Gemini API**: Used for AI-powered content generation within the DeoGlory study system.
- **React**: Frontend library.
- **Express.js**: Backend framework.
- **Drizzle ORM**: For database interaction.
- **React Markdown**: For rendering Markdown content.
- **Google Maps (indirect)**: Location links open in Google Maps, but direct integration has been removed.

## Future Plans

### Native App-Like Navigation
A detailed plan for transforming the site navigation to feel like a native mobile app is documented in `docs/NATIVE_APP_PLAN.md`. This includes:
- Bottom tab navigation for mobile
- Page transitions with Framer Motion
- PWA configuration
- APK generation methods (PWABuilder, Bubblewrap, Capacitor)