# Guia de Deployment em Produção - Render + Neon

## Visão Geral do Sistema

Este documento descreve como fazer deploy da aplicação **Emaús** em produção usando:
- **Hosting**: Render.com
- **Banco de Dados**: Neon (PostgreSQL)

## Verificação Pré-Deployment

### ✅ Banco de Dados

**55 tabelas criadas e configuradas:**

1. **Base Tables (sem dependências)**
   - users, positions, elections, bible_verses
   - daily_mission_content, daily_missions
   - streak_milestones, instagram_posts
   - verification_codes, anonymous_push_subscriptions

2. **Election Management**
   - candidates, election_winners
   - election_positions, election_attendance
   - votes, pdf_verifications

3. **Content Management**
   - devotionals, devotional_comments, devotional_readings
   - site_events, site_content, banners
   - board_members

4. **Learning System (Seasons & Lessons)**
   - seasons, season_final_challenges
   - season_rankings, user_season_progress
   - user_final_challenge_progress
   - study_weeks, study_lessons, study_units
   - study_quiz_questions, study_quiz_responses
   - user_lesson_progress, user_unit_progress

5. **Gamification**
   - achievements, user_achievements, achievement_xp
   - daily_missions, user_daily_missions, daily_mission_xp
   - streak_milestones, user_streak_milestones, streak_freeze_history
   - user_streak_milestones, daily_activity
   - xp_transactions, crystal_transactions
   - leaderboard_entries

6. **Learning Progress**
   - weekly_goal_progress, weekly_practice, weekly_practice_bonus
   - practice_questions, study_profiles

7. **Social Features**
   - prayer_requests, prayer_reactions
   - notifications, push_subscriptions

8. **Audit & Logging**
   - audit_logs

9. **Bible Verse System**
   - verse_readings

## Configuração no Neon

### 1. Criar Banco de Dados no Neon
1. Acesse [neon.tech](https://neon.tech)
2. Crie um novo projeto
3. Crie um banco de dados chamado `emaús` ou similar
4. Copie a connection string: `postgresql://...`

### 2. Variáveis de Ambiente Necessárias

```env
# Database
DATABASE_URL=postgresql://user:password@project.neon.tech/dbname?sslmode=require

# JWT & Security
JWT_SECRET=seu-jwt-secret-muito-seguro-aqui

# Email & Notifications
RESEND_API_KEY=re_sua_chave_aqui
VAPID_PUBLIC_KEY=sua_chave_publica
VAPID_PRIVATE_KEY=sua_chave_privada

# Admin
ADMIN_EMAIL=seu-email-admin@example.com
ADMIN_PASSWORD=senha-super-segura

# Session
SESSION_SECRET=seu-session-secret

# Google APIs (opcional)
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_CALENDAR_CREDENTIALS=seu-credentials-json

# Instagram (opcional)
INSTAGRAM_ACCESS_TOKEN=seu-token
INSTAGRAM_USER_ID=seu-user-id

# OpenAI (opcional)
OPENAI_API_KEY=sua-chave-openai

# Google Gemini (opcional)
GEMINI_API_KEY=sua-chave-gemini

# Frontend URL (para CORS)
VITE_VAPID_PUBLIC_KEY=sua_chave_publica
```

## Deployment no Render

### 1. Preparar Repositório

```bash
# Garantir que build está funcionando localmente
npm run build

# Garantir que migrations estão atualizadas
npm run db:generate  # Se necessário
npm run db:push      # Para sincronizar schema
```

### 2. Criar Web Service no Render

1. Acesse [render.com](https://render.com)
2. Clique em "New +" > "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: emaús (ou similar)
   - **Root Directory**: `.` (raiz)
   - **Runtime**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `node ./dist/index.cjs`

### 3. Definir Variáveis de Ambiente

No dashboard do Render:
1. Vá para "Environment"
2. Adicione todas as variáveis listadas acima
3. Use a DATABASE_URL do Neon

### 4. Deploy

1. Render fará deploy automaticamente a cada push no branch principal
2. Ou faça deploy manual: clique "Deploy"

## Checklist Pré-Produção

### Base de Dados
- [ ] Neon project criado
- [ ] Database criado
- [ ] Variável DATABASE_URL obtida
- [ ] SSL enabled no Neon (automático)

### Aplicação
- [ ] `npm run build` funciona localmente
- [ ] `node ./dist/index.cjs` inicia sem erros
- [ ] Todas as 55 tabelas estão em `create-tables.ts`
- [ ] Migration file (`migrations/0000_seasons_schema.sql`) está completo

### Render
- [ ] Web Service criado
- [ ] Build command: `npm run build`
- [ ] Start command: `node ./dist/index.cjs`
- [ ] Todas variáveis de ambiente definidas
- [ ] DATABASE_URL aponta para Neon

### Secrets
- [ ] JWT_SECRET - 64+ caracteres aleatórios
- [ ] SESSION_SECRET - seguro
- [ ] ADMIN_PASSWORD - forte
- [ ] Todos os tokens de APIs configurados

## Monitoramento em Produção

### Render
- Logs estão em "Logs" no dashboard
- Monitore CPU, memória, banda

### Neon
- Acesse console Neon para monitorar banco
- Veja query performance

## Rollback em Caso de Problema

Se algo der errado:

1. **No Render**: Use "Deployments" > "Previous" para reverter
2. **No Neon**: Banco de dados separado, sem risco de rollback no código
3. **Local**: Use `npm run db:push` para resincronizar schema

## Contato & Suporte

- **Render Docs**: https://render.com/docs
- **Neon Docs**: https://neon.tech/docs
- **PostgreSQL**: https://www.postgresql.org/docs/

---

**Data de Criação**: 22 de Dezembro de 2024
**Versão do Node**: 20+
**Banco de Dados**: PostgreSQL 14+
