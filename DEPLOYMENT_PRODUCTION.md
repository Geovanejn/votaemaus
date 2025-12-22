# Guia de Deployment em Produção - Render + Neon

## ⚠️ AVISO PRÉ-DEPLOYMENT

Verifique `SCHEMA_VERIFICATION_REPORT.md` - há discrepâncias no schema que precisam ser resolvidas.

## Visão Geral do Sistema

Este documento descreve como fazer deploy da aplicação **Emaús** em produção usando:
- **Hosting**: Render.com
- **Banco de Dados**: Neon (PostgreSQL)

## Verificação Pré-Deployment

### ✅ Banco de Dados

**55 tabelas criadas e configuradas:**

**Base Tables (sem dependências)**
- users (11 colunas)
- positions (2 colunas)
- elections, bible_verses, daily_mission_content
- daily_missions, streak_milestones, instagram_posts
- verification_codes, anonymous_push_subscriptions

**Election Management**
- candidates, election_winners, election_positions
- election_attendance, votes, pdf_verifications

**Content Management**
- devotionals, devotional_comments, devotional_readings
- site_events, site_content, banners
- board_members

**Learning System**
- seasons (16 colunas), study_weeks, study_lessons
- study_units, study_quiz_questions, study_quiz_responses
- study_profiles (30 colunas - maior tabela)

**Gamification**
- achievements, user_achievements, achievement_xp
- daily_missions, user_daily_missions, daily_mission_xp
- streak_milestones, user_streak_milestones, streak_freeze_history
- xp_transactions, crystal_transactions
- leaderboard_entries, daily_activity

**Learning Progress**
- weekly_goal_progress, weekly_practice, weekly_practice_bonus
- user_lesson_progress, user_unit_progress, practice_questions
- user_season_progress, season_rankings

**Social Features**
- prayer_requests (22 colunas), prayer_reactions
- notifications, push_subscriptions

**Audit & Logging**
- audit_logs

**Bible System**
- verse_readings

### 📊 Estatísticas do Schema

```
Total de Tabelas: 55
Total de Colunas: 509
Média por Tabela: 9.3
Tabela Maior: study_profiles (30 colunas)
Tabela Menor: positions (2 colunas)
```

## Configuração no Neon

### 1. Criar Banco de Dados no Neon
1. Acesse [neon.tech](https://neon.tech)
2. Crie um novo projeto PostgreSQL
3. Crie um banco de dados chamado `emaus` ou similar
4. Copie a connection string: `postgresql://...`

### 2. Variáveis de Ambiente Necessárias

```env
# Database - OBRIGATÓRIO
DATABASE_URL=postgresql://user:password@project.neon.tech/dbname?sslmode=require

# Security - OBRIGATÓRIO
JWT_SECRET=seu-jwt-secret-muito-seguro-aqui (gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=seu-session-secret (gerar igual)

# Admin - OBRIGATÓRIO
ADMIN_EMAIL=seu-email-admin@example.com
ADMIN_PASSWORD=senha-super-segura

# Email & Notifications - OBRIGATÓRIO
RESEND_API_KEY=re_sua_chave_aqui
VAPID_PUBLIC_KEY=sua_chave_publica
VAPID_PRIVATE_KEY=sua_chave_privada
VITE_VAPID_PUBLIC_KEY=sua_chave_publica

# Google APIs (Opcional)
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret

# Instagram (Opcional)
INSTAGRAM_ACCESS_TOKEN=seu-token
INSTAGRAM_USER_ID=seu-user-id

# AI (Opcional)
OPENAI_API_KEY=sua-chave-openai
GEMINI_API_KEY=sua-chave-gemini

# Node Environment
NODE_ENV=production
```

## Deployment no Render

### 1. Preparar Repositório

```bash
# Garantir que build está funcionando localmente
npm run build

# Garantir que migrations estão atualizadas
npm run db:push
```

### 2. Criar Web Service no Render

1. Acesse [render.com](https://render.com)
2. Clique em "New +" > "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: emaus
   - **Root Directory**: `.`
   - **Runtime**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `node ./dist/index.cjs`

### 3. Definir Variáveis de Ambiente

No dashboard do Render:
1. Vá para "Environment"
2. Adicione todas as variáveis listadas acima
3. Use a DATABASE_URL do Neon

### 4. Deploy

Render fará deploy automaticamente a cada push no branch principal.

## Checklist Pré-Produção

### Base de Dados
- [ ] Neon project criado
- [ ] Database criado
- [ ] Variável DATABASE_URL obtida
- [ ] SSL enabled no Neon
- [ ] **Revisar SCHEMA_VERIFICATION_REPORT.md**

### Aplicação
- [ ] `npm run build` funciona localmente
- [ ] `node ./dist/index.cjs` inicia sem erros
- [ ] `npm run db:push` sincroniza schema

### Render
- [ ] Web Service criado
- [ ] Build command: `npm run build`
- [ ] Start command: `node ./dist/index.cjs`
- [ ] Todas variáveis de ambiente definidas
- [ ] DATABASE_URL aponta para Neon

### Secrets
- [ ] JWT_SECRET - 64+ caracteres aleatórios
- [ ] SESSION_SECRET - 64+ caracteres aleatórios
- [ ] ADMIN_PASSWORD - forte (mínimo 12 caracteres)
- [ ] Todos os tokens de APIs configurados
- [ ] Nenhum secret commitado no repositório

## Monitoramento em Produção

### Render
- Logs estão em "Logs" no dashboard
- Monitore CPU, memória, banda

### Neon
- Acesse console Neon para monitorar banco
- Veja query performance
- Monitore connections e storage

## Troubleshooting

### Erro: "DATABASE_URL must be set"
- Verifique se DATABASE_URL está definida no Render
- Verifique se não há typos

### Erro: "Connection timeout"
- Verifique se SSL está habilitado no Neon
- Verifique DATABASE_URL tem `?sslmode=require`

### Tabelas não existem
- Execute `npm run db:push` localmente
- Verifique migration em `migrations/0000_seasons_schema.sql`

## Rollback em Caso de Problema

Se algo der errado:

1. **No Render**: Use "Deployments" > "Previous" para reverter
2. **No Neon**: Backup automático disponível (verifique console)
3. **Local**: Use `npm run db:push` para resincronizar schema

## Referências

- **Render Docs**: https://render.com/docs
- **Neon Docs**: https://neon.tech/docs
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Drizzle ORM**: https://orm.drizzle.team

---

**Data de Criação**: 22 de Dezembro de 2024
**Versão do Node**: 20+
**Banco de Dados**: PostgreSQL 14+
**Tabelas**: 55
**Colunas**: 509
