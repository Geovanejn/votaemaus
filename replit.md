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
A gamified study module replicating Duolingo's visual design while maintaining UMP Emaus branding (primary orange #FFA500). The system uses React with Framer Motion for animations.

### Components (client/src/components/study/)
- **LessonNode**: Circular 3D lesson buttons with green completion states, shadows, and animations
- **LessonMap**: Serpentine lesson path with SVG connectors and treasure chest rewards
- **SectionHeader**: Orange banner with "SECAO X, UNIDADE Y" format
- **StartButton**: Pill-shaped "COMECAR" button for available lessons
- **DailyMissions**: Progress bar-based daily objectives with time countdown
- **StreakCelebration**: Full-screen celebration for streak milestones
- **LessonComplete**: Completion screen with colorful stat boxes (XP, accuracy, time)
- **BottomNav**: 5-tab navigation (Inicio, Versiculos, Ranking, Perfil, Mais)
- **HeartsDisplay/XPDisplay/StreakBadge/LevelBadge**: Gamification stat displays
- **FeedbackOverlay**: Correct/incorrect answer feedback with explanations

### Color System
- Primary Orange: #FFA500 (section headers, branding)
- Duolingo Green: #58CC02 (completed lessons, correct answers)
- Duolingo Blue: #1CB0F6 (continue buttons, active states)
- XP Yellow: #FFC800 (XP displays)
- Streak Orange: #FF9600 (streak displays)
- Hearts Red: #FF4B4B (heart icons)

### Preview Page
Access `/study-preview` without authentication to test all study components.

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