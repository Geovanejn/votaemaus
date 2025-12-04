# Emaus Vota - Election Management System (DeoGlory)

## Overview
Emaus Vota (DeoGlory) is a full-stack web application for managing elections within the UMP Emaus church youth group. It features email-based authentication, role-based access control, secure voting, and real-time results. Beyond elections, it has expanded into a comprehensive UMP Emaus portal, incorporating a gamified study system (Duolingo-style), achievements, daily missions, and PWA support. The project aims to provide transparency, fairness, and an engaging platform for youth group activities.

## User Preferences
- Preferred communication style: Simple, everyday language (Portuguese - Brazil)
- Language: Portuguese (pt-BR)
- Branding: UMP Emaús with primary orange #FFA500

## System Architecture

### UI/UX Decisions
The system features a responsive, Portuguese UI optimized for clarity and ease of use, incorporating UMP Emaús branding (primary orange #FFA500) and a mobile-first Material Design approach. It includes real-time results with automatic polling and visual hierarchies. The study system utilizes a Duolingo-inspired gamified design with Framer Motion animations, adhering to UMP Emaus branding. PWA support is integrated with offline caching and push notifications.

### Technical Implementations

**Frontend**:
- React 18 + TypeScript + Vite
- Wouter for routing
- TanStack Query v5 for server state management
- shadcn/ui on Radix UI primitives with Tailwind CSS
- Framer Motion for animations
- Zustand for global state
- Authentication via React Context API with JWT tokens in localStorage
- React Hook Form + Zod for form validation

**Backend**:
- Express.js + Node.js + TypeScript
- Drizzle ORM configured for PostgreSQL (Neon)
- JWT-based authentication with email verification
- User roles: `isAdmin`, `isMember`
- node-cron for scheduled tasks

**WebSocket**:
- Socket.IO with JWT authentication for real-time updates (elections, study progress).

**Study System (Duolingo-style)**:
- 3-stage lesson structure (Estude, Medite, Responda)
- Gamified elements: XP, levels, hearts system, streaks, leaderboard.
- AI integration via OpenAI/Google Gemini for content extraction and generation.

**Daily Missions System**:
- Daily refreshing missions (e.g., complete_lesson, read_daily_verse) with XP and badge rewards.

**Gamification System**:
- 35+ achievements across categories (streak, lessons, xp, special).
- Optional sound feedback system.

### Feature Specifications

**Core Election Features**:
- Email/password authentication with JWT and 6-digit verification.
- Role-based access (admin/member).
- Comprehensive election management with 3-round scrutiny.
- Attendance control and real-time results display.
- PDF audit reports and shareable results images export.

**Study System Features**:
- Gamified lesson map with XP, levels, hearts, and streak tracking.
- Ranking/Leaderboard (weekly/monthly/all-time).
- Multiple exercise types.
- AI-powered content generation.

**Gamification & Engagement**:
- 35+ achievements.
- Daily missions.
- Sound feedback system.
- PWA support with offline caching and push notifications.
- In-app notification center.

### System Design Choices
The architecture is designed for expandability, supporting future modules for secretariats management, devotionals, prayer requests, events, and an institutional website. Content for Christian meditation is strictly focused on reflection on God's Word.

## External Dependencies

### Email Service
- **Resend** - Transactional emails and verification codes.

### UI Libraries
- **@radix-ui/** - Accessible, unstyled UI components.
- **lucide-react** - Icon library.
- **react-easy-crop** - Interactive image cropping.
- **framer-motion** - Fluid animations.

### Database
- **better-sqlite3** - Local SQLite for development.
- **@neondatabase/serverless** - PostgreSQL for production.
- **drizzle-orm** - Type-safe ORM.
- **drizzle-kit** - Schema migrations.

### AI Integration
- **OpenAI API** - Content generation and extraction.
- **Google Gemini API** - Alternative AI provider.

### Validation & Forms
- **Zod** - Runtime schema validation.
- **drizzle-zod** - Generate Zod schemas from Drizzle tables.
- **react-hook-form** - Form handling.

### Utilities
- **node-cron** - Task scheduling.
- **pdf-parse** - PDF text extraction.
- **jspdf** + **jspdf-autotable** - PDF generation.
- **html2canvas** - Image export.
- **qrcode** - QR code generation.