# Emaus Vota - Election Management System

## Overview
Emaus Vota is a full-stack web application designed for managing elections within the UMP Emaus church youth group. It provides email-based authentication, role-based access control, secure voting mechanisms, and real-time result displays to ensure transparency and fairness. Key features include the generation of shareable results images and PDF audit reports. The project aims to evolve into a comprehensive UMP Emaus portal, integrating modules for devotionals, prayer requests, events, and an enhanced member area, with the election system remaining a central component.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The system features a responsive, Portuguese UI optimized for clarity and ease of use, incorporating UMP Emaús branding (primary orange #FFA500) and a mobile-first Material Design approach. It includes real-time results with automatic polling, smart sorting, and visual hierarchies. Administrative tools facilitate the export of election result images and the generation of PDF audit reports. The study system utilizes a Duolingo-inspired gamified design with Framer Motion animations and also adheres to UMP Emaus branding.

### Technical Implementations
**Frontend**: Built with React 18, TypeScript, and Vite. It uses Wouter for routing, TanStack Query for server state management, shadcn/ui on Radix UI primitives, and Tailwind CSS for styling. Authentication state is managed via React Context API, with tokens stored in local storage. Forms are handled using React Hook Form and Zod for validation.
**Backend**: Developed with Express.js, Node.js, and TypeScript, offering RESTful API endpoints. Authentication is email-based, utilizing 6-digit verification codes and JWTs. User roles (`isAdmin`, `isMember`) enforce access control. The application supports Better-SQLite3 for development and Drizzle ORM configured for PostgreSQL, implementing election rules such as one active election, one vote per user per position, and a three-round scrutiny system.
**Study System**: Features a gamified learning experience with a 3-stage lesson structure (Estude, Medite, Responda) and a "3 Verses = +1 Heart" recovery system. AI, via the Google Gemini API, processes uploaded PDFs to extract content. Admin can control lesson release through locking, unlocking, and scheduling.
**Daily Missions System**: A Duolingo-inspired system providing daily challenges, refreshing every 24 hours. Missions include completing lessons, reading daily verses, timed quizzes, and biblical character studies. Rewards include XP and special badges.

### Feature Specifications
Core functionalities encompass: email/password authentication with JWT, role-based access, comprehensive election management, secure candidate registration and voting, real-time results display, an admin panel for member management, automated majority-based position closing, a three-round scrutiny system, generation of shareable results images and PDF audit reports, an automated birthday email system, and full mobile optimization. The study system allows for structured lessons with various unit types (text, verse, meditation, reflection, multiple-choice, true/false, fill-blank).

### System Design Choices
The architecture is designed for expandability, supporting future modules for Secretariats, Devotionals (CRUD), Prayer Requests, Events & Schedule, Current Board display, Instagram Integration, a revamped Home Page, and expanded tiered permissions. Christian meditation content is strictly defined to focus on reflection on God's Word and prayer, avoiding secular mindfulness practices.

## External Dependencies

-   **Email Service**: Resend (for transactional emails and verification codes).
-   **UI Component Libraries**: @radix-ui/ (accessible, unstyled UI components), lucide-react (icon library), react-easy-crop (interactive image cropping).
-   **Database**: better-sqlite3 (local SQLite for development), @neondatabase/serverless (PostgreSQL deployment).
-   **Development Tools**: Drizzle Kit (database migration and schema management), tsx (direct TypeScript execution), node-cron (scheduling automated tasks).
-   **Validation**: Zod (runtime schema validation), drizzle-zod (generates Zod schemas from Drizzle tables).
-   **AI Integration**: Google Gemini API (for content generation and extraction in the study module).