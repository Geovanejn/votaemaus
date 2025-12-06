# Melhorias do Sistema UMP Emaus

**Data:** 06/12/2025
**Status:** Em Implementacao
**Versao:** 1.1
**Ultima Atualizacao:** 06/12/2025

---

## STATUS DE IMPLEMENTACAO

| Fase | Descricao | Status |
|------|-----------|--------|
| 1 | Correcao de bug de data de eventos | CONCLUIDA |
| 1 | Correcao de URL do Google Calendar | CONCLUIDA |
| 2 | Upload de Imagens nos Paineis | PENDENTE |
| 3 | Integracao com Google Maps | PENDENTE |
| 4 | Botao "Estou Orando" | PENDENTE |
| 5 | Moderacao Automatica | PENDENTE |
| 6 | Gerenciamento de Exclusao | PENDENTE |
| 7 | Sistema de Notificacoes | PENDENTE |
| 8 | Notificacoes DeoGlory | PENDENTE |

---

## INDICE

1. [Resumo Executivo](#1-resumo-executivo)
2. [Upload de Imagens nos Paineis](#2-upload-de-imagens-nos-paineis)
3. [Integracao com Google Maps](#3-integracao-com-google-maps)
4. [Correcao de Bug de Data de Eventos](#4-correcao-de-bug-de-data-de-eventos)
5. [Botao "Estou Orando" com Estado Persistente](#5-botao-estou-orando-com-estado-persistente)
6. [Sistema de Moderacao Automatica](#6-sistema-de-moderacao-automatica)
7. [Gerenciamento de Comentarios e Pedidos](#7-gerenciamento-de-comentarios-e-pedidos)
8. [Sistema de Notificacoes](#8-sistema-de-notificacoes)
9. [Notificacoes DeoGlory (Estilo Duolingo)](#9-notificacoes-deoglory-estilo-duolingo)
10. [Arquitetura Tecnica](#10-arquitetura-tecnica)
11. [Cronograma de Implementacao](#11-cronograma-de-implementacao)

---

## 1. RESUMO EXECUTIVO

Este documento detalha as melhorias solicitadas para o sistema UMP Emaus, organizadas em 10 areas principais:

| # | Melhoria | Descricao | Prioridade |
|---|----------|-----------|------------|
| 1 | Upload de Imagens | Substituir campos URL por upload de arquivo nos paineis Marketing e Espiritualidade | ALTA |
| 2 | Google Maps | Integracao com Google Maps para eventos (autocomplete de endereco) | MEDIA |
| 3 | Bug Data Eventos | Corrigir validacao de data que marca eventos futuros como passados | CRITICA |
| 4 | Botao "Estou Orando" | Mudar cor e persistir estado ao clicar (estilo redes sociais) | ALTA |
| 5 | Moderacao Automatica | Filtrar palavras improprias automaticamente em comentarios e pedidos | ALTA |
| 6 | Gerenciamento Comentarios | Espiritualidade pode excluir; autor pode excluir proprio pedido | MEDIA |
| 7 | Notificacoes Gerais | Email e notificacao push para novos devocionais, eventos, pedidos | ALTA |
| 8 | Notificacoes DeoGlory | Sistema completo estilo Duolingo com lembretes e engajamento | ALTA |

---

## 2. UPLOAD DE IMAGENS NOS PAINEIS

### 2.1 Objetivo

Substituir todos os campos de URL de imagem por um sistema de upload de arquivo, similar ao cadastro de membro existente.

### 2.2 Locais de Implementacao

#### 2.2.1 Painel Marketing - Cadastro de Evento

**Situacao Atual:**
- Campo `imageUrl` recebe uma URL externa

**Novo Comportamento:**
- Botao "Selecionar Imagem" abre seletor de arquivo
- Imagem e recortada no formato 16:9 (landscape para eventos)
- Upload automatico para `/api/upload` com folder `events`
- Preview da imagem apos upload

**Formato da Imagem de Evento:**
```typescript
const eventImageConfig = {
  aspectRatio: 16/9,           // Formato landscape para banners de evento
  maxWidth: 1200,              // Largura maxima
  maxHeight: 675,              // Altura maxima (1200 / 16 * 9)
  quality: 0.85,               // Qualidade JPEG
  acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
};
```

#### 2.2.2 Painel Marketing - Cadastro de Membro da Diretoria

**Situacao Atual:**
- Campo `photoUrl` recebe URL ou upload manual

**Novo Comportamento:**
- Ao selecionar um membro do sistema (via `userId`), a foto cadastrada do membro e carregada automaticamente
- Opcao de substituir a foto com novo upload
- Formato: Quadrado 1:1 (igual ao cadastro de membro)

**Logica de Auto-Preenchimento:**
```typescript
// Ao selecionar usuario no BoardMemberSelector
const handleUserSelect = async (userId: number) => {
  const user = users.find(u => u.id === userId);
  if (user) {
    form.setValue('name', user.fullName);
    form.setValue('userId', userId);
    
    // AUTO-PREENCHER FOTO DO USUARIO
    if (user.photoUrl) {
      form.setValue('photoUrl', user.photoUrl);
      setPreviewImage(user.photoUrl);
    }
  }
};
```

**Formato da Imagem de Diretoria:**
```typescript
const boardMemberImageConfig = {
  aspectRatio: 1,              // Formato quadrado para avatar
  maxWidth: 400,               // Largura maxima
  maxHeight: 400,              // Altura maxima
  quality: 0.85,               // Qualidade JPEG
  acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
};
```

#### 2.2.3 Painel Espiritualidade - Cadastro de Devocional

**Situacao Atual:**
- Campo `imageUrl` recebe uma URL externa

**Novo Comportamento:**
- Botao "Selecionar Imagem de Capa" abre seletor de arquivo
- Imagem e recortada no formato 16:9 (arte de devocional)
- Upload automatico para `/api/upload` com folder `devotionals`
- Preview da imagem apos upload

**Formato da Imagem de Devocional:**
```typescript
const devotionalImageConfig = {
  aspectRatio: 16/9,           // Formato landscape para capa
  maxWidth: 1200,              // Largura maxima
  maxHeight: 675,              // Altura maxima
  quality: 0.85,               // Qualidade JPEG
  acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
};
```

### 2.3 Componente de Upload Reutilizavel

**Arquivo:** `client/src/components/ui/image-upload.tsx`

```typescript
interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  aspectRatio?: number;        // 1 para quadrado, 16/9 para landscape
  folder?: string;             // Pasta no servidor (events, devotionals, board)
  placeholder?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  aspectRatio = 1,
  folder = 'uploads',
  placeholder = 'Selecionar Imagem',
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempImageSrc(reader.result as string);
        setCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCropComplete = async (croppedImage: string) => {
    setIsUploading(true);
    try {
      // Converter base64 para blob
      const blob = await fetch(croppedImage).then(r => r.blob());
      const formData = new FormData();
      formData.append('file', blob, 'image.jpg');
      formData.append('folder', folder);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      onChange(data.url);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className={className}>
      {value ? (
        <div className="relative">
          <img src={value} alt="Preview" className="rounded-lg object-cover" />
          <Button onClick={() => onChange('')} variant="destructive" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="cursor-pointer">
          <input type="file" accept="image/*" onChange={handleFileSelect} hidden />
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
            <p>{placeholder}</p>
          </div>
        </label>
      )}
      
      <ImageCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={tempImageSrc || ''}
        onCropComplete={handleCropComplete}
        aspectRatio={aspectRatio}
      />
    </div>
  );
}
```

### 2.4 Atualizacao do ImageCropDialog

O componente existente `ImageCropDialog.tsx` precisa suportar diferentes aspect ratios:

```typescript
interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  aspectRatio?: number;  // NOVO - default 1 (quadrado)
}

export default function ImageCropDialog({
  aspectRatio = 1,  // 1 = quadrado, 16/9 = landscape
  ...props
}: ImageCropDialogProps) {
  // Usar aspectRatio no componente Cropper
  <Cropper
    image={imageSrc}
    crop={crop}
    zoom={zoom}
    aspect={aspectRatio}  // Usar prop dinamica
    onCropChange={onCropChange}
    onCropComplete={onCropAreaChange}
    onZoomChange={onZoomChange}
  />
}
```

---

## 3. INTEGRACAO COM GOOGLE MAPS

### 3.1 Objetivo

Substituir o campo de URL do Google Maps por um componente de busca de endereco com autocomplete, usando a API Google Places.

### 3.2 Implementacao

#### 3.2.1 Backend - Nova Rota de Geocoding

**Arquivo:** `server/routes.ts`

```typescript
// Buscar coordenadas e link do Google Maps a partir de um endereco
app.get("/api/maps/geocode", async (req, res) => {
  try {
    const { address } = req.query;
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ message: "Endereco obrigatorio" });
    }
    
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "API Key nao configurada" });
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=pt-BR`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const { lat, lng } = result.geometry.location;
      
      res.json({
        formattedAddress: result.formatted_address,
        lat,
        lng,
        placeId: result.place_id,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${result.place_id}`,
      });
    } else {
      res.status(404).json({ message: "Endereco nao encontrado" });
    }
  } catch (error) {
    console.error("Geocode error:", error);
    res.status(500).json({ message: "Erro ao buscar endereco" });
  }
});

// Autocomplete de endereco
app.get("/api/maps/autocomplete", async (req, res) => {
  try {
    const { input } = req.query;
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ message: "Input obrigatorio" });
    }
    
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "API Key nao configurada" });
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&language=pt-BR&components=country:br`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK') {
      res.json({
        predictions: data.predictions.map((p: any) => ({
          description: p.description,
          placeId: p.place_id,
        })),
      });
    } else {
      res.json({ predictions: [] });
    }
  } catch (error) {
    console.error("Autocomplete error:", error);
    res.status(500).json({ message: "Erro ao buscar sugestoes" });
  }
});
```

#### 3.2.2 Frontend - Componente de Busca de Local

**Arquivo:** `client/src/components/ui/location-picker.tsx`

```typescript
interface LocationPickerProps {
  value: {
    location: string;
    locationUrl: string;
  };
  onChange: (value: { location: string; locationUrl: string }) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<{description: string; placeId: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length >= 3) {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(searchTerm)}`);
          const data = await res.json();
          setSuggestions(data.predictions || []);
        } catch (error) {
          console.error('Autocomplete error:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  const handleSelect = async (suggestion: {description: string; placeId: string}) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/maps/geocode?address=${encodeURIComponent(suggestion.description)}`);
      const data = await res.json();
      
      onChange({
        location: data.formattedAddress || suggestion.description,
        locationUrl: data.mapsUrl,
      });
      
      setSearchTerm('');
      setSuggestions([]);
    } catch (error) {
      console.error('Geocode error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          placeholder="Digite o endereco do evento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {isLoading && <Loader2 className="absolute right-3 top-2.5 animate-spin" />}
        
        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full bg-background border rounded-md mt-1 shadow-lg">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="w-full text-left px-4 py-2 hover-elevate"
                onClick={() => handleSelect(s)}
              >
                <MapPin className="inline mr-2 h-4 w-4" />
                {s.description}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {value.location && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="flex-1">{value.location}</span>
          <Button size="sm" variant="ghost" asChild>
            <a href={value.locationUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onChange({ location: '', locationUrl: '' })}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
```

#### 3.2.3 Exibicao na Pagina Publica de Evento

Na pagina publica do evento, o local sera exibido como link clicavel:

```typescript
// Em EventDetailPage.tsx
{event.location && (
  <div className="flex items-center gap-2">
    <MapPin className="h-5 w-5 text-primary" />
    {event.locationUrl ? (
      <a 
        href={event.locationUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {event.location}
      </a>
    ) : (
      <span>{event.location}</span>
    )}
  </div>
)}
```

---

## 4. CORRECAO DE BUG DE DATA DE EVENTOS

### 4.1 Problema Identificado

Ao cadastrar um evento para o dia 06/12/2025, o sistema esta marcando como "evento passado" mesmo sendo o dia 05/12/2025.

**Causa Provavel:** Problema de fuso horario (timezone) na comparacao de datas.

### 4.2 Solucao

#### 4.2.1 Backend - Comparacao de Datas

**Arquivo:** `server/routes.ts` ou `server/storage.ts`

```typescript
// Funcao para comparar datas ignorando horario e usando timezone correto
function isEventPast(eventDate: string): boolean {
  // Criar data do evento como meia-noite no fuso horario de Sao Paulo
  const eventDateTime = new Date(eventDate + 'T00:00:00-03:00');
  
  // Criar data de hoje como meia-noite no fuso horario de Sao Paulo
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const todayDateTime = new Date(todayStr + 'T00:00:00-03:00');
  
  return eventDateTime < todayDateTime;
}

// Usar na query de eventos
async function getUpcomingEvents(): Promise<SiteEvent[]> {
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  
  return db.select().from(schema.siteEvents)
    .where(and(
      eq(schema.siteEvents.isPublished, true),
      gte(schema.siteEvents.startDate, todayStr)  // >= hoje
    ))
    .orderBy(asc(schema.siteEvents.startDate));
}
```

#### 4.2.2 Frontend - Validacao no Formulario

```typescript
// Em MarketingEventoEditor.tsx
const validateEventDate = (date: string): boolean => {
  const eventDate = new Date(date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return eventDate >= today;
};

// Mostrar aviso se data for passada
{!validateEventDate(form.watch('startDate')) && (
  <Alert variant="warning">
    <AlertDescription>
      A data selecionada e anterior a hoje. Tem certeza?
    </AlertDescription>
  </Alert>
)}
```

### 4.3 Correcao do Erro de URL do Google Calendar

**Problema:** Ao clicar em "Sincronizar Google Agenda" da erro na URL.

**Solucao:** Garantir que a URL do ICS esteja usando o dominio correto:

```typescript
// No frontend, usar a URL publica correta
const getCalendarUrl = () => {
  // Usar a URL do dominio publico, nao localhost
  const baseUrl = window.location.origin;
  return `${baseUrl}/api/site/events/calendar.ics`;
};

// Para sincronizacao com Google Calendar
const getGoogleCalendarSubscribeUrl = () => {
  const icsUrl = getCalendarUrl();
  // URL para adicionar calendario ao Google
  return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(icsUrl)}`;
};
```

---

## 5. BOTAO "ESTOU ORANDO" COM ESTADO PERSISTENTE

### 5.1 Objetivo

Quando um usuario clicar em "Estou Orando", o botao deve:
1. Mudar de cor (ex: de cinza para laranja/primary)
2. Ficar "fixo" mostrando que ja clicou
3. Persistir o estado mesmo apos atualizar a pagina

### 5.2 Implementacao

#### 5.2.1 Backend - Novas Tabelas e Rotas

**Schema - Nova Tabela `prayer_interactions`:**

```typescript
// shared/schema.ts
export const prayerInteractions = pgTable("prayer_interactions", {
  id: serial("id").primaryKey(),
  prayerRequestId: integer("prayer_request_id").notNull().references(() => prayerRequests.id, { onDelete: "cascade" }),
  
  // Para usuarios logados
  userId: integer("user_id").references(() => users.id),
  
  // Para usuarios anonimos (usar fingerprint ou localStorage ID)
visitorId: text("visitor_id"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // Garantir que cada usuario/visitante so clica uma vez por pedido
  uniqueUserPrayer: unique().on(table.prayerRequestId, table.userId),
  uniqueVisitorPrayer: unique().on(table.prayerRequestId, table.visitorId),
}));
```

**Rotas Atualizadas:**

```typescript
// Verificar se usuario ja esta orando
app.get("/api/site/prayer-requests/:id/is-praying", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const visitorId = req.query.visitorId as string;
    
    const isPraying = await storage.checkIfPraying(id, userId, visitorId);
    
    res.json({ isPraying });
  } catch (error) {
    console.error("Check praying error:", error);
    res.status(500).json({ message: "Erro ao verificar" });
  }
});

// Registrar que esta orando (toggle)
app.post("/api/site/prayer-requests/:id/pray", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const { visitorId } = req.body;
    
    const result = await storage.togglePraying(id, userId, visitorId);
    
    res.json({
      success: true,
      isPraying: result.isPraying,
      inPrayerCount: result.inPrayerCount,
    });
  } catch (error) {
    console.error("Toggle praying error:", error);
    res.status(500).json({ message: "Erro ao registrar" });
  }
});
```

#### 5.2.2 Frontend - Componente do Botao

```typescript
interface PrayButtonProps {
  prayerRequestId: number;
  initialCount: number;
}

export function PrayButton({ prayerRequestId, initialCount }: PrayButtonProps) {
  const { user } = useAuth();
  const [isPraying, setIsPraying] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  
  // Gerar ID unico para visitantes anonimos
  const visitorId = useMemo(() => {
    if (user) return null;
    let id = localStorage.getItem('visitor_id');
    if (!id) {
      id = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('visitor_id', id);
    }
    return id;
  }, [user]);
  
  // Verificar estado inicial
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const params = new URLSearchParams();
        if (visitorId) params.append('visitorId', visitorId);
        
        const res = await fetch(`/api/site/prayer-requests/${prayerRequestId}/is-praying?${params}`);
        const data = await res.json();
        setIsPraying(data.isPraying);
      } catch (error) {
        console.error('Check praying status error:', error);
      }
    };
    checkStatus();
  }, [prayerRequestId, visitorId]);
  
  const handleClick = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/site/prayer-requests/${prayerRequestId}/pray`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      });
      
      const data = await res.json();
      setIsPraying(data.isPraying);
      setCount(data.inPrayerCount);
    } catch (error) {
      console.error('Toggle praying error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      variant={isPraying ? "default" : "outline"}
      className={cn(
        "transition-all duration-300",
        isPraying && "bg-primary text-primary-foreground"
      )}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Heart className={cn("h-4 w-4 mr-2", isPraying && "fill-current")} />
      )}
      {isPraying ? "Orando" : "Estou Orando"} ({count})
    </Button>
  );
}
```

---

## 6. SISTEMA DE MODERACAO AUTOMATICA

### 6.1 Objetivo

Filtrar automaticamente comentarios e pedidos de oracao que contenham:
- Palavras de baixo calao
- Conteudo sexual
- Xingamentos
- Discurso de odio

**Se passar no filtro:** Publicado automaticamente
**Se nao passar:** Fica pendente para revisao manual

### 6.2 Implementacao

#### 6.2.1 Filtro de Palavras

**Arquivo:** `server/utils/profanity-filter.ts`

O sistema ja possui a biblioteca `bad-words` instalada. Expandir com lista em portugues:

```typescript
import Filter from 'bad-words';

// Lista expandida de palavras em portugues
const palavrasProibidasPT = [
  // Baixo calao
  'merda', 'porra', 'caralho', 'foda', 'fodase', 'fodasse', 'buceta', 'pau', 'pinto',
  'rola', 'bosta', 'cagar', 'cagada', 'cu', 'cuzao', 'cuzinho', 'cacete', 'pqp',
  
  // Xingamentos
  'idiota', 'imbecil', 'retardado', 'babaca', 'otario', 'fdp', 'filhodaputa',
  'vagabundo', 'vagabunda', 'vadia', 'piranha', 'puta', 'arrombado', 'arrombada',
  
  // Discurso de odio
  'viado', 'veado', 'bicha', 'sapatao', 'traveco',
  
  // Conteudo sexual
  'sexo', 'transa', 'transar', 'gozar', 'gozada', 'punheta', 'masturbar',
  'boquete', 'chupar', 'foder', 'meter',
];

const filter = new Filter();
filter.addWords(...palavrasProibidasPT);

export interface ModerationResult {
  isClean: boolean;
  hasProfanity: boolean;
  flaggedWords: string[];
  shouldAutoApprove: boolean;
}

export function moderateContent(text: string): ModerationResult {
  const textLower = text.toLowerCase();
  const flaggedWords: string[] = [];
  
  for (const word of palavrasProibidasPT) {
    if (textLower.includes(word)) {
      flaggedWords.push(word);
    }
  }
  
  const isProfane = filter.isProfane(text);
  const isClean = !isProfane && flaggedWords.length === 0;
  
  return {
    isClean,
    hasProfanity: isProfane || flaggedWords.length > 0,
    flaggedWords,
    shouldAutoApprove: isClean,  // Se limpo, aprova automaticamente
  };
}
```

#### 6.2.2 Uso nas Rotas

```typescript
// Enviar pedido de oracao - COM MODERACAO AUTOMATICA
app.post('/api/site/prayer-requests', async (req, res) => {
  const { name, category, request } = req.body;
  
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: "Nome e obrigatorio" });
  }
  
  // MODERAR AUTOMATICAMENTE
  const moderation = moderateContent(request);
  
  const prayerRequest = await storage.createPrayerRequest({
    name,
    category,
    request,
    // SE LIMPO, APROVA AUTOMATICAMENTE
    isApproved: moderation.shouldAutoApprove,
    status: moderation.shouldAutoApprove ? 'approved' : 'pending',
    moderationDetails: moderation.isClean 
      ? 'Aprovado automaticamente' 
      : `Aguardando revisao: ${moderation.flaggedWords.join(', ')}`,
  });
  
  // Notificar espiritualidade se precisar revisao
  if (!moderation.shouldAutoApprove) {
    await notifyEspiritualidadeTeam('new_pending_prayer', prayerRequest);
  }
  
  res.json({ 
    success: true, 
    message: moderation.shouldAutoApprove 
      ? "Pedido publicado com sucesso!"
      : "Pedido enviado e sera analisado antes de ser publicado.",
  });
});
```

---

## 7. GERENCIAMENTO DE COMENTARIOS E PEDIDOS

### 7.1 Permissoes

| Acao | Espiritualidade | Autor | Outros |
|------|-----------------|-------|--------|
| Ver comentarios/pedidos | Todos | Proprio | Publicos |
| Excluir comentario | Sim | Proprio | Nao |
| Excluir pedido de oracao | Sim | Proprio | Nao |
| Aprovar/Rejeitar | Sim | Nao | Nao |

### 7.2 Implementacao

#### 7.2.1 Rotas de Exclusao

```typescript
// Excluir comentario (espiritualidade ou autor)
app.delete("/api/devotionals/comments/:id", authenticateToken, async (req: AuthRequest, res) => {
  const commentId = parseInt(req.params.id);
  const userId = req.user!.id;
  const isEspiritualidade = req.user!.secretaria === 'espiritualidade' || req.user!.isAdmin;
  
  const comment = await storage.getDevotionalComment(commentId);
  if (!comment) {
    return res.status(404).json({ message: "Comentario nao encontrado" });
  }
  
  // Verificar permissao: espiritualidade OU autor do comentario
  const isAuthor = comment.userId === userId;
  if (!isEspiritualidade && !isAuthor) {
    return res.status(403).json({ message: "Sem permissao para excluir" });
  }
  
  await storage.deleteDevotionalComment(commentId);
  res.json({ message: "Comentario excluido com sucesso" });
});

// Excluir pedido de oracao (espiritualidade ou autor)
app.delete("/api/site/prayer-requests/:id", authenticateToken, async (req: AuthRequest, res) => {
  const requestId = parseInt(req.params.id);
  const userId = req.user!.id;
  const isEspiritualidade = req.user!.secretaria === 'espiritualidade' || req.user!.isAdmin;
  
  const request = await storage.getPrayerRequest(requestId);
  if (!request) {
    return res.status(404).json({ message: "Pedido nao encontrado" });
  }
  
  // Verificar permissao: espiritualidade OU autor do pedido
  const isAuthor = request.userId === userId;
  if (!isEspiritualidade && !isAuthor) {
    return res.status(403).json({ message: "Sem permissao para excluir" });
  }
  
  await storage.deletePrayerRequest(requestId);
  res.json({ message: "Pedido excluido com sucesso" });
});
```

---

## 8. SISTEMA DE NOTIFICACOES

### 8.1 Objetivo

Notificar membros cadastrados quando houver:
- Novo devocional publicado
- Novo evento publicado
- Novo pedido de oracao (apenas para espiritualidade)

Para NAO membros: Opção do navegador para push notifications.

### 8.2 Tipos de Notificacao

| Evento | Email | Push Navegador | In-App |
|--------|-------|----------------|--------|
| Novo devocional | Sim | Sim | Sim |
| Novo evento | Sim | Sim | Sim |
| Novo pedido oracao | Espiritualidade | Espiritualidade | Espiritualidade |
| Comentario recebido | Espiritualidade | Espiritualidade | Espiritualidade |

### 8.3 Implementacao

#### 8.3.1 Servico de Notificacoes

**Arquivo:** `server/notifications.ts`

```typescript
import { Resend } from 'resend';
import webpush from 'web-push';
import { storage } from './storage';

const resend = new Resend(process.env.RESEND_API_KEY);

// Configurar VAPID keys para push notifications
webpush.setVapidDetails(
  'mailto:contato@umpemaus.com.br',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export type NotificationType = 
  | 'new_devotional'
  | 'new_event'
  | 'new_prayer_request'
  | 'new_comment';

interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  url: string;
  data?: Record<string, any>;
}

export async function sendNotification(payload: NotificationPayload) {
  const { type, title, body, url } = payload;
  
  // 1. Determinar destinatarios
  let recipients: { userId: number; email: string; subscriptions: any[] }[] = [];
  
  if (type === 'new_prayer_request' || type === 'new_comment') {
    // Apenas espiritualidade
    recipients = await storage.getUsersBySecretaria('espiritualidade');
  } else {
    // Todos os membros ativos
    recipients = await storage.getActiveMembers();
  }
  
  // 2. Enviar emails em batch
  const emails = recipients.map(r => r.email);
  await sendBatchEmail(emails, title, body, url);
  
  // 3. Enviar push notifications
  for (const recipient of recipients) {
    for (const subscription of recipient.subscriptions) {
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({ title, body, url })
        );
      } catch (error) {
        console.error('Push notification error:', error);
        // Remover subscription invalida
        if ((error as any).statusCode === 410) {
          await storage.removePushSubscription(recipient.userId, subscription.endpoint);
        }
      }
    }
  }
  
  // 4. Criar notificacao in-app
  for (const recipient of recipients) {
    await storage.createNotification({
      userId: recipient.userId,
      type,
      title,
      body,
      url,
      isRead: false,
    });
  }
}

async function sendBatchEmail(emails: string[], subject: string, body: string, url: string) {
  // Enviar em lotes de 50
  const batchSize = 50;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    await resend.emails.send({
      from: 'UMP Emaus <noreply@umpemaus.com.br>',
      to: batch,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FFA500;">${subject}</h2>
          <p>${body}</p>
          <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #FFA500; color: white; text-decoration: none; border-radius: 8px;">
            Ver mais
          </a>
        </div>
      `,
    });
  }
}
```

#### 8.3.2 Integracao nos Hooks de Criacao

```typescript
// Ao criar devocional
app.post("/api/admin/devotionals", async (req, res) => {
  const devotional = await storage.createDevotional(req.body);
  
  if (devotional.isPublished) {
    await sendNotification({
      type: 'new_devotional',
      title: 'Novo Devocional',
      body: `"${devotional.title}" foi publicado. Leia agora!`,
      url: `/devocionais/${devotional.id}`,
    });
  }
  
  res.json(devotional);
});

// Ao criar evento
app.post("/api/admin/events", async (req, res) => {
  const event = await storage.createSiteEvent(req.body);
  
  if (event.isPublished) {
    await sendNotification({
      type: 'new_event',
      title: 'Novo Evento',
      body: `"${event.title}" foi adicionado a agenda. Confira!`,
      url: `/agenda/${event.id}`,
    });
  }
  
  res.json(event);
});

// Ao receber pedido de oracao
app.post("/api/site/prayer-requests", async (req, res) => {
  const request = await storage.createPrayerRequest(req.body);
  
  // Notificar espiritualidade
  await sendNotification({
    type: 'new_prayer_request',
    title: 'Novo Pedido de Oracao',
    body: `${request.name} enviou um pedido de oracao.`,
    url: '/admin/espiritualidade/oracoes',
  });
  
  res.json(request);
});
```

#### 8.3.3 Frontend - Prompt de Notificacao para Visitantes

```typescript
// Em App.tsx ou componente de layout
export function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    // Mostrar apenas para visitantes nao logados
    const hasSeenPrompt = localStorage.getItem('notification_prompt_seen');
    const isLoggedIn = !!localStorage.getItem('token');
    
    if (!hasSeenPrompt && !isLoggedIn && 'Notification' in window) {
      setTimeout(() => setShowPrompt(true), 30000); // Apos 30s
    }
  }, []);
  
  const handleAllow = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Registrar subscription
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
      });
      
      await fetch('/api/notifications/subscribe-anonymous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
    }
    
    localStorage.setItem('notification_prompt_seen', 'true');
    setShowPrompt(false);
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="fixed bottom-4 right-4 p-4 bg-card border rounded-lg shadow-lg max-w-sm">
      <h4 className="font-semibold">Fique por dentro!</h4>
      <p className="text-sm text-muted-foreground mt-1">
        Receba notificacoes de novos devocionais e eventos.
      </p>
      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={handleAllow}>Permitir</Button>
        <Button size="sm" variant="ghost" onClick={() => setShowPrompt(false)}>
          Agora nao
        </Button>
      </div>
    </div>
  );
}
```

---

## 9. NOTIFICACOES DEOGLORY (ESTILO DUOLINGO)

### 9.1 Objetivo

Criar um sistema de notificacoes para o DeoGlory inspirado no Duolingo, incentivando engajamento e retorno dos usuarios.

### 9.2 Tipos de Notificacao DeoGlory

| Tipo | Disparador | Canal | Horario |
|------|------------|-------|---------|
| Nova temporada | Temporada publicada | Email + Push | Imediato |
| Licao liberada | Licao disponivel | Email + Push | Imediato |
| Evento bonus | Admin cria evento | Email + Push | Imediato |
| Temporada encerrada | Temporada termina | Email | Imediato (com relatorio) |
| Licao do dia | Diariamente | Push | 07:00 |
| Versiculo do dia | Diariamente | Push | 07:00 |
| Inatividade 2 dias | Sem acesso 2 dias | Push | 10:00 |
| Inatividade 3 dias | Sem acesso 3 dias | Push | 10:00 |
| Inatividade 5 dias | Sem acesso 5 dias | Push | 10:00 |
| Inatividade 7 dias | Sem acesso 7 dias | Push + Email | 10:00 |
| Inatividade 10 dias | Sem acesso 10 dias | Push + Email | 10:00 |
| Inatividade 15 dias | Sem acesso 15 dias | Push + Email | 10:00 |

### 9.3 Implementacao

#### 9.3.1 Scheduler de Notificacoes

**Arquivo:** `server/deoglory-notifications.ts`

```typescript
import cron from 'node-cron';
import { storage } from './storage';
import { sendNotification, sendPushNotification, sendEmail } from './notifications';

// Versiculo do dia - 07:00 (America/Sao_Paulo)
cron.schedule('0 7 * * *', async () => {
  console.log('[DeoGlory] Enviando versiculo do dia...');
  
  const dailyVerse = await storage.getDailyVerse();
  const subscriptions = await storage.getAllPushSubscriptions();
  
  for (const sub of subscriptions) {
    await sendPushNotification(sub, {
      title: 'Versiculo do Dia',
      body: dailyVerse.text,
      icon: '/icons/bible.png',
      url: '/study',
    });
  }
}, { timezone: 'America/Sao_Paulo' });

// Lembrete da licao do dia - 07:00 (America/Sao_Paulo)
cron.schedule('0 7 * * *', async () => {
  console.log('[DeoGlory] Enviando lembrete de licao...');
  
  const usersWithPendingLessons = await storage.getUsersWithPendingLessons();
  
  for (const user of usersWithPendingLessons) {
    await sendPushToUser(user.id, {
      title: 'Sua licao de hoje esta esperando!',
      body: 'Mantenha seu streak! Complete a licao do dia.',
      icon: '/icons/lesson.png',
      url: '/study',
    });
  }
}, { timezone: 'America/Sao_Paulo' });

// Verificar inatividade - 10:00 (America/Sao_Paulo)
cron.schedule('0 10 * * *', async () => {
  console.log('[DeoGlory] Verificando inatividade de usuarios...');
  
  const inactiveUsers = await storage.getInactiveUsers();
  
  for (const user of inactiveUsers) {
    const daysSinceLastAccess = user.daysSinceLastAccess;
    
    let message = '';
    let shouldEmail = false;
    
    switch (daysSinceLastAccess) {
      case 2:
        message = 'Sentimos sua falta! Seu streak esta em risco.';
        break;
      case 3:
        message = 'Opa! Ja faz 3 dias. Volte para continuar crescendo!';
        break;
      case 5:
        message = 'Nao desista! 5 dias longe, mas nunca e tarde para voltar.';
        break;
      case 7:
        message = 'Uma semana sem estudar? Vamos retomar juntos!';
        shouldEmail = true;
        break;
      case 10:
        message = '10 dias! Sua jornada espiritual precisa de voce.';
        shouldEmail = true;
        break;
      case 15:
        message = '15 dias longe... Que tal um novo comeco hoje?';
        shouldEmail = true;
        break;
    }
    
    if (message) {
      await sendPushToUser(user.id, {
        title: 'DeoGlory sente sua falta!',
        body: message,
        icon: '/icons/comeback.png',
        url: '/study',
      });
      
      if (shouldEmail) {
        await sendEmail(user.email, {
          subject: 'Sentimos sua falta no DeoGlory!',
          body: `
            <h2>Ola, ${user.fullName}!</h2>
            <p>${message}</p>
            <p>Seu progresso ate agora:</p>
            <ul>
              <li>XP Total: ${user.totalXp}</li>
              <li>Nivel: ${user.level}</li>
              <li>Licoes completadas: ${user.completedLessons}</li>
            </ul>
            <a href="https://umpemaus.com.br/study">Continuar Estudando</a>
          `,
        });
      }
    }
  }
}, { timezone: 'America/Sao_Paulo' });

// Funcao para enviar notificacao ao finalizar temporada
export async function sendSeasonEndNotification(seasonId: number) {
  const season = await storage.getStudySeason(seasonId);
  const participants = await storage.getSeasonParticipants(seasonId);
  
  for (const participant of participants) {
    const stats = await storage.getUserSeasonStats(participant.userId, seasonId);
    
    await sendEmail(participant.email, {
      subject: `Temporada "${season.title}" Encerrada - Seu Relatorio`,
      body: `
        <h2>Parabens, ${participant.fullName}!</h2>
        <p>A temporada "${season.title}" foi encerrada. Confira seu desempenho:</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <h3>Seu Relatorio</h3>
          <ul>
            <li><strong>XP Ganho:</strong> ${stats.xpEarned}</li>
            <li><strong>Licoes Completadas:</strong> ${stats.lessonsCompleted} de ${stats.totalLessons}</li>
            <li><strong>Taxa de Acerto:</strong> ${stats.accuracy}%</li>
            <li><strong>Posicao no Ranking:</strong> ${stats.rank}o lugar</li>
            <li><strong>Conquistas Desbloqueadas:</strong> ${stats.achievementsUnlocked}</li>
          </ul>
        </div>
        
        <p>Continue crescendo na proxima temporada!</p>
        <a href="https://umpemaus.com.br/study">Ver mais detalhes</a>
      `,
    });
  }
}
```

#### 9.3.2 Tabela de Controle de Ultimo Acesso

```typescript
// Atualizar no schema.ts
export const userStudyStats = pgTable("user_study_stats", {
  // ... campos existentes ...
  lastAccessAt: timestamp("last_access_at").notNull().defaultNow(),
});

// Atualizar a cada acesso ao DeoGlory
app.use('/api/study/*', authenticateToken, async (req, res, next) => {
  if (req.user) {
    await storage.updateUserLastAccess(req.user.id);
  }
  next();
});
```

#### 9.3.3 Mensagens Estilo Duolingo

```typescript
const duolingoStyleMessages = {
  comeBack: [
    'Seu streak sente sua falta!',
    'Uma licao rapida? Prometo que nao demora!',
    'Voce estava indo tao bem! Que tal continuar?',
    'So 5 minutinhos para manter seu progresso.',
    'A Palavra de Deus espera por voce!',
  ],
  
  encouragement: [
    'Voce esta arrasando!',
    'Continue assim, campeao!',
    'Que dedicacao! Parabens!',
    'Seu esforco esta valendo a pena!',
    'Deus se alegra com sua dedicacao!',
  ],
  
  streakReminder: [
    'Nao perca seu streak de {days} dias!',
    '{days} dias de dedicacao! Nao pare agora!',
    'Falta pouco para o fim do dia. Mantenha o streak!',
  ],
  
  achievement: [
    'Nova conquista desbloqueada!',
    'Voce alcancou um novo nivel!',
    'Parabens pelo marco atingido!',
  ],
};

function getRandomMessage(category: keyof typeof duolingoStyleMessages, params?: Record<string, any>) {
  const messages = duolingoStyleMessages[category];
  let message = messages[Math.floor(Math.random() * messages.length)];
  
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      message = message.replace(`{${key}}`, String(value));
    }
  }
  
  return message;
}
```

---

## 10. ARQUITETURA TECNICA

### 10.1 Novas Tabelas do Banco de Dados

```typescript
// shared/schema.ts

// Interacoes de oracao (para "Estou Orando")
export const prayerInteractions = pgTable("prayer_interactions", {
  id: serial("id").primaryKey(),
  prayerRequestId: integer("prayer_request_id").notNull().references(() => prayerRequests.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id),
  visitorId: text("visitor_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notificacoes in-app
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  url: text("url"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Subscricoes de push para visitantes anonimos
export const anonymousPushSubscriptions = pgTable("anonymous_push_subscriptions", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

### 10.2 Variaveis de Ambiente Necessarias

```env
# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Web Push (VAPID Keys)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# Resend (ja configurado)
RESEND_API_KEY=your_resend_api_key
```

### 10.3 Dependencias NPM Necessarias

```bash
# Push Notifications
npm install web-push

# Tipos
npm install -D @types/web-push
```

---

## 11. CRONOGRAMA DE IMPLEMENTACAO

### Fase 1: Correcoes Urgentes (Prioridade CRITICA)
| Tarefa | Estimativa |
|--------|------------|
| Corrigir bug de data de eventos | 1h |
| Corrigir URL do Google Calendar | 30min |

### Fase 2: Upload de Imagens (Prioridade ALTA)
| Tarefa | Estimativa |
|--------|------------|
| Criar componente ImageUpload reutilizavel | 2h |
| Atualizar ImageCropDialog para suportar aspect ratio | 1h |
| Implementar upload em eventos | 1h |
| Implementar upload em devocionais | 1h |
| Auto-preencher foto na diretoria | 1h |

### Fase 3: Google Maps (Prioridade MEDIA)
| Tarefa | Estimativa |
|--------|------------|
| Criar rotas de geocoding/autocomplete | 2h |
| Criar componente LocationPicker | 2h |
| Integrar no formulario de eventos | 1h |
| Atualizar exibicao publica | 1h |

### Fase 4: Botao "Estou Orando" (Prioridade ALTA)
| Tarefa | Estimativa |
|--------|------------|
| Criar tabela prayer_interactions | 30min |
| Implementar rotas de toggle | 1h |
| Criar componente PrayButton | 2h |
| Testar persistencia | 30min |

### Fase 5: Moderacao Automatica (Prioridade ALTA)
| Tarefa | Estimativa |
|--------|------------|
| Expandir filtro de palavras | 1h |
| Integrar nas rotas de criacao | 1h |
| Adicionar interface de revisao | 1h |

### Fase 6: Gerenciamento de Exclusao (Prioridade MEDIA)
| Tarefa | Estimativa |
|--------|------------|
| Implementar rotas de exclusao | 1h |
| Adicionar botoes no frontend | 1h |

### Fase 7: Sistema de Notificacoes (Prioridade ALTA)
| Tarefa | Estimativa |
|--------|------------|
| Configurar VAPID keys | 30min |
| Implementar service worker | 2h |
| Criar servico de notificacoes | 3h |
| Integrar nos hooks de criacao | 2h |
| Criar prompt para visitantes | 1h |

### Fase 8: Notificacoes DeoGlory (Prioridade ALTA)
| Tarefa | Estimativa |
|--------|------------|
| Criar schedulers de notificacao | 3h |
| Implementar verificacao de inatividade | 2h |
| Criar templates de email | 2h |
| Implementar relatorio de temporada | 2h |

---

**Total Estimado:** ~40 horas de desenvolvimento

---

*Documento criado em: 06/12/2025*
*Versao: 1.0*
*Pendente: Aprovacao do Arquiteto*
