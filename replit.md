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
- **Real-time Features**: Push notifications for member engagement.
- **AI Integration**: Used for generating exercises and questions from topics or PDF content, with improved prompts for better quality. Includes quota tracking with 5-minute cooldown to preserve quota for high-priority operations (PDF study generation) when low-priority schedulers hit rate limits.
  - **Models**: Prioritizes gemini-2.5-flash and gemini-2.5-flash-lite for all AI operations.
  - **Quota Management**: Schedulers (daily missions, recovery verses) use local fallback data when quota is exhausted, ensuring manual study generation has available quota.
- **Study System (DeoGlory)**:
    - **XP System**: Tracks experience points, with corrections to prevent duplication and ensure accurate daily XP calculation. Penalties for incorrect answers and hints are implemented.
    - **Crystal System**: Rewards members based on specific criteria like perfect lessons, consecutive perfect lessons, daily lessons, and weekly streaks.
    - **Achievements**: Automatic unlocking of achievements based on predefined JSON criteria (streak, lessons, XP, special).
    - **Quiz Mechanics**: Includes multiple-choice, true/false, and fill-in-the-blank questions. Questions are randomized, and "Against the Clock" missions require 100% accuracy within a time limit.
    - **Content Generation**: AI-powered generation of study materials, exercises, and practice questions.

### Feature Specifications
- **Public Site**: Home banner with highlighted Instagram posts, daily devotionals, event agenda, "Who We Are" page, and directory.
- **Member Area**: User profiles, push notifications, event participation, and access to the DeoGlory study system.
- **Admin Panel**:
    - **General**: User and event management, devotional creation, directory management.
    - **Marketing**: Instagram post synchronization and highlighting, location input for addresses.
    - **DeoGlory Admin**: Full lesson management (AI generation or PDF upload), status tracking (Draft/Published), and control over lesson availability.
    - **Multi-Panel Dashboard**: Admins have a selection page to access different administrative panels (Emaus Vota, Espiritualidade, Marketing, DeoGlory, Site Institucional).

### System Design Choices
- **Modular Project Structure**: Clear separation of client, server, and shared codebases.
- **Database Schema**: Managed with Drizzle, allowing for `db:push` command for schema synchronization.
- **Environment Configuration**: Utilizes environment variables (`secrets`) for sensitive information and API keys.
- **Root Administrator**: Automatic creation and promotion of a root admin user based on environment variables.

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