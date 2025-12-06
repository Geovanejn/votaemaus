# Plano de Melhorias - Painéis das Secretarias

**Data:** 05/12/2025
**Status:** Documentação - Aprovado pelo Arquiteto
**Versão:** 2.1

---

## ÍNDICE

1. [Resumo Executivo](#1-resumo-executivo)
2. [Alterações no Cadastro](#2-alterações-no-cadastro)
3. [Sistema de Painéis por Secretaria](#3-sistema-de-painéis-por-secretaria)
4. [Painel Espiritualidade](#4-painel-espiritualidade)
5. [Painel Marketing](#5-painel-marketing)
6. [Melhorias na Página Diretoria](#6-melhorias-na-página-diretoria)
7. [Melhorias na Página de Oração](#7-melhorias-na-página-de-oração)
8. [Novas Tabelas do Banco de Dados](#8-novas-tabelas-do-banco-de-dados)
9. [Alterações em Tabelas Existentes](#9-alterações-em-tabelas-existentes)
10. [Novas Rotas da API](#10-novas-rotas-da-api)
11. [Componentes Frontend](#11-componentes-frontend)
12. [Integração Gemini para Missões Diárias](#12-integração-gemini-para-missões-diárias)
13. [Sistema de Moderação Automática](#13-sistema-de-moderação-automática)
14. [Editor Rich Text (TipTap)](#14-editor-rich-text-tiptap)
15. [Geração de Calendário ICS](#15-geração-de-calendário-ics)
16. [Dependências Necessárias](#16-dependências-necessárias)
17. [Cronograma de Implementação](#17-cronograma-de-implementação)
18. [Estado Atual do Código - Painel Espiritualidade](#18-estado-atual-do-código---painel-espiritualidade)

---

## 1. RESUMO EXECUTIVO

Este documento detalha as melhorias solicitadas para o sistema UMP Emaús, focando em:

| Melhoria | Descrição |
|----------|-----------|
| Secretarias | Restringir cadastro para APENAS Espiritualidade e Marketing |
| Painéis Admin | Painéis específicos por secretaria com acesso baseado em permissões |
| Devocionais | Editor rich text com TipTap, formatação padronizada, embeds de vídeo |
| Eventos | CRUD completo, calendário anual, export para Google Agenda (ICS) |
| Diretoria | Layout uniforme, dados puxados do banco de usuários |
| Oração | Remover anônimo, Mural da Oração interativo, moderação automática |
| IA | Missões diárias geradas EXCLUSIVAMENTE por Gemini (não OpenAI) |

---

## 2. ALTERAÇÕES NO CADASTRO

### 2.1 Estado Atual
```typescript
// shared/schema.ts - linha 23
export type Secretaria = "none" | "espiritualidade" | "marketing" | "acao_social" | "comunicacao" | "eventos" | null;
```

### 2.2 Novo Estado
```typescript
// APENAS duas secretarias ativas
export type Secretaria = "none" | "espiritualidade" | "marketing" | null;
```

### 2.3 Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `shared/schema.ts` | Remover opções "acao_social", "comunicacao", "eventos" do tipo Secretaria |
| `client/src/pages/admin.tsx` | Atualizar select do formulário de edição de membro |
| `server/routes.ts` | Validar secretaria na criação/edição de membro |

### 2.4 Migração de Dados
```sql
-- Usuários com secretarias antigas serão atualizados para "none"
UPDATE users 
SET secretaria = 'none' 
WHERE secretaria IN ('acao_social', 'comunicacao', 'eventos');
```

### 2.5 Opções do Select no Frontend
```typescript
const secretariaOptions = [
  { value: "none", label: "Nenhuma" },
  { value: "espiritualidade", label: "Espiritualidade" },
  { value: "marketing", label: "Marketing" },
];
```

---

## 3. SISTEMA DE PAINÉIS POR SECRETARIA

### 3.1 Lógica de Navegação

```
Usuário Logado
├── SEMPRE Visível (para todos os membros)
│   ├── Emaús Vota (/vote)
│   └── DeoGlory (/study)
│
├── Se secretaria = "espiritualidade" OU isAdmin = true
│   └── Painel Espiritualidade (/admin/espiritualidade)
│       ├── /admin/espiritualidade/devocionais
│       ├── /admin/espiritualidade/oracoes
│       └── /admin/espiritualidade/comentarios
│
├── Se secretaria = "marketing" OU isAdmin = true
│   └── Painel Marketing (/admin/marketing)
│       ├── /admin/marketing/eventos
│       ├── /admin/marketing/calendario
│       ├── /admin/marketing/diretoria
│       └── /admin/marketing/paginas
│
└── Se isAdmin = true
    └── Admin Geral (/admin)
        ├── Gerenciar Membros
        ├── Emaus Vota Admin
        └── DeoGlory Admin
```

### 3.2 Novos Middlewares de Autorização

**Arquivo:** `server/auth.ts`

```typescript
// Middleware para membros da Secretaria Espiritualidade (ou admin)
export function requireEspiritualidade(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  if (req.user.secretaria !== 'espiritualidade' && !req.user.isAdmin) {
    return res.status(403).json({ message: "Acesso negado - Secretaria Espiritualidade" });
  }
  next();
}

// Middleware para membros da Secretaria Marketing (ou admin)
export function requireMarketing(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  if (req.user.secretaria !== 'marketing' && !req.user.isAdmin) {
    return res.status(403).json({ message: "Acesso negado - Secretaria Marketing" });
  }
  next();
}
```

### 3.3 Componente de Navegação (Sidebar/Header)

**Arquivo:** `client/src/components/Navigation.tsx` ou `AppSidebar.tsx`

```typescript
// Lógica para exibir menu baseado em secretaria
const { user } = useAuth();

const showEspiritualidadePanel = user?.secretaria === 'espiritualidade' || user?.isAdmin;
const showMarketingPanel = user?.secretaria === 'marketing' || user?.isAdmin;

// Menu items condicionais
const menuItems = [
  // Sempre visível para membros logados
  { title: "Emaús Vota", url: "/vote", icon: Vote, visible: true },
  { title: "DeoGlory", url: "/study", icon: Book, visible: true },
  
  // Visível apenas para Espiritualidade ou Admin
  { title: "Espiritualidade", url: "/admin/espiritualidade", icon: Heart, visible: showEspiritualidadePanel },
  
  // Visível apenas para Marketing ou Admin
  { title: "Marketing", url: "/admin/marketing", icon: Megaphone, visible: showMarketingPanel },
  
  // Visível apenas para Admin
  { title: "Admin Geral", url: "/admin", icon: Settings, visible: user?.isAdmin },
];
```

---

## 4. PAINEL ESPIRITUALIDADE

### 4.1 Funcionalidades

#### 4.1.1 Gerenciador de Devocionais

**Recursos Completos:**
- Lista de devocionais (publicados e rascunhos)
- Editor rich text com TipTap
- Upload de imagem de capa (arte da devocional)
- Publicar/Despublicar/Agendar
- Visualizar e moderar comentários

**Formatação do Editor TipTap:**

| Recurso | Descrição | Atalho |
|---------|-----------|--------|
| Negrito | Texto em negrito | Ctrl+B |
| Itálico | Texto em itálico | Ctrl+I |
| Sublinhado | Texto sublinhado | Ctrl+U |
| Lista Ordenada | 1. 2. 3. | - |
| Lista Não Ordenada | • Bullet points | - |
| Links | Adicionar hyperlinks | Ctrl+K |
| Embed YouTube | Incorporar vídeo do YouTube | - |
| Embed Instagram | Incorporar post do Instagram | - |
| Títulos | H2, H3 (corpo do texto) | - |

**Padronização Obrigatória:**

```typescript
// Configuração de formatação padrão
const devotionalFormatConfig = {
  // Título: NÃO EDITÁVEL pelo usuário, formatação fixa
  title: {
    fontFamily: "Inter, sans-serif",
    fontSize: "28px",
    fontWeight: 700,
    color: "inherit", // Respeita tema claro/escuro
    editable: false,  // Usuário não pode alterar estilo do título
  },
  
  // Corpo: Fonte padrão, apenas 3 tamanhos permitidos
  body: {
    fontFamily: "Inter, sans-serif",
    allowedFontSizes: ["14px", "16px", "18px"], // Pequeno, Normal, Grande
    defaultFontSize: "16px",
    lineHeight: 1.6,
  },
  
  // Versículo: Estilo diferenciado
  verse: {
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
    fontSize: "18px",
  },
};
```

**Schema do Devocional no Editor:**
```typescript
interface DevotionalFormData {
  title: string;           // Título (formatação fixa)
  verse: string;           // Texto do versículo
  verseReference: string;  // Ex: "João 3:16"
  content: string;         // Conteúdo rich text (TipTap JSON)
  contentHtml: string;     // HTML renderizado para exibição
  summary?: string;        // Resumo opcional
  prayer?: string;         // Oração final
  imageUrl?: string;       // URL da imagem de capa
  author: string;          // Autor
  isPublished: boolean;    // Publicado ou rascunho
  isFeatured: boolean;     // Destaque na home
  scheduledAt?: Date;      // Agendamento de publicação
}
```

#### 4.1.2 Gerenciador de Pedidos de Oração

**Recursos:**
- Lista de pedidos pendentes (aguardando aprovação)
- Lista de pedidos aprovados (no Mural)
- Aprovar/Rejeitar pedidos
- Marcar como "Em Oração"
- Filtros por categoria e status
- Histórico de pedidos moderados
- Visualizar pedidos que falharam na moderação automática

**Status dos Pedidos:**
```typescript
type PrayerStatus = "pending" | "approved" | "rejected" | "praying" | "answered" | "archived";
```

**Interface de Moderação:**
```
┌─────────────────────────────────────────────────────────────────┐
│  🙏 Pedidos de Oração                    [Filtrar: Pendentes ▼] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [⚠️ Pendente]  Maria Silva                    há 2h     │   │
│  │                                                         │   │
│  │ "Peço oração pela saúde do meu pai..."                 │   │
│  │                                                         │   │
│  │ Categoria: Saúde                                       │   │
│  │ Moderação: ✅ Passou na verificação automática         │   │
│  │                                                         │   │
│  │ [✅ Aprovar]  [❌ Rejeitar]  [👁️ Detalhes]             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [🚫 Bloqueado]  Usuário Teste                  há 5h    │   │
│  │                                                         │   │
│  │ "Texto com conteúdo inapropriado..."                   │   │
│  │                                                         │   │
│  │ ⚠️ FALHOU NA MODERAÇÃO:                                │   │
│  │ - Linguagem inapropriada detectada                     │   │
│  │                                                         │   │
│  │ [🔄 Revisar Manualmente]  [🗑️ Excluir]                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.1.3 Sistema de Comentários

**Recursos:**
- Ver todos os comentários por devocional
- Moderar comentários (aprovar/rejeitar)
- Excluir comentários impróprios
- Responder comentários como administrador
- Filtrar por status (pendentes, aprovados)

### 4.2 Rotas do Painel Espiritualidade

| Rota | Descrição |
|------|-----------|
| `/admin/espiritualidade` | Dashboard principal com métricas |
| `/admin/espiritualidade/devocionais` | Lista de devocionais |
| `/admin/espiritualidade/devocionais/novo` | Criar novo devocional |
| `/admin/espiritualidade/devocionais/:id` | Editar devocional |
| `/admin/espiritualidade/oracoes` | Gerenciar pedidos de oração |
| `/admin/espiritualidade/comentarios` | Moderar comentários |

---

## 5. PAINEL MARKETING

### 5.1 Funcionalidades

#### 5.1.1 Gerenciador de Eventos

**Tipos de Evento:**

| Tipo | Descrição | Campos Específicos |
|------|-----------|-------------------|
| **Evento Comum** | Apenas informativo | Título, descrição, data, local |
| **Evento com Inscrição** | Requer formulário de inscrição | + registrationUrl, campos extras |

**Campos do Evento Completos:**
```typescript
interface SiteEventFormData {
  // Informações básicas
  title: string;
  description: string;          // Rich text
  shortDescription: string;     // Para cards
  imageUrl?: string;            // Imagem de capa
  
  // Data e hora
  startDate: string;            // YYYY-MM-DD
  endDate?: string;             // Para eventos de múltiplos dias
  time?: string;                // HH:MM
  isAllDay: boolean;            // Evento o dia todo
  
  // Localização
  location: string;             // Nome do local
  locationUrl?: string;         // URL do Google Maps (NOVO)
  
  // Inscrição
  requiresRegistration: boolean; // (NOVO) Requer inscrição?
  registrationUrl?: string;      // Link externo de inscrição
  registrationDeadline?: Date;   // Data limite para inscrição
  maxAttendees?: number;         // Limite de vagas
  
  // Financeiro
  price?: string;               // "Gratuito" ou "R$ 50,00"
  
  // Categorização
  category: EventCategory;      // geral, culto, retiro, estudo, social, confraternizacao
  
  // Publicação
  isPublished: boolean;
  isFeatured: boolean;          // Destaque na home
  
  // Calendário
  icsUid?: string;              // UID único para export ICS
}
```

**Campo Google Maps:**
```typescript
// Componente de input para URL do Google Maps
<FormField
  control={form.control}
  name="locationUrl"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Link Google Maps</FormLabel>
      <FormControl>
        <Input 
          placeholder="https://maps.google.com/..." 
          {...field} 
        />
      </FormControl>
      <FormDescription>
        Cole o link de compartilhamento do Google Maps
      </FormDescription>
    </FormItem>
  )}
/>
```

#### 5.1.2 Calendário Anual

**Funcionalidades:**
- Visualização de TODOS os eventos do ano
- Filtros por categoria e mês
- Export ICS para Google Calendar
- Sincronização automática via link de calendário

**Endpoint ICS:**
```
GET /api/site/events/calendar.ics
Content-Type: text/calendar; charset=utf-8
```

**Exemplo de Arquivo ICS:**
```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UMP Emaus//Calendario de Eventos//PT-BR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:UMP Emaús - Eventos

BEGIN:VEVENT
UID:evento-123@umpemaus.com.br
DTSTAMP:20251205T120000Z
DTSTART:20251220T190000
DTEND:20251220T210000
SUMMARY:Culto de Natal UMP
DESCRIPTION:Culto especial de Natal com louvor e celebração
LOCATION:Igreja Presbiteriana de Emaús
URL:https://umpemaus.com.br/agenda/123
GEO:-23.5505;-46.6333
END:VEVENT

END:VCALENDAR
```

**Botão de Sincronização:**
```typescript
// No frontend, link para adicionar ao Google Calendar
const calendarUrl = `${window.location.origin}/api/site/events/calendar.ics`;

<Button asChild>
  <a href={calendarUrl} target="_blank">
    <Calendar className="mr-2 h-4 w-4" />
    Sincronizar com Google Agenda
  </a>
</Button>
```

#### 5.1.3 Gerenciador da Diretoria

**Recursos:**
- Selecionar membro do banco de dados de usuários
- Dados PUXADOS AUTOMATICAMENTE:
  - Nome completo (`users.fullName`)
  - Email (`users.email`)
  - Foto de perfil (`users.photoUrl`)
- Campos adicionais (editáveis):
  - Cargo na diretoria
  - Bio
  - WhatsApp
  - Instagram
  - Ordem de exibição

**Interface de Seleção:**
```typescript
// Componente BoardMemberSelector
interface BoardMemberSelectorProps {
  onSelect: (userId: number, userData: UserData) => void;
}

// Busca usuários do banco
const { data: users } = useQuery({
  queryKey: ['/api/marketing/users'],
});

// Ao selecionar, preenche automaticamente
const handleUserSelect = (userId: number) => {
  const user = users.find(u => u.id === userId);
  if (user) {
    form.setValue('name', user.fullName);
    form.setValue('photoUrl', user.photoUrl);
    form.setValue('userId', userId);
    // Email e outros dados são referenciados via userId
  }
};
```

#### 5.1.4 Editor de Páginas do Site

**Páginas Editáveis:**

| Página | Seções |
|--------|--------|
| Quem Somos | História, Missão, Visão, Valores |
| Agenda | Introdução, Descrição |
| Diretoria | Introdução, Mandato atual |

**Estrutura no Banco:**
```typescript
// Tabela site_content
{
  page: "quem-somos",
  section: "missao",
  title: "Nossa Missão",
  content: "Conteúdo em rich text...",
  imageUrl: "opcional",
  metadata: { order: 1 }
}
```

### 5.2 Rotas do Painel Marketing

| Rota | Descrição |
|------|-----------|
| `/admin/marketing` | Dashboard principal com métricas |
| `/admin/marketing/eventos` | Lista de eventos |
| `/admin/marketing/eventos/novo` | Criar evento |
| `/admin/marketing/eventos/:id` | Editar evento |
| `/admin/marketing/calendario` | Calendário anual visual |
| `/admin/marketing/diretoria` | Gerenciar diretoria |
| `/admin/marketing/paginas` | Editar páginas do site |

---

## 6. MELHORIAS NA PÁGINA DIRETORIA

### 6.1 Alterações Visuais

**REMOVER:**
- Texto "Demais Membros da Diretoria"
- Diferenciação de tamanho entre presidente/vice e outros
- Qualquer separação visual entre cargos

**NOVO LAYOUT:**
- TODOS os membros com MESMO tamanho de card
- Grid responsivo uniforme
- Ordem definida pelo campo `orderIndex`
- Dados puxados do banco de usuários via `userId`

### 6.2 Código Atual vs Novo

**ATUAL (Remover):**
```typescript
// Separa featured (presidente/vice) de outros - REMOVER ISSO
const featuredMembers = boardMembers.filter(m => isFeaturedPosition(m.position));
const otherMembers = boardMembers.filter(m => !isFeaturedPosition(m.position));

// Renderiza em seções separadas - REMOVER ISSO
<section>
  <h2>Diretoria</h2>
  {featuredMembers.map(...)} {/* Cards grandes */}
</section>
<section>
  <h2>Demais Membros da Diretoria</h2> {/* REMOVER */}
  {otherMembers.map(...)} {/* Cards pequenos */}
</section>
```

**NOVO (Implementar):**
```typescript
// Todos os membros ordenados por orderIndex
const allMembers = boardMembers
  .filter(m => m.isCurrent)
  .sort((a, b) => a.orderIndex - b.orderIndex);

// Grid uniforme para TODOS
<section>
  <h2>Diretoria</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {allMembers.map((member) => (
      <BoardMemberCard 
        key={member.id} 
        member={member}
        className="h-full" // Altura igual para todos
      />
    ))}
  </div>
</section>
```

### 6.3 Componente BoardMemberCard Uniforme

```typescript
// Todos os cards com mesmo tamanho
interface BoardMemberCardProps {
  member: BoardMember & { user?: User };
}

function BoardMemberCard({ member }: BoardMemberCardProps) {
  // Puxar foto do usuário vinculado se existir
  const photoUrl = member.photoUrl || member.user?.photoUrl;
  
  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-6 flex flex-col items-center text-center flex-1">
        {/* Avatar - mesmo tamanho para todos */}
        <Avatar className="w-24 h-24 mb-4">
          <AvatarImage src={photoUrl} alt={member.name} />
          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
        </Avatar>
        
        {/* Nome */}
        <h3 className="font-semibold text-lg">{member.name}</h3>
        
        {/* Cargo */}
        <Badge variant="secondary" className="mt-2">
          {member.position}
        </Badge>
        
        {/* Bio opcional */}
        {member.bio && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-3">
            {member.bio}
          </p>
        )}
        
        {/* Contatos */}
        <div className="flex gap-2 mt-4">
          {member.whatsapp && (
            <Button size="icon" variant="ghost" asChild>
              <a href={`https://wa.me/${member.whatsapp}`}>
                <Phone className="h-4 w-4" />
              </a>
            </Button>
          )}
          {member.instagram && (
            <Button size="icon" variant="ghost" asChild>
              <a href={`https://instagram.com/${member.instagram}`}>
                <Instagram className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 7. MELHORIAS NA PÁGINA DE ORAÇÃO

### 7.1 REMOVER Opção Anônima

**ANTES:**
```typescript
const prayerFormSchema = z.object({
  name: z.string().min(2).optional().or(z.literal("")),
  isAnonymous: z.boolean().default(false), // REMOVER
  whatsapp: z.string().optional(),
  category: z.string(),
  request: z.string().min(10),
});
```

**DEPOIS:**
```typescript
const prayerFormSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"), // OBRIGATÓRIO
  // isAnonymous: REMOVIDO
  whatsapp: z.string().optional(),
  category: z.string(),
  request: z.string().min(10, "Pedido deve ter pelo menos 10 caracteres"),
});
```

**Alterações no Formulário:**
- Remover checkbox "Enviar de forma anônima"
- Campo nome passa a ser OBRIGATÓRIO
- Mensagem de validação clara

### 7.2 Mural da Oração

**Nova Seção na Página:**
- Exibe APENAS pedidos APROVADOS
- Mostra: Nome + Pedido (sem categoria, sem WhatsApp)
- Botão de interação "Estou em Oração"
- Contador de pessoas orando

**Interface do Mural:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🙏 Mural da Oração                                             │
│                                                                 │
│  "Orem uns pelos outros." - Tiago 5:16                         │
│                                                                 │
│  ─────────────────────────────────────────                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  Maria Silva                                            │   │
│  │                                                         │   │
│  │  "Peço oração pela recuperação da minha avó que está   │   │
│  │   hospitalizada. Ela precisa muito de Deus."           │   │
│  │                                                         │   │
│  │  [🙏 Estou em Oração] 12 pessoas orando                │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  João Pedro                                             │   │
│  │                                                         │   │
│  │  "Oração por direção profissional. Estou em busca de   │   │
│  │   um novo emprego."                                     │   │
│  │                                                         │   │
│  │  [✓ Orando] 8 pessoas orando                           │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Componente PrayerWallCard:**
```typescript
interface PrayerWallItem {
  id: number;
  name: string;
  request: string;
  prayerCount: number;      // Número de pessoas orando
  userHasPrayed: boolean;   // Se o usuário logado já reagiu
  createdAt: string;
}

function PrayerWallCard({ item, onPray }: { item: PrayerWallItem; onPray: () => void }) {
  return (
    <Card>
      <CardContent className="p-4">
        <h4 className="font-medium">{item.name}</h4>
        <p className="text-muted-foreground mt-2">{item.request}</p>
        
        <div className="flex items-center justify-between mt-4">
          <Button 
            variant={item.userHasPrayed ? "secondary" : "default"}
            onClick={onPray}
            disabled={item.userHasPrayed}
          >
            {item.userHasPrayed ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Orando
              </>
            ) : (
              <>
                <Heart className="mr-2 h-4 w-4" />
                Estou em Oração
              </>
            )}
          </Button>
          
          <span className="text-sm text-muted-foreground">
            {item.prayerCount} {item.prayerCount === 1 ? 'pessoa' : 'pessoas'} orando
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Funcionalidade de Reação:**
- Usuário logado pode clicar "Estou em Oração"
- Cada usuário só pode reagir UMA VEZ por pedido
- Contador incrementa em tempo real
- Reação persiste (não pode desfazer)

### 7.3 Tabela de Reações

```typescript
// Nova tabela: prayer_reactions
export const prayerReactions = pgTable("prayer_reactions", {
  id: serial("id").primaryKey(),
  prayerRequestId: integer("prayer_request_id")
    .notNull()
    .references(() => prayerRequests.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // Um usuário só pode reagir uma vez por pedido
  uniqueUserPrayer: unique().on(table.userId, table.prayerRequestId),
}));
```

---

## 8. NOVAS TABELAS DO BANCO DE DADOS

### 8.1 Comentários de Devocionais

```typescript
export const devotionalComments = pgTable("devotional_comments", {
  id: serial("id").primaryKey(),
  devotionalId: integer("devotional_id")
    .notNull()
    .references(() => devotionals.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .references(() => users.id), // null = comentário público (não logado)
  authorName: text("author_name").notNull(), // Nome do autor (obrigatório)
  content: text("content").notNull(),
  isPublic: boolean("is_public").notNull().default(true),
  isApproved: boolean("is_approved").notNull().default(false), // Precisa aprovação
  parentId: integer("parent_id")
    .references(() => devotionalComments.id), // Para respostas
  likesCount: integer("likes_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### 8.2 Reações de Oração

```typescript
export const prayerReactions = pgTable("prayer_reactions", {
  id: serial("id").primaryKey(),
  prayerRequestId: integer("prayer_request_id")
    .notNull()
    .references(() => prayerRequests.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueUserPrayer: unique().on(table.userId, table.prayerRequestId),
}));
```

### 8.3 Inscrições em Eventos

```typescript
export const eventRegistrations = pgTable("event_registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => siteEvents.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .references(() => users.id), // null = inscrição externa (não logado)
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  additionalInfo: text("additional_info"), // JSON com campos extras
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled, attended
  paymentStatus: text("payment_status").default("not_required"),
  paymentAmount: text("payment_amount"),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  cancelledAt: timestamp("cancelled_at"),
});
```

---

## 9. ALTERAÇÕES EM TABELAS EXISTENTES

### 9.1 Tabela devotionals

```typescript
// Adicionar campos
coverImageUrl: text("cover_image_url"),    // Imagem de capa/arte
status: text("status").default("draft"),   // draft, published, scheduled
slug: text("slug"),                         // URL amigável
contentRich: text("content_rich"),          // TipTap JSON
scheduledAt: timestamp("scheduled_at"),     // Publicação agendada
```

### 9.2 Tabela siteEvents

```typescript
// Adicionar campos
requiresRegistration: boolean("requires_registration").notNull().default(false),
registrationDeadline: timestamp("registration_deadline"),
maxAttendees: integer("max_attendees"),
registrationFields: text("registration_fields"), // JSON com campos do formulário
allowPresenceConfirmation: boolean("allow_presence_confirmation").notNull().default(true),
icsUid: text("ics_uid"), // UID único para calendário ICS
```

### 9.3 Tabela prayerRequests

```typescript
// Adicionar campos
isModerated: boolean("is_moderated").notNull().default(false),
moderatedBy: integer("moderated_by").references(() => users.id),
moderatedAt: timestamp("moderated_at"),
isApproved: boolean("is_approved").notNull().default(false),
approvedAt: timestamp("approved_at"),
approvedBy: integer("approved_by").references(() => users.id),
inPrayerCount: integer("in_prayer_count").notNull().default(0),

// Flags de moderação automática
hasProfanity: boolean("has_profanity").default(false),
hasHateSpeech: boolean("has_hate_speech").default(false),
hasSexualContent: boolean("has_sexual_content").default(false),
moderationDetails: text("moderation_details"), // Detalhes do filtro

// REMOVER campo:
// isAnonymous: boolean - SERÁ REMOVIDO
```

---

## 10. NOVAS ROTAS DA API

### 10.1 Painel Espiritualidade

| Método | Rota | Descrição | Middleware |
|--------|------|-----------|------------|
| GET | `/api/espiritualidade/devotionals` | Listar devocionais (admin) | requireEspiritualidade |
| POST | `/api/espiritualidade/devotionals` | Criar devocional | requireEspiritualidade |
| PUT | `/api/espiritualidade/devotionals/:id` | Atualizar devocional | requireEspiritualidade |
| DELETE | `/api/espiritualidade/devotionals/:id` | Excluir devocional | requireEspiritualidade |
| POST | `/api/espiritualidade/devotionals/:id/publish` | Publicar devocional | requireEspiritualidade |
| POST | `/api/espiritualidade/devotionals/:id/unpublish` | Despublicar | requireEspiritualidade |
| POST | `/api/espiritualidade/upload` | Upload de imagem | requireEspiritualidade |
| GET | `/api/espiritualidade/prayers` | Listar pedidos | requireEspiritualidade |
| PATCH | `/api/espiritualidade/prayers/:id/approve` | Aprovar pedido | requireEspiritualidade |
| PATCH | `/api/espiritualidade/prayers/:id/reject` | Rejeitar pedido | requireEspiritualidade |
| GET | `/api/espiritualidade/devotionals/:id/comments` | Listar comentários | requireEspiritualidade |
| PATCH | `/api/espiritualidade/comments/:id/approve` | Aprovar comentário | requireEspiritualidade |
| DELETE | `/api/espiritualidade/comments/:id` | Excluir comentário | requireEspiritualidade |

### 10.2 Painel Marketing

| Método | Rota | Descrição | Middleware |
|--------|------|-----------|------------|
| GET | `/api/marketing/events` | Listar eventos (admin) | requireMarketing |
| POST | `/api/marketing/events` | Criar evento | requireMarketing |
| PUT | `/api/marketing/events/:id` | Atualizar evento | requireMarketing |
| DELETE | `/api/marketing/events/:id` | Excluir evento | requireMarketing |
| GET | `/api/marketing/events/:id/registrations` | Listar inscrições | requireMarketing |
| POST | `/api/marketing/upload` | Upload de imagem | requireMarketing |
| GET | `/api/marketing/board-members` | Listar diretoria (admin) | requireMarketing |
| POST | `/api/marketing/board-members` | Adicionar membro | requireMarketing |
| PUT | `/api/marketing/board-members/:id` | Atualizar membro | requireMarketing |
| DELETE | `/api/marketing/board-members/:id` | Remover membro | requireMarketing |
| PATCH | `/api/marketing/board-members/reorder` | Reordenar | requireMarketing |
| GET | `/api/marketing/site-content` | Obter conteúdo | requireMarketing |
| PUT | `/api/marketing/site-content/:page/:section` | Atualizar conteúdo | requireMarketing |
| GET | `/api/marketing/users` | Listar usuários para seleção | requireMarketing |

### 10.3 Rotas Públicas (Atualizações)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/site/prayer-wall` | Mural da oração (aprovados) |
| POST | `/api/site/prayer-wall/:id/react` | Reagir "Estou em oração" |
| POST | `/api/site/prayer-requests` | Enviar pedido (com moderação) |
| POST | `/api/site/devotionals/:id/comments` | Adicionar comentário |
| GET | `/api/site/devotionals/:id/comments` | Ver comentários aprovados |
| GET | `/api/site/events/calendar.ics` | Calendário ICS |

---

## 11. COMPONENTES FRONTEND

### 11.1 Novos Componentes UI

| Componente | Localização | Descrição |
|------------|-------------|-----------|
| `RichTextEditor` | `components/ui/rich-text-editor.tsx` | Editor TipTap completo |
| `ImageUpload` | `components/ui/image-upload.tsx` | Upload com preview |
| `YouTubeEmbed` | `components/ui/youtube-embed.tsx` | Embed de vídeo YT |
| `InstagramEmbed` | `components/ui/instagram-embed.tsx` | Embed de post IG |
| `CalendarView` | `components/ui/calendar-view.tsx` | Visualização de calendário |

### 11.2 Novos Componentes Site

| Componente | Localização | Descrição |
|------------|-------------|-----------|
| `PrayerWall` | `components/site/PrayerWall.tsx` | Mural da oração |
| `PrayerWallCard` | `components/site/PrayerWallCard.tsx` | Card de pedido |
| `DevotionalComments` | `components/site/DevotionalComments.tsx` | Seção de comentários |
| `CommentCard` | `components/site/CommentCard.tsx` | Card de comentário |
| `CommentForm` | `components/site/CommentForm.tsx` | Formulário de comentário |

### 11.3 Novos Componentes Admin

| Componente | Localização | Descrição |
|------------|-------------|-----------|
| `EventCalendar` | `components/admin/EventCalendar.tsx` | Calendário de eventos |
| `BoardMemberSelector` | `components/admin/BoardMemberSelector.tsx` | Seletor de usuários |
| `DevotionalEditor` | `components/admin/DevotionalEditor.tsx` | Editor de devocional |
| `PrayerModerationList` | `components/admin/PrayerModerationList.tsx` | Lista de moderação |

### 11.4 Novas Páginas

| Página | Localização |
|--------|-------------|
| Dashboard Espiritualidade | `pages/admin/EspiritualidadeDashboard.tsx` |
| Gerenciar Devocionais | `pages/admin/EspiritualidadeDevocionais.tsx` |
| Editor Devocional | `pages/admin/EspiritualidadeDevocionalEditor.tsx` |
| Gerenciar Orações | `pages/admin/EspiritualidadeOracoes.tsx` |
| Dashboard Marketing | `pages/admin/MarketingDashboard.tsx` |
| Gerenciar Eventos | `pages/admin/MarketingEventos.tsx` |
| Editor Evento | `pages/admin/MarketingEventoEditor.tsx` |
| Calendário Anual | `pages/admin/MarketingCalendario.tsx` |
| Gerenciar Diretoria | `pages/admin/MarketingDiretoria.tsx` |
| Editar Páginas | `pages/admin/MarketingPaginas.tsx` |

---

## 12. INTEGRAÇÃO GEMINI PARA MISSÕES DIÁRIAS

### 12.1 Requisito

As missões diárias DEVEM ser geradas EXCLUSIVAMENTE pela IA Gemini (Google).
**NÃO USAR OpenAI para missões diárias.**

### 12.2 Configuração Atual

O projeto já possui a integração `javascript_gemini` instalada.

**Arquivo:** `server/ai.ts`

### 12.3 Implementação

```typescript
// server/ai.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Função EXCLUSIVA para missões diárias - SEMPRE usa Gemini
export async function generateDailyMissionContentWithGemini(): Promise<DailyMissionContent> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `
    Gere conteúdo para missões bíblicas diárias em português brasileiro.
    Retorne um JSON com:
    {
      "dailyVerse": "Versículo bíblico com referência",
      "bibleFact": "Fato curioso sobre a Bíblia",
      "bibleCharacter": "Nome de personagem bíblico e breve descrição",
      "dailyTheme": "Tema de meditação do dia",
      "timedQuizQuestions": [
        {
          "question": "Pergunta sobre a Bíblia",
          "options": ["A", "B", "C", "D"],
          "correctIndex": 0
        }
      ]
    }
    
    O conteúdo deve ser edificante, cristão e adequado para jovens.
  `;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Parse do JSON retornado
  const content = JSON.parse(text);
  
  return content;
}

// BLOQUEAR uso de OpenAI para missões
export async function generateDailyMissionContent(): Promise<DailyMissionContent> {
  // SEMPRE usa Gemini para missões diárias
  return generateDailyMissionContentWithGemini();
}
```

### 12.4 Scheduler de Missões

**Arquivo:** `server/scheduler.ts`

```typescript
import cron from 'node-cron';
import { generateDailyMissionContentWithGemini } from './ai';
import { storage } from './storage';

// Gerar conteúdo das missões diariamente às 00:01
cron.schedule('1 0 * * *', async () => {
  console.log('[Missions] Gerando conteúdo diário com Gemini...');
  
  try {
    // SEMPRE usa Gemini
    const content = await generateDailyMissionContentWithGemini();
    const today = new Date().toISOString().split('T')[0];
    
    await storage.createDailyMissionContent({
      contentDate: today,
      dailyVerse: content.dailyVerse,
      bibleFact: content.bibleFact,
      bibleCharacter: content.bibleCharacter,
      dailyTheme: content.dailyTheme,
      timedQuizQuestions: JSON.stringify(content.timedQuizQuestions),
    });
    
    console.log('[Missions] Conteúdo gerado com sucesso via Gemini');
  } catch (error) {
    console.error('[Missions] Erro ao gerar conteúdo:', error);
  }
}, {
  timezone: "America/Sao_Paulo"
});
```

---

## 13. SISTEMA DE MODERAÇÃO AUTOMÁTICA

### 13.1 Objetivo

Filtrar automaticamente pedidos de oração que contenham:
- Palavras de baixo calão
- Conteúdo sexual
- Xingamentos
- Discurso de ódio

### 13.2 Bibliotecas Recomendadas

```bash
npm install bad-words
```

### 13.3 Implementação

**Arquivo:** `server/utils/profanity-filter.ts`

```typescript
import Filter from 'bad-words';

// Lista de palavras em português (expandir conforme necessário)
const palavrasProibidasPT = [
  // Baixo calão
  'merda', 'porra', 'caralho', 'foda', 'fodase', 'buceta', 'pau', 'pinto',
  'rola', 'bosta', 'cagar', 'cagada', 'cu', 'cuzao', 'cuzinho',
  
  // Xingamentos
  'idiota', 'imbecil', 'retardado', 'babaca', 'otario', 'fdp', 'filhodaputa',
  'vagabundo', 'vagabunda', 'vadia', 'piranha', 'puta', 'prostituta',
  
  // Discurso de ódio
  'viado', 'veado', 'bicha', 'sapatao', 'traveco', 'preto', 'macaco',
  'judeu', 'nword', // palavras racistas
  
  // Conteúdo sexual
  'sexo', 'transa', 'transar', 'gozar', 'gozada', 'punheta', 'masturbar',
  'boquete', 'chupar', 'foder', 'meter', 'comer', 'dar',
];

// Configurar filtro
const filter = new Filter();
filter.addWords(...palavrasProibidasPT);

// Verificar se texto contém palavrões
export function containsProfanity(text: string): boolean {
  return filter.isProfane(text);
}

// Limpar texto (substituir por asteriscos)
export function cleanText(text: string): string {
  return filter.clean(text);
}

// Análise detalhada para moderação
export interface ModerationResult {
  isClean: boolean;
  hasProfanity: boolean;
  hasHateSpeech: boolean;
  hasSexualContent: boolean;
  flaggedWords: string[];
  details: string;
}

export function moderateContent(text: string): ModerationResult {
  const textLower = text.toLowerCase();
  const flaggedWords: string[] = [];
  
  // Verificar palavras proibidas
  for (const word of palavrasProibidasPT) {
    if (textLower.includes(word)) {
      flaggedWords.push(word);
    }
  }
  
  // Classificar tipo de conteúdo
  const hasProfanity = flaggedWords.some(w => 
    ['merda', 'porra', 'caralho', 'foda'].some(p => w.includes(p))
  );
  
  const hasHateSpeech = flaggedWords.some(w => 
    ['viado', 'bicha', 'preto', 'macaco'].some(p => w.includes(p))
  );
  
  const hasSexualContent = flaggedWords.some(w => 
    ['sexo', 'transa', 'gozar', 'punheta'].some(p => w.includes(p))
  );
  
  return {
    isClean: flaggedWords.length === 0,
    hasProfanity,
    hasHateSpeech,
    hasSexualContent,
    flaggedWords,
    details: flaggedWords.length > 0 
      ? `Palavras detectadas: ${flaggedWords.join(', ')}`
      : 'Conteúdo aprovado',
  };
}
```

### 13.4 Uso na API

**Arquivo:** `server/routes.ts`

```typescript
import { moderateContent } from './utils/profanity-filter';

// Rota de envio de pedido de oração
app.post('/api/site/prayer-requests', async (req, res) => {
  const { name, whatsapp, category, request } = req.body;
  
  // Validar campos obrigatórios (nome é obrigatório agora)
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ 
      error: "Nome é obrigatório",
      code: "NAME_REQUIRED" 
    });
  }
  
  // MODERAR conteúdo automaticamente
  const moderation = moderateContent(request);
  
  if (!moderation.isClean) {
    // Criar pedido mas marcar como não aprovado
    await storage.createPrayerRequest({
      name,
      whatsapp,
      category,
      request,
      status: 'pending',
      isApproved: false,
      isModerated: true,
      hasProfanity: moderation.hasProfanity,
      hasHateSpeech: moderation.hasHateSpeech,
      hasSexualContent: moderation.hasSexualContent,
      moderationDetails: moderation.details,
    });
    
    return res.status(400).json({
      error: "Seu pedido contém conteúdo inapropriado. Por favor, revise o texto.",
      code: "CONTENT_MODERATION_FAILED",
      // Não revelar detalhes específicos por segurança
    });
  }
  
  // Conteúdo limpo - criar pedido para aprovação manual
  const prayerRequest = await storage.createPrayerRequest({
    name,
    whatsapp,
    category,
    request,
    status: 'pending',
    isApproved: false,
    isModerated: true,
    hasProfanity: false,
    hasHateSpeech: false,
    hasSexualContent: false,
    moderationDetails: 'Aprovado na verificação automática',
  });
  
  res.json({ 
    success: true, 
    message: "Pedido enviado com sucesso! Será publicado após aprovação.",
    id: prayerRequest.id 
  });
});
```

---

## 14. EDITOR RICH TEXT (TIPTAP)

### 14.1 Instalação

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-youtube
npm install @tiptap/extension-link
npm install @tiptap/extension-underline
npm install @tiptap/extension-placeholder
```

### 14.2 Componente Editor

**Arquivo:** `client/src/components/ui/rich-text-editor.tsx`

```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Youtube from '@tiptap/extension-youtube';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  List, ListOrdered, Link as LinkIcon, 
  Youtube as YoutubeIcon, Instagram
} from 'lucide-react';
import { Button } from './button';
import { Toggle } from './toggle';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string, html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Youtube.configure({
        width: 640,
        height: 360,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Escreva aqui...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      const html = editor.getHTML();
      onChange(json, html);
    },
  });

  if (!editor) return null;

  const addYoutubeVideo = () => {
    const url = prompt('Cole a URL do vídeo do YouTube:');
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  };

  const addLink = () => {
    const url = prompt('Cole a URL do link:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('underline')}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1" />
        
        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1" />
        
        <Button size="sm" variant="ghost" onClick={addLink}>
          <LinkIcon className="h-4 w-4" />
        </Button>
        
        <Button size="sm" variant="ghost" onClick={addYoutubeVideo}>
          <YoutubeIcon className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none"
      />
    </div>
  );
}
```

### 14.3 Estilos Padrão para Devocionais

```css
/* Estilos para conteúdo de devocionais */
.devotional-content {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: var(--foreground);
}

.devotional-content h1,
.devotional-content h2,
.devotional-content h3 {
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.devotional-content .verse {
  font-family: 'Georgia', serif;
  font-style: italic;
  font-size: 18px;
  border-left: 4px solid var(--primary);
  padding-left: 16px;
  margin: 24px 0;
}

.devotional-content iframe {
  max-width: 100%;
  border-radius: 8px;
  margin: 16px 0;
}
```

---

## 15. GERAÇÃO DE CALENDÁRIO ICS

### 15.1 Instalação

```bash
npm install ical-generator
```

### 15.2 Implementação

**Arquivo:** `server/utils/ics-generator.ts`

```typescript
import ical, { ICalCalendar, ICalEventStatus } from 'ical-generator';
import { SiteEvent } from '@shared/schema';

export function generateEventsCalendar(events: SiteEvent[]): string {
  const calendar = ical({
    name: 'UMP Emaús - Eventos',
    prodId: '//UMP Emaus//Calendario de Eventos//PT-BR',
    timezone: 'America/Sao_Paulo',
  });

  for (const event of events) {
    if (!event.isPublished) continue;
    
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : startDate;
    
    // Adicionar horário se disponível
    if (event.time) {
      const [hours, minutes] = event.time.split(':');
      startDate.setHours(parseInt(hours), parseInt(minutes));
      endDate.setHours(parseInt(hours) + 2, parseInt(minutes)); // Duração padrão 2h
    }
    
    calendar.createEvent({
      id: event.icsUid || `evento-${event.id}@umpemaus.com.br`,
      start: startDate,
      end: endDate,
      allDay: event.isAllDay,
      summary: event.title,
      description: event.shortDescription || event.description || '',
      location: event.location || undefined,
      url: event.registrationUrl || undefined,
      status: ICalEventStatus.CONFIRMED,
    });
  }

  return calendar.toString();
}
```

### 15.3 Rota da API

**Arquivo:** `server/routes.ts`

```typescript
import { generateEventsCalendar } from './utils/ics-generator';

// Endpoint para download do calendário ICS
app.get('/api/site/events/calendar.ics', async (req, res) => {
  try {
    // Buscar eventos publicados
    const events = await storage.getPublishedEvents();
    
    // Gerar conteúdo ICS
    const icsContent = generateEventsCalendar(events);
    
    // Retornar como arquivo de calendário
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ump-emaus-eventos.ics"');
    res.send(icsContent);
  } catch (error) {
    console.error('Erro ao gerar calendário ICS:', error);
    res.status(500).json({ error: 'Erro ao gerar calendário' });
  }
});
```

---

## 16. DEPENDÊNCIAS NECESSÁRIAS

### 16.1 NPM Packages a Instalar

```bash
# Editor Rich Text
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-youtube @tiptap/extension-link
npm install @tiptap/extension-underline @tiptap/extension-placeholder

# Moderação de conteúdo
npm install bad-words

# Geração de calendário
npm install ical-generator
```

### 16.2 Integrações Já Instaladas

| Integração | Status | Uso |
|------------|--------|-----|
| Gemini (Google) | ÚNICO PROVEDOR | TODA geração de conteúdo: lições, missões, exercícios, resumos |
| Multer | Instalado | Upload de arquivos |
| Resend | Configurado | Emails transacionais |

**IMPORTANTE:** OpenAI foi COMPLETAMENTE REMOVIDO do projeto. Usar APENAS Gemini.

---

## 17. CRONOGRAMA DE IMPLEMENTAÇÃO

### Fase 1: Fundação (Prioridade ALTA)

| Tarefa | Estimativa | Dependências |
|--------|------------|--------------|
| Atualizar tipo Secretaria no schema | 30 min | - |
| Executar migração de dados | 15 min | Schema |
| Criar middlewares requireEspiritualidade/Marketing | 30 min | - |
| Adicionar novas tabelas ao banco | 1h | - |
| Atualizar navigation/sidebar condicionalmente | 1h | Middlewares |

### Fase 2: Painel Espiritualidade

| Tarefa | Estimativa | Dependências |
|--------|------------|--------------|
| Instalar e configurar TipTap | 1h | - |
| Criar componente RichTextEditor | 2h | TipTap |
| Criar editor de devocionais | 3h | RichTextEditor |
| Sistema de upload de imagens | 1h | Multer |
| Rotas API de devocionais | 2h | Schema |
| Gerenciador de pedidos de oração | 2h | - |
| Sistema de comentários | 2h | Schema |

### Fase 3: Painel Marketing

| Tarefa | Estimativa | Dependências |
|--------|------------|--------------|
| CRUD de eventos | 3h | Schema |
| Calendário visual | 2h | - |
| Geração de ICS | 1h | ical-generator |
| Gerenciador da diretoria | 2h | - |
| Editor de páginas do site | 2h | TipTap |

### Fase 4: Melhorias no Site Público

| Tarefa | Estimativa | Dependências |
|--------|------------|--------------|
| Atualizar página de oração (remover anônimo) | 30 min | - |
| Implementar Mural da Oração | 2h | Schema |
| Sistema de reações | 1h | Schema |
| Atualizar página da diretoria (layout uniforme) | 1h | - |
| Adicionar comentários nas devocionais | 2h | Schema |

### Fase 5: Moderação e IA

| Tarefa | Estimativa | Dependências |
|--------|------------|--------------|
| Implementar filtro de palavras | 1h | bad-words |
| Integrar moderação nas rotas | 1h | Filtro |
| Configurar Gemini para missões | 1h | Gemini |
| Atualizar scheduler de missões | 30 min | Gemini |

### Fase 6: Testes e Ajustes

| Tarefa | Estimativa | Dependências |
|--------|------------|--------------|
| Testes de integração | 2h | Tudo |
| Ajustes de UI/UX | 2h | Testes |
| Performance e otimizações | 1h | - |
| Documentação final | 1h | - |

---

## 18. ESTADO ATUAL DO CÓDIGO - PAINEL ESPIRITUALIDADE

### 18.1 Responsabilidades do Painel

O Painel de Espiritualidade (`/admin/espiritualidade`) é responsável por:
1. **Criar, gerenciar e publicar devocionais**
2. **Controlar a página de devocionais** (o que aparece no site público)
3. **Controlar a página de oração** (moderação de pedidos)

### 18.2 Estrutura de Dados Existente

#### Tabela `devotionals` (shared/schema.ts - linha 375)

```typescript
export const devotionals = pgTable("devotionals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  verse: text("verse").notNull(),
  verseReference: text("verse_reference").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  prayer: text("prayer"),
  imageUrl: text("image_url"),
  author: text("author"),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  isPublished: boolean("is_published").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### Tabela `prayer_requests` (shared/schema.ts - linha 462)

```typescript
export type PrayerCategory = "saude" | "familia" | "trabalho" | "espiritual" | "relacionamento" | "outros";
export type PrayerStatus = "pending" | "praying" | "answered" | "archived";

export const prayerRequests = pgTable("prayer_requests", {
  id: serial("id").primaryKey(),
  name: text("name"),
  whatsapp: text("whatsapp"),
  category: text("category").notNull().default("outros"),
  request: text("request").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false), // A SER REMOVIDO
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  prayedBy: integer("prayed_by").references(() => users.id),
  prayedAt: timestamp("prayed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### 18.3 Rotas de API Existentes

#### Devocionais - Rotas Públicas (server/routes.ts ~linha 3118)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/site/devotionals` | Lista devocionais publicados (limite configurável) |
| GET | `/api/site/devotionals/:id` | Detalhes de um devocional específico |

#### Pedidos de Oração - Rotas Públicas (server/routes.ts ~linha 3173)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/site/prayer-requests` | Enviar pedido de oração (rate limited) |

#### Pedidos de Oração - Rotas Admin (server/routes.ts ~linha 3222)

| Método | Rota | Middleware | Descrição |
|--------|------|------------|-----------|
| GET | `/api/admin/prayer-requests` | requireAdminOrMarketing | Listar pedidos (filtrável por status) |
| PATCH | `/api/admin/prayer-requests/:id` | requireAdminOrMarketing | Atualizar status do pedido |

### 18.4 Métodos de Storage Existentes (server/storage.ts)

#### Devocionais

```typescript
// Métodos já implementados
getAllDevotionals(limit?: number): Promise<Devotional[]>
getDevotionalById(id: number): Promise<Devotional | null>
getLatestDevotional(): Promise<Devotional | null>

// Métodos A IMPLEMENTAR
createDevotional(data: InsertDevotional): Promise<Devotional>
updateDevotional(id: number, data: Partial<InsertDevotional>): Promise<Devotional>
deleteDevotional(id: number): Promise<void>
getAllDevotionalsAdmin(): Promise<Devotional[]> // Incluir rascunhos
```

#### Pedidos de Oração

```typescript
// Métodos já implementados
createPrayerRequest(data: InsertPrayerRequest): Promise<PrayerRequest>
getAllPrayerRequests(status?: string): Promise<PrayerRequest[]>
updatePrayerRequestStatus(id: number, status: string): Promise<PrayerRequest>

// Métodos A IMPLEMENTAR
getApprovedPrayerRequests(): Promise<PrayerRequest[]> // Para Mural
incrementPrayingCount(id: number): Promise<void> // Para "Estou em Oração"
```

### 18.5 Componentes Frontend Existentes

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `client/src/pages/site/devocionais.tsx` | Listagem pública de devocionais | EXISTENTE |
| `client/src/pages/site/devocional-detail.tsx` | Detalhe de devocional | EXISTENTE |
| `client/src/pages/site/oracao.tsx` | Página pública de oração | EXISTENTE |
| `client/src/pages/admin/admin-site.tsx` | Admin atual (tabs mistas) | EXISTENTE |
| `client/src/components/DevotionalShareCard.tsx` | Card de compartilhamento | EXISTENTE |

### 18.6 Componentes Frontend A CRIAR

| Componente | Localização | Descrição |
|------------|-------------|-----------|
| `EspiritualidadeDashboard.tsx` | `pages/admin/espiritualidade/` | Dashboard principal com métricas |
| `DevotionalList.tsx` | `pages/admin/espiritualidade/` | Lista de devocionais (publicados + rascunhos) |
| `DevotionalEditor.tsx` | `pages/admin/espiritualidade/` | Editor com TipTap para criar/editar |
| `PrayerModerationList.tsx` | `pages/admin/espiritualidade/` | Lista de moderação de pedidos |
| `PrayerWall.tsx` | `components/site/` | Mural da Oração público |

### 18.7 Rotas API A CRIAR

#### Novas rotas para `/api/espiritualidade/`

| Método | Rota | Middleware | Descrição |
|--------|------|------------|-----------|
| GET | `/api/espiritualidade/devotionals` | requireEspiritualidade | Listar TODOS (incluindo rascunhos) |
| POST | `/api/espiritualidade/devotionals` | requireEspiritualidade | Criar novo devocional |
| PUT | `/api/espiritualidade/devotionals/:id` | requireEspiritualidade | Atualizar devocional |
| DELETE | `/api/espiritualidade/devotionals/:id` | requireEspiritualidade | Excluir devocional |
| PATCH | `/api/espiritualidade/devotionals/:id/publish` | requireEspiritualidade | Publicar/Despublicar |
| GET | `/api/espiritualidade/prayer-requests` | requireEspiritualidade | Listar pedidos para moderação |
| PATCH | `/api/espiritualidade/prayer-requests/:id` | requireEspiritualidade | Aprovar/Rejeitar pedido |
| GET | `/api/site/prayer-wall` | - (público) | Pedidos aprovados para o Mural |
| POST | `/api/site/prayer-wall/:id/pray` | authenticateToken | Marcar "Estou em Oração" |

### 18.8 Checklist de Implementação

**Última atualização:** 05/12/2025 - Painéis Espiritualidade e Marketing

#### Backend

- [x] Criar middleware `requireEspiritualidade` em `server/auth.ts` (como `requireAdminOrEspiritualidade`)
- [x] Criar middleware `requireMarketing` em `server/auth.ts` (como `requireAdminOrMarketing`)
- [x] Adicionar métodos de CRUD de devocionais em `server/storage.ts` (getAllDevotionalsAdmin, updateDevotional, deleteDevotional, publishDevotional, unpublishDevotional)
- [x] Criar rotas `/api/espiritualidade/devotionals` em `server/routes.ts` (CRUD completo, publish/unpublish)
- [x] Mover/duplicar rotas de oração para `/api/espiritualidade/` (approve/reject com moderação)
- [x] Adicionar campos contentHtml e scheduledAt na tabela devotionals (schema atualizado)
- [x] Adicionar campos de moderação em prayerRequests (isModerated, moderatedBy, isApproved, hasProfanity, etc.)
- [x] Remover campo isAnonymous da tabela prayerRequests
- [x] Implementar rota GET `/api/site/prayer-requests/approved` para o Mural da Oração
- [x] Implementar rota POST `/api/site/prayer-requests/:id/pray` para interação "Estou em Oração"
- [x] Criar rotas `/api/marketing/events` (CRUD completo de eventos)
- [x] Criar rotas `/api/marketing/board-members` (CRUD de diretoria)
- [x] Implementar rota GET `/api/marketing/users` para buscar usuários disponíveis para diretoria
- [ ] Adicionar sistema de moderação automática com bad-words (filtro de palavras)
- [ ] Implementar endpoint `/api/site/events/calendar.ics` para export ICS

#### Frontend

- [x] Criar página `EspiritualidadeDashboard.tsx` (client/src/pages/admin/)
- [x] Criar página de listagem de devocionais `EspiritualidadeDevocionais.tsx` com CRUD
- [x] Criar editor de devocional `EspiritualidadeDevocionalEditor.tsx` com TipTap
- [x] Criar página de moderação `EspiritualidadeOracoes.tsx` (aprovar/rejeitar pedidos)
- [x] Criar componente `RichTextEditor.tsx` com TipTap (bold, italic, underline, H2/H3, listas, links, YouTube)
- [x] Atualizar navegação na página Admin para incluir botões dos painéis
- [x] Registrar rotas /admin/espiritualidade/* em App.tsx
- [x] Criar página `MarketingDashboard.tsx` com métricas de eventos e diretoria
- [x] Criar página `MarketingEventos.tsx` com listagem e CRUD de eventos
- [x] Criar página `MarketingEventoEditor.tsx` para criar/editar eventos
- [x] Criar página `MarketingDiretoria.tsx` com listagem e CRUD de diretoria
- [x] Criar página `MarketingDiretoriaEditor.tsx` para criar/editar membros da diretoria
- [x] Registrar rotas /admin/marketing/* em App.tsx
- [x] Atualizar página /membro para exibir painéis baseados na secretaria do usuário
- [ ] Atualizar `oracao.tsx` para incluir Mural da Oração interativo
- [ ] Adicionar botão "Estou em Oração" com contador no Mural

#### Dependências

- [x] Instalar TipTap: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-youtube`, `@tiptap/extension-link`, `@tiptap/extension-underline`, `@tiptap/extension-placeholder`
- [ ] Instalar bad-words para filtro de palavras inapropriadas
- [ ] Instalar ical-generator para export de calendário ICS

### 18.9 O Que Falta Para Completar MVP

1. **Mural da Oração Interativo**
   - Atualizar página `/oracao` para exibir Mural com pedidos aprovados
   - Botão "Estou em Oração" com contador (backend já pronto)

2. **Moderação Automática**
   - Integrar biblioteca bad-words para filtro de palavras
   - Filtrar palavrões, discurso de ódio, conteúdo sexual

3. **Calendário ICS**
   - Implementar endpoint `/api/site/events/calendar.ics`
   - Botão de sincronização com Google Agenda

---

## 19. STATUS DAS IMPLEMENTAÇÕES

### 19.1 Implementações Concluídas - Sessão 06/12/2025

| Item | Status | Descrição |
|------|--------|-----------|
| Middlewares de Autorização | IMPLEMENTADO | `requireAdminOrEspiritualidade` e `requireAdminOrMarketing` em `server/auth.ts` |
| Tabela prayerReactions | IMPLEMENTADO | Sistema "Estou em Oração" com unique constraint por sessionId |
| Tabela devotionalComments | IMPLEMENTADO | Comentários de devocionais com moderação e destaque |
| Campo isAnonymous Removido | IMPLEMENTADO | Removido de `client/src/pages/admin/admin-site.tsx` - nome agora obrigatório |
| Layout Uniforme Diretoria | JÁ IMPLEMENTADO | Página `/site/diretoria.tsx` já tinha layout uniforme verificado |
| MarketingDiretoriaEditor | JÁ IMPLEMENTADO | Editor com seleção de usuário do banco já funcionando |

### 19.2 Novas Tabelas Criadas

```typescript
// prayer_reactions - Sistema "Estou em Oração"
// Localização: shared/schema.ts linhas 511-526
export const prayerReactions = pgTable("prayer_reactions", {
  id: serial("id").primaryKey(),
  prayerRequestId: integer("prayer_request_id").notNull().references(() => prayerRequests.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueReaction: unique().on(table.prayerRequestId, table.sessionId),
}));

// devotional_comments - Comentários de devocionais
// Localização: shared/schema.ts linhas 528-555
export const devotionalComments = pgTable("devotional_comments", {
  id: serial("id").primaryKey(),
  devotionalId: integer("devotional_id").notNull().references(() => devotionals.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  content: text("content").notNull(),
  isApproved: boolean("is_approved").notNull().default(false),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  isHighlighted: boolean("is_highlighted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### 19.3 Arquivos Modificados

| Arquivo | Modificação |
|---------|-------------|
| `shared/schema.ts` | Adicionadas tabelas prayerReactions e devotionalComments |
| `client/src/pages/admin/admin-site.tsx` | Removido campo isAnonymous da interface e template |
| `server/auth.ts` | Middlewares de autorização por secretaria |

### 19.4 Próximos Passos

1. **Mural da Oração Interativo** - Atualizar `/oracao` com botão "Estou em Oração"
2. **API para prayerReactions** - Criar endpoints para registrar/consultar reações
3. **API para devotionalComments** - Criar endpoints CRUD com moderação
4. **Moderação Automática** - Integrar filtro de palavras com bad-words
5. **Calendário ICS** - Endpoint `/api/site/events/calendar.ics`

---

## OBSERVAÇÕES FINAIS

1. **Segurança:** Todas as rotas admin usam middlewares `requireAdminOrEspiritualidade` e `requireAdminOrMarketing`
2. **Validação:** Zod usado para validar todas as entradas
3. **Moderação:** Fallback manual disponível caso o filtro automático falhe
4. **Upload:** Limitar tamanho (max 5MB) e tipos de arquivo (apenas imagens)
5. **Rich Text:** Sanitizar HTML antes de salvar para evitar XSS
6. **Gemini:** Usar EXCLUSIVAMENTE Gemini para missões diárias (DeoGlory)
7. **ICS:** Gerar UIDs únicos para cada evento no calendário

---

*Documento atualizado em 06/12/2025*
*Versão: 2.4 - Novas tabelas prayerReactions e devotionalComments*
*Status: Painéis 92% completos - Falta: Mural interativo, API reactions/comments, moderação automática, calendário ICS*
