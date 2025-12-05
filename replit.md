# Emaus Vota - Election Management System (DeoGlory)

## Overview
Emaus Vota (DeoGlory) is a full-stack web application designed for managing elections within the UMP Emaus church youth group, featuring secure voting, role-based access, and real-time results. It has evolved into a comprehensive UMP Emaus portal, incorporating a gamified study system (Duolingo-style), achievements, daily missions, and PWA support. The project aims to foster transparency, fairness, and engagement within the youth group.

## User Preferences
- Preferred communication style: Simple, everyday language (Portuguese - Brazil)
- Language: Portuguese (pt-BR)
- Branding: UMP Emaús with primary orange #FFA500

## System Architecture

### UI/UX Decisions
The system features a responsive, Portuguese UI with a mobile-first Material Design approach, optimized for clarity and ease of use, and branded with UMP Emaús' primary orange (#FFA500). It includes real-time election results, a gamified Duolingo-inspired study system with Framer Motion animations, and PWA support with offline caching and push notifications.

### Technical Implementations
**Frontend**: React 18, TypeScript, Vite, Wouter for routing, TanStack Query v5, shadcn/ui on Radix UI, Tailwind CSS, Framer Motion, Zustand, React Context API for authentication (JWT in localStorage), React Hook Form, Zod.
**Backend**: Express.js, Node.js, TypeScript, Drizzle ORM for PostgreSQL (Neon), JWT authentication with email verification, `isAdmin` and `isMember` roles, node-cron for scheduled tasks.
**WebSocket**: Socket.IO with JWT for real-time updates.
**Study System**: 3-stage lessons, XP, levels, hearts, streaks, leaderboard, AI integration via Google Gemini for content generation.
**Daily Missions**: Daily refreshing missions with XP and badge rewards.
**Gamification**: 35+ achievements, optional sound feedback.

### Feature Specifications
**Core Election Features**: Email/password authentication, role-based access, 3-round election management, attendance control, real-time results, PDF audit reports, shareable results images.
**Devotional Sharing**: Enhanced sharing with banner-style image generation (html2canvas) and Web Share API integration.
**Study System**: Gamified lesson map, ranking/leaderboard, multiple exercise types, AI-powered content generation.
**Gamification & Engagement**: Achievements, daily missions, PWA support, in-app notification center.
**Site Institucional (Public Website)**: Public pages (Home, Agenda, Devocionais, Diretoria, Oracao, Quem Somos), prayer request submission, board members display, banner carousel.
**Admin Dashboards**: Separate admin panels for site content management (board members, prayer requests, banners, site content) and study season management (CRUD seasons, publish, import PDF with AI, generate final challenge with AI).

### System Design Choices
The architecture is designed for expandability, supporting future modules. Content for Christian meditation focuses strictly on God's Word.

## External Dependencies

### Email Service
- **Resend**: Transactional emails and verification codes.

### UI Libraries
- **@radix-ui/**: Accessible, unstyled UI components.
- **lucide-react**: Icon library.
- **react-easy-crop**: Interactive image cropping.
- **framer-motion**: Fluid animations.

### Database
- **PostgreSQL**: Neon serverless PostgreSQL for all environments.
- **@neondatabase/serverless**: Serverless PostgreSQL driver.
- **drizzle-orm**: Type-safe ORM with PostgreSQL pg-core dialect.
- **drizzle-kit**: Schema migrations.

### AI Integration
- **Google Gemini API**: EXCLUSIVE AI provider for all content generation (lessons, missions, exercises, summaries).

### Validation & Forms
- **Zod**: Runtime schema validation.
- **drizzle-zod**: Generate Zod schemas from Drizzle tables.
- **react-hook-form**: Form handling.

### Utilities
- **node-cron**: Task scheduling.
- **pdf-parse**: PDF text extraction.
- **jspdf** + **jspdf-autotable**: PDF generation.
- **html2canvas**: Image export.
- **qrcode**: QR code generation.