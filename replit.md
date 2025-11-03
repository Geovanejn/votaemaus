# Emaús Vota - Election Management System

## Overview
Emaús Vota is a full-stack web application designed to manage elections for a church youth group (UMP Emaús). The system provides email-based authentication with verification codes, role-based access control (admin/member), election management, and voting functionality with real-time results. Built with a focus on trust, transparency, and accessibility, it follows civic tech design principles to ensure clarity during the voting process, aiming to provide a transparent and accessible voting experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (November 3, 2025)
- **Implemented complete member data editing functionality**: Added full photo upload capability to the member edit dialog in the admin panel. Admins can now edit all member information including name, email, birthdate, and photo. The photo editing uses the same circular crop tool as member registration, ensuring consistent avatar appearance. Added separate handlers (`handleEditPhotoUpload`) and context tracking (`cropContext` state) to distinguish between adding and editing photos, ensuring the cropped image updates the correct member object.
- **Verified and fixed password authentication system**: The system already had a complete password authentication implementation. Fixed a critical bug where the frontend was sending only `password` instead of both `password` and `confirmPassword` to the `/api/auth/set-password` endpoint. The system now works as intended: first-time users login with email verification code, are prompted to set a password after first login (if hasPassword is false), and can use email+password for subsequent logins. The login page includes a toggle to switch between code and password authentication methods.

## Previous Changes (November 2, 2025)
- **Fixed email logo with CID embedding for Gmail compatibility**: Converted congratulations email to use CID (Content-ID) attachment method instead of base64 data URIs, which Gmail blocks. Logo is now attached as a multipart MIME attachment and referenced via `<img src="cid:logo-emaus" />`. Removed alt text from logo image. This ensures the logo displays correctly in Gmail and other email clients. Login page continues to use the circular logo (160KB), while admin/vote/results pages use the full logo with text (from attached_assets) in their footers (h-48 height).
- **Fixed available members cache invalidation**: Added cache invalidation for `/api/members/non-admins` query when positions are opened, closed, or winners are set. This ensures that elected members are immediately removed from the candidate selection list when opening the next position, preventing already-elected members from appearing as available candidates for subsequent positions.
- **Implemented 1-hour session persistence**: Changed JWT token expiration from 7 days to 1 hour. Added automatic redirect in the login page for already-authenticated users, so members don't need to request a new verification code if their session is still valid within the 1-hour window. Added user-facing message indicating session duration.
- **Fixed available members query**: Corrected the frontend query to properly pass the `electionId` parameter as a query string to the `/api/members/non-admins` endpoint. Previously, the query was passing the parameter as an object in the queryKey array, which was being converted to `[object Object]` instead of a proper query string. This prevented the backend from filtering out members who had already won positions in the current election. The fix now properly constructs the URL with query parameters (e.g., `/api/members/non-admins?electionId=123`), ensuring that elected members do not appear in the candidate selection list for subsequent positions.
- **Increased footer logos to 100% larger**: Changed the UMP Emaús logo size in the footer of both admin and member (vote) pages from h-24 to h-48 (100% increase) for better visibility and branding impact.

## System Architecture

### Frontend Architecture
The frontend is built with **React 18** and **TypeScript**, using **Vite** for development and building. **Wouter** handles lightweight client-side routing with auth-gated route trees. **TanStack Query** manages server state, caching, and data fetching. The UI is built using **shadcn/ui** components on **Radix UI** primitives and styled with **Tailwind CSS**, adhering to a mobile-first responsive design based on Material Design principles with custom UMP Emaús branding. State management uses React Context API for authentication, TanStack Query for server state, and local storage for token persistence. Form handling is managed by **React Hook Form** with **Zod** for validation.

### Backend Architecture
The backend uses **Express.js** on **Node.js** with **TypeScript** for RESTful API endpoints. Authentication is email-based with 6-digit verification codes and **JWT** for stateless sessions. **bcrypt.js** is used for admin password hashing. Role-based access control is implemented via `isAdmin` and `isMember` flags. The API is organized into domains like `/api/auth`, `/api/admin`, `/api/elections`, and `/api/vote`. The database layer uses **Better-SQLite3** for development, with **Drizzle ORM** configured for PostgreSQL. The schema includes tables for `users`, `positions`, `elections`, `candidates`, `votes`, `verification_codes`, and `election_winners`, enforcing business logic constraints like one active election at a time, one vote per user per position, and a three-round scrutiny system.

### UI/UX Decisions
The system features a responsive UI following civic tech design principles, ensuring clarity during the voting process. It includes a Portuguese language interface and custom UMP Emaús branding with a primary orange color (`#FFA500`). The results display is real-time, with automatic polling, smart sorting, and visual hierarchies to highlight leading and elected candidates. An "Export Results" feature allows admins to generate professional, institutional images of election results in various aspect ratios (9:16 for Stories, 4:5 for Feed) using custom user-provided assets, typography, and precise spacing. Member photo uploads include a circular crop tool powered by **react-easy-crop**, allowing admins to position and zoom images for consistent circular avatars throughout the system. The admin members page includes a footer with the UMP Emaús logo.

### Feature Specifications
Key features include:
- Email-based authentication with 6-digit verification codes and JWT tokens.
- Role-based access control (admin/member).
- Election management (create, close, archive elections).
- Candidate registration and management.
- Secure voting with duplicate prevention.
- Real-time results display with vote counts and percentages.
- Admin panel for member registration and attendance confirmation.
- Per-position election control, allowing individual positions to open/close.
- Automatic majority-based closing for positions.
- Three-round scrutiny voting system with tie-resolution.
- Generation of shareable election results images with circular candidate photos.
- Circular image crop tool for member photo uploads with zoom and positioning controls.
- Full mobile optimization.

## External Dependencies

### Email Service
- **Resend**: Used for sending transactional emails, specifically 6-digit verification codes.

### UI Component Libraries
- **@radix-ui/**: Accessible component primitives for building the UI.
- **lucide-react**: Icon library for consistent iconography across the application.
- **react-easy-crop**: Interactive image cropping component for circular member photo uploads.

### Database
- **better-sqlite3**: Used for local SQLite database development.
- **@neondatabase/serverless**: Configured for potential future PostgreSQL deployment.

### Development Tools
- **Drizzle Kit**: For database migration and schema management.
- **esbuild**: For server-side bundling in production.
- **tsx**: For TypeScript execution during development.

### Validation
- **Zod**: Runtime schema validation for data integrity.
- **drizzle-zod**: Generates Zod schemas from Drizzle tables.