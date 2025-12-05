# Plano de Melhorias - Paineis das Secretarias

**Data:** 05/12/2025
**Status:** Documentacao - Aguardando Aprovacao
**Versao:** 1.0

---

## INDICE

1. [Resumo Executivo](#1-resumo-executivo)
2. [Alteracoes no Cadastro](#2-alteracoes-no-cadastro)
3. [Sistema de Paineis por Secretaria](#3-sistema-de-paineis-por-secretaria)
4. [Painel Espiritualidade](#4-painel-espiritualidade)
5. [Painel Marketing](#5-painel-marketing)
6. [Melhorias na Pagina Diretoria](#6-melhorias-na-pagina-diretoria)
7. [Melhorias na Pagina de Oracao](#7-melhorias-na-pagina-de-oracao)
8. [Novas Tabelas do Banco de Dados](#8-novas-tabelas-do-banco-de-dados)
9. [Novas Rotas da API](#9-novas-rotas-da-api)
10. [Componentes Frontend](#10-componentes-frontend)
11. [Cronograma de Implementacao](#11-cronograma-de-implementacao)

---

## 1. RESUMO EXECUTIVO

Este documento detalha as melhorias solicitadas para o sistema UMP Emaus, focando em:
- Restricao de secretarias no cadastro (apenas Espiritualidade e Marketing)
- Paineis administrativos especificos por secretaria
- Ferramentas de criacao de conteudo (devocionais e eventos)
- Sistema de moderacao automatica
- Mural da Oracao interativo

---

## 2. ALTERACOES NO CADASTRO

### 2.1 Estado Atual
```typescript
// shared/schema.ts - linha 23
export type Secretaria = "none" | "espiritualidade" | "marketing" | "acao_social" | "comunicacao" | "eventos" | null;
```

### 2.2 Novo Estado
```typescript
export type Secretaria = "none" | "espiritualidade" | "marketing" | null;
```

### 2.3 Arquivos a Modificar
| Arquivo | Modificacao |
|---------|-------------|
| `shared/schema.ts` | Remover opcoes "acao_social", "comunicacao", "eventos" |
| Formulario de cadastro/edicao | Atualizar opcoes do select |

### 2.4 Migracao de Dados
```sql
-- Usuarios com secretarias antigas serao atualizados para "none"
UPDATE users 
SET secretaria = 'none' 
WHERE secretaria IN ('acao_social', 'comunicacao', 'eventos');
```

---

## 3. SISTEMA DE PAINEIS POR SECRETARIA

### 3.1 Logica de Navegacao

```
Usuario Logado
├── Sempre Visivel
│   ├── Emaus Vota
│   └── DeoGlory
├── Se secretaria = "espiritualidade"
│   └── Painel Espiritualidade (/admin/espiritualidade)
├── Se secretaria = "marketing"
│   └── Painel Marketing (/admin/marketing)
└── Se isAdmin = true
    ├── Painel Espiritualidade
    ├── Painel Marketing
    └── Admin Geral
```

### 3.2 Middleware de Autorizacao

**Arquivo:** `server/auth.ts`

```typescript
// Ja existe: requireAdminOrMarketing
// Ja existe: requireAdminOrEspiritualidade

// Novo middleware para membros da secretaria (nao apenas admin)
export function requireEspiritualidade(req: Request, res: Response, next: NextFunction) {
  if (!req.user || (req.user.secretaria !== 'espiritualidade' && !req.user.isAdmin)) {
    return res.status(403).json({ message: "Acesso negado - Secretaria Espiritualidade" });
  }
  next();
}

export function requireMarketing(req: Request, res: Response, next: NextFunction) {
  if (!req.user || (req.user.secretaria !== 'marketing' && !req.user.isAdmin)) {
    return res.status(403).json({ message: "Acesso negado - Secretaria Marketing" });
  }
  next();
}
```

### 3.3 Componente de Navegacao

**Arquivo:** `client/src/components/Navigation.tsx` (ou sidebar)

```typescript
// Logica para exibir menu baseado em secretaria
const showEspiritualidadePanel = user.secretaria === 'espiritualidade' || user.isAdmin;
const showMarketingPanel = user.secretaria === 'marketing' || user.isAdmin;
```

---

## 4. PAINEL ESPIRITUALIDADE

### 4.1 Funcionalidades

#### 4.1.1 Gerenciador de Devocionais

**Recursos:**
- Lista de devocionais (publicados e rascunhos)
- Editor rich text (TipTap)
- Upload de imagem de capa
- Publicar/Despublicar
- Visualizar comentarios

**Formatacao do Editor:**
- Negrito, Italico, Sublinhado
- Listas (ordenadas e nao ordenadas)
- Links
- Embed de YouTube (iframe)
- Embed de Instagram (oEmbed)
- Titulos (H2, H3)

**Padronizacao:**
- Titulo: Fonte padrao, tamanho fixo (nao editavel)
- Corpo: Fonte padrao definida no CSS
- Tamanhos de fonte: 3 opcoes (normal, medio, grande)

#### 4.1.2 Gerenciador de Pedidos de Oracao

**Recursos:**
- Lista de pedidos pendentes
- Aprovar/Rejeitar pedidos
- Marcar como "Em oracao"
- Filtros por categoria e status
- Historico de pedidos moderados

#### 4.1.3 Sistema de Comentarios

**Recursos:**
- Ver comentarios por devocional
- Moderar comentarios
- Excluir comentarios improprios

### 4.2 Rotas do Painel

| Rota | Descricao |
|------|-----------|
| `/admin/espiritualidade` | Dashboard principal |
| `/admin/espiritualidade/devocionais` | Lista de devocionais |
| `/admin/espiritualidade/devocionais/novo` | Criar devocional |
| `/admin/espiritualidade/devocionais/:id` | Editar devocional |
| `/admin/espiritualidade/oracoes` | Gerenciar pedidos |

---

## 5. PAINEL MARKETING

### 5.1 Funcionalidades

#### 5.1.1 Gerenciador de Eventos

**Recursos:**
- CRUD completo de eventos
- Tipos de evento:
  - **Evento Comum:** Apenas informativo
  - **Evento com Inscricao:** Link de inscricao + contador
- Campo Google Maps (URL)
- Upload de imagem de capa
- Calendario visual

**Campos do Evento:**
```typescript
{
  title: string;
  description: string; // Rich text
  shortDescription: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  time: string;
  location: string;
  locationUrl: string; // Google Maps URL
  price: string;
  registrationUrl: string; // Para eventos com inscricao
  requiresRegistration: boolean;
  category: EventCategory;
  isPublished: boolean;
}
```

#### 5.1.2 Calendario Anual

**Recursos:**
- Visualizacao de todos os eventos do ano
- Export ICS para Google Calendar
- Sincronizacao automatica

**Endpoint ICS:**
```
GET /api/site/events/calendar.ics
```

#### 5.1.3 Gerenciador da Diretoria

**Recursos:**
- Selecionar membro do banco de dados de usuarios
- Dados puxados automaticamente:
  - Nome completo
  - Email
  - Foto de perfil
- Campos adicionais:
  - Cargo na diretoria
  - Bio
  - WhatsApp
  - Instagram
  - Ordem de exibicao

#### 5.1.4 Editor de Paginas

**Paginas Editaveis:**
- Quem Somos (missao, visao, valores)
- Agenda (introducao)
- Diretoria (introducao)

### 5.2 Rotas do Painel

| Rota | Descricao |
|------|-----------|
| `/admin/marketing` | Dashboard principal |
| `/admin/marketing/eventos` | Lista de eventos |
| `/admin/marketing/eventos/novo` | Criar evento |
| `/admin/marketing/eventos/:id` | Editar evento |
| `/admin/marketing/calendario` | Calendario anual |
| `/admin/marketing/diretoria` | Gerenciar diretoria |
| `/admin/marketing/paginas` | Editar paginas |

---

## 6. MELHORIAS NA PAGINA DIRETORIA

### 6.1 Alteracoes Visuais

**Remover:**
- Texto "Demais Membros da Diretoria"
- Diferenciacao de tamanho entre presidente/vice e outros

**Novo Layout:**
- Todos os membros com mesmo tamanho de card
- Grid responsivo uniforme
- Ordem definida pelo campo `orderIndex`

### 6.2 Codigo Atual vs Novo

**Atual:**
```typescript
// Separa featured (presidente/vice) de outros
const featuredMembers = boardMembers.filter(m => isFeaturedPosition(m.position));
const otherMembers = boardMembers.filter(m => !isFeaturedPosition(m.position));
```

**Novo:**
```typescript
// Todos os membros ordenados por orderIndex
const allMembers = boardMembers.sort((a, b) => a.orderIndex - b.orderIndex);
```

---

## 7. MELHORIAS NA PAGINA DE ORACAO

### 7.1 Remover Opcao Anonima

**Antes:**
```typescript
const prayerFormSchema = z.object({
  name: z.string().min(2).optional().or(z.literal("")),
  isAnonymous: z.boolean().default(false), // REMOVER
  // ...
});
```

**Depois:**
```typescript
const prayerFormSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio"),
  // isAnonymous removido
  // ...
});
```

### 7.2 Mural da Oracao

**Nova Secao na Pagina:**
- Exibe pedidos APROVADOS
- Mostra apenas: Nome + Pedido (sem categoria ou WhatsApp)
- Botao de interacao "Estou em Oracao"

**Componente:**
```typescript
interface PrayerWallItem {
  id: number;
  name: string;
  request: string;
  prayerCount: number;
  userHasPrayed: boolean;
}
```

**Funcionalidade de Reacao:**
- Usuario logado pode clicar "Estou em Oracao"
- Contador de pessoas orando
- Usuario so pode reagir uma vez por pedido

### 7.3 Nova Tabela: Reacoes de Oracao

```typescript
export const prayerReactions = pgTable("prayer_reactions", {
  id: serial("id").primaryKey(),
  prayerRequestId: integer("prayer_request_id").notNull().references(() => prayerRequests.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueUserPrayer: unique().on(table.userId, table.prayerRequestId),
}));
```

### 7.4 Moderacao Automatica

**Implementacao:**
- Biblioteca de palavras proibidas (portugues)
- Verificacao no backend antes de salvar
- Lista customizavel pelo admin

**Categorias de Filtro:**
- Palavras de baixo calao
- Conteudo sexual
- Xingamentos
- Discurso de odio

**Codigo:**
```typescript
// server/utils/profanity-filter.ts
import Filter from 'bad-words';

const filter = new Filter();
filter.addWords(...palavrasProibidasPT);

export function containsProfanity(text: string): boolean {
  return filter.isProfane(text);
}

export function cleanText(text: string): string {
  return filter.clean(text);
}
```

**Resposta da API quando detectado:**
```json
{
  "error": "Seu pedido contem conteudo inapropriado. Por favor, revise o texto.",
  "code": "CONTENT_MODERATION_FAILED"
}
```

---

## 8. NOVAS TABELAS DO BANCO DE DADOS

### 8.1 Comentarios de Devocionais

```typescript
export const devotionalComments = pgTable("devotional_comments", {
  id: serial("id").primaryKey(),
  devotionalId: integer("devotional_id").notNull().references(() => devotionals.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isApproved: boolean("is_approved").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### 8.2 Reacoes de Oracao

```typescript
export const prayerReactions = pgTable("prayer_reactions", {
  id: serial("id").primaryKey(),
  prayerRequestId: integer("prayer_request_id").notNull().references(() => prayerRequests.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueUserPrayer: unique().on(table.userId, table.prayerRequestId),
}));
```

### 8.3 Alteracoes em Tabelas Existentes

**devotionals:**
```typescript
// Adicionar campo para conteudo rich text (JSON)
contentRich: text("content_rich"), // TipTap JSON
```

**siteEvents:**
```typescript
// Adicionar campo para tipo de evento
requiresRegistration: boolean("requires_registration").notNull().default(false),
```

**prayerRequests:**
```typescript
// Adicionar campos de moderacao
isModerated: boolean("is_moderated").notNull().default(false),
moderatedBy: integer("moderated_by").references(() => users.id),
moderatedAt: timestamp("moderated_at"),
isApproved: boolean("is_approved").notNull().default(false),
```

---

## 9. NOVAS ROTAS DA API

### 9.1 Painel Espiritualidade

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/espiritualidade/devotionals` | Listar devocionais (admin) |
| POST | `/api/espiritualidade/devotionals` | Criar devocional |
| PUT | `/api/espiritualidade/devotionals/:id` | Atualizar devocional |
| DELETE | `/api/espiritualidade/devotionals/:id` | Excluir devocional |
| POST | `/api/espiritualidade/devotionals/:id/publish` | Publicar devocional |
| POST | `/api/espiritualidade/upload` | Upload de imagem |
| GET | `/api/espiritualidade/prayers` | Listar pedidos de oracao |
| PATCH | `/api/espiritualidade/prayers/:id/approve` | Aprovar pedido |
| PATCH | `/api/espiritualidade/prayers/:id/reject` | Rejeitar pedido |
| GET | `/api/espiritualidade/devotionals/:id/comments` | Listar comentarios |
| DELETE | `/api/espiritualidade/comments/:id` | Excluir comentario |

### 9.2 Painel Marketing

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/marketing/events` | Listar eventos (admin) |
| POST | `/api/marketing/events` | Criar evento |
| PUT | `/api/marketing/events/:id` | Atualizar evento |
| DELETE | `/api/marketing/events/:id` | Excluir evento |
| POST | `/api/marketing/upload` | Upload de imagem |
| GET | `/api/marketing/board-members` | Listar diretoria (admin) |
| POST | `/api/marketing/board-members` | Adicionar membro |
| PUT | `/api/marketing/board-members/:id` | Atualizar membro |
| DELETE | `/api/marketing/board-members/:id` | Remover membro |
| GET | `/api/marketing/site-content` | Obter conteudo do site |
| PUT | `/api/marketing/site-content/:page/:section` | Atualizar conteudo |
| GET | `/api/marketing/users` | Listar usuarios para selecao |

### 9.3 Rotas Publicas (atualizacoes)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/site/prayer-wall` | Mural da oracao |
| POST | `/api/site/prayer-wall/:id/react` | Reagir "Estou em oracao" |
| POST | `/api/site/devotionals/:id/comments` | Adicionar comentario |
| GET | `/api/site/devotionals/:id/comments` | Ver comentarios |
| GET | `/api/site/events/calendar.ics` | Calendario ICS |

---

## 10. COMPONENTES FRONTEND

### 10.1 Novos Componentes

| Componente | Localizacao | Descricao |
|------------|-------------|-----------|
| `RichTextEditor` | `components/ui/rich-text-editor.tsx` | Editor TipTap |
| `ImageUpload` | `components/ui/image-upload.tsx` | Upload com preview |
| `PrayerWall` | `components/site/PrayerWall.tsx` | Mural da oracao |
| `PrayerCard` | `components/site/PrayerCard.tsx` | Card de pedido |
| `DevotionalComments` | `components/site/DevotionalComments.tsx` | Secao de comentarios |
| `EventCalendar` | `components/admin/EventCalendar.tsx` | Calendario de eventos |
| `BoardMemberSelector` | `components/admin/BoardMemberSelector.tsx` | Seletor de usuarios |

### 10.2 Paginas Novas

| Pagina | Localizacao |
|--------|-------------|
| Dashboard Espiritualidade | `pages/admin/EspiritualidadeDashboard.tsx` |
| Gerenciar Devocionais | `pages/admin/EspiritualidadeDevocionais.tsx` |
| Editor Devocional | `pages/admin/EspiritualidadeDevocionalEditor.tsx` |
| Gerenciar Oracoes | `pages/admin/EspiritualidadeOracoes.tsx` |
| Dashboard Marketing | `pages/admin/MarketingDashboard.tsx` |
| Gerenciar Eventos | `pages/admin/MarketingEventos.tsx` |
| Editor Evento | `pages/admin/MarketingEventoEditor.tsx` |
| Calendario Anual | `pages/admin/MarketingCalendario.tsx` |
| Gerenciar Diretoria | `pages/admin/MarketingDiretoria.tsx` |
| Editar Paginas | `pages/admin/MarketingPaginas.tsx` |

---

## 11. CRONOGRAMA DE IMPLEMENTACAO

### Fase 1: Fundacao (Prioridade Alta)
1. Atualizar tipo Secretaria no schema
2. Criar novos middlewares de autorizacao
3. Adicionar novas tabelas ao banco de dados
4. Implementar filtro de palavras proibidas

### Fase 2: Painel Espiritualidade
1. Criar editor de devocionais com TipTap
2. Sistema de upload de imagens
3. Gerenciador de pedidos de oracao
4. Sistema de comentarios

### Fase 3: Painel Marketing
1. CRUD de eventos
2. Calendario com export ICS
3. Gerenciador da diretoria
4. Editor de paginas do site

### Fase 4: Melhorias no Site Publico
1. Atualizar pagina de oracao
2. Implementar Mural da Oracao
3. Atualizar pagina da diretoria
4. Adicionar sistema de comentarios nas devocionais

### Fase 5: Testes e Ajustes
1. Testes de integracao
2. Ajustes de UI/UX
3. Performance e otimizacoes
4. Documentacao final

---

## DEPENDENCIAS NECESSARIAS

### NPM Packages
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-youtube
npm install @tiptap/extension-link
npm install bad-words
npm install ical-generator
```

### Integracao ja Instalada
- OpenAI (para possivel moderacao avancada com IA)
- Gemini (alternativa para moderacao com IA)
- Multer (upload de arquivos)

---

## OBSERVACOES FINAIS

1. **Seguranca:** Todas as rotas admin devem usar os middlewares apropriados
2. **Validacao:** Usar Zod para validar todas as entradas
3. **Moderacao:** Implementar fallback manual caso o filtro automatico falhe
4. **Upload:** Limitar tamanho e tipos de arquivo (max 5MB, apenas imagens)
5. **Rich Text:** Sanitizar HTML antes de salvar para evitar XSS

---

*Documento criado em 05/12/2025*
*Aprovacao pendente antes da implementacao*
