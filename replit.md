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

**Devotional Sharing Feature**:
- Enhanced sharing with banner-style image generation (1080x1920 for stories).
- DevotionalShareCard component renders background image + title + verse.
- Uses html2canvas for image generation.
- Supports Web Share API with file sharing for WhatsApp/social media.
- Fallback options: download image or share link only.

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

**Site Institucional (Public Website)**:
- Public pages: Home, Agenda, Devocionais, Diretoria, Oracao, Quem Somos
- Prayer request submission form with anonymous option
- Board members display with photos and WhatsApp contact
- Banner carousel on homepage
- Admin dashboard at /admin/site with tabs for managing:
  - Diretoria (board members CRUD)
  - Pedidos de Oracao (prayer request status management)
  - Banners (homepage carousel management)

### API Routes

**Site Institucional - Public Routes**:
- `GET /api/site/board-members` - Get current board members
- `GET /api/site/banners` - Get active banners
- `GET /api/site/events` - Get upcoming events
- `GET /api/site/devotionals` - Get featured devotionals
- `POST /api/site/prayer-requests` - Submit prayer request

**Site Institucional - Admin Routes**:
- `GET/POST/PATCH/DELETE /api/admin/board-members` - Manage board members
- `GET/PATCH /api/admin/prayer-requests` - View and update prayer request status
- `GET/POST/PATCH/DELETE /api/admin/banners` - Manage banners
- `GET/POST /api/admin/site-content` - Manage site content

**Sistema de Temporadas - Public Routes**:
- `GET /api/study/seasons` - Listar temporadas publicadas
- `GET /api/study/seasons/:id` - Detalhes da temporada
- `GET /api/study/seasons/:id/lessons` - Licoes da temporada
- `GET /api/study/seasons/:id/progress` - Progresso do usuario
- `GET /api/study/seasons/:id/rankings` - Rankings da temporada
- `GET /api/study/seasons/:id/final-challenge` - Desafio final
- `POST /api/study/seasons/:id/final-challenge/start` - Iniciar desafio
- `POST /api/study/seasons/:id/final-challenge/submit` - Enviar respostas

**Sistema de Temporadas - Admin Routes**:
- `GET/POST/PUT/DELETE /api/study/admin/seasons` - CRUD temporadas
- `POST /api/study/admin/seasons/:id/publish` - Publicar temporada
- `POST /api/study/admin/seasons/:id/import-pdf` - Importar PDF com IA
- `POST /api/study/admin/seasons/:id/final-challenge` - Criar desafio
- `POST /api/study/admin/seasons/:id/generate-final-challenge` - Gerar desafio com IA

**Metas Semanais Routes**:
- `GET /api/study/weekly-goals/progress` - Progresso das metas
- `POST /api/study/weekly-goals/confirm-lesson` - Confirmar licao
- `POST /api/study/weekly-goals/confirm-verse` - Confirmar versiculo
- `POST /api/study/weekly-goals/confirm-mission` - Confirmar missao
- `GET /api/study/devotional-status/:id` - Status de leitura
- `POST /api/study/devotional-read/:id` - Marcar devocional lido

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
- **PostgreSQL** - Neon serverless PostgreSQL for all environments (development and production)
- **@neondatabase/serverless** - Serverless PostgreSQL driver
- **drizzle-orm** - Type-safe ORM with PostgreSQL pg-core dialect
- **drizzle-kit** - Schema migrations via `npm run db:push`

### Database Architecture

**All Environments (Development & Production):**
- PostgreSQL via Neon serverless (`@neondatabase/serverless`)
- Connection via `DATABASE_URL` environment variable
- Schema defined in `shared/schema.ts` using `drizzle-orm/pg-core`
- Database connection in `server/db.ts` using Pool from Neon
- Schema push: `npm run db:push`

**Migration Notes (December 2024):**
- Migrated from SQLite (better-sqlite3) to PostgreSQL (Neon)
- All SQLite-specific code removed
- Schema uses PostgreSQL types (serial, boolean, timestamp with NOW())

### Tabelas do Sistema

**Autenticacao:**
- `users` - Usuarios com campo `secretaria` para permissoes por departamento
- `verification_codes` - Codigos de verificacao por email

**Emaus Vota (Eleicoes):**
- `positions`, `elections`, `election_positions`
- `candidates`, `votes`, `election_winners`
- `election_attendance`, `pdf_verifications`

**DeoGlory (Estudos Gamificados):**
- `study_profiles`, `study_weeks`, `study_lessons`, `study_units`
- `user_lesson_progress`, `user_unit_progress`
- `xp_transactions`, `daily_activity`, `leaderboard_entries`
- `achievements`, `user_achievements`
- `daily_missions`, `user_daily_missions`, `daily_mission_content`
- `bible_verses`, `verse_readings`
- `notifications`, `push_subscriptions`

**Sistema de Temporadas (Dezembro 2024):**
- `seasons` - Temporadas de estudo (baseadas em revistas EBD)
- `season_final_challenges` - Desafio final cronometrado por temporada
- `user_season_progress` - Progresso do usuario por temporada
- `season_rankings` - Ranking por temporada
- `weekly_goal_progress` - Progresso das metas semanais
- `devotional_readings` - Confirmacao de leitura de devocionais
- `study_lessons.seasonId` - Campo de ligacao entre licoes e temporadas

**Metas Semanais:**
- Campos em `study_profiles`: `weeklyLessonsGoal`, `weeklyVersesGoal`, `weeklyMissionsGoal`, `weeklyDevotionalsGoal`
- Leitura de devocionais incrementa meta semanal via `confirmDevotionalRead`

**Site Institucional:**
- `devotionals` - Devocionais (campo `is_featured` para destaque)
- `site_events` - Eventos com categoria, preco, link inscricao
- `instagram_posts` - Posts integrados do Instagram
- `prayer_requests` - Pedidos de oracao
- `banners` - Banners do carrossel da home
- `board_members` - Membros da diretoria
- `site_content` - Conteudo editavel (quem somos, missao, etc.)

### Sistema de Secretarias

Usuarios podem pertencer a secretarias com permissoes especificas:
- `espiritualidade` - Acesso ao painel /admin/study (DeoGlory) para gerenciar semanas de estudo, licoes, exercicios e geracao de conteudo por IA
- `marketing` - Acesso ao painel /admin/site para gerenciar diretoria, pedidos de oracao, banners e conteudo do site
- `acao_social` - Acoes sociais
- `comunicacao` - Comunicacao interna
- `eventos` - Organizacao de eventos

**Permissoes de Acesso:**
- Admins (isAdmin=true): Acesso total a todos os modulos
- Secretaria Espiritualidade: /admin/study + APIs de estudo e IA
- Secretaria Marketing: /admin/site + APIs de site institucional

**Middleware de Autorizacao:**
- `requireAdmin`: Apenas admins
- `requireAdminOrMarketing`: Admins ou secretaria marketing
- `requireAdminOrEspiritualidade`: Admins ou secretaria espiritualidade

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