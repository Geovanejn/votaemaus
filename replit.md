# Emaús Vota - Election Management System

## Overview
Emaús Vota is a full-stack web application designed to manage elections for a church youth group (UMP Emaús). It offers email-based authentication with verification codes, role-based access control (admin/member), election management, and voting functionality with real-time results. The system aims to provide a transparent and accessible voting experience, adhering to civic tech design principles and focusing on trust and clarity.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18 and TypeScript, utilizing Vite for development. Wouter handles client-side routing, while TanStack Query manages server state and data fetching. The UI is constructed using shadcn/ui components on Radix UI primitives, styled with Tailwind CSS, and follows a mobile-first responsive design based on Material Design principles with custom UMP Emaús branding. State management uses React Context API for authentication and local storage for token persistence. Form handling is managed by React Hook Form with Zod for validation.

### Backend Architecture
The backend uses Express.js on Node.js with TypeScript for RESTful API endpoints. Authentication is email-based with 6-digit verification codes and JWT for stateless sessions, with bcrypt.js for admin password hashing. Role-based access control is implemented via `isAdmin` and `isMember` flags. The API is organized into domains like `/api/auth`, `/api/admin`, `/api/elections`, and `/api/vote`. The database layer uses Better-SQLite3 for development, with Drizzle ORM configured for PostgreSQL. The schema includes tables for `users`, `positions`, `elections`, `candidates`, `votes`, `verification_codes`, and `election_winners`, enforcing business logic constraints like one active election at a time, one vote per user per position, and a three-round scrutiny system.

### UI/UX Decisions
The system features a responsive UI following civic tech design principles, ensuring clarity during the voting process. It includes a Portuguese language interface and custom UMP Emaús branding with a primary orange color (`#FFA500`). Results are displayed in real-time with automatic polling, smart sorting, and visual hierarchies. An "Export Results" feature allows admins to generate professional images of election results in various aspect ratios using custom user-provided assets. Member photo uploads include a circular crop tool powered by react-easy-crop, ensuring consistent circular avatars. The admin members page includes a footer with the UMP Emaús logo.

### Feature Specifications
Key features include:
- Email and password-based authentication with 6-digit verification codes and JWT tokens.
- Auto-logout with page reload after 2-hour session expiration.
- Role-based access control (admin/member).
- Election management (create, close, archive elections).
- Candidate registration and management.
- Secure voting with duplicate prevention.
- Real-time results display with vote counts and percentages.
- Admin panel for member registration, editing, and attendance confirmation.
- Per-position election control, allowing individual positions to open/close.
- Automatic majority-based closing for positions.
- Three-round scrutiny voting system with tie-resolution.
- Generation of shareable election results images with circular candidate photos.
- PDF audit report generation with voter attendance, vote timeline, and complete election results.
- Automated birthday email system with daily cron job.
- Circular image crop tool for member photo uploads.
- Full mobile optimization.

## External Dependencies

### Email Service
- **Resend**: For sending transactional emails, including verification codes.

