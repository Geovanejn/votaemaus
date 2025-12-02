# Emaus Vota - Election Management System

## Overview
Emaus Vota is a full-stack web application for managing elections within the UMP Emaus church youth group. It provides email-based authentication, role-based access control, election creation and management, secure voting, and real-time results. The system emphasizes transparency, accessibility, and adheres to civic tech principles, offering features like shareable results images and PDF audit reports. Its purpose is to streamline the electoral process, ensure fairness, and foster trust among participants.

## Recent Changes (December 2024)

### Duolingo-Style Study System Visual Improvements
- **LessonNode Component**: Updated to use UMP Emaus orange colors (#FFA500) for available lessons, with improved 3D button effects and glow animations
- **LessonMap Component**: Enhanced path connectors with orange gradients for next lessons, improved week header design
- **BottomNav Component**: New Duolingo-style bottom navigation with animated indicators and color-coded icons
- **LevelBadge Component**: New circular progress design with UMP Emaus orange gradient
- **Celebration Component**: New confetti, stars, and XP burst animations for lesson completion
- **RewardModal Component**: New post-lesson reward modal with XP counter, streak display, and celebration effects
- **Ranking Page**: Complete redesign with podium for top 3, animated list entries, and position change indicators
- **Study Home Page**: New daily goal card, streak card, and improved layout

### Design System Documentation
- Created `docs/DUOLINGO_DESIGN_SYSTEM.md` with complete design specifications
- Documented color palette, component specifications, and animation guidelines

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

---

## 🚀 Portal UMP Emaús Completo (Planejamento Futuro)

### Visão Geral
Expandir o sistema atual de votação para um portal completo da UMP Emaús, integrando múltiplas funcionalidades em um único ecossistema, mantendo a votação como um dos módulos.

### Estrutura do Portal
```
Portal UMP Emaús
├── 🏠 Home (feed com devocionais + Instagram)
├── 🙏 Devocionais
├── 📿 Pedidos de Oração
├── 📅 Programações
├── 👥 Diretoria
├── 🗳️ Votação (sistema atual)
└── 👤 Área do Membro (perfil + painel de secretaria)
```

### Novas Funcionalidades Planejadas

#### 1. Sistema de Secretarias
- Cadastro de secretarias (Espiritualidade, Louvor, Missões, Comunicação, etc.)
- Membros podem ser vinculados a secretarias
- Cada secretaria tem acesso a painéis específicos
- Cores personalizadas por secretaria

#### 2. Devocionais
**Funcionalidades:**
- Membros da Secretaria de Espiritualidade podem criar/editar devocionais
- Campos: título, conteúdo, versículo, autor, data
- Sistema de publicação (rascunho/publicado)
- Página pública para leitura
- Filtro e busca por palavra-chave

**Acesso:**
- Público: Ler devocionais publicados
- Secretaria de Espiritualidade: CRUD completo

#### 3. Pedidos de Oração
**Funcionalidades:**
- Formulário público (qualquer pessoa pode enviar)
- Campos: nome, e-mail, igreja (opcional), pedido
- Sistema de status (pendente/atendido)
- Membros autenticados veem todos os detalhes
- Visitantes veem lista sem e-mails

**Acesso:**
- Público: Criar pedidos, ver lista resumida
- Membros: Ver detalhes completos, atualizar status

#### 4. Programações e Eventos
**Funcionalidades:**
- CRUD de eventos futuros
- Campos: título, descrição, data, hora, local, imagem
- Calendário visual
- Opção de adicionar ao calendário pessoal

**Acesso:**
- Público: Visualizar eventos
- Secretaria de Comunicação/Admin: CRUD completo

#### 5. Diretoria Atual
**Funcionalidades:**
- Página pública com cards da diretoria
- Exibir: foto, nome, cargo, e-mail, telefone
- Organização por hierarquia
- Dados sincronizados com cadastro de membros

**Acesso:**
- Público: Visualizar
- Admin: Definir cargos e hierarquia

#### 6. Integração com Instagram
**Funcionalidades:**
- Sincronização automática de posts via API do Instagram
- Cache local para performance
- Exibição na home (últimos 6 posts)
- Atualização a cada 1 hora

**Tecnologia:**
- Instagram Graph API
- Armazenamento em cache no banco
- Widget embed como alternativa simples

#### 7. Home Page Renovada
**Componentes:**
- Banner de boas-vindas
- Últimos 3 devocionais
- Próximas programações (destaque)
- Feed do Instagram
- Acesso rápido a pedidos de oração
- Versículo do dia (futuro)

### Novas Tabelas do Banco de Dados

```typescript
// Secretarias
secretarias: {
  id: integer (PK),
  nome: text,
  descricao: text,
  cor: text (hex color)
}

// Atualização em Members
members: {
  ...campos_existentes,
  secretariaId: integer (FK, opcional),
  telefone: text,
  cargo: text (opcional: "Presidente", "Vice-Presidente", etc.)
}

// Devocionais
devotionals: {
  id: integer (PK),
  titulo: text,
  conteudo: text,
  versiculo: text,
  autorId: integer (FK members),
  publicado: boolean,
  createdAt: datetime
}

// Pedidos de Oração
prayer_requests: {
  id: integer (PK),
  nome: text,
  email: text,
  igreja: text (opcional),
  pedido: text,
  status: text (pendente/atendido),
  createdAt: datetime
}

// Programações/Eventos
events: {
  id: integer (PK),
  titulo: text,
  descricao: text,
  data: date,
  hora: time,
  local: text,
  imagemUrl: text,
  createdAt: datetime
}

// Posts do Instagram (cache)
instagram_posts: {
  id: integer (PK),
  postId: text (Instagram ID),
  caption: text,
  imageUrl: text,
  permalink: text,
  createdAt: datetime
}
```

### Sistema de Permissões Expandido

```typescript
Níveis de acesso:
1. Visitante
   - Home, devocionais, criar pedido de oração, programações, diretoria

2. Membro Comum
   - Tudo acima + ver detalhes de pedidos de oração

3. Membro de Secretaria
   - Espiritualidade: Gerenciar devocionais
   - Comunicação: Gerenciar programações, sync Instagram
   - Outras secretarias: Painéis específicos (futuro)

4. Admin
   - Tudo acima + gerenciar votação, membros, secretarias, etc.
```

### API Endpoints Planejados

```typescript
// Devocionais
GET    /api/devotionals              // Listar publicados
GET    /api/devotionals/:id          // Detalhes
POST   /api/devotionals              // Criar (secretaria)
PUT    /api/devotionals/:id          // Editar (secretaria)
DELETE /api/devotionals/:id          // Deletar (secretaria)

// Pedidos de Oração
GET    /api/prayer-requests          // Listar
GET    /api/prayer-requests/:id      // Detalhes (membros)
POST   /api/prayer-requests          // Criar (público)
PUT    /api/prayer-requests/:id      // Atualizar status (membros)
DELETE /api/prayer-requests/:id      // Deletar (admin)

// Programações
GET    /api/events                   // Listar futuros
GET    /api/events/:id               // Detalhes
POST   /api/events                   // Criar (comunicação/admin)
PUT    /api/events/:id               // Editar
DELETE /api/events/:id               // Deletar

// Secretarias
GET    /api/secretarias              // Listar todas
POST   /api/secretarias              // Criar (admin)
PUT    /api/secretarias/:id          // Editar (admin)
DELETE /api/secretarias/:id          // Deletar (admin)

// Instagram
GET    /api/instagram/posts          // Posts em cache
POST   /api/instagram/sync           // Sincronizar (admin)

// Diretoria
GET    /api/board                    // Membros da diretoria atual
```

### Novas Páginas Frontend

```typescript
client/src/pages/
├── Home.tsx                  // Landing page renovada
├── Devotionals.tsx           // Lista de devocionais
├── DevotionalView.tsx        // Leitura individual
├── DevotionalEditor.tsx      // CRUD (secretaria)
├── PrayerRequests.tsx        // Formulário + lista
├── Events.tsx                // Programações públicas
├── EventsManager.tsx         // Gerenciar (comunicação)
├── Board.tsx                 // Diretoria atual
├── MemberArea.tsx            // Área do membro
├── SecretaryPanel.tsx        // Painel da secretaria
└── Settings.tsx              // Configurações (admin)
```

### Menu de Navegação Atualizado

**Visitante:**
```
[Logo] Home | Devocionais | Oração | Programações | Diretoria | Votação | [Entrar]
```

**Membro Logado:**
```
[Logo] Home | Devocionais | Oração | Programações | Diretoria | Votação | Minha Área ▼
                                                                           ├─ Perfil
                                                                           ├─ Minha Secretaria
                                                                           ├─ Admin (se admin)
                                                                           └─ Sair
```

### Funcionalidades Adicionais (Futuro)

1. **Versículo do Dia** - API bíblia para versículo diário
2. **Galeria de Fotos** - Álbuns de eventos passados
3. **Testemunhos** - Membros compartilham testemunhos
4. **Downloads** - Materiais, estudos, recursos
5. **Estatísticas** - Dashboard com métricas da UMP
6. **Notificações** - Sistema de avisos importantes
7. **Chat/Mensagens** - Comunicação interna
8. **Biblioteca** - Materiais didáticos, sermões

### Roadmap de Implementação

**Fase 1: Base (1 semana)**
- Criar tabelas: secretarias, devotionals, prayer_requests, events
- Adicionar campos em members (secretariaId, telefone, cargo)
- Sistema de permissões por secretaria
- Menu de navegação atualizado

**Fase 2: Devocionais (3-4 dias)**
- CRUD de devocionais
- Página pública de leitura
- Editor para secretaria de espiritualidade
- Sistema de publicação

**Fase 3: Pedidos de Oração (2 dias)**
- Formulário público
- Lista para visitantes e membros
- Sistema de status
- Painel de gerenciamento

**Fase 4: Programações (2 dias)**
- CRUD de eventos
- Página pública com calendário
- Gerenciador para comunicação
- Upload de imagens

**Fase 5: Diretoria (1 dia)**
- Página com cards da diretoria
- Sincronização com dados de membros
- Hierarquia e cargos

**Fase 6: Instagram (2-3 dias)**
- Integração com Instagram Graph API
- Sistema de cache
- Widget na home
- Sincronização automática

**Fase 7: Home Renovada (2 dias)**
- Design responsivo
- Integração de todos os módulos
- Feed unificado
- SEO otimizado

**Fase 8: Polish & Launch (2 dias)**
- Testes completos
- Otimizações de performance
- Documentação
- Deploy

### Tecnologias Adicionais Necessárias

- **Instagram Graph API** - Integração com posts
- **API Bíblia** (opcional) - Versículo do dia
- **Image Upload** - Cloudinary ou similar para fotos de eventos
- **Calendar Integration** - iCal/Google Calendar export

### Considerações Técnicas

**Performance:**
- Cache de posts do Instagram (refresh 1x/hora)
- Paginação em listas longas
- Lazy loading de imagens

**SEO:**
- Meta tags dinâmicas por página
- Open Graph para compartilhamento
- Sitemap.xml
- Schema.org markup

**Acessibilidade:**
- ARIA labels
- Navegação por teclado
- Contraste adequado
- Textos alternativos

**Mobile-First:**
- Design responsivo em todas as páginas
- Touch-friendly
- Performance otimizada

### Custos Estimados

- **Hospedagem**: Replit (~$20/mês) ou VPS (~$5-10/mês)
- **Domínio**: ~R$40/ano
- **Instagram API**: Gratuito (limite 200 req/hora)
- **Cloudinary** (imagens): Plano gratuito suficiente
- **Total mensal**: ~R$50-100

### Notas de Implementação

- Manter sistema de votação funcionando durante toda migração
- Implementação incremental por fases
- Testes em cada fase antes de avançar
- Backup regular do banco de dados
- Documentação de cada módulo
- Treinamento para secretarias específicas