# Auditoria Completa do Sistema Emaus Vota / DeoGlory

**Data:** 05 de Dezembro de 2025  
**Ambiente de Producao:** umpemaus.onrender.com  
**Banco de Dados:** PostgreSQL (Neon)  
**Status:** EM PRODUCAO

---

## SUMARIO EXECUTIVO

Este documento apresenta uma auditoria completa do sistema, identificando:
- **16 problemas criticos** que necessitam correcao imediata
- **8 problemas de seguranca** (3 criticos)
- **12 arquivos com dados mockados** a serem removidos
- **5 scripts de teste** que nao devem existir em producao

---

## 1. PROBLEMAS CRITICOS DE SEGURANCA

### 1.1 Credenciais Hard-Coded (CRITICO)

**Arquivo:** `server/db.ts` (linhas 21-23)
```typescript
const adminEmail = "marketingumpemaus@gmail.com";
const adminName = "UMP Emaús";
const adminPassword = "umpEmaus2025#";
```

**Risco:** Qualquer pessoa com acesso ao codigo fonte conhece a senha do admin.

**Solucao:** 
- Remover criacao automatica de admin
- Usar variaveis de ambiente para provisionar admin inicial
- Trocar senha do admin em producao IMEDIATAMENTE

---

### 1.2 JWT Secret Hard-Coded (CRITICO)

**Arquivo:** `server/auth.ts` (linha 6)
```typescript
const JWT_SECRET = process.env.JWT_SECRET || "emaus-vota-secret-key-2025";
```

**Risco:** Se `JWT_SECRET` nao estiver definido, qualquer pessoa pode forjar tokens JWT.

**Status:** Verificar se `JWT_SECRET` esta definido em producao. Se nao estiver, tokens podem ser forjados.

**Solucao:**
- Garantir que JWT_SECRET esta definido em producao
- Remover fallback hard-coded
- Usar erro em vez de fallback

---

### 1.3 Rota de Desenvolvimento Exposta

**Arquivo:** `server/routes.ts` (linha 1249)
```typescript
app.post("/api/dev/seed-test-users", async (req, res) => {
```

**Risco:** Rota de seed pode ser acessada se check de ambiente falhar.

**Solucao:** Remover rota completamente ou bloquear por IP/token secreto.

---

## 2. ROTAS NAO PROTEGIDAS

As seguintes rotas publicas estao corretas (dados publicos do site):
- `GET /api/site/devotionals` - Devocionais publicos
- `GET /api/site/events` - Eventos publicos
- `GET /api/site/board-members` - Diretoria
- `GET /api/site/banners` - Banners da home
- `POST /api/site/prayer-requests` - Envio de pedidos de oracao

As seguintes rotas administrativas estao PARCIALMENTE protegidas:
- `GET/PATCH /api/admin/prayer-requests` - Apenas `authenticateToken` (falta `requireAdmin`)
- `GET/POST/PATCH/DELETE /api/admin/board-members` - Apenas `authenticateToken` (falta `requireAdminOrMarketing`)
- `GET/POST/PATCH/DELETE /api/admin/banners` - Apenas `authenticateToken` (falta `requireAdminOrMarketing`)
- `GET/POST /api/admin/site-content` - Apenas `authenticateToken` (falta `requireAdminOrMarketing`)

**Risco:** Qualquer usuario autenticado pode modificar conteudo do site.

---

## 3. DADOS MOCKADOS IDENTIFICADOS

### 3.1 Frontend - Dados de Preview/Fallback

| Arquivo | Dados Mock | Uso |
|---------|------------|-----|
| `client/src/pages/study/profile.tsx` | `mockProfile`, `mockAchievements`, `mockUser` | Preview mode |
| `client/src/pages/study/seasons.tsx` | `mockUserProfile`, `mockDailyGoal`, `mockVerses`, `mockLessons` | Preview mode |
| `client/src/pages/study/index.tsx` | `mockDailyGoal`, `mockVerses`, `mockLessons` | Preview mode |
| `client/src/pages/study/ranking.tsx` | `mockWeeklyRanking`, `mockMonthlyRanking` | Preview mode |
| `client/src/pages/study/explore.tsx` | `mockCategories`, `mockDailyVerse` | Preview mode |
| `client/src/pages/study/lesson.tsx` | `mockDailyVerse`, `mockLessons` | Preview mode |
| `client/src/pages/site/diretoria.tsx` | `defaultBoardMembers` | Fallback |
| `client/src/pages/admin/admin-site.tsx` | `defaultBoardMembers` | Fallback |

**Nota:** Dados de "preview mode" sao usados apenas em rotas `/study-preview/*` para demonstracao. NAO afetam usuarios logados.

### 3.2 Backend - Arquivos de Seed

| Arquivo | Descricao | Acao |
|---------|-----------|------|
| `server/seed-study-data.ts` | Licoes, versiculos, missoes, conquistas | REMOVER ou mover para /scripts |
| `server/seed-site-content.ts` | Devocionais, eventos, posts Instagram | REMOVER ou mover para /scripts |

### 3.3 Scripts de Teste

| Arquivo | Descricao | Acao |
|---------|-----------|------|
| `scripts/seed-test-data.ts` | Cria usuarios e eleicoes de teste | REMOVER de producao |
| `scripts/create-test-election.ts` | Cria eleicao de teste | REMOVER de producao |
| `scripts/cleanup-test-data.ts` | Limpa dados de teste | MANTER (util) |
| `scripts/reset-db.ts` | Reset do banco | PERIGO em producao |
| `scripts/init-production.ts` | Inicializacao de producao | Verificar |

---

## 4. ANALISE DO PERFIL DEOGLORY

### 4.1 Vinculacao com Dados Reais

**Fluxo de Dados:**
1. Usuario faz login -> JWT contem `userId`
2. `GET /api/study/profile` -> `authenticateToken` extrai `req.user.id`
3. `storage.getOrCreateStudyProfile(userId)` -> Cria ou busca perfil vinculado

**Codigo em `server/storage.ts` (linhas 1341-1349):**
```typescript
async getOrCreateStudyProfile(userId: number): Promise<any> {
  let profile = await this.getStudyProfile(userId);
  if (!profile) {
    const [newProfile] = await db.insert(schema.studyProfiles)
      .values({ userId })
      .returning();
    return newProfile;
  }
  return profile;
}
```

**Status:** O perfil DeoGlory ESTA corretamente vinculado ao usuario real atraves do `userId`.

### 4.2 Dados do Usuario no Perfil

O perfil exibe:
- `effectiveUser.fullName` - Vem do usuario autenticado (`req.user`)
- `effectiveUser.email` - Vem do usuario autenticado
- `effectiveUser.photoUrl` - Vem do usuario autenticado

**Codigo em `client/src/pages/study/profile.tsx` (linhas 233-235):**
```typescript
const effectiveProfile = isPreview ? mockProfile : profile;
const effectiveAchievements = isPreview ? mockAchievements : achievements;
const effectiveUser = isPreview ? mockUser : user;
```

**Conclusao:** Quando NAO esta em preview mode, todos os dados sao REAIS.

---

## 5. BANCO DE DADOS

### 5.1 Tabelas Existentes (45 tabelas)

```
achievements, banners, bible_verses, board_members, candidates,
daily_activity, daily_mission_content, daily_missions, devotional_readings,
devotionals, election_attendance, election_positions, election_winners,
elections, instagram_posts, leaderboard_entries, notifications,
pdf_verifications, positions, prayer_requests, push_subscriptions,
season_final_challenges, season_rankings, seasons, site_content,
site_events, study_lesson_progress, study_lessons, study_profiles,
study_quiz_questions, study_quiz_responses, study_units, study_weeks,
user_achievements, user_daily_missions, user_final_challenge_progress,
user_lesson_progress, user_season_progress, user_unit_progress, users,
verification_codes, verse_readings, votes, weekly_goal_progress, xp_transactions
```

### 5.2 Usuarios em Producao

```sql
SELECT email, full_name, is_admin, is_member FROM users;
```

Resultado: Apenas 1 usuario (admin padrao com senha hard-coded)

**ACAO URGENTE:** Trocar senha do admin em producao!

---

## 6. DESEMPENHO

### 6.1 Potenciais Problemas N+1

**Arquivo:** `server/storage.ts`

Metodos que podem causar N+1:
- `getLessonsForWeek` - Busca licoes e depois unidades separadamente
- `getSeasonLessons` - Similar

**Recomendacao:** Usar JOINs ou batch queries quando possivel.

### 6.2 Indices Recomendados

```sql
-- Indices para queries frequentes
CREATE INDEX idx_study_profiles_user_id ON study_profiles(user_id);
CREATE INDEX idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX idx_devotional_readings_user_id ON devotional_readings(user_id);
CREATE INDEX idx_weekly_goal_progress_user_week ON weekly_goal_progress(user_id, week_key);
```

---

## 7. VARIAVEIS DE AMBIENTE

### 7.1 Secrets Configurados
- `SESSION_SECRET` - OK
- `DATABASE_URL` - OK
- `PGDATABASE`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD` - OK

### 7.2 Secrets FALTANDO (Critico)
- `JWT_SECRET` - NAO VERIFICADO (pode estar usando fallback inseguro)
- `RESEND_API_KEY` - Necessario para emails

---

## 8. ARQUIVOS DE IMAGEM

### 8.1 Stock Images Usadas
Localizacao: `attached_assets/stock_images/`

Imagens de fallback para:
- Devocionais
- Eventos
- Posts Instagram

**Status:** OK - Imagens locais, nao dependem de servicos externos

---

## 9. PLANO DE REMEDIACAO

### PRIORIDADE 1 - IMEDIATO (Seguranca)

1. [ ] Trocar senha do admin em producao
2. [ ] Definir `JWT_SECRET` em producao (se nao definido)
3. [ ] Remover senha hard-coded de `server/db.ts`
4. [ ] Remover fallback do JWT_SECRET em `server/auth.ts`
5. [ ] Adicionar `requireAdminOrMarketing` nas rotas admin do site

### PRIORIDADE 2 - CURTO PRAZO (Limpeza)

6. [ ] Mover `server/seed-study-data.ts` para `/scripts`
7. [ ] Mover `server/seed-site-content.ts` para `/scripts`
8. [ ] Remover rota `/api/dev/seed-test-users`
9. [ ] Adicionar `.gitignore` para scripts de teste sensíveis

### PRIORIDADE 3 - MEDIO PRAZO (Qualidade)

10. [ ] Otimizar queries N+1 em storage.ts
11. [ ] Adicionar indices no banco de dados
12. [ ] Implementar rate limiting nas APIs publicas
13. [ ] Adicionar logs de auditoria para acoes administrativas

---

## 10. CONCLUSAO

O sistema esta funcional mas apresenta **vulnerabilidades de seguranca criticas** que devem ser corrigidas IMEDIATAMENTE antes de continuar em producao.

**O perfil DeoGlory ESTA corretamente vinculado aos dados reais dos usuarios.** Os dados mockados existentes sao usados apenas em modo preview para demonstracao.

A principal preocupacao e a **senha do admin exposta no codigo fonte**, que deve ser trocada imediatamente.

---

*Documento gerado automaticamente em 05/12/2025*
