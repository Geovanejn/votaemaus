# Emaús Vota - Election Management System

## Overview
Emaús Vota is a full-stack web application for managing elections within the UMP Emaús church youth group. It provides email-based authentication, role-based access control, election creation and management, secure voting, and real-time results. The system emphasizes transparency, accessibility, and adheres to civic tech principles, offering features like shareable results images and PDF audit reports. Its purpose is to streamline the electoral process, ensure fairness, and foster trust among participants.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
Built with React 18 and TypeScript, using Vite, Wouter for routing, and TanStack Query for server state. UI components are from shadcn/ui on Radix UI primitives, styled with Tailwind CSS, following a mobile-first Material Design approach with custom UMP Emaús branding. State management uses React Context API for authentication and local storage for tokens. Forms are handled by React Hook Form with Zod validation.

### Backend
Developed using Express.js on Node.js with TypeScript, providing RESTful API endpoints. Authentication is email-based with 6-digit verification codes and JWT. User roles (admin/member) are managed via `isAdmin` and `isMember` flags. The API is organized by domains (`/api/auth`, `/api/admin`, etc.). The database uses Better-SQLite3 for development and Drizzle ORM configured for PostgreSQL, with a schema enforcing election rules (e.g., one active election, one vote per user per position) and a three-round scrutiny system.

### UI/UX Decisions
The system features a responsive UI designed for clarity, with a Portuguese interface and UMP Emaús branding (primary orange color #FFA500). Real-time results include automatic polling, smart sorting, and visual hierarchies. Admins can export professional-looking election result images and generate comprehensive PDF audit reports. Member photo uploads utilize a circular crop tool.

### Feature Specifications
Key features include:
- Email/password authentication with JWT and 2-hour session auto-logout.
- Role-based access control (admin/member).
- Comprehensive election management (create, close, archive, per-position control).
- Candidate registration and secure, duplicate-prevented voting.
- Real-time results with vote counts and percentages.
- Admin panel for member registration, editing, attendance, and active status management.
- Automatic majority-based position closing and three-round scrutiny system with tie-resolution.
- Generation of shareable election results images and detailed PDF audit reports (attendance, vote timeline, results).
- Automated birthday email system.
- Circular image crop tool for member photos.
- Full mobile optimization.
- Tracking of active/inactive members to manage election participation without deleting member data.

## External Dependencies

### Email Service
- **Resend**: For transactional emails and verification codes.

### UI Component Libraries
- **@radix-ui/**: Accessible UI primitives.
- **lucide-react**: Icon library.
- **react-easy-crop**: Interactive image cropping.

### Database
- **better-sqlite3**: For local SQLite development.
- **@neondatabase/serverless**: For PostgreSQL deployment.

### Development Tools
- **Drizzle Kit**: Database migration and schema management.
- **tsx**: TypeScript execution.
- **node-cron**: Automated task scheduling.

### Validation
- **Zod**: Runtime schema validation.
- **drizzle-zod**: Zod schema generation from Drizzle tables.