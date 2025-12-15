# Site UMP Emaús

## Visão Geral
Sistema web completo para a União de Mocidade Presbiteriana (UMP) da Igreja Presbiteriana Emaús. Inclui site público, área de membros e painel administrativo.

## Configuração de Ambiente

### Variáveis de Ambiente Obrigatórias (Secrets)

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão PostgreSQL (automático no Replit) |
| `SESSION_SECRET` | Chave secreta para sessões |
| `JWT_SECRET` | Chave para tokens JWT |
| `ADMIN_EMAIL` | Email do administrador raiz |
| `ADMIN_PASSWORD` | Senha do administrador raiz |
| `INSTAGRAM_ACCESS_TOKEN` | Token de acesso da API do Instagram |
| `INSTAGRAM_USER_ID` | ID do usuário Instagram @umpemaus |
| `VAPID_PUBLIC_KEY` | Chave pública para notificações push |
| `VAPID_PRIVATE_KEY` | Chave privada para notificações push |

### Administrador Raiz

O administrador raiz é criado automaticamente na inicialização do banco quando `ADMIN_EMAIL` e `ADMIN_PASSWORD` estão definidos como secrets. Se o usuário já existir, ele é promovido a admin.

### Integração Instagram

**Como configurar:**
1. Acesse [developers.facebook.com](https://developers.facebook.com/)
2. Crie um app do tipo "Business"
3. Configure a Instagram Graph API
4. Adicione sua conta como "Instagram Tester" em Roles > Instagram Testers
5. Aceite o convite em [instagram.com/accounts/manage_access/](https://instagram.com/accounts/manage_access/)
6. Gere um token de acesso de longa duração (60 dias)
7. Adicione `INSTAGRAM_ACCESS_TOKEN` e `INSTAGRAM_USER_ID` nos secrets

**Sincronização:**
- Os posts são sincronizados automaticamente a cada 6 horas
- É possível sincronizar manualmente no painel de marketing
- Posts podem ser destacados para aparecer no banner da home

## Estrutura do Projeto

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   │   ├── admin/     # Painel administrativo
│   │   │   ├── member/    # Área do membro
│   │   │   └── site/      # Site público
│   │   └── lib/           # Utilitários
├── server/                 # Backend Express
│   ├── routes.ts          # Rotas da API
│   ├── storage.ts         # Interface de armazenamento
│   ├── instagram.ts       # Integração Instagram
│   ├── scheduler.ts       # Tarefas agendadas
│   └── db.ts              # Conexão com banco
└── shared/                 # Código compartilhado
    └── schema.ts          # Esquema do banco (Drizzle)
```

## Funcionalidades

### Site Público
- Home com banner destacado do Instagram
- Devocionais diários
- Agenda de eventos
- Página "Quem Somos"
- Diretoria

### Área do Membro
- Login/Cadastro
- Perfil pessoal
- Notificações push
- Participação em eventos

### Painel Admin
- Gerenciamento de eventos
- Gerenciamento de diretoria
- Devocionais
- **Instagram**: sincronização e destaque de posts no banner
- Gerenciamento de membros

## Comandos

```bash
npm run dev      # Desenvolvimento
npm run build    # Build para produção
npm run start    # Iniciar em produção
npm run db:push  # Sincronizar esquema do banco
```

## Últimas Alterações

### 15/12/2025 - DeoGlory Study System Improvements
- **getStageFromUnitType helper**: Nova função centralizada em routes.ts que mapeia tipos de unidade para stages (text/verse→estude, meditation/reflection→medite, multiple_choice/true_false/fill_blank→responda)
- **Seed data fix**: Corrigido bug onde questões não apareciam na seção Responda (faltava stage correto)
- **AI prompts melhorados**: generateExercisesFromTopic e generateUniquePracticeQuestions agora geram alternativas mais desafiadoras e plausíveis
  - Instruções para criar distratores inteligentes
  - Evita alternativas obviamente erradas
  - Varia posição da resposta correta

### 14/12/2025 - DeoGloryLicoes Admin Reescrito
- **DeoGloryLicoes.tsx**: Reescrito completamente com funcionalidade completa
  - Removida opcao "Escrever Manualmente" - mantido apenas "Criar com IA" e "Upload de PDF"
  - Seletor de chave Gemini (1-5) para distribuir carga entre chaves de API
  - Dialogs de geracao com input de texto ou upload de PDF
  - Cards de semanas com badges de status (Rascunho/Publicado)
  - Acoes de gerenciamento: Editar, Publicar, Liberar/Bloquear licoes, Excluir
  - Estados de carregamento com Skeleton e empty state

### 14/12/2025 - Nova Tela de Seleção de Painéis para Admin
- **AdminDashboard**: Criada nova página de seleção de painéis para admins
  - Admins agora veem uma tela com cards para todos os painéis disponíveis
  - Painéis: Emaus Vota, Espiritualidade, Marketing, DeoGlory, Site Institucional
  - Interface similar à experiência de membros com secretaria
- **Rotas atualizadas**:
  - `/admin` - Nova tela de seleção de painéis
  - `/admin/emaus-vota` - Painel de gerenciamento de eleições (antigo /admin)
  - `/admin/espiritualidade` - Painel de espiritualidade
  - `/admin/marketing` - Painel de marketing
  - `/admin/study` - Painel DeoGlory Admin
  - `/admin/site` - Painel do Site Institucional

### 08/12/2025
- Adicionada rota `/agenda/:id` para deep-linking de eventos
- Botao "Ver Detalhes" do banner agora abre diretamente o dialog do evento
- Adicionado LocationInput no painel Marketing > Quem Somos para editar endereco
- Removida integracao com Google Maps (nao usada)
- Adicionados componentes simples para links de localizacao (LocationLink e LocationInput)
- Localizacoes agora sao exibidas como links clicaveis que abrem no Google Maps
- Atualizado footer, pagina Quem Somos e Agenda para usar os novos componentes

### 11/12/2025 - Correcoes DeoGlory Study
- **Pratique Unlock**: Cache do practiceStatus agora e invalidado apos completar licao, garantindo desbloqueio imediato
- **Fill-blank Cleanup**: Removidas reticencias e underscores extras das questoes de lacunas (cleanTrailingDots)
- **Markdown Formatting**: FormattedText agora limpa caracteres de escape (\\n, \\*, \\_) antes de renderizar com ReactMarkdown
- **Multiple Choice Randomization**: Respostas corretas de multipla escolha agora sao distribuidas aleatoriamente entre A, B, C e D (eliminado vies para letra B)
  - Criada funcao `createMultipleChoice` que embaralha opcoes e recalcula correctIndex
  - Perguntas de fallback agora tambem passam pela randomizacao
- **Stars Display**: Estrelas na secao Pratique agora preenchidas em branco quando conquistadas
  - Tamanho aumentado de h-4 para h-5 para melhor visibilidade
  - Adicionado drop-shadow para contraste
  - Estrelas nao conquistadas ficam transparentes com contorno
- **Golden Styling**: Secoes Estude, Medite, Responda e Pratique ficam douradas ao conquistar 3 estrelas

### 10/12/2025 - DeoGlory Study System Fixes
- **Crystal Display**: Adicionado componente CrystalDisplay.tsx para mostrar saldo de cristais no frontend
- **StudyHeader**: Atualizado para incluir exibicao de cristais junto com coracoes
- **Profile Page**: Adicionado CrystalBalanceCard na pagina de perfil do DeoGlory
- **Achievement Unlocking**: Implementada logica de desbloqueio automatico de conquistas
  - Funcao `checkAndUnlockAchievements()` verifica requisitos apos licoes completadas
  - Funcao `unlockAchievement()` desbloqueia conquistas e concede XP/cristais
  - Logica corrigida para exigir TODOS os criterios (conjuntiva) nao apenas um
- **Daily Verse Endpoint**: Adicionado GET `/api/study/daily-verse` separado dos versiculos de recuperacao
- **Achievements Seeding**: Atualizado seed de conquistas com requisitos JSON para auto-unlock
  - Categorias: streak, lessons, xp, special
  - 22 conquistas com criterios claros de desbloqueio

### 10/12/2025 - Animacoes de Streak e Cristais
- **StreakIncrementAnimation**: Componente de animacao para aumento de streak
  - Transicao animada do numero anterior para o novo valor
  - Frase motivacional "Mantenha a Chama do Evangelho Acesa"
  - Icone de chama animado com pulsacao
  - Som de streak no inicio e som de conquista no final
- **CrystalGainAnimation**: Componente de animacao para ganho de cristais
  - Particulas de cristal flutuantes com efeito de brilho
  - Contador animado incrementando ate o valor total
  - Som de cristal durante contagem e som de conquista no final
- **Sound System**: Adicionado som 'crystal' no use-sounds.ts
- **Lesson Flow**: Animacoes integradas no fluxo de conclusao de licao
  - Fase 1: Animacao de streak (se aumentou)
  - Fase 2: Animacao de cristais (se ganhou cristais)
  - Fase 3: Tela de conclusao da licao
- **Defensive Guards**: Protecao contra divisao por zero em animacoes

### 10/12/2025 - Sistema de Criterios para Cristais
- **Novo sistema de recompensas**: Cristais nao sao mais dados em toda licao
- **Criterios implementados**:
  - Licao perfeita (sem erros): 3 cristais
  - Sequencia de 2 licoes perfeitas: +5 cristais bonus
  - Sequencia de 3 licoes perfeitas: +8 cristais bonus
  - Sequencia de 5 licoes perfeitas: +15 cristais bonus
  - 3 licoes consecutivas: 5 cristais
  - 5 licoes consecutivas: 10 cristais
  - 7 licoes consecutivas: 20 cristais
  - Primeira licao do dia: 2 cristais
  - 1 semana estudando todos os dias (7 dias consecutivos): 25 cristais
- **Novos campos no studyProfiles**:
  - consecutivePerfectLessons: sequencia de licoes perfeitas
  - consecutiveLessons: sequencia de licoes (qualquer resultado)
  - totalLessonsCompletedToday: licoes feitas hoje
  - lastLessonDate: data da ultima licao
  - weeklyLessonsStreak: dias consecutivos de estudo
- **Logica de reset**: Counters sao resetados quando o usuario pula um dia

### 07/12/2025
- Configuracao do ADMIN_EMAIL e ADMIN_PASSWORD como secrets permanentes
- Integracao Instagram configurada e funcionando com posts reais do @umpemaus
- Adicionada secao de Instagram no painel de marketing
- Funcionalidade de destacar post do Instagram no banner da home