### UI Component Libraries
- **@radix-ui/**: Accessible component primitives.
- **lucide-react**: Icon library.
- **react-easy-crop**: Interactive image cropping.

### Database
- **better-sqlite3**: For local SQLite database development.
- **@neondatabase/serverless**: Configured for potential future PostgreSQL deployment.

### Development Tools
- **Drizzle Kit**: For database migration and schema management.
- **tsx**: For TypeScript execution during development.
- **node-cron**: For scheduling automated tasks.

### Validation
- **Zod**: Runtime schema validation.
- **drizzle-zod**: Generates Zod schemas from Drizzle tables.

## Recent Bug Fixes (November 4, 2025)

### Elected Members in Nomination List Bug (FINAL FIX)
**Issue**: Elected candidates were still appearing in the "Indicação de Membros para Candidatura" dialog for subsequent positions, despite previous fix attempts.
**Root Cause**: The nomination dialog uses the `/api/elections/:id/attendance` endpoint, which was NOT filtering out elected members. The previous fix only addressed the `/api/members/non-admins` endpoint used by a different dialog.
**Solution**: Modified `/api/elections/:id/attendance` route in `server/routes.ts` to:
1. Query `storage.getElectionWinners(electionId)` to get all winners for the current election
2. Build a Set of winner user IDs for efficient filtering
3. Filter the attendance list to exclude any member whose ID is in the winner Set
4. This ensures elected members (like Geovane Nascimento who was elected Presidente) no longer appear when nominating for Vice-Presidente or other positions

### PDF Audit Report - All Results on First Page
**Issue**: PDF audit report was spreading position results across multiple pages, requiring users to flip through pages to see all elected candidates.
**User Request**: Show all election results (cargo and elected candidate) on the first page for quick reference.
**Solution**: Modified both `generateElectionAuditPDF` and `generateElectionAuditPDFBase64` in `client/src/lib/pdfGenerator.ts` to:
1. Added a new section "2. Resultados por Cargo" with a compact summary table showing all completed positions with:
   - Cargo (position name)
   - Eleito (elected candidate name)  
   - Votos (vote count)
   - Escrutínio (scrutiny round)
2. Moved detailed breakdown to section "3. Detalhamento por Cargo e Escrutínio"
3. Renumbered "Detalhamento de Votos Individuais" to section "4." for proper sequencing
4. Removed verbose debug logging that could leak PII in production
5. Now users can see all election winners at a glance on page 1, with full details following on subsequent pages

### Manual Position Closing UX Improvement
**Change**: Reverted "Fechar Cargo Manualmente" button to display inline action buttons instead of a dialog.
**Solution**: Modified `client/src/pages/admin.tsx` to show two direct action buttons when clicked:
1. "Fechar Permanentemente" - Permanently closes the position
2. "Fechar e Reabrir Cargo" - Temporarily closes and reopens the position
This provides a more streamlined UX by removing an unnecessary dialog step.

### PDF Audit Report Enhancements
**Standardization**: Ensured both `generateElectionAuditPDF` (download) and `generateElectionAuditPDFBase64` (email/finalization) have identical formatting:
1. Both include signature section with date by extension
2. Both display opening date (createdAt) and closing date (closedAt) with Brasília timezone timestamps
3. All timestamps use `timeZone: "America/Sao_Paulo"` for consistent local time display
4. Improved spacing: reduced gap between logo and title (from 2 to 1), increased gap between subtitle and content (from 8 to 10)

### Force Close Position - Cache Invalidation Fix (November 4, 2025)
**Issue**: When using "Fechar e Reabrir Cargo" button, the system would show members who were not present in the assembly in the nomination dialog.
**Root Cause**: The `forceClosePositionMutation` was not invalidating the attendance cache (`/api/elections/:id/attendance`), causing stale data to be displayed.
**Solution**: Added `queryClient.invalidateQueries({ queryKey: ["/api/elections", activeElection?.id, "attendance"] })` to the mutation's `onSuccess` handler to ensure fresh attendance data is fetched after reopening a position.

### PDF Date Formatting Fix (November 4, 2025)
**Issue**: The "Data de Abertura" (opening date) in the PDF audit report was showing incorrect times, not properly converted to Brasília timezone.
**Root Cause**: Using `getDate()`, `getMonth()`, and `getFullYear()` methods directly on Date objects doesn't respect the timezone parameter, causing UTC times to be displayed.
**Solution**: Modified both `generateElectionAuditPDF` and `generateElectionAuditPDFBase64` to use `toLocaleDateString` and `toLocaleTimeString` with explicit `timeZone: "America/Sao_Paulo"` and `hour12: false` options for proper timezone conversion. Also renamed "Data de Criação" to "Data de Encerramento" for clarity.

### Login Page Spacing Improvements (November 4, 2025)
**Change**: Adjusted all spacing on the login page for a more compact and refined layout.
**Solution**: Modified `client/src/pages/login.tsx` to:
1. Reduced header bar height from `h-2` to `h-0.5` (75% reduction)
2. Reduced top margin from `mt-2 sm:mt-4` to `mt-0.5 sm:mt-1` (70% reduction)
3. Reduced logo-to-title spacing from `mb-9 sm:mb-12` to `mb-3 sm:mb-4` (70% reduction)
4. Increased title-to-subtitle spacing from `mb-2` to `mb-4` (100% increase)
5. Increased form element spacing from `space-y-4` to `space-y-6` and `space-y-2` to `space-y-3` (50% increase)
This creates a more balanced and visually appealing login experience.

### Timestamp Storage and Display Fix (November 4, 2025)
**Issue**: Election opening and closing timestamps were being recorded with incorrect times, not reflecting the actual São Paulo timezone when events occurred.
**Root Cause**: Previous implementation attempted to store São Paulo time as UTC by converting locale strings, which caused a ~3 hour shift because the São Paulo wall-clock time was being interpreted as UTC.
**Solution**: Modified `server/storage.ts` to:
1. Store all timestamps in UTC using `new Date().toISOString()` in `createElection()` and `finalizeElection()`
2. Opening timestamp (`created_at`) is captured when "Abrir Nova Eleição" button is clicked
3. Closing timestamp (`closed_at`) is captured when "Finalizar Eleição" button is clicked
4. Display conversion to "America/Sao_Paulo" happens only in PDF generation using `toLocaleDateString` and `toLocaleTimeString`
5. PDF footer timestamp always uses the moment the PDF is generated (not the election's `closedAt`)
This ensures timestamps are stored unambiguously in UTC and displayed correctly in São Paulo local time.

### Display Election Dates on Results Page (November 4, 2025)
**Feature**: Added display of election opening and closing dates with timestamps on the results page.
**Implementation**: Modified the following files:
1. **shared/schema.ts**: Added `createdAt` and `closedAt` fields to the `ElectionResults` type
2. **server/storage.ts**: Updated `getElectionResults()` to include `createdAt` and `closedAt` in the returned object
3. **client/src/pages/results.tsx**: Added conditional rendering of opening and closing dates with São Paulo timezone formatting
   - "Data de Abertura" shows when the election was opened (when admin clicked "Abrir Nova Eleição")
   - "Data de Fechamento" shows when the election was finalized (when admin clicked "Finalizar Eleição")
   - Both display date in DD/MM/YYYY format and time in HH:MM format (24-hour)
This provides users with complete transparency about when elections were opened and closed.