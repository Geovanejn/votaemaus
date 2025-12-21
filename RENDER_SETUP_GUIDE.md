# Guia Completo de Deploy no Render

## Visão Geral

Este projeto está totalmente configurado para fazer deploy no Render com PostgreSQL incluído. Tudo é gerenciado pelo Render - sem dependências externas como Neon.

## Arquivos de Configuração

- **render.yaml**: Define o web service + database PostgreSQL automático
- **package.json**: Build script e start command configurados
- **.env.example**: Variáveis de ambiente necessárias

## Passo 1: Preparar o Repository

1. Certifique-se que todos os arquivos estão commitados:
```bash
git status
```

2. O arquivo `render.yaml` já está na raiz do projeto

## Passo 2: Deploy no Render

### Método A: Via GitHub (Recomendado)

1. Acesse https://dashboard.render.com
2. Clique em **New +** → **Blueprint**
3. Conecte seu repositório GitHub
4. Render lerá automaticamente o `render.yaml`
5. Revise as configurações e clique em **Create**

### Método B: Manual (Se não usar Blueprint)

1. Acesse https://dashboard.render.com
2. Crie um **PostgreSQL** service primeiro:
   - Database Name: `deoglory`
   - User: `deoglory_user`
   - Plan: Free
3. Crie um **Web Service**:
   - Conecte ao repositório
   - Build Command: `npm install && npm run build`
   - Start Command: `node dist/index.cjs`
   - Environment: Node

## Passo 3: Configurar Variáveis de Ambiente

Após criar o serviço, adicione no painel do Render:

| Variável | Valor | Notas |
|----------|-------|-------|
| `NODE_ENV` | `production` | Automático via render.yaml |
| `DATABASE_URL` | Auto preenchido | Vem do PostgreSQL service |
| `ADMIN_EMAIL` | seu_email@example.com | Seu email de admin |
| `ADMIN_PASSWORD` | senha_forte | Senha segura |
| `JWT_SECRET` | Gere: `openssl rand -base64 32` | Para autenticação |
| `SESSION_SECRET` | Gere: `openssl rand -base64 32` | Para sessões |
| `RESEND_API_KEY` | (opcional) | Se usar email |
| `OPENAI_API_KEY` | (opcional) | Se usar IA |
| `GOOGLE_GEMINI_API_KEY` | (opcional) | Se usar Gemini |
| `GOOGLE_CALENDAR_CLIENT_ID` | (opcional) | Se usar Google Calendar |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | (opcional) | Se usar Google Calendar |
| `INSTAGRAM_ACCESS_TOKEN` | (opcional) | Se usar Instagram |
| `INSTAGRAM_USER_ID` | (opcional) | Se usar Instagram |
| `VAPID_PUBLIC_KEY` | (opcional) | Se usar Web Push |
| `VAPID_PRIVATE_KEY` | (opcional) | Se usar Web Push |

## Passo 4: Monitorar o Deploy

1. Vá para **Deployments** no seu serviço
2. Acompanhe o build - deve levar 2-5 minutos
3. Quando status mudar para "Live", seu app está online!
4. Clique em **Logs** para ver mensagens do servidor

## URLs

Após deploy bem-sucedido:
- **Frontend**: https://seu-projeto.onrender.com
- **API**: https://seu-projeto.onrender.com/api
- **WebSocket**: wss://seu-projeto.onrender.com

## O que Render Faz Automaticamente

✅ Cria e gerencia PostgreSQL
✅ Executa `npm install && npm run build`
✅ Reinicia após crashes
✅ SSL/HTTPS automático
✅ Variáveis de ambiente criptografadas
✅ Logs persistentes
✅ Auto-redeploy ao fazer push

## Troubleshooting

### "Build failed"
- Verifique os logs em **Deployments** → **Logs**
- Procure por erros de npm
- Confirme que `npm run build` funciona localmente

### "DATABASE_URL is not set"
- Verifique se o PostgreSQL service foi criado
- Confirme que está linkado ao web service
- Aguarde 30 segundos e reinicie o deployment

### "Connection refused"
- PostgreSQL pode estar iniciando - aguarde
- Verifique se as credenciais estão corretas
- Veja os logs para mensagens de erro específicas

### Deploy lento
- Plano free tem recursos limitados
- Primeira inicialização leva mais tempo
- Inatividade por 15+ minutos coloca em "sleep"

## Atualizações Futuras

Para fazer novo deploy:
1. Faça commit e push das mudanças
2. Render detectará automaticamente
3. Novo deployment começará em segundos
4. Monitore em **Deployments**

## Upgrade de Plano

Se precisar de mais recursos:
1. Vá para **Settings** do serviço
2. Upgrade o "Instance Type"
3. Escolha entre Standard, Pro, etc.

## Backup e Recuperação

Para backup do banco:
1. Acesse o PostgreSQL service no Render
2. Use ferramentas como `pg_dump` para exportar dados
3. Guarde em local seguro

## Atualizações de Versão

Quando atualizar packages:
1. Commit as mudanças em `package.json`
2. Push para GitHub
3. Render automaticamente refaz o build

## Rollback

Para voltar a versão anterior:
1. No Render, procure por **Deployments**
2. Selecione uma versão anterior bem-sucedida
3. Clique em **Redeploy**

## Mais Informações

- Documentação Render: https://render.com/docs
- Render PostgreSQL: https://render.com/docs/databases
- PostgreSQL Docs: https://www.postgresql.org/docs/

---

**Pronto para deploy! 🚀**

O projeto está 100% configurado. Basta seguir os passos acima para colocar online no Render.
