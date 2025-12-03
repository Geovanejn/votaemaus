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

## DeoGlory Study System - Lesson Format Documentation

### Lesson Structure (3 Stages)
Each lesson follows a mandatory 3-stage structure:

**Stage 1: ESTUDE (Learn)**
- Unit types: `text`, `verse`
- Purpose: Reading content and Bible verses
- Users read educational material without losing hearts

**Stage 2: MEDITE (Meditate)**
- Unit types: `meditation`, `reflection`
- Purpose: Practical applications and prayer guides
- Users reflect on how to apply teachings to daily life

**Stage 3: RESPONDA (Answer)**
- Unit types: `multiple_choice`, `true_false`, `fill_blank`
- Purpose: Test comprehension with exercises
- ONLY stage where incorrect answers cause heart loss

### Unit Content Formats

**text (stage: estude)**
```json
{
  "type": "text",
  "stage": "estude",
  "content": {
    "title": "Topic Title",
    "body": "Main educational content (minimum 100 words)",
    "highlight": "Key phrase to emphasize (optional)"
  },
  "xpValue": 2-5
}
```

**verse (stage: estude)**
```json
{
  "type": "verse",
  "stage": "estude",
  "content": {
    "title": "Bible Verse Title",
    "body": "Complete verse text from ARA version",
    "highlight": "John 3:16"
  },
  "xpValue": 2-5
}
```

**meditation (stage: medite)**
```json
{
  "type": "meditation",
  "stage": "medite",
  "content": {
    "title": "Meditation Title",
    "body": "Detailed meditation guide with practical applications",
    "meditationDuration": 60
  },
  "xpValue": 3-5
}
```

**reflection (stage: medite)**
```json
{
  "type": "reflection",
  "stage": "medite",
  "content": {
    "title": "Practical Application",
    "body": "How to apply this teaching in daily life",
    "reflectionPrompt": "Personal reflection question"
  },
  "xpValue": 3-5
}
```

**multiple_choice (stage: responda)**
```json
{
  "type": "multiple_choice",
  "stage": "responda",
  "content": {
    "question": "Clear question about the content",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanationCorrect": "Explanation when correct",
    "explanationIncorrect": "Explanation when incorrect",
    "hint": "Optional hint"
  },
  "xpValue": 5-10
}
```

**true_false (stage: responda)**
```json
{
  "type": "true_false",
  "stage": "responda",
  "content": {
    "statement": "Statement to judge as true or false",
    "isTrue": true,
    "explanationCorrect": "Explanation when correct",
    "explanationIncorrect": "Explanation when incorrect"
  },
  "xpValue": 5-10
}
```

**fill_blank (stage: responda)**
IMPORTANT: The question MUST have complete context!
```json
{
  "type": "fill_blank",
  "stage": "responda",
  "content": {
    "question": "Jesus said: I am the ___, the truth and the life.",
    "correctAnswer": "way",
    "explanationCorrect": "John 14:6 - Jesus presents himself as the only way",
    "explanationIncorrect": "The correct answer is 'way'. Reread John 14:6"
  },
  "xpValue": 5-10
}
```

INCORRECT fill_blank examples (DO NOT USE):
- `"question": "___"` (no context)
- `"question": "Complete: ___"` (too vague)
- `"question": "___"` with only the blank

### Important Rules
1. All Bible verses MUST use ARA (Almeida Revista e Atualizada) version
2. Content must be in Brazilian Portuguese with proper accents (é, ç, ã, etc.)
3. Each lesson must have units from ALL 3 stages in order: ESTUDE -> MEDITE -> RESPONDA
4. Include 2-4 exercises per lesson in the RESPONDA stage
5. Text content should be substantive (minimum 100 words)
6. All fill_blank questions MUST have complete sentences with context

### Christian Meditation Guidelines
Christian meditation is DIFFERENT from Buddhist/Eastern meditation. NEVER include:
- "Breathe deeply", "Breathe 3 times", "Close your eyes and breathe"
- Breathing techniques or mindfulness practices
- Any mental emptying practices

Christian meditation MUST include:
- Reflection on God's Word
- Prayer directed to the Lord
- Practical application of biblical text
- Communion with God through Scripture
- Self-examination in light of the Scriptures

### Study Navigation (UI/UX)
- Navigation uses circular arrow buttons (left/right) at bottom center
- Counter shows current position (e.g., "3 de 15")
- "Concluir Estudo" button appears only on the last screen
- Topics display with "Tópico X" label above the title
- Title and content are combined on the same card

### Admin Seed Data
- Route: POST /api/study/admin/seed (requires admin auth)
- Script: server/seed-study-data.ts
- Seeds real biblical study content about faith ("O Que É a Fé?")
- Clears existing study data before inserting new content

## Recent Changes (December 2025)

### Fill Blank Exercise Fix
- **Issue**: fill_blank exercises showed empty question field
- **Solution**: Added backward compatibility mapping in storage.ts (sentence → question)
- **Location**: server/storage.ts - getStudyUnits method

### Deterministic Unit Ordering
- **Issue**: Unit ordering could drift due to undefined orderIndex values
- **Solution**: Sort by orderIndex (primary) + id (secondary) for stable sequence
- **Location**: client/src/pages/study/lesson.tsx - allUnits sorting

### Christian Meditation Content
- **Issue**: Meditation content contained Buddhist breathing references
- **Solution**: Updated database to remove all breathing technique references
- **Verified**: No content with "respiração", "feche os olhos", or breathing instructions

### Study Content Display
- **Design Decision**: Title and content displayed together on same screen
- **Implementation**: Direct structured unit mapping (parseStudyContent removed)
- **Location**: client/src/components/study/StudyContent.tsx

### Topic Numbering
- **Counter**: topicCounter starts at 1 for actual topics
- **Verse/Conclusion**: Use 0 (not numbered as topics)
- **Display**: "Tópico X" label above content title

## Architecture Notes

### Data Flow for Study Units
1. Database stores units with orderIndex and content JSON
2. storage.ts fetches and maps fields (including backward compatibility)
3. lesson.tsx sorts by orderIndex + id before rendering
4. StudyContent.tsx displays structured sections

### Key Files
- **shared/schema.ts**: Data models and Zod schemas
- **server/storage.ts**: Database operations with field mapping
- **server/routes.ts**: API endpoints
- **client/src/pages/study/lesson.tsx**: Main lesson page with ordering
- **client/src/components/study/StudyContent.tsx**: Content display
- **client/src/components/study/ExerciseCard.tsx**: Exercise handling
- **server/seed-study-data.ts**: Admin seed data script