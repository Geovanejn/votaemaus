# Site UMP Emaús

## Overview
This project is a comprehensive web system for the União de Mocidade Presbiteriana (UMP) of the Emaús Presbyterian Church. It aims to enhance community engagement, streamline event management, and provide spiritual resources through a public website, a members-only area, and an administrative panel. Key capabilities include daily devotionals, event scheduling, member management, social media integration, and the interactive DeoGlory study system. The DeoGlory system offers gamified learning, achievement tracking, and real-time progress. The system also includes a Treasury Module for financial management, member fee tracking, and an e-commerce shop with payment integration.

## User Preferences
- I prefer simple and direct language.
- I want iterative development with frequent, small updates rather than large, infrequent ones.
- Ask for my confirmation before implementing any major architectural changes or refactoring.
- I prefer detailed explanations for complex features or decisions.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.

## System Architecture

### UI/UX Decisions
The front-end is built with React and features a responsive design. The DeoGlory study system incorporates gamified elements like ranking, animated feedback, and golden styling for completed sections. Consistent card layouts and color schemes are used. Accessibility features include text-to-speech normalization.

### Technical Implementations
- **Frontend**: React
- **Backend**: Express.js
- **Database**: PostgreSQL (managed with Drizzle ORM)
- **Authentication**: JWT for API security, session-based for general access.
- **Scheduled Tasks**: Background tasks for Instagram synchronization, event deadline notifications, devotional comment notifications, daily missions, and abandoned cart reminders.
- **Real-time Features**: Push notifications and WebSocket-based online status.
- **Notification System**: Comprehensive system for push, in-app, and email notifications for various events (devotionals, events, prayer requests, lessons, achievements, birthdays, etc.). Notifications include a standard icon payload.
- **AI Integration**: Used for generating exercises and questions from topics or PDFs, with quota tracking and cooldowns. Prioritizes `gemini-3-flash-preview`, `gemini-2.5-flash`, and `gemini-2.5-lite` models. Includes server-side validation for AI-generated questions.
- **Study System (DeoGlory)**: Features an XP system with daily missions, general/annual/seasonal ranking, a crystal reward system, and automatic achievements. Supports multiple-choice, true/false, and fill-in-the-blank quiz mechanics.
- **Devotional Mobile Crop**: Admin tool to define mobile-optimized crop areas for devotional cover images.
- **Admin Panel**: Provides management for users, events, devotionals, directory, marketing (Instagram integration), and the DeoGlory study system (lesson management, AI generation from PDFs). Supports multi-panel access.
- **Special Events System**: Events can include AI-generated lessons, collectible cards with rarity levels, image uploads, and countdown timers.
- **Treasury Module**: Manages member fees (Percapta, UMP), an e-commerce store, and event fee collection. Features financial dashboards and Mercado Pago PIX integration. Includes role-based access for Treasurer and Marketing. Excel report generation supports filtering by category (loja, emprestimo). Member financial panel at `/membro/financeiro` shows fee status and payment history.
- **E-commerce Shop (Loja)**: Redesigned with Jesuscopy-style design. Features swipeable banner carousel with Embla Carousel and autoplay, 2x2 category grid with custom badges, "Lancamentos" product section. Product pages have swipeable image galleries. Admin panel supports separate banner image upload for home carousel (bannerImageData field in shopItems table). Banner images are independent of product gallery images.

### System Design Choices
- **Modular Project Structure**: Clear separation of client, server, and shared code.
- **Database Schema**: Managed with Drizzle ORM.
- **Environment Configuration**: Utilizes environment variables for sensitive data.
- **Root Administrator**: Automatic creation of a root admin user.
- **Deployment**: Optimized for Render, including lazy database initialization.
- **Performance Optimizations**: Extensive use of batch queries (e.g., `LEFT JOIN LATERAL`, `Promise.all`, `inArray()`), caching, and data projection to reduce N+1 queries and improve response times for leaderboards, weekly goals, and lesson progress. HTTP compression (Gzip) is enabled. Database indexes are applied to frequently queried fields.
- **Admin API Validation**: Strict Zod schemas for all admin UPDATE endpoints to prevent privilege escalation.
- **Error Handling**: Centralized error handling with `AppError` and logger.

## External Dependencies
- **PostgreSQL**: Primary database.
- **Instagram Graph API**: For fetching and displaying Instagram posts.
- **Web Push Notifications (VAPID)**: For sending push notifications.
- **Gemini API**: For AI-powered content generation.
- **React**: Frontend library.
- **Express.js**: Backend framework.
- **Drizzle ORM**: Database interaction.
- **Mercado Pago API**: For PIX payment integration in the Treasury Module.
- **React Markdown**: For rendering Markdown content.
```