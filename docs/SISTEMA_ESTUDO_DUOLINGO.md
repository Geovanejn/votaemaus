# Sistema de Estudo Estilo Duolingo - Documentação Completa

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológico Recomendado](#2-stack-tecnológico-recomendado)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Modelo de Dados (Database Schema)](#4-modelo-de-dados-database-schema)
5. [Sistema de Gamificação](#5-sistema-de-gamificação)
6. [Integração com IA](#6-integração-com-ia)
7. [Fluxo do Usuário e UX](#7-fluxo-do-usuário-e-ux)
8. [Painel Administrativo](#8-painel-administrativo)
9. [Roadmap de Implementação](#9-roadmap-de-implementação)
10. [Desafios e Soluções](#10-desafios-e-soluções)
11. [Decisões Pendentes](#11-decisões-pendentes)

---

## 1. Visão Geral

### 1.1 Objetivo do Sistema
Criar uma plataforma de estudo/meditação gamificada que replica a experiência do Duolingo, permitindo que administradores façam upload de PDFs semanais que são processados por IA para gerar automaticamente:
- Lições estruturadas
- Perguntas e exercícios
- Desafios
- Metas semanais

### 1.2 Características Principais
- **Mobile-first**: Interface otimizada para dispositivos móveis
- **Feedback imediato**: Respostas instantâneas como no Duolingo (verde/vermelho, animações, sons)
- **Gamificação completa**: XP, streaks, níveis, conquistas, rankings
- **IA integrada**: Processamento automático de PDFs e geração de conteúdo
- **Estudos semanais**: Conteúdo renovado semanalmente pelo administrador

### 1.3 Público-Alvo
- Membros da comunidade que desejam estudar e meditar semanalmente
- Administradores que gerenciam o conteúdo semanal

---

## 2. Stack Tecnológico Recomendado

### 2.1 Frontend (Opções)

#### Opção A: PWA (Progressive Web App) - RECOMENDADO PARA INÍCIO RÁPIDO
```
React + Vite (já existente no projeto)
├── TailwindCSS + Shadcn UI (já configurado)
├── Framer Motion (animações fluidas)
├── TanStack Query (cache e estado)
├── Socket.IO Client (tempo real)
└── Workbox (PWA/offline)
```

**Vantagens:**
- Reutiliza código existente
- Desenvolvimento mais rápido
- Funciona em todos os dispositivos
- Pode ser "instalado" como app

**Desvantagens:**
- Menos acesso a recursos nativos (haptics limitado)
- Performance ligeiramente inferior a apps nativos

#### Opção B: React Native + Expo
```
React Native + Expo
├── NativeWind (TailwindCSS para RN)
├── React Navigation
├── Expo Haptics (vibração)
├── Expo Audio (sons)
└── React Native Reanimated (animações)
```

**Vantagens:**
- Experiência verdadeiramente nativa
- Haptics, sons, notificações push nativas
- Performance superior em mobile

**Desvantagens:**
- Desenvolvimento mais complexo
- Precisa manter web e mobile separados
- Curva de aprendizado maior

### 2.2 Backend
```
Node.js + Express (já existente)
├── Drizzle ORM + PostgreSQL (já configurado)
├── Socket.IO (eventos em tempo real)
├── Redis (cache de rankings, sessões)
├── BullMQ (fila de jobs para IA)
└── OpenAI API (processamento de PDFs)
```

### 2.3 IA e Processamento
```
Pipeline de IA
├── OpenAI GPT-4 (extração e geração de conteúdo)
├── PDF.js ou pdf-parse (leitura de PDFs)
├── LangChain (orquestração de prompts)
└── PGVector ou Pinecone (embeddings opcionais)
```

### 2.4 Infraestrutura
```
Replit (hospedagem atual)
├── Object Storage (PDFs e assets)
├── PostgreSQL (banco de dados)
├── WebSockets (tempo real)
└── CDN (assets estáticos)
```

### 2.5 Recomendação Final de Stack
Para equilíbrio entre velocidade de desenvolvimento e experiência mobile:

| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| Frontend | React + Vite (PWA) | Reutiliza código existente, rápido de implementar |
| Animações | Framer Motion | Animações fluidas, API simples |
| Estado | TanStack Query + Zustand | Cache automático, estado global leve |
| Tempo Real | Socket.IO | Feedback instantâneo, eventos live |
| Backend | Express + Drizzle | Já configurado no projeto |
| IA | OpenAI GPT-4 | Melhor qualidade de extração/geração |
| Fila de Jobs | BullMQ + Redis | Processamento assíncrono de PDFs |

---

## 3. Arquitetura do Sistema

### 3.1 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (PWA)                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  App Mobile  │  │ Lesson Player│  │  Admin Panel │  │  Gamification│     │
│  │   (Mapa)     │  │  (Exercícios)│  │  (Upload PDF)│  │  (XP/Streak) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
              HTTP/REST       WebSocket        File Upload
                    │               │               │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (Express)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  API Routes  │  │  Socket.IO   │  │  AI Service  │  │  Job Queue   │     │
│  │  (REST)      │  │  (Real-time) │  │  (OpenAI)    │  │  (BullMQ)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
│                              │                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        STORAGE LAYER (Drizzle ORM)                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
             ┌──────────┐    ┌──────────┐    ┌──────────┐
             │PostgreSQL│    │  Redis   │    │  Object  │
             │ (Dados)  │    │ (Cache)  │    │ Storage  │
             └──────────┘    └──────────┘    └──────────┘
```

### 3.2 Fluxo de Dados

#### Fluxo 1: Upload de PDF pelo Admin
```
Admin → Upload PDF → API → Object Storage
                       ↓
                 Job Queue (BullMQ)
                       ↓
              AI Worker processa
                       ↓
           Extrai texto do PDF
                       ↓
         GPT-4 gera lições/perguntas
                       ↓
         Salva no PostgreSQL
                       ↓
         Notifica Admin (WebSocket)
                       ↓
         Admin revisa e publica
```

#### Fluxo 2: Usuário fazendo lição
```
Usuário → Inicia lição → API busca conteúdo
                              ↓
                  Renderiza exercícios
                              ↓
          Usuário responde → Validação local
                              ↓
           Feedback imediato (animação/som)
                              ↓
               API registra progresso
                              ↓
         Atualiza XP/Streak (WebSocket)
                              ↓
         Atualiza ranking em tempo real
```

---

## 4. Modelo de Dados (Database Schema)

### 4.1 Tabelas Principais

```typescript
// ==================== USUÁRIOS ====================

// Tabela de usuários (já existe no projeto, adaptar)
users {
  id: serial PRIMARY KEY
  email: varchar UNIQUE
  password_hash: varchar
  name: varchar
  avatar_url: varchar
  role: enum('user', 'admin')
  created_at: timestamp
  updated_at: timestamp
}

// Perfil de gamificação do usuário
user_profiles {
  id: serial PRIMARY KEY
  user_id: integer REFERENCES users(id)
  total_xp: integer DEFAULT 0
  current_level: integer DEFAULT 1
  current_streak: integer DEFAULT 0
  longest_streak: integer DEFAULT 0
  hearts: integer DEFAULT 5
  hearts_refill_at: timestamp
  last_activity_date: date
  daily_goal: integer DEFAULT 10  // minutos por dia
  timezone: varchar DEFAULT 'America/Sao_Paulo'
  streak_freeze_count: integer DEFAULT 0
  created_at: timestamp
  updated_at: timestamp
}

// ==================== CONTEÚDO ====================

// Semanas de estudo (cada upload de PDF)
study_weeks {
  id: serial PRIMARY KEY
  week_number: integer
  year: integer
  title: varchar
  description: text
  pdf_url: varchar
  status: enum('processing', 'draft', 'published', 'archived')
  published_at: timestamp
  created_by: integer REFERENCES users(id)
  ai_metadata: jsonb  // metadados da extração IA
  created_at: timestamp
  updated_at: timestamp
}

// Lições dentro de cada semana
lessons {
  id: serial PRIMARY KEY
  study_week_id: integer REFERENCES study_weeks(id)
  order_index: integer  // ordem na semana
  title: varchar
  type: enum('study', 'meditation', 'challenge', 'review')
  description: text
  xp_reward: integer DEFAULT 10
  estimated_minutes: integer DEFAULT 5
  icon: varchar  // ícone para o mapa
  is_bonus: boolean DEFAULT false
  created_at: timestamp
  updated_at: timestamp
}

// Unidades/Exercícios dentro de cada lição
lesson_units {
  id: serial PRIMARY KEY
  lesson_id: integer REFERENCES lessons(id)
  order_index: integer
  type: enum('text', 'question', 'meditation', 'reflection', 'audio')
  content: jsonb  // conteúdo estruturado
  xp_value: integer DEFAULT 2
  created_at: timestamp
}

// Estrutura do content JSONB por tipo:
// type='text': { title, body, highlight }
// type='question': { question, options[], correct_index, explanation, hint }
// type='meditation': { title, duration_seconds, audio_url?, instructions }
// type='reflection': { prompt, min_words? }
// type='audio': { title, audio_url, transcript? }

// ==================== PROGRESSO ====================

// Progresso do usuário em cada lição
user_lesson_progress {
  id: serial PRIMARY KEY
  user_id: integer REFERENCES users(id)
  lesson_id: integer REFERENCES lessons(id)
  status: enum('locked', 'available', 'in_progress', 'completed')
  started_at: timestamp
  completed_at: timestamp
  xp_earned: integer DEFAULT 0
  mistakes_count: integer DEFAULT 0
  time_spent_seconds: integer DEFAULT 0
  UNIQUE(user_id, lesson_id)
}

// Progresso do usuário em cada unidade
user_unit_progress {
  id: serial PRIMARY KEY
  user_id: integer REFERENCES users(id)
  lesson_unit_id: integer REFERENCES lesson_units(id)
  is_completed: boolean DEFAULT false
  answer_given: jsonb  // resposta do usuário
  is_correct: boolean
  attempts: integer DEFAULT 0
  completed_at: timestamp
  UNIQUE(user_id, lesson_unit_id)
}

// ==================== GAMIFICAÇÃO ====================

// Transações de XP (histórico detalhado)
xp_transactions {
  id: serial PRIMARY KEY
  user_id: integer REFERENCES users(id)
  amount: integer
  source: enum('lesson', 'challenge', 'streak_bonus', 'achievement', 'daily_goal')
  source_id: integer  // ID da lição/conquista
  description: varchar
  created_at: timestamp
}

// Registro diário de streak
streak_records {
  id: serial PRIMARY KEY
  user_id: integer REFERENCES users(id)
  activity_date: date
  minutes_studied: integer DEFAULT 0
  lessons_completed: integer DEFAULT 0
  xp_earned: integer DEFAULT 0
  streak_maintained: boolean DEFAULT false
  UNIQUE(user_id, activity_date)
}

// Catálogo de conquistas
achievements {
  id: serial PRIMARY KEY
  code: varchar UNIQUE  // ex: 'streak_7', 'level_10', 'perfect_week'
  name: varchar
  description: text
  icon: varchar
  xp_reward: integer DEFAULT 0
  category: enum('streak', 'xp', 'lessons', 'special')
  requirement: jsonb  // condições para desbloquear
  is_secret: boolean DEFAULT false
}

// Conquistas do usuário
user_achievements {
  id: serial PRIMARY KEY
  user_id: integer REFERENCES users(id)
  achievement_id: integer REFERENCES achievements(id)
  unlocked_at: timestamp
  UNIQUE(user_id, achievement_id)
}

// Rankings/Leaderboards
leaderboard_entries {
  id: serial PRIMARY KEY
  user_id: integer REFERENCES users(id)
  period_type: enum('weekly', 'monthly', 'all_time')
  period_key: varchar  // ex: '2024-W48', '2024-12', 'all'
  xp_earned: integer DEFAULT 0
  rank_position: integer
  updated_at: timestamp
  UNIQUE(user_id, period_type, period_key)
}

// ==================== IA/PROCESSAMENTO ====================

// Jobs de processamento de IA
ai_jobs {
  id: serial PRIMARY KEY
  study_week_id: integer REFERENCES study_weeks(id)
  status: enum('pending', 'processing', 'completed', 'failed')
  job_type: enum('pdf_extraction', 'content_generation', 'review')
  input_data: jsonb
  output_data: jsonb
  error_message: text
  started_at: timestamp
  completed_at: timestamp
  created_at: timestamp
}

// ==================== NOTIFICAÇÕES ====================

notifications {
  id: serial PRIMARY KEY
  user_id: integer REFERENCES users(id)
  type: enum('streak_reminder', 'new_content', 'achievement', 'challenge')
  title: varchar
  message: text
  data: jsonb
  is_read: boolean DEFAULT false
  created_at: timestamp
}
```

### 4.2 Índices Importantes

```sql
-- Performance de consultas frequentes
CREATE INDEX idx_user_lesson_progress_user ON user_lesson_progress(user_id);
CREATE INDEX idx_user_lesson_progress_status ON user_lesson_progress(user_id, status);
CREATE INDEX idx_lessons_week ON lessons(study_week_id, order_index);
CREATE INDEX idx_lesson_units_lesson ON lesson_units(lesson_id, order_index);
CREATE INDEX idx_streak_records_user_date ON streak_records(user_id, activity_date DESC);
CREATE INDEX idx_leaderboard_period ON leaderboard_entries(period_type, period_key, xp_earned DESC);
CREATE INDEX idx_xp_transactions_user ON xp_transactions(user_id, created_at DESC);
```

---

## 5. Sistema de Gamificação

### 5.1 Sistema de XP (Experiência)

| Ação | XP Ganho | Notas |
|------|----------|-------|
| Completar unidade de texto | 2 XP | Leitura |
| Resposta correta | 5 XP | Primeira tentativa |
| Resposta correta (2a tentativa) | 2 XP | Com erro anterior |
| Completar meditação | 10 XP | Por sessão |
| Completar lição inteira | 15 XP | Bônus de conclusão |
| Lição perfeita (sem erros) | +10 XP | Bônus extra |
| Bônus de streak (7 dias) | 20 XP | Uma vez |
| Bônus de streak (30 dias) | 100 XP | Uma vez |
| Completar meta diária | 5 XP | Por dia |
| Desbloquear conquista | Variável | 10-100 XP |

### 5.2 Sistema de Níveis

```javascript
// Fórmula de XP por nível (inspirada no Duolingo)
function xpRequiredForLevel(level) {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level - 1, 1.5));
}

// Níveis e XP necessário:
// Nível 1:  0 XP
// Nível 2:  100 XP
// Nível 3:  283 XP
// Nível 4:  520 XP
// Nível 5:  800 XP
// Nível 10: 2,700 XP
// Nível 20: 8,500 XP
// Nível 50: 34,300 XP
```

### 5.3 Sistema de Streak (Sequência)

```javascript
// Regras de Streak
const STREAK_RULES = {
  // Horário de reset do streak (meia-noite no timezone do usuário)
  resetHour: 0,
  
  // Período de graça (horas após meia-noite para manter streak)
  gracePeriodHours: 4,
  
  // Atividade mínima para manter streak
  minimumActivityMinutes: 5,
  
  // Streak freeze (proteções contra perda)
  maxFreezes: 2,
  freezeCooldownDays: 7,
  
  // Bônus de streak
  bonuses: [
    { days: 7, xp: 20 },
    { days: 14, xp: 30 },
    { days: 30, xp: 100 },
    { days: 60, xp: 200 },
    { days: 100, xp: 500 },
    { days: 365, xp: 2000 }
  ]
};
```

### 5.4 Sistema de Corações (Vidas)

```javascript
const HEARTS_SYSTEM = {
  // Máximo de corações
  maxHearts: 5,
  
  // Corações iniciais
  startingHearts: 5,
  
  // Custo por erro
  heartsLostPerMistake: 1,
  
  // Recuperação de corações
  refillOptions: [
    { type: 'time', waitMinutes: 30, heartsGained: 1 },
    { type: 'meditation', durationMinutes: 5, heartsGained: 1 },
    { type: 'practice', lessonType: 'review', heartsGained: 2 },
    { type: 'full_refill', waitHours: 5, heartsGained: 5 }
  ],
  
  // Sem corações = não pode fazer novas lições
  // Mas pode fazer revisões para ganhar corações
};
```

### 5.5 Sistema de Conquistas

```javascript
const ACHIEVEMENTS = [
  // Streak
  { code: 'streak_3', name: 'Iniciante Dedicado', description: '3 dias seguidos', category: 'streak', xp: 10 },
  { code: 'streak_7', name: 'Semana Perfeita', description: '7 dias seguidos', category: 'streak', xp: 25 },
  { code: 'streak_30', name: 'Mês de Fé', description: '30 dias seguidos', category: 'streak', xp: 100 },
  { code: 'streak_100', name: 'Centurião', description: '100 dias seguidos', category: 'streak', xp: 500 },
  { code: 'streak_365', name: 'Devoto Anual', description: '365 dias seguidos', category: 'streak', xp: 2000 },
  
  // XP/Níveis
  { code: 'level_5', name: 'Estudante', description: 'Alcance o nível 5', category: 'xp', xp: 20 },
  { code: 'level_10', name: 'Discípulo', description: 'Alcance o nível 10', category: 'xp', xp: 50 },
  { code: 'level_25', name: 'Sábio', description: 'Alcance o nível 25', category: 'xp', xp: 150 },
  { code: 'level_50', name: 'Mestre', description: 'Alcance o nível 50', category: 'xp', xp: 500 },
  
  // Lições
  { code: 'first_lesson', name: 'Primeiro Passo', description: 'Complete sua primeira lição', category: 'lessons', xp: 5 },
  { code: 'perfect_lesson', name: 'Perfeito!', description: 'Complete uma lição sem erros', category: 'lessons', xp: 15 },
  { code: 'week_complete', name: 'Semana Completa', description: 'Complete todas as lições da semana', category: 'lessons', xp: 50 },
  { code: 'lessons_10', name: 'Estudioso', description: 'Complete 10 lições', category: 'lessons', xp: 30 },
  { code: 'lessons_50', name: 'Veterano', description: 'Complete 50 lições', category: 'lessons', xp: 100 },
  
  // Especiais
  { code: 'early_bird', name: 'Madrugador', description: 'Estude antes das 6h', category: 'special', xp: 10 },
  { code: 'night_owl', name: 'Coruja Noturna', description: 'Estude após as 23h', category: 'special', xp: 10 },
  { code: 'meditation_master', name: 'Mestre da Meditação', description: 'Complete 20 meditações', category: 'special', xp: 50 },
  { code: 'comeback', name: 'Retorno Triunfante', description: 'Volte após 7 dias ausente', category: 'special', xp: 25 },
];
```

### 5.6 Sistema de Rankings (Leaderboard)

```javascript
const LEADERBOARD_CONFIG = {
  // Tipos de ranking
  periods: ['weekly', 'monthly', 'all_time'],
  
  // Atualização
  updateFrequency: 'real_time', // ou 'hourly', 'daily'
  
  // Exibição
  showTopN: 100,
  showUserRank: true,
  showNearbyUsers: 5, // usuários acima e abaixo
  
  // Ligas (opcional - como Duolingo)
  leagues: [
    { name: 'Bronze', minRank: 80, maxRank: 100 },
    { name: 'Prata', minRank: 60, maxRank: 79 },
    { name: 'Ouro', minRank: 40, maxRank: 59 },
    { name: 'Safira', minRank: 20, maxRank: 39 },
    { name: 'Rubi', minRank: 10, maxRank: 19 },
    { name: 'Esmeralda', minRank: 5, maxRank: 9 },
    { name: 'Ametista', minRank: 2, maxRank: 4 },
    { name: 'Diamante', minRank: 1, maxRank: 1 },
  ],
  
  // Promoção/Rebaixamento
  promotionThreshold: 10, // Top 10% sobe de liga
  relegationThreshold: 10, // Bottom 10% desce de liga
};
```

---

## 6. Integração com IA

### 6.1 Pipeline de Processamento de PDF

```
┌─────────────────┐
│  Admin Upload   │
│     PDF         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Salvar PDF     │
│  Object Storage │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Criar Job na   │
│  Fila (BullMQ)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Worker Inicia  │
│  Processamento  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Extrair Texto  │
│  do PDF         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GPT-4 Analisa  │
│  e Estrutura    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gera Lições    │
│  e Exercícios   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Salvar como    │
│  Draft          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Admin Revisa   │
│  e Publica      │
└─────────────────┘
```

### 6.2 Prompts de IA

#### Prompt 1: Extração e Análise do PDF

```javascript
const EXTRACTION_PROMPT = `
Você é um especialista em educação e design instrucional. Analise o texto do PDF fornecido e extraia:

1. TEMA PRINCIPAL: Qual é o assunto central?
2. PONTOS-CHAVE: Liste os 5-10 conceitos mais importantes
3. VERSÍCULOS/CITAÇÕES: Identifique referências importantes
4. REFLEXÕES: Pontos que merecem reflexão pessoal
5. APLICAÇÕES PRÁTICAS: Como aplicar no dia a dia

Retorne em formato JSON estruturado:
{
  "tema": "...",
  "resumo": "...",
  "pontos_chave": [...],
  "versiculos": [...],
  "reflexoes": [...],
  "aplicacoes": [...]
}
`;
```

#### Prompt 2: Geração de Lições

```javascript
const LESSON_GENERATION_PROMPT = `
Com base na análise do conteúdo, crie um plano de estudo semanal no estilo Duolingo com:

1. LIÇÃO DE INTRODUÇÃO (5 min)
   - Apresentação do tema
   - 3-5 cards de texto curto
   - 2 perguntas simples de compreensão

2. LIÇÕES DE ESTUDO (3-4 lições, 5-10 min cada)
   - Cada lição foca em um ponto-chave
   - Mix de: texto, perguntas múltipla escolha, complete a frase
   - Feedback explicativo para cada resposta

3. SESSÃO DE MEDITAÇÃO (5-10 min)
   - Introdução calma
   - Texto guiado baseado no tema
   - Momento de reflexão silenciosa

4. DESAFIO SEMANAL
   - Perguntas mais difíceis
   - Revisão de todo conteúdo
   - Bônus de XP para conclusão

Formato de saída JSON:
{
  "lessons": [
    {
      "title": "...",
      "type": "study|meditation|challenge|review",
      "description": "...",
      "estimated_minutes": 5,
      "units": [
        {
          "type": "text|question|meditation|reflection",
          "content": {...}
        }
      ]
    }
  ]
}
`;
```

#### Prompt 3: Geração de Perguntas

```javascript
const QUESTION_GENERATION_PROMPT = `
Crie perguntas variadas para testar a compreensão do conteúdo. Para cada pergunta:

1. MÚLTIPLA ESCOLHA (4 opções, 1 correta)
2. VERDADEIRO/FALSO com justificativa
3. COMPLETE A FRASE (preencher lacuna)
4. ORDENAÇÃO (colocar em ordem correta)

Cada pergunta deve ter:
- Texto claro e objetivo
- Feedback para resposta correta
- Feedback para resposta incorreta (educativo, não punitivo)
- Dica opcional (para segunda tentativa)

Mantenha tom:
- Encorajador (nunca crítico)
- Educativo (explique o porquê)
- Acessível (linguagem simples)

Exemplo de saída:
{
  "type": "multiple_choice",
  "question": "Qual é o significado de...?",
  "options": ["A", "B", "C", "D"],
  "correct_index": 2,
  "explanation_correct": "Exatamente! C é correto porque...",
  "explanation_incorrect": "Não é isso. A resposta correta é C porque...",
  "hint": "Pense no contexto de..."
}
`;
```

### 6.3 Configuração do OpenAI

```javascript
const AI_CONFIG = {
  // Modelo principal
  model: 'gpt-4-turbo-preview',
  
  // Parâmetros de geração
  temperature: 0.7,  // Criatividade moderada
  max_tokens: 4000,
  
  // Rate limiting
  requestsPerMinute: 20,
  tokensPerMinute: 80000,
  
  // Retry logic
  maxRetries: 3,
  retryDelayMs: 1000,
  
  // Custos estimados por PDF
  estimatedInputTokens: 5000,
  estimatedOutputTokens: 10000,
  estimatedCostPerPdf: 0.15  // USD
};
```

### 6.4 Fluxo de Revisão Humana

1. IA gera conteúdo → Status: `draft`
2. Admin recebe notificação
3. Admin revisa no painel:
   - Editar textos
   - Ajustar perguntas
   - Reordenar lições
   - Adicionar/remover unidades
4. Admin aprova → Status: `published`
5. Usuários podem acessar

---

## 7. Fluxo do Usuário e UX

### 7.1 Onboarding (Primeiro Acesso)

```
1. Tela de Boas-vindas
   └── Animação suave, logo, proposta de valor

2. Definir Meta Diária
   └── "Quantos minutos por dia?"
   └── Opções: 5, 10, 15, 20 minutos

3. Tutorial Interativo (1 mini-lição)
   └── Mostrar como funciona
   └── Dar primeira conquista
   └── Celebrar com animação

4. Tela Principal (Mapa)
   └── Mostrar primeira semana
   └── Indicar onde começar
```

### 7.2 Tela Principal (Mapa de Lições)

```
┌────────────────────────────────────────────┐
│  [Perfil]    Semana 48    [Streak: 🔥7]   │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │     💎 DESAFIO (Bloqueado)         │   │
│  │              │                      │   │
│  │     📖 Lição 4 (Bloqueada)         │   │
│  │              │                      │   │
│  │     🧘 Meditação (Disponível)      │   │
│  │              │                      │   │
│  │     📖 Lição 2 (Completa ✓)        │   │
│  │              │                      │   │
│  │     📖 Lição 1 (Completa ✓)        │   │
│  │              │                      │   │
│  │  [▶️ COMEÇAR] Introdução           │   │
│  └────────────────────────────────────┘   │
│                                            │
│  ───────────────────────────────────────   │
│  [🏠 Home] [📊 Rank] [👤 Perfil] [⚙️]      │
└────────────────────────────────────────────┘
```

### 7.3 Tela de Lição (Exercícios)

```
┌────────────────────────────────────────────┐
│  [✕ Sair]   ████████░░░░ 60%   [❤️ 5]     │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │                                    │   │
│  │    Complete a frase:               │   │
│  │                                    │   │
│  │    "A fé é a certeza daquilo      │   │
│  │     que ___________"               │   │
│  │                                    │   │
│  │    ┌─────────────┐                 │   │
│  │    │ esperamos   │ ← selecionado   │   │
│  │    └─────────────┘                 │   │
│  │    ┌─────────────┐                 │   │
│  │    │ duvidamos   │                 │   │
│  │    └─────────────┘                 │   │
│  │    ┌─────────────┐                 │   │
│  │    │ sabemos     │                 │   │
│  │    └─────────────┘                 │   │
│  │                                    │   │
│  └────────────────────────────────────┘   │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │         [VERIFICAR]                │   │
│  └────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

### 7.4 Feedback Imediato

```
RESPOSTA CORRETA:
┌────────────────────────────────────────────┐
│                                            │
│     ✓ Correto!                             │
│                                            │
│  "esperamos" está correto!                 │
│  Hebreus 11:1 nos ensina que...           │
│                                            │
│  +5 XP                                     │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │         [CONTINUAR]                │   │
│  └────────────────────────────────────┘   │
└────────────────────────────────────────────┘

RESPOSTA INCORRETA:
┌────────────────────────────────────────────┐
│                                            │
│     ✗ Não foi dessa vez                    │
│                                            │
│  A resposta correta é "esperamos".         │
│  Hebreus 11:1 fala sobre a certeza         │
│  daquilo que esperamos...                  │
│                                            │
│  ❤️ -1                                      │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │         [CONTINUAR]                │   │
│  └────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

### 7.5 Celebrações e Animações

| Momento | Animação | Som |
|---------|----------|-----|
| Resposta correta | Confetti verde, check mark | "Ding!" positivo |
| Resposta incorreta | Shake suave, X vermelho | "Buzz" suave |
| Lição completa | Explosão de confetti, +XP voando | Fanfarra curta |
| Novo nível | Animação de level up, badge | Música épica |
| Conquista | Badge animado, brilho | Som de achievement |
| Streak mantido | Fogo animado, número incrementa | "Whoosh" |

### 7.6 Mobile-First Design Principles

1. **Touch Targets**: Mínimo 44x44px para botões
2. **Thumb Zone**: Ações principais no terço inferior
3. **Swipe Gestures**: Navegação por gestos
4. **Bottom Navigation**: Menu fixo na parte inferior
5. **Pull to Refresh**: Atualizar conteúdo puxando
6. **Skeleton Loading**: Placeholder enquanto carrega
7. **Haptic Feedback**: Vibração sutil em interações
8. **Offline Support**: Cache de lições em progresso

---

## 8. Painel Administrativo

### 8.1 Funcionalidades do Admin

1. **Dashboard**
   - Estatísticas gerais (usuários ativos, lições completas)
   - Gráficos de engajamento
   - Alertas de problemas

2. **Gerenciar Semanas**
   - Upload de novo PDF
   - Ver status de processamento IA
   - Revisar/editar conteúdo gerado
   - Publicar/despublicar semanas

3. **Editor de Lições**
   - Arrastar e soltar para reordenar
   - Editar textos inline
   - Adicionar/remover unidades
   - Preview em tempo real

4. **Gerenciar Usuários**
   - Lista de usuários
   - Ver progresso individual
   - Resetar senhas
   - Ajustar XP/streak (suporte)

5. **Configurações**
   - Horários de notificação
   - Parâmetros de gamificação
   - Configurações de IA

### 8.2 Fluxo de Upload de PDF

```
1. Admin acessa "Nova Semana"

2. Preenche informações:
   - Número da semana
   - Título
   - Descrição

3. Upload do PDF
   - Drag & drop ou selecionar arquivo
   - Validação de formato (PDF apenas)
   - Limite de tamanho (10MB)

4. Iniciar Processamento
   - Botão "Processar com IA"
   - Barra de progresso
   - Tempo estimado

5. Revisão do Conteúdo
   - Visualizar lições geradas
   - Editar/ajustar conforme necessário
   - Testar perguntas

6. Publicação
   - Agendar data de publicação
   - Ou publicar imediatamente
   - Notificar usuários
```

---

## 9. Roadmap de Implementação

### Fase 1: MVP Core (2-3 semanas)
- [ ] Setup do banco de dados com novo schema
- [ ] Sistema de autenticação (adaptar existente)
- [ ] CRUD básico de lições (manual, sem IA)
- [ ] Player de lições com feedback
- [ ] Sistema básico de XP e progresso
- [ ] Interface mobile-first

### Fase 2: Gamificação Completa (1-2 semanas)
- [ ] Sistema de streak
- [ ] Sistema de corações
- [ ] Conquistas e badges
- [ ] Rankings/leaderboards
- [ ] Animações e sons
- [ ] Notificações (web push)

### Fase 3: Integração IA (2-3 semanas)
- [ ] Setup OpenAI API
- [ ] Pipeline de processamento PDF
- [ ] Geração automática de lições
- [ ] Sistema de revisão admin
- [ ] Queue de jobs (BullMQ)

### Fase 4: Polish e Otimização (1-2 semanas)
- [ ] PWA completo (offline, install)
- [ ] Performance optimization
- [ ] Testes E2E
- [ ] Documentação final
- [ ] Monitoramento e analytics

### Fase 5: Features Avançadas (Futuro)
- [ ] App nativo (React Native)
- [ ] Sistema de amigos
- [ ] Desafios em grupo
- [ ] Comentários/discussões
- [ ] Múltiplos idiomas

---

## 10. Desafios e Soluções

### 10.1 Desafio: Qualidade da IA

**Problema**: IA pode gerar conteúdo incorreto ou de baixa qualidade.

**Soluções**:
- Sempre ter revisão humana antes de publicar
- Prompts bem estruturados com exemplos
- Validação automática de formato
- Feedback loop para melhorar prompts

### 10.2 Desafio: Variabilidade de PDFs

**Problema**: PDFs podem ter formatos muito diferentes.

**Soluções**:
- OCR para PDFs escaneados
- Fallback para extração manual
- Guia para admin sobre formato ideal
- Pré-processamento de normalização

### 10.3 Desafio: Performance Mobile

**Problema**: Animações podem ser lentas em dispositivos antigos.

**Soluções**:
- Usar CSS transforms (GPU accelerated)
- Lazy loading de assets
- Skeleton loading states
- Reduzir animações em dispositivos lentos

### 10.4 Desafio: Engajamento a Longo Prazo

**Problema**: Usuários podem perder interesse.

**Soluções**:
- Conteúdo semanal novo
- Sistema de streak com incentivos
- Rankings e competição saudável
- Conquistas difíceis para veteranos
- Notificações inteligentes (não spam)

### 10.5 Desafio: Custos de IA

**Problema**: Processamento de IA pode ser caro.

**Soluções**:
- Processar apenas uma vez por PDF
- Cache agressivo de respostas
- Usar modelos mais baratos para tarefas simples
- Monitorar custos mensais
- Estimativa: ~$5-10/mês com uso moderado

---

## 11. Decisões Pendentes

### 11.1 Para Discutir com Você

1. **PWA vs App Nativo**
   - PWA: Mais rápido de desenvolver, funciona em todos os dispositivos
   - App Nativo: Melhor experiência, mais recursos (haptics, notificações)
   - **Recomendação**: Começar com PWA, migrar para nativo depois

2. **Sistema de Corações**
   - Com corações: Mais parecido com Duolingo, mas pode frustrar
   - Sem corações: Mais acessível, menos gamificado
   - **Recomendação**: Implementar com opção de desativar

3. **Ligas/Competição**
   - Ligas semanais: Mais engajamento, mais complexidade
   - Ranking simples: Mais fácil, menos competitivo
   - **Recomendação**: Começar com ranking simples

4. **Frequência de Conteúdo**
   - Semanal: Como descrito, um PDF por semana
   - Diário: Mais engajamento, mais trabalho para admin
   - **Recomendação**: Semanal com conteúdo denso

5. **Modelo de Notificações**
   - Push agressivo: Mais engajamento, pode irritar
   - Push suave: Menos efetivo, mais respeitoso
   - **Recomendação**: Configurável pelo usuário

### 11.2 Próximos Passos

Após nossa discussão, precisamos definir:

1. [ ] Confirmar stack tecnológica (PWA ou nativo?)
2. [ ] Validar modelo de dados
3. [ ] Definir MVP mínimo (o que cortar para v1?)
4. [ ] Definir prioridades de gamificação
5. [ ] Orçamento para IA (OpenAI)
6. [ ] Timeline desejada
7. [ ] Recursos disponíveis (quantas pessoas?)

---

## Apêndice A: Estimativa de Custos

| Item | Custo Mensal Estimado |
|------|----------------------|
| OpenAI API (10 PDFs/mês) | $5-10 |
| Replit (hosting) | Incluído |
| PostgreSQL (Neon) | Incluído |
| Object Storage | Incluído |
| Push Notifications (OneSignal free tier) | $0 |
| **Total Estimado** | **$5-10/mês** |

---

## Apêndice B: Referências

- [Duolingo Design Guidelines](https://design.duolingo.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [TanStack Query](https://tanstack.com/query)

---

*Documento criado em: Dezembro 2024*
*Versão: 1.0*
*Status: Aguardando Discussão*
