# Emaus Vota - Election Management System

## Overview
Emaus Vota is a full-stack web application for managing elections within the UMP Emaus church youth group. It features email-based authentication, role-based access, secure voting, and real-time results to ensure transparency and fairness. Key capabilities include generating shareable results images and PDF audit reports. The project is envisioned to expand into a comprehensive UMP Emaus portal, incorporating modules for devotionals, prayer requests, events, and an updated member area, with the voting system remaining a core component.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is built with React 18, TypeScript, and Vite. It uses Wouter for routing, TanStack Query for server state, shadcn/ui on Radix UI primitives, and Tailwind CSS for styling, following a mobile-first Material Design approach with UMP Emaús branding (primary orange #FFA500). State management uses React Context API for authentication and local storage for tokens. Forms are managed with React Hook Form and Zod validation.

### Backend
The backend uses Express.js with Node.js and TypeScript, providing RESTful API endpoints. Authentication is email-based with 6-digit verification codes and JWTs. User roles (`isAdmin`, `isMember`) control access. The database uses Better-SQLite3 for development and Drizzle ORM configured for PostgreSQL, enforcing election rules like one active election and one vote per user per position, and implementing a three-round scrutiny system.

### UI/UX Decisions
The system features a responsive, Portuguese UI optimized for clarity and ease of use, with UMP Emaús branding. It includes real-time results with automatic polling, smart sorting, and visual hierarchies. Administrative tools allow exporting election result images and generating PDF audit reports.

### Feature Specifications
Core functionalities include: email/password authentication with JWT, role-based access, comprehensive election management, secure candidate registration and voting, real-time results display, admin panel for member management, automated majority-based position closing, a three-round scrutiny system, generation of shareable results images and PDF audit reports, an automated birthday email system, and full mobile optimization.

### System Design Choices
The architecture supports an expandable portal with planned modules for Secretariats, Devotionals (CRUD functionality), Prayer Requests, Events & Schedule, Current Board display, Instagram Integration, a renewed Home Page, and expanded tiered permissions.

### Duolingo-Style Study System
This module provides a gamified study experience with a Duolingo-inspired visual design, maintaining UMP Emaus branding. It uses React with Framer Motion for animations and is mobile-first. Content is managed by admin uploading PDFs, which AI processes to extract titles, lessons, and content using the Google Gemini API. Lessons follow a 3-stage structure (Estude, Medite, Responda) and a "3 Verses = +1 Heart" recovery system. Admin can control lesson release via locking, unlocking, and scheduling.

## External Dependencies

### Email Service
- **Resend**: For transactional emails and verification codes.

### UI Component Libraries
- **@radix-ui/**: Accessible, unstyled UI components.
- **lucide-react**: Icon library.
- **react-easy-crop**: Interactive image cropping.

### Database
- **better-sqlite3**: Local SQLite database for development.
- **@neondatabase/serverless**: PostgreSQL deployment.

### Development Tools
- **Drizzle Kit**: Database migration and schema management.
- **tsx**: Direct TypeScript execution.
- **node-cron**: Scheduling automated tasks.

### Validation
- **Zod**: Runtime schema validation.
- **drizzle-zod**: Generates Zod schemas from Drizzle tables.

### AI Integration
- **Google Gemini API**: Used for content generation and extraction in the study module.