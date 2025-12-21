# Configuração de Chaves Gemini API

## Como o Sistema Funciona

O DeoGlory suporta **até 5 chaves Gemini** diferentes para distribuir a carga de requisições e evitar limites de taxa (rate limiting).

## Configuração

### Opção 1: Uma Única Chave (Simples)

Se você tem apenas uma chave Gemini, configure assim:

```env
GEMINI_API_KEY=sua_chave_api_aqui
```

### Opção 2: Cinco Chaves Numeradas (Recomendado)

Se você tem múltiplas chaves Gemini, configure cada uma:

```env
GEMINI_API_KEY_1=primeira_chave_aqui
GEMINI_API_KEY_2=segunda_chave_aqui
GEMINI_API_KEY_3=terceira_chave_aqui
GEMINI_API_KEY_4=quarta_chave_aqui
GEMINI_API_KEY_5=quinta_chave_aqui
```

## Como as Chaves São Usadas

Quando o sistema precisa de uma chave:

1. **Procura pela chave numerada** (ex: `GEMINI_API_KEY_2`)
2. **Se não encontrar**, usa a **chave genérica** (`GEMINI_API_KEY`)
3. **Se nenhuma existir**, retorna erro

### Exemplo

```typescript
// O sistema pode pedir a chave #3
const chave = getGeminiApiKey("3");
// Ele procura: GEMINI_API_KEY_3
// Se não encontrar: usa GEMINI_API_KEY
```

## Distribuição de Carga

Quando você tem 5 chaves diferentes:

- Requisição 1 → usa `GEMINI_API_KEY_1`
- Requisição 2 → usa `GEMINI_API_KEY_2`
- Requisição 3 → usa `GEMINI_API_KEY_3`
- Requisição 4 → usa `GEMINI_API_KEY_4`
- Requisição 5 → usa `GEMINI_API_KEY_5`
- Requisição 6 → volta a usar `GEMINI_API_KEY_1`

Assim você distribui a carga e evita bater no limite de requisições de uma única chave.

## Onde Obter Chaves

1. Acesse: https://makersuite.google.com
2. Configure um projeto
3. Gere uma **API Key**
4. Repita para cada chave necessária

## Modelos Suportados

O sistema tenta usar nesta ordem:

1. `gemini-3-flash-preview` (Recomendado)
2. `gemini-2.5-flash` (Fallback)
3. `gemini-2.5-lite` (Último fallback)

Se um modelo não estiver disponível ou der erro, tenta o próximo automaticamente.

## No Render

Adicione as variáveis no dashboard do Render:

```yaml
GEMINI_API_KEY_1: sua_chave_1
GEMINI_API_KEY_2: sua_chave_2
GEMINI_API_KEY_3: sua_chave_3
GEMINI_API_KEY_4: sua_chave_4
GEMINI_API_KEY_5: sua_chave_5
```

Ou apenas:

```yaml
GEMINI_API_KEY: sua_chave
```

## Verificação

Para verificar se está configurado:
- Se `GEMINI_API_KEY_1` OU `GEMINI_API_KEY` existem → Sistema está pronto
- Se nenhuma existir → IA com Gemini será desabilitada (mas OpenAI continuará funcionando)
