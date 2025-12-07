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

### 07/12/2025
- Configuração do ADMIN_EMAIL e ADMIN_PASSWORD como secrets permanentes
- Integração Instagram configurada e funcionando com posts reais do @umpemaus
- Adicionada seção de Instagram no painel de marketing
- Funcionalidade de destacar post do Instagram no banner da home
