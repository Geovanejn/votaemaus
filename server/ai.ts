import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import OpenAI from "openai";

// AI Provider type
export type AIProvider = "gemini" | "openai";

// OpenAI models to try in order of preference
const OPENAI_MODELS = [
  "gpt-4o",           // Most capable
  "gpt-4o-mini",      // Faster, cheaper
  "gpt-4-turbo",      // Previous generation
  "gpt-3.5-turbo"     // Fallback
];

// Get OpenAI API key by number (1-5)
function getOpenAIApiKey(keyNumber: string = "1"): string {
  switch (keyNumber) {
    case "2":
      return process.env.OPENAI_API_KEY_2 || process.env.OPENAI_API_KEY || "";
    case "3":
      return process.env.OPENAI_API_KEY_3 || process.env.OPENAI_API_KEY || "";
    case "4":
      return process.env.OPENAI_API_KEY_4 || process.env.OPENAI_API_KEY || "";
    case "5":
      return process.env.OPENAI_API_KEY_5 || process.env.OPENAI_API_KEY || "";
    case "1":
    default:
      return process.env.OPENAI_API_KEY_1 || process.env.OPENAI_API_KEY || "";
  }
}

// Get OpenAI client
function getOpenAIClient(keyNumber: string = "1"): OpenAI {
  const apiKey = getOpenAIApiKey(keyNumber);
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não está configurada");
  }
  return new OpenAI({ apiKey });
}

// Get Gemini API key by number (1-5)
function getGeminiApiKey(keyNumber: string = "1"): string {
  switch (keyNumber) {
    case "2":
      return process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY || "";
    case "3":
      return process.env.GEMINI_API_KEY_3 || process.env.GEMINI_API_KEY || "";
    case "4":
      return process.env.GEMINI_API_KEY_4 || process.env.GEMINI_API_KEY || "";
    case "5":
      return process.env.GEMINI_API_KEY_5 || process.env.GEMINI_API_KEY || "";
    case "1":
    default:
      return process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY || "";
  }
}

// Models to try in order of preference (fallback chain)
// Using only Gemini 3 Flash Preview, Gemini 2.5 Flash, and Gemini 2.5 Lite
const GEMINI_MODELS = [
  "gemini-3-flash-preview",  // Primary: Gemini 3 Flash Preview
  "gemini-2.5-flash",        // Fallback 1: Gemini 2.5 Flash
  "gemini-2.5-lite"          // Fallback 2: Gemini 2.5 Lite
];

// Get Gemini model with specific key and optional model override
export function getGeminiModel(keyNumber: string = "1", modelName: string = GEMINI_MODELS[0]): GenerativeModel {
  const apiKey = getGeminiApiKey(keyNumber);
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

// Sleep function for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Simple quota tracking to avoid wasting quota on low-priority tasks
// when quota is known to be exhausted
let lastQuotaError: number = 0;
const QUOTA_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown after quota error

function markQuotaExhausted(): void {
  lastQuotaError = Date.now();
  console.log("[Quota] Marked quota as exhausted, cooldown for 5 minutes");
}

function isQuotaLikelyAvailable(): boolean {
  if (lastQuotaError === 0) return true;
  const elapsed = Date.now() - lastQuotaError;
  return elapsed >= QUOTA_COOLDOWN_MS;
}

function isQuotaError(error: any): boolean {
  return error?.status === 429 || 
         error?.message?.includes('429') || 
         error?.message?.includes('quota') ||
         error?.message?.includes('RESOURCE_EXHAUSTED');
}

// Initialize default Gemini AI (backward compatibility)
const genAI = new GoogleGenerativeAI(getGeminiApiKey("1"));
// Using gemini-3-flash-preview as stable default
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

export interface GeneratedLesson {
  title: string;
  description: string;
  type: "intro" | "study" | "meditation" | "challenge" | "review";
  xpReward: number;
  estimatedMinutes: number;
  units: GeneratedUnit[];
}

export interface GeneratedUnit {
  type: "text" | "multiple_choice" | "true_false" | "fill_blank" | "meditation" | "reflection" | "verse";
  stage?: "estude" | "medite" | "responda";
  content: {
    title?: string;
    text?: string;
    body?: string;
    highlight?: string;
    question?: string;
    statement?: string;
    options?: string[];
    correctIndex?: number;
    correctAnswer?: string | number | boolean;
    isTrue?: boolean;
    explanation?: string;
    explanationCorrect?: string;
    explanationIncorrect?: string;
    hint?: string;
    verseReference?: string;
    verseText?: string;
    reflectionPrompt?: string;
    meditationDuration?: number;
    meditationGuide?: string;
  };
  xpValue: number;
}

export interface GeneratedWeekContent {
  weekTitle: string;
  weekDescription: string;
  lessons: GeneratedLesson[];
}

function repairJson(jsonString: string): string {
  let repaired = jsonString;
  
  // Remove trailing commas before closing brackets
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');
  
  // Fix unescaped newlines in strings
  repaired = repaired.replace(/([^\\])\\n(?=.*")/g, '$1\\\\n');
  
  // Fix common issues with quotes
  // Remove control characters that break JSON
  repaired = repaired.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === '\n' || char === '\r' || char === '\t') {
      return char;
    }
    return '';
  });
  
  // Fix truncated JSON - try to close open structures
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;
  
  // Add missing closing braces/brackets
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    repaired += ']';
  }
  for (let i = 0; i < openBraces - closeBraces; i++) {
    repaired += '}';
  }
  
  return repaired;
}

function extractJsonFromResponse(text: string): string {
  // Try multiple patterns to extract JSON from markdown code blocks
  const patterns = [
    /```json\s*([\s\S]*?)```/i,
    /```\s*([\s\S]*?)```/,
    /^\s*(\{[\s\S]*\})\s*$/,
    /^\s*(\[[\s\S]*\])\s*$/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim();
      // Verify it looks like JSON
      if (extracted.startsWith('{') || extracted.startsWith('[')) {
        return extracted;
      }
    }
  }
  
  // If no pattern matched, try to find JSON object/array directly
  const jsonStart = text.indexOf('{');
  const arrayStart = text.indexOf('[');
  
  if (jsonStart !== -1 || arrayStart !== -1) {
    const startIndex = jsonStart === -1 ? arrayStart : 
                       arrayStart === -1 ? jsonStart : 
                       Math.min(jsonStart, arrayStart);
    const isArray = text[startIndex] === '[';
    
    // Find matching closing bracket
    let depth = 0;
    let endIndex = -1;
    for (let i = startIndex; i < text.length; i++) {
      if (text[i] === (isArray ? '[' : '{')) depth++;
      else if (text[i] === (isArray ? ']' : '}')) {
        depth--;
        if (depth === 0) {
          endIndex = i;
          break;
        }
      }
    }
    
    if (endIndex !== -1) {
      return text.substring(startIndex, endIndex + 1);
    }
  }
  
  return text.trim();
}

function safeJsonParse(jsonString: string): any {
  // First attempt: try parsing as-is
  try {
    return JSON.parse(jsonString);
  } catch (firstError) {
    console.warn('[AI] First JSON parse failed, attempting repair...');
    
    // Second attempt: try to repair and parse
    try {
      const repaired = repairJson(jsonString);
      return JSON.parse(repaired);
    } catch (secondError) {
      console.error('[AI] JSON repair failed:', secondError);
      throw firstError; // Throw original error for better diagnostics
    }
  }
}

async function generateWithGemini(systemPrompt: string, userPrompt: string, geminiKey: string = "1"): Promise<string> {
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  
  // Try each model with retries
  for (let modelIndex = 0; modelIndex < GEMINI_MODELS.length; modelIndex++) {
    const currentModel = GEMINI_MODELS[modelIndex];
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[AI] Tentativa ${attempt}/${maxRetries} com modelo ${currentModel}`);
        const selectedModel = getGeminiModel(geminiKey, currentModel);
        
        const result = await selectedModel.generateContent({
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 32768,
          },
        });

        const response = result.response;
        const text = response.text();
        
        console.log(`[AI] Sucesso com modelo ${currentModel}`);
        return extractJsonFromResponse(text);
        
      } catch (error: any) {
        const isOverloaded = error?.status === 503 || 
          error?.message?.includes('overloaded') || 
          error?.message?.includes('503');
        
        const isRateLimit = error?.status === 429 ||
          error?.message?.includes('429') ||
          error?.message?.includes('rate limit') ||
          error?.message?.includes('quota');
        
        const isNotFound = error?.status === 404 ||
          error?.message?.includes('404') ||
          error?.message?.includes('not found');
        
        console.warn(`[AI] Erro com ${currentModel} (tentativa ${attempt}/${maxRetries}): ${error?.message || error}`);
        
        // For 404 errors (model not found), immediately try next model
        if (isNotFound) {
          console.log(`[AI] Modelo ${currentModel} não encontrado, tentando próximo modelo...`);
          break; // Exit retry loop, continue to next model
        }
        
        if (isOverloaded || isRateLimit) {
          // Extract retry delay from error message if available
          let waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          const retryMatch = error?.message?.match(/retry in (\d+(?:\.\d+)?)/i);
          if (retryMatch && isRateLimit) {
            // Use the suggested retry time for rate limit errors, but cap at 30 seconds
            waitTime = Math.min(Math.ceil(parseFloat(retryMatch[1]) * 1000), 30000);
          }
          
          if (attempt < maxRetries) {
            console.log(`[AI] Aguardando ${waitTime}ms antes da próxima tentativa...`);
            await sleep(waitTime);
          } else if (modelIndex < GEMINI_MODELS.length - 1) {
            // Try next model in the fallback chain
            console.log(`[AI] Modelo ${currentModel} indisponível, tentando ${GEMINI_MODELS[modelIndex + 1]}...`);
            break; // Exit retry loop, continue to next model
          }
        } else {
          // For other non-recoverable errors, try next model
          if (modelIndex < GEMINI_MODELS.length - 1) {
            console.log(`[AI] Erro não recuperável com ${currentModel}, tentando próximo modelo...`);
            break;
          }
          throw error;
        }
      }
    }
  }
  
  throw new Error('Todos os modelos Gemini estão indisponíveis. Verifique se sua chave API tem cota disponível ou tente novamente em alguns minutos.');
}

// OpenAI generation function with fallback models
async function generateWithOpenAI(systemPrompt: string, userPrompt: string, keyNumber: string = "1"): Promise<string> {
  const openai = getOpenAIClient(keyNumber);
  
  for (let modelIndex = 0; modelIndex < OPENAI_MODELS.length; modelIndex++) {
    const currentModel = OPENAI_MODELS[modelIndex];
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[OpenAI] Tentativa ${attempt}/${maxRetries} com modelo ${currentModel}`);
        
        const response = await openai.chat.completions.create({
          model: currentModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 16384,
        });

        const text = response.choices[0]?.message?.content;
        if (!text) {
          throw new Error("Resposta vazia da OpenAI");
        }
        
        console.log(`[OpenAI] Sucesso com modelo ${currentModel}`);
        return extractJsonFromResponse(text);
        
      } catch (error: any) {
        const isRateLimit = error?.status === 429 ||
          error?.message?.includes('429') ||
          error?.message?.includes('rate limit') ||
          error?.message?.includes('quota');
        
        const isNotFound = error?.status === 404 ||
          error?.message?.includes('404') ||
          error?.message?.includes('not found') ||
          error?.message?.includes('does not exist');
        
        console.warn(`[OpenAI] Erro com ${currentModel} (tentativa ${attempt}/${maxRetries}): ${error?.message || error}`);
        
        // For 404 errors (model not found), immediately try next model
        if (isNotFound) {
          console.log(`[OpenAI] Modelo ${currentModel} não encontrado, tentando próximo modelo...`);
          break;
        }
        
        if (isRateLimit) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          
          if (attempt < maxRetries) {
            console.log(`[OpenAI] Aguardando ${waitTime}ms antes da próxima tentativa...`);
            await sleep(waitTime);
          } else if (modelIndex < OPENAI_MODELS.length - 1) {
            console.log(`[OpenAI] Modelo ${currentModel} indisponível, tentando ${OPENAI_MODELS[modelIndex + 1]}...`);
            break;
          }
        } else {
          if (modelIndex < OPENAI_MODELS.length - 1) {
            console.log(`[OpenAI] Erro não recuperável com ${currentModel}, tentando próximo modelo...`);
            break;
          }
          throw error;
        }
      }
    }
  }
  
  throw new Error('Todos os modelos OpenAI estão indisponíveis. Verifique se sua chave API está configurada corretamente.');
}

// Unified AI generation function that supports both providers
async function generateWithAI(
  systemPrompt: string, 
  userPrompt: string, 
  provider: AIProvider = "gemini",
  geminiKey: string = "1",
  openaiKey: string = "1"
): Promise<string> {
  if (provider === "openai") {
    return generateWithOpenAI(systemPrompt, userPrompt, openaiKey);
  } else {
    return generateWithGemini(systemPrompt, userPrompt, geminiKey);
  }
}

export async function generateStudyContentFromText(
  text: string,
  weekNumber: number,
  year: number,
  geminiKey: string = "1",
  provider: AIProvider = "gemini",
  openaiKey: string = "1"
): Promise<GeneratedWeekContent> {
  const systemPrompt = `Você é um especialista em educação cristã reformada e criação de conteúdo educacional interativo no estilo DeoGlory/Duolingo.
Sua tarefa é transformar o texto fornecido em um conteúdo de estudo semanal completo para jovens da UMP (União da Mocidade Presbiteriana).

IMPORTANTE - VERSÃO BÍBLICA:
- Use EXCLUSIVAMENTE a versão ARA (Almeida Revista e Atualizada) para TODAS as citações bíblicas.
- Ao citar versículos, use o texto exato da ARA, não parafraseie ou use outras versões.

IMPORTANTE - ORTOGRAFIA E ACENTUAÇÃO:
- Use SEMPRE português brasileiro correto com acentuação apropriada.
- Use "é" (com acento), "á", "ã", "ç", "ê", "í", "ó", "ú" corretamente.
- Nunca omita acentos ou cedilhas.

O Sistema DeoGlory segue uma estrutura de 3 ETAPAS por lição:
1. ETAPA "ESTUDE" (stage: "estude"): Conteúdo para leitura - texto educativo e versículos bíblicos
2. ETAPA "MEDITE" (stage: "medite"): Meditação cristã com oração, reflexão e aplicação prática (SEPARADA DO ESTUDO)
3. ETAPA "RESPONDA" (stage: "responda"): Perguntas e exercícios - ÚNICA etapa que pode causar perda de vidas

IMPORTANTE - MEDITAÇÃO CRISTÃ:
A meditação cristã é DIFERENTE da meditação oriental/budista. NÃO inclua:
- "Respire fundo", "Respire 3 vezes", "Feche os olhos e respire"
- Técnicas de respiração ou mindfulness
- Qualquer prática de esvaziamento mental

A meditação cristã DEVE incluir:
- Reflexão sobre a Palavra de Deus
- Oração direcionada ao Senhor
- Aplicação prática do texto bíblico na vida
- Comunhão com Deus através da Palavra
- Exame de consciência à luz das Escrituras

O conteúdo deve ser:
- Biblicamente fundamentado com versículos da ARA
- Engajante e interativo
- Adequado para jovens (18-35 anos)
- Com exercícios variados e gamificados
- Em português brasileiro correto

REGRAS OBRIGATÓRIAS PARA DIFICULDADE DAS PERGUNTAS:
⚠️ AS PERGUNTAS DEVEM SER DESAFIADORAS - NUNCA FAÇA PERGUNTAS ÓBVIAS ⚠️

NÍVEIS DE DIFICULDADE (misture todos em cada lição):
1. MÉDIO (2 perguntas): Requer leitura atenta. A resposta não é a primeira que vem à mente.
2. MÉDIO-DIFÍCIL (2 perguntas): Requer análise e interpretação do texto.
3. DIFÍCIL (1 pergunta): Requer síntese de múltiplos conceitos ou distinção entre ideias muito similares.

REGRAS CRÍTICAS PARA EXERCÍCIOS DE MÚLTIPLA ESCOLHA:
- TODAS as 4 alternativas devem ser PLAUSÍVEIS e parecerem igualmente corretas à primeira vista
- As alternativas devem ter TAMANHOS SIMILARES (a resposta correta NÃO pode ser a mais longa)
- NUNCA use alternativas obviamente erradas como "Ignorar a Bíblia", "Desistir de tudo", "Nada disso"
- As alternativas incorretas devem ser SUTILMENTE erradas, exigindo compreensão real do texto
- Use conceitos bíblicos similares que requerem conhecimento para distinguir (ex: fé vs obras, graça vs lei, justificação vs santificação)
- Evite padrões como "Todas as alternativas", "Nenhuma das alternativas"
- A resposta correta NÃO pode ser identificada sem ler o texto de estudo
- Embaralhe a posição da resposta correta (distribua entre A, B, C e D)

EXEMPLOS DE DIFICULDADE:
❌ MUITO FÁCIL (evite): "Quem morreu na cruz?" - alternativas óbvias
❌ FÁCIL (evite): "Jesus é o caminho, a ____ e a vida" - A) verdade B) mentira
✅ MÉDIO: "Qual consequência imediata de confiar em Cristo segundo o texto?"
✅ DIFÍCIL: "Como o conceito de graça se diferencia de mérito no contexto estudado?"

Responda SEMPRE em JSON válido com a estrutura exata especificada. NÃO use markdown, apenas JSON puro.`;

  const userPrompt = `Transforme o seguinte texto em um conteúdo de estudo semanal (Semana ${weekNumber} de ${year}).

TEXTO BASE:
${text}

ESTRUTURA DO ESTUDO BÍBLICO (seguir este formato):
📖 ESTUDO BÍBLICO: [TÍTULO DO TEMA]

✨ Versículo Base
[Referência] — "[Texto do versículo na ARA]"

📌 1. [TÍTULO DO PRIMEIRO TÓPICO]
[Texto explicativo do tópico]

📌 2. [TÍTULO DO SEGUNDO TÓPICO]
[Texto explicativo do tópico]

... (mais tópicos conforme necessário)

🟦 CONCLUSÃO
[Texto da conclusão]

Gere um JSON com a seguinte estrutura:
{
  "weekTitle": "Título da semana baseado no tema principal",
  "weekDescription": "Descrição breve do conteúdo da semana",
  "lessons": [
    {
      "title": "Título da lição",
      "description": "Descrição breve",
      "type": "intro|study|meditation|challenge|review",
      "xpReward": 10-50,
      "estimatedMinutes": 5-15,
      "units": [
        {
          "type": "text|multiple_choice|true_false|fill_blank|meditation|reflection|verse",
          "stage": "estude|medite|responda",
          "content": {
            // Para "text" (stage: "estude"): { "title": "Título do Tópico", "body": "Conteúdo principal de leitura. Deve ser rico e educativo.", "highlight": "Frase chave para destacar (opcional)" }
            // Para "verse" (stage: "estude"): { "title": "Versículo Base (ARA)", "body": "Texto completo do versículo na versão ARA", "highlight": "Referência: João 3:16" }
            // Para "meditation" (stage: "medite"): { "title": "Meditação na Palavra", "body": "Guia de meditação CRISTÃ focado na Palavra de Deus, oração e aplicação prática. SEM técnicas de respiração.", "meditationDuration": 60 }
            // Para "reflection" (stage: "medite"): { "title": "Aplicação Prática", "body": "Como aplicar este ensino na vida diária", "reflectionPrompt": "Pergunta para reflexão pessoal" }
            // Para "multiple_choice" (stage: "responda"): { "question": "Pergunta clara sobre o conteúdo", "options": ["Alternativa plausível A", "Alternativa plausível B", "Alternativa plausível C", "Alternativa plausível D"], "correctIndex": 0-3 (varie a posição!), "explanationCorrect": "Explicação quando acertar", "explanationIncorrect": "Explicação quando errar", "hint": "Dica opcional" } - IMPORTANTE: Todas as alternativas devem ser plausíveis e ter tamanhos similares!
            // Para "true_false" (stage: "responda"): { "statement": "Afirmação para julgar verdadeiro ou falso", "isTrue": true, "explanationCorrect": "Explicação quando acertar", "explanationIncorrect": "Explicação quando errar" }
            // Para "fill_blank" (stage: "responda"): IMPORTANTE - A frase DEVE ter contexto completo! Inclua campo "options" com 4 alternativas semanticamente coerentes!
            //   - Se a resposta é um VERBO, as alternativas devem ser VERBOS
            //   - Se a resposta é um SUBSTANTIVO, as alternativas devem ser SUBSTANTIVOS do mesmo tipo
            //   - Se a resposta é um ADJETIVO, as alternativas devem ser ADJETIVOS
            //   - Se a resposta é um NOME PRÓPRIO (pessoa), as alternativas devem ser NOMES PRÓPRIOS
            //   Exemplos:
            //   - { "question": "Jesus disse: Eu sou o ___, a verdade e a vida.", "correctAnswer": "caminho", "options": ["caminho", "destino", "propósito", "sentido"], "explanationCorrect": "João 14:6 - Jesus se apresenta como o único caminho ao Pai", "explanationIncorrect": "A resposta correta é 'caminho'. Releia João 14:6", "hint": "Pense em como chegamos a um lugar" }
            //   - { "question": "Segundo Romanos 8:28, Deus coopera em todas as coisas para o ___ daqueles que O amam.", "correctAnswer": "bem", "options": ["bem", "proveito", "benefício", "crescimento"], "explanationCorrect": "Deus trabalha para nosso benefício!", "explanationIncorrect": "A resposta é 'bem'. Romanos 8:28 nos ensina sobre a providência divina.", "hint": "Deus trabalha para nosso..." }
            //   - { "question": "O fruto do Espírito inclui amor, alegria, paz, ___ e bondade.", "correctAnswer": "paciência", "options": ["paciência", "mansidão", "longanimidade", "temperança"], "explanationCorrect": "Gálatas 5:22 lista os frutos do Espírito", "explanationIncorrect": "A resposta é 'paciência'. Veja Gálatas 5:22.", "hint": "Um fruto que nos ajuda a esperar" }
          },
          "xpValue": 2-10
        }
      ]
    }
  ]
}

ESTRUTURA OBRIGATÓRIA DAS LIÇÕES - 3 ETAPAS:

ETAPA 1 - ESTUDE (stage: "estude"):
- Uma unidade "verse" com o VERSÍCULO BASE da versão ARA (título + versículo na mesma unidade)
- Múltiplas unidades "text" para cada TÓPICO (título do tópico + texto explicativo juntos)
- Uma unidade "text" para a CONCLUSÃO

ETAPA 2 - MEDITE (stage: "medite") - SEPARADA DO ESTUDO:
- OBRIGATÓRIO: Inclua NO MÍNIMO 3 unidades de aplicação prática
- Unidades "reflection" com APLICAÇÕES PRÁTICAS (como aplicar na vida diária)
- Unidades "meditation" com MEDITAÇÃO CRISTÃ (oração, reflexão na Palavra - SEM técnicas de respiração)

ETAPA 3 - RESPONDA (stage: "responda"):
- Unidades de exercícios: "multiple_choice", "true_false", "fill_blank"
- APENAS esta etapa causa perda de vidas quando o usuário erra

Regras Adicionais:
1. OBRIGATÓRIO: Crie 5 a 7 lições por semana, uma para cada dia de estudo (Segunda a Domingo)
2. Analise o PDF e divida o conteúdo em lições diárias com temas conectados
3. Cada lição deve seguir as 3 etapas na ordem: ESTUDE -> MEDITE -> RESPONDA
4. Use APENAS a versão ARA (Almeida Revista e Atualizada) para todos os versículos
5. O texto de leitura deve ser EXTENSO e detalhado (mínimo 150 palavras por tópico) - textos curtos serão rejeitados
6. OBRIGATÓRIO: Inclua EXATAMENTE 5 perguntas por lição (etapa RESPONDA) - misture múltipla escolha, verdadeiro/falso e complete a frase
7. OBRIGATÓRIO: A etapa ESTUDE deve ter NO MÍNIMO 6 telas (1 versículo base + 4 ou mais tópicos + 1 conclusão)
8. As aplicações práticas (etapa MEDITE) devem conectar o texto bíblico com a vida cotidiana
9. As perguntas devem testar compreensão do texto de leitura
10. O conteúdo deve ser edificante e encorajador
11. Use português brasileiro correto COM TODOS OS ACENTOS
12. Se o PDF contiver múltiplos tópicos/seções, crie uma lição para cada tópico principal

REGRAS OBRIGATÓRIAS PARA EXERCÍCIOS fill_blank:
- A frase DEVE ter contexto suficiente para o usuário entender o que preencher
- NUNCA gere apenas "___" sem contexto - isso é INVÁLIDO
- O campo "question" deve ser uma frase COMPLETA com ___ no lugar da palavra a completar
- Exemplo CORRETO: "Jesus disse: Eu sou o ___, a verdade e a vida."
- Exemplo INCORRETO: "___" (sem contexto)
- Exemplo INCORRETO: "Complete: ___" (muito vago)
- A resposta deve ser uma ÚNICA palavra ou expressão curta

Retorne APENAS o JSON, sem explicações adicionais.`;

  try {
    const content = await generateWithAI(systemPrompt, userPrompt, provider, geminiKey, openaiKey);
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    const parsed = safeJsonParse(content) as GeneratedWeekContent;
    return validateAndCleanContent(parsed);
  } catch (error) {
    console.error("Erro ao gerar conteudo com IA:", error);
    throw new Error(`Falha ao gerar conteudo: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
}

export async function generateExercisesFromTopic(topic: string, count: number = 5): Promise<GeneratedUnit[]> {
  const systemPrompt = `Voce e um especialista em educacao crista. Crie exercicios interativos no estilo Duolingo sobre o topico fornecido.
Responda SEMPRE em JSON valido. NAO use markdown, apenas JSON puro.

REGRAS PARA ALTERNATIVAS DE MULTIPLA ESCOLHA:
- Crie 4 alternativas PLAUSÍVEIS que parecem corretas à primeira vista
- Use distratores inteligentes relacionados ao tema
- Evite alternativas obviamente erradas ou absurdas
- VARIE a posição da resposta correta (0, 1, 2, ou 3)`;

  const userPrompt = `Crie ${count} exercicios variados sobre o topico: "${topic}"

Retorne um JSON com a estrutura:
{
  "exercises": [
    {
      "type": "multiple_choice|true_false|fill_blank|reflection",
      "content": {
        "question": "...",
        "options": ["Alternativa plausível A", "Alternativa plausível B", "Alternativa plausível C", "Alternativa plausível D"],
        "correctAnswer": 0-3 (VARIE a posição!),
        "explanation": "..."
      },
      "xpValue": 5
    }
  ]
}

IMPORTANTE: Para múltipla escolha, todas as alternativas devem parecer razoáveis e relacionadas ao tema.
Varie os tipos de exercicios e mantenha as perguntas educativas e engajantes.
Retorne APENAS o JSON, sem explicacoes adicionais.`;

  try {
    const content = await generateWithGemini(systemPrompt, userPrompt);
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    const parsed = safeJsonParse(content);
    return parsed.exercises || [];
  } catch (error) {
    console.error("Erro ao gerar exercicios:", error);
    throw new Error(`Falha ao gerar exercicios: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
}

export interface PracticeQuestion {
  type: "multiple_choice" | "true_false" | "fill_blank";
  content: {
    question?: string;
    statement?: string;
    options?: string[];
    correctIndex?: number;
    correctAnswer?: string;
    isTrue?: boolean;
    explanationCorrect?: string;
    explanationIncorrect?: string;
  };
}

// Helper function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper function to randomize correct answer position in multiple choice
export function randomizeMultipleChoiceAnswer(content: any): any {
  if (!content.options || !Array.isArray(content.options) || content.options.length < 2) {
    return content;
  }
  
  const correctIndex = content.correctIndex || 0;
  const correctAnswer = content.options[correctIndex];
  
  // Create shuffled options
  const shuffledOptions = shuffleArray(content.options);
  const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);
  
  return {
    ...content,
    options: shuffledOptions,
    correctIndex: newCorrectIndex
  };
}

export async function generateUniquePracticeQuestions(weekTitle: string, weekDescription: string, existingQuestions: string[]): Promise<PracticeQuestion[]> {
  const systemPrompt = `Voce e um especialista em educacao crista. Crie perguntas de pratica UNICAS e DIFERENTES sobre o tema fornecido.
Responda SEMPRE em JSON valido. NAO use markdown, apenas JSON puro.
IMPORTANTE: As perguntas devem ser COMPLETAMENTE DIFERENTES das perguntas existentes listadas.
IMPORTANTE: Para perguntas de multipla escolha, VARIE a posicao da resposta correta entre A, B, C e D (nao coloque sempre na mesma posicao).

REGRAS CRITICAS PARA ALTERNATIVAS DE MULTIPLA ESCOLHA:
- Todas as 4 alternativas devem ser PLAUSÍVEIS e parecer corretas à primeira vista
- Use distratores inteligentes: respostas que poderiam parecer certas mas têm uma diferença sutil
- Evite alternativas obviamente erradas ou absurdas
- As alternativas incorretas devem estar relacionadas ao tema e parecer razoáveis
- Exemplo BOM: Pergunta sobre amor de Deus - alternativas falam de amor condicional, incondicional, merecido, seletivo
- Exemplo RUIM: Alternativas como "Não sei", "Nenhuma das anteriores", ou respostas absurdas`;

  const existingQuestionsText = existingQuestions.length > 0 
    ? `\n\nPERGUNTAS JA EXISTENTES (NAO repita estas, crie perguntas NOVAS e DIFERENTES):\n${existingQuestions.join('\n')}`
    : '';

  const userPrompt = `Crie 10 perguntas de pratica UNICAS sobre o tema: "${weekTitle}"
Descricao do tema: ${weekDescription}
${existingQuestionsText}

Retorne um JSON com a estrutura:
{
  "questions": [
    {
      "type": "multiple_choice",
      "content": {
        "question": "Pergunta diferente das existentes",
        "options": ["Opcao A", "Opcao B", "Opcao C", "Opcao D"],
        "correctIndex": 0-3 (VARIE a posicao! Nao coloque sempre em 1),
        "explanationCorrect": "Explicacao quando acertar",
        "explanationIncorrect": "Explicacao quando errar"
      }
    },
    {
      "type": "true_false",
      "content": {
        "statement": "Afirmacao para julgar",
        "isTrue": true ou false,
        "explanationCorrect": "Explicacao",
        "explanationIncorrect": "Explicacao"
      }
    },
    {
      "type": "fill_blank",
      "content": {
        "question": "Frase com ___ para completar",
        "correctAnswer": "palavra",
        "explanationCorrect": "Explicacao",
        "explanationIncorrect": "Explicacao"
      }
    }
  ]
}

REGRAS:
1. Crie exatamente 10 perguntas
2. Varie os tipos: 5 multiple_choice, 3 true_false, 2 fill_blank
3. Para multiple_choice: DISTRIBUA as respostas corretas entre A, B, C e D (nao coloque todas como B!)
4. As perguntas devem ser DIFERENTES das ja existentes
5. Foque no conteudo do tema: ${weekTitle}

Retorne APENAS o JSON, sem explicacoes adicionais.`;

  try {
    const content = await generateWithGemini(systemPrompt, userPrompt);
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    const parsed = safeJsonParse(content);
    const questions = parsed.questions || [];
    
    // Validate and clean each question, randomizing answer positions
    return questions.map((q: any) => {
      if (q.type === 'multiple_choice') {
        q.content = randomizeMultipleChoiceAnswer(q.content);
      }
      return validateAndCleanUnit({ ...q, xpValue: 5 }, q.type);
    }).slice(0, 10);
  } catch (error) {
    console.error("Erro ao gerar perguntas de pratica:", error);
    throw new Error(`Falha ao gerar perguntas: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
}

export async function generateReflectionQuestions(text: string, count: number = 3): Promise<string[]> {
  const systemPrompt = `Voce e um lider de jovens cristao. Crie perguntas de reflexao profundas baseadas no texto.
Responda SEMPRE em JSON valido. NAO use markdown, apenas JSON puro.`;

  const userPrompt = `Baseado no seguinte texto, crie ${count} perguntas de reflexao para discussao em grupo:

${text}

Retorne um JSON: { "questions": ["pergunta1", "pergunta2", ...] }

As perguntas devem:
1. Promover autoavaliacao espiritual
2. Conectar o texto com a vida pratica
3. Ser abertas (sem resposta certa/errada)
4. Encorajar compartilhamento de experiencias

Retorne APENAS o JSON, sem explicacoes adicionais.`;

  try {
    const content = await generateWithGemini(systemPrompt, userPrompt);
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    const parsed = safeJsonParse(content);
    return parsed.questions || [];
  } catch (error) {
    console.error("Erro ao gerar perguntas:", error);
    throw new Error(`Falha ao gerar perguntas: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
}

export async function summarizeText(text: string): Promise<string> {
  try {
    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ 
          text: `Voce e um resumidor de textos cristao. Crie resumos claros e edificantes em portugues brasileiro.

Resuma o seguinte texto em 2-3 paragrafos, mantendo os pontos principais e a mensagem espiritual:

${text}` 
        }] 
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    return result.response.text() || "";
  } catch (error) {
    console.error("Erro ao resumir texto:", error);
    throw new Error(`Falha ao resumir: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
}

export async function extractTextFromPDFContent(pdfText: string): Promise<string> {
  // Clean up the extracted PDF text
  return pdfText
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function generateStudyContentFromPDF(
  pdfText: string,
  weekNumber: number,
  year: number,
  geminiKey: string = "1",
  provider: AIProvider = "gemini",
  openaiKey: string = "1"
): Promise<GeneratedWeekContent> {
  // Clean the PDF text first
  const cleanedText = await extractTextFromPDFContent(pdfText);
  
  // Use the same generation function with selected provider and key
  return generateStudyContentFromText(cleanedText, weekNumber, year, geminiKey, provider, openaiKey);
}

function validateAndCleanUnit(unit: GeneratedUnit, type: string): GeneratedUnit {
  return normalizeUnitContent({ ...unit, type });
}

function normalizeUnitContent(unit: GeneratedUnit): GeneratedUnit {
  const content = unit.content || {};
  
  switch (unit.type) {
    case "text":
      if (!content.body && content.text) {
        content.body = content.text;
      }
      if (!content.body) {
        content.body = "Conteudo nao disponivel";
      }
      if (!content.title) {
        content.title = "";
      }
      delete content.text;
      break;
      
    case "verse":
      if (!content.body && content.verseText) {
        content.body = content.verseText;
      }
      if (!content.body && content.text) {
        content.body = content.text;
      }
      if (!content.body) {
        content.body = "Versiculo nao disponivel";
      }
      if (!content.highlight && content.verseReference) {
        content.highlight = content.verseReference;
      }
      if (!content.title) {
        content.title = "Versiculo";
      }
      delete content.text;
      delete content.verseText;
      break;
      
    case "multiple_choice":
      if (!Array.isArray(content.options) || content.options.length === 0) {
        content.options = ["Opcao A", "Opcao B", "Opcao C", "Opcao D"];
      }
      content.options = content.options
        .map((opt: any) => String(opt || "").trim())
        .filter((opt: string) => opt !== "");
      if (content.options.length < 2) {
        content.options = ["Opcao A", "Opcao B", "Opcao C", "Opcao D"];
      }
      const optionCount = content.options.length;
      
      if (content.correctAnswer !== undefined && content.correctIndex === undefined) {
        let parsedIndex = 0;
        const answerValue = String(content.correctAnswer).trim().toUpperCase();
        if (/^[A-D]$/.test(answerValue)) {
          parsedIndex = answerValue.charCodeAt(0) - 'A'.charCodeAt(0);
        } else if (/^\d+$/.test(answerValue)) {
          const numValue = parseInt(answerValue, 10);
          parsedIndex = numValue >= 1 ? numValue - 1 : numValue;
        } else if (typeof content.correctAnswer === 'number') {
          const numValue = content.correctAnswer;
          parsedIndex = numValue >= 1 ? numValue - 1 : numValue;
        }
        if (isNaN(parsedIndex) || parsedIndex < 0) {
          parsedIndex = 0;
        }
        content.correctIndex = Math.min(parsedIndex, optionCount - 1);
      }
      if (content.correctIndex === undefined) {
        content.correctIndex = 0;
      }
      content.correctIndex = Math.max(0, Math.min(content.correctIndex, optionCount - 1));
      if (!content.question) {
        content.question = "Pergunta nao disponivel";
      }
      if (!content.explanationCorrect && content.explanation) {
        content.explanationCorrect = content.explanation;
        content.explanationIncorrect = content.explanation;
      }
      if (!content.explanationCorrect) {
        content.explanationCorrect = "Correto!";
      }
      if (!content.explanationIncorrect) {
        content.explanationIncorrect = "Incorreto. Tente novamente.";
      }
      delete content.correctAnswer;
      delete content.explanation;
      
      // Randomize the correct answer position for better variety
      const randomizedContent = randomizeMultipleChoiceAnswer(content);
      Object.assign(content, randomizedContent);
      break;
      
    case "true_false":
      if (content.question && !content.statement) {
        content.statement = content.question;
      }
      if (!content.statement) {
        content.statement = "Afirmacao nao disponivel";
      }
      if (content.isTrue === undefined) {
        if (content.correctAnswer !== undefined) {
          content.isTrue = content.correctAnswer === true || content.correctAnswer === "true";
        } else {
          content.isTrue = true;
        }
      }
      if (!content.explanationCorrect && content.explanation) {
        content.explanationCorrect = content.explanation;
        content.explanationIncorrect = content.explanation;
      }
      if (!content.explanationCorrect) {
        content.explanationCorrect = "Correto!";
      }
      if (!content.explanationIncorrect) {
        content.explanationIncorrect = "Incorreto. Tente novamente.";
      }
      delete content.question;
      delete content.correctAnswer;
      delete content.explanation;
      break;
      
    case "fill_blank":
      // Ensure we have a valid answer string
      const answerStr = content.correctAnswer ? String(content.correctAnswer).trim() : "";
      if (!answerStr) {
        content.correctAnswer = "palavra";
        console.warn("[AI Validation] fill_blank missing correctAnswer, using default");
      } else {
        content.correctAnswer = answerStr;
      }
      
      if (!content.question) {
        content.question = "";
      }
      
      // Remove common prefixes and check for meaningful context
      const cleanedQuestion = content.question
        .replace(/^complete:?\s*/gi, '')
        .replace(/^preencha:?\s*/gi, '')
        .replace(/^a resposta e:?\s*/gi, '')
        .trim();
      
      // Check if question has proper context:
      // - Must have more than just "___"
      // - Must have at least 15 characters of content (excluding blanks)
      // - Must contain at least one space (multiple words)
      const questionWithoutBlanks = cleanedQuestion.replace(/___/g, '').trim();
      const hasProperContext = 
        questionWithoutBlanks.length >= 15 && 
        questionWithoutBlanks.includes(' ') &&
        cleanedQuestion !== "___" &&
        cleanedQuestion !== "";
      
      if (!hasProperContext) {
        // Create a contextual fallback question with the answer hint
        const firstLetter = answerStr.charAt(0).toUpperCase();
        const answerLen = answerStr.length;
        const hint = answerLen > 3 ? `${firstLetter}${'_'.repeat(answerLen - 1)}` : `${firstLetter}...`;
        
        content.question = `Complete a frase com a palavra correta (${hint}): ___`;
        console.warn(`[AI Validation] fill_blank had insufficient context, created fallback question`);
      } else {
        content.question = cleanedQuestion;
      }
      
      // Ensure exactly one blank
      if (!content.question.includes("___")) {
        content.question = content.question.replace(/\s*$/, " ___");
      }
      const blankMatches = content.question.match(/___/g) || [];
      if (blankMatches.length > 1) {
        const firstBlankIndex = content.question.indexOf("___");
        const beforeBlank = content.question.substring(0, firstBlankIndex + 3);
        let afterBlank = content.question.substring(firstBlankIndex + 3);
        afterBlank = afterBlank.replace(/___/g, "...");
        content.question = beforeBlank + afterBlank;
      }
      
      // Set up explanations
      if (!content.explanationCorrect && content.explanation) {
        content.explanationCorrect = content.explanation;
        content.explanationIncorrect = content.explanation;
      }
      if (!content.explanationCorrect) {
        content.explanationCorrect = "Correto! Muito bem!";
      }
      if (!content.explanationIncorrect) {
        content.explanationIncorrect = `Incorreto. A resposta correta e: "${content.correctAnswer}".`;
      }
      delete content.explanation;
      break;
      
    case "meditation":
      if (!content.body && content.meditationGuide) {
        content.body = content.meditationGuide;
      }
      if (!content.body && content.text) {
        content.body = content.text;
      }
      if (!content.body) {
        content.body = "Guia de meditacao nao disponivel";
      }
      if (!content.meditationDuration) {
        content.meditationDuration = 60;
      }
      if (!content.title) {
        content.title = "Meditacao";
      }
      delete content.text;
      delete content.meditationGuide;
      break;
      
    case "reflection":
      if (!content.body && content.reflectionPrompt) {
        content.body = content.reflectionPrompt;
      }
      if (!content.body && content.text) {
        content.body = content.text;
      }
      if (!content.body) {
        content.body = "Reflexao nao disponivel";
      }
      if (!content.title) {
        content.title = "Reflexao";
      }
      delete content.text;
      break;
  }
  
  unit.content = content;
  return unit;
}

function validateAndCleanContent(content: GeneratedWeekContent): GeneratedWeekContent {
  if (!content.weekTitle) {
    content.weekTitle = "Semana de Estudos";
  }
  if (!content.weekDescription) {
    content.weekDescription = "Conteudo semanal de estudos biblicos";
  }
  if (!content.lessons || !Array.isArray(content.lessons)) {
    content.lessons = [];
  }

  content.lessons = content.lessons.map((lesson, index) => {
    const validTypes = ["intro", "study", "meditation", "challenge", "review"];
    if (!validTypes.includes(lesson.type)) {
      lesson.type = "study";
    }
    if (!lesson.title) {
      lesson.title = `Licao ${index + 1}`;
    }
    if (!lesson.xpReward || lesson.xpReward < 1) {
      lesson.xpReward = 10;
    }
    if (!lesson.estimatedMinutes || lesson.estimatedMinutes < 1) {
      lesson.estimatedMinutes = 5;
    }
    if (!lesson.units || !Array.isArray(lesson.units)) {
      lesson.units = [];
    }

    lesson.units = lesson.units
      .map(unit => {
        const validUnitTypes = ["text", "multiple_choice", "true_false", "fill_blank", "meditation", "reflection", "verse"];
        if (!validUnitTypes.includes(unit.type)) {
          unit.type = "text";
        }
        if (!unit.content) {
          unit.content = { body: "Conteudo nao disponivel" };
        }
        if (!unit.xpValue || unit.xpValue < 1) {
          unit.xpValue = 2;
        }
        
        // Assign stage based on unit type if not already set
        if (!unit.stage) {
          if (unit.type === "text" || unit.type === "verse") {
            unit.stage = "estude";
          } else if (unit.type === "meditation" || unit.type === "reflection") {
            unit.stage = "medite";
          } else {
            unit.stage = "responda";
          }
        }
        
        return normalizeUnitContent(unit);
      });
    
    // Validate minimum content requirements
    let estudeUnits = lesson.units.filter(u => u.stage === "estude");
    let mediteUnits = lesson.units.filter(u => u.stage === "medite" && 
      (u.type === "meditation" || u.type === "reflection"));
    let respondaUnits = lesson.units.filter(u => u.stage === "responda" && 
      (u.type === "multiple_choice" || u.type === "true_false" || u.type === "fill_blank"));
    
    // Enforce minimum 3 applications in medite section
    if (mediteUnits.length < 3) {
      console.warn(`[AI Validation] Lesson "${lesson.title}" has only ${mediteUnits.length} applications. Adding ${3 - mediteUnits.length} more.`);
      const applicationTemplates = [
        { title: "Aplicacao na Vida Diaria", body: "Como posso aplicar esse ensinamento hoje em minhas decisoes e relacionamentos?", reflectionPrompt: "Pense em uma situacao recente onde esse principio poderia ter guiado suas acoes." },
        { title: "Oracao de Compromisso", body: "Faca uma oracao pedindo a Deus sabedoria para viver esse ensinamento no seu cotidiano.", reflectionPrompt: "Dedique um momento para orar e se comprometer com essa verdade." },
        { title: "Pratica Semanal", body: "Escolha uma acao concreta para praticar esse ensinamento durante esta semana.", reflectionPrompt: "Qual sera sua acao pratica para viver esse principio?" }
      ];
      
      const maxOrderIndex = Math.max(...lesson.units.map(u => u.orderIndex || 0), 0);
      for (let i = mediteUnits.length; i < 3; i++) {
        const template = applicationTemplates[i % applicationTemplates.length];
        lesson.units.push({
          type: "reflection",
          stage: "medite",
          orderIndex: maxOrderIndex + i + 1,
          content: template,
          xpValue: 3
        });
      }
    }
    
    // Enforce minimum 5 questions in responda section
    if (respondaUnits.length < 5) {
      console.warn(`[AI Validation] Lesson "${lesson.title}" has only ${respondaUnits.length} questions. Adding ${5 - respondaUnits.length} more.`);
      
      // Function to create multiple choice with random correct index
      const createMultipleChoice = (question: string, options: string[], correctOptionIndex: number, explanationCorrect: string, explanationIncorrect: string) => {
        // Shuffle the options and track the new correct index
        const shuffledOptions = [...options];
        const correctAnswer = options[correctOptionIndex];
        for (let i = shuffledOptions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
        }
        const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);
        
        return {
          question,
          options: shuffledOptions,
          correctIndex: newCorrectIndex,
          explanationCorrect,
          explanationIncorrect
        };
      };
      
      const questionTemplates = [
        { type: "true_false", content: { statement: "Este ensinamento nos ajuda a viver de forma mais alinhada com a vontade de Deus.", isTrue: true, explanationCorrect: "Correto! Os ensinamentos biblicos sempre nos guiam para a vontade de Deus.", explanationIncorrect: "A resposta correta e Verdadeiro. Os ensinamentos biblicos nos direcionam a Deus." } },
        { type: "true_false", content: { statement: "Os principios biblicos se aplicam somente a vida espiritual, nao afetando decisoes praticas do dia a dia.", isTrue: false, explanationCorrect: "Correto! Os principios biblicos se aplicam a toda nossa vida, incluindo decisoes praticas.", explanationIncorrect: "A resposta correta e Falso. A Biblia orienta todas as areas da nossa vida." } },
        { type: "multiple_choice", content: createMultipleChoice("Qual atitude reflete melhor a aplicacao deste ensinamento?", ["Refletir sobre o texto e buscar aplicacao pratica", "Compartilhar o texto com outros antes de aplicar", "Memorizar o texto para usar no futuro", "Estudar comentarios sobre o texto primeiro"], 0, "Isso mesmo! A reflexao e aplicacao pratica sao fundamentais.", "A resposta correta e refletir e aplicar. Embora outras opcoes sejam boas, a aplicacao pratica e essencial.") },
        { type: "true_false", content: { statement: "A meditacao na Palavra de Deus requer um ambiente perfeito e silencioso para ser eficaz.", isTrue: false, explanationCorrect: "Correto! Podemos meditar na Palavra em qualquer lugar, mesmo em ambientes imperfeitos.", explanationIncorrect: "A resposta correta e Falso. A meditacao biblica nao depende de condicoes perfeitas." } },
        { type: "multiple_choice", content: createMultipleChoice("Como a fe biblica se relaciona com os desafios diarios?", ["A fe nos fortalece para enfrentar dificuldades com esperanca", "A fe nos livra de todos os problemas automaticamente", "A fe e apenas para momentos de culto e oracao", "A fe substitui a necessidade de agir praticamente"], 0, "Correto! A fe nos fortalece, mas nao nos isenta dos desafios.", "A resposta correta e que a fe nos fortalece para enfrentar dificuldades com esperanca.") }
      ];
      
      const maxOrderIndex = Math.max(...lesson.units.map(u => u.orderIndex || 0), 0);
      for (let i = respondaUnits.length; i < 5; i++) {
        const template = questionTemplates[i % questionTemplates.length];
        // Create a fresh copy of the template to ensure each question has randomized options
        let content = template.content;
        if (template.type === "multiple_choice") {
          // Re-randomize for each added question
          const mc = template.content as any;
          content = createMultipleChoice(mc.question, mc.options, mc.correctIndex, mc.explanationCorrect, mc.explanationIncorrect);
        }
        lesson.units.push({
          type: template.type,
          stage: "responda",
          orderIndex: maxOrderIndex + 10 + i,
          content,
          xpValue: 5
        });
      }
    }
    
    // Log final validation status
    if (estudeUnits.length < 6) {
      console.warn(`[AI Validation] Lesson "${lesson.title}" has only ${estudeUnits.length} study screens (minimum 6 required)`);
    }
    
    lesson.units = lesson.units
      // Post-normalization: filter out fill_blank units that still lack proper context
      .filter(unit => {
        if (unit.type === "fill_blank") {
          const question = unit.content.question || "";
          const answer = unit.content.correctAnswer || "";
          
          // Remove blank markers and check remaining content
          const contentWithoutBlanks = question.replace(/___/g, '').trim();
          
          // Reject if:
          // 1. Question is too short (less than 20 chars of actual content)
          // 2. Answer is missing or empty
          // 3. Question doesn't contain meaningful context (just generic phrases)
          const genericPhrases = [
            'complete a frase',
            'complete a palavra',
            'preencha',
            'a resposta e',
            'palavra correta'
          ];
          
          const lowerContent = contentWithoutBlanks.toLowerCase();
          const isGeneric = genericPhrases.some(phrase => 
            lowerContent === phrase || lowerContent.startsWith(phrase + ' ')
          );
          
          if (!answer || contentWithoutBlanks.length < 20 || isGeneric) {
            console.warn(`[AI Validation] Removing contextless fill_blank: "${question}" -> answer: "${answer}"`);
            return false; // Filter out this unit
          }
        }
        return true; // Keep other unit types
      });

    return lesson;
  });

  return content;
}

export function isAIConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export async function generateDailyVerseWithAI(): Promise<{ verse: string; reference: string } | null> {
  const { getDailyVerse } = await import("./bible-api.js");
  
  try {
    const bibleApiResult = await getDailyVerse();
    if (bibleApiResult) {
      console.log("[BibleAPI] Daily verse fetched successfully from ABíbliaDigital");
      return bibleApiResult;
    }
  } catch (error) {
    console.warn("[BibleAPI] Failed to fetch daily verse, falling back to Gemini:", error);
  }

  if (!isAIConfigured()) {
    console.log("[AI] Gemini not configured and Bible API failed");
    return null;
  }

  try {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    
    const prompt = `Você é um pastor experiente. Selecione um versículo bíblico inspirador e edificante para o dia de hoje (dia ${dayOfYear} do ano).

Critérios:
- Deve ser um versículo real da Bíblia na versão ARA (Almeida Revista e Atualizada)
- Deve trazer esperança, encorajamento ou sabedoria
- Pode ser do Antigo ou Novo Testamento
- Varie entre diferentes livros da Bíblia
- Use APENAS texto da versão ARA

Responda APENAS em formato JSON:
{
  "verse": "Texto completo do versículo na versão ARA",
  "reference": "Livro Capítulo:Versículo (ARA)"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[AI] Could not extract JSON from daily verse response");
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      verse: parsed.verse,
      reference: parsed.reference
    };
  } catch (error) {
    console.error("[AI] Error generating daily verse:", error);
    return null;
  }
}

// Local fallback recovery verses to avoid API calls when quota is low
const LOCAL_RECOVERY_VERSES = [
  { verse: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.", reference: "Isaías 41:10 (ARA)", reflection: "Deus está sempre conosco, mesmo nos momentos mais difíceis." },
  { verse: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", reference: "Mateus 11:28 (ARA)", reflection: "Jesus oferece descanso para nossa alma cansada." },
  { verse: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.", reference: "1 Pedro 5:7 (ARA)", reflection: "Podemos entregar nossas preocupações a Deus, pois Ele cuida de nós." },
  { verse: "Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão e não se cansarão; caminharão e não se fatigarão.", reference: "Isaías 40:31 (ARA)", reflection: "A espera em Deus renova nossas forças espirituais." },
  { verse: "O Senhor é o meu pastor; nada me faltará.", reference: "Salmos 23:1 (ARA)", reflection: "Com Deus como nosso guia, nada nos faltará." },
];

export async function generateRecoveryVersesWithAI(count: number = 5): Promise<Array<{ verse: string; reference: string; reflection: string }> | null> {
  const { getRecoveryVerses } = await import("./bible-api.js");
  
  // First try Bible API (no AI cost)
  try {
    const bibleApiResult = await getRecoveryVerses(count);
    if (bibleApiResult && bibleApiResult.length > 0) {
      console.log(`[BibleAPI] ${bibleApiResult.length} recovery verses fetched successfully from ABíbliaDigital`);
      return bibleApiResult;
    }
  } catch (error) {
    console.warn("[BibleAPI] Failed to fetch recovery verses from API");
  }

  // Try AI generation if configured and quota likely available
  // This is a LOW-PRIORITY task, so we skip AI if quota was recently exhausted
  if (isAIConfigured() && isQuotaLikelyAvailable()) {
    try {
      const prompt = `Gere ${count} versículos bíblicos de conforto (versão ARA) com reflexões breves. JSON: {"verses":[{"verse":"texto","reference":"Livro X:Y (ARA)","reflection":"reflexão"}]}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.verses && parsed.verses.length > 0) {
          console.log("[Recovery Verses] Successfully generated with AI");
          return parsed.verses;
        }
      }
    } catch (error: any) {
      if (isQuotaError(error)) {
        markQuotaExhausted();
        console.log("[Recovery Verses] AI quota exceeded, using local fallback");
      } else {
        console.error("[Recovery Verses] AI error:", error?.message);
      }
    }
  } else if (!isQuotaLikelyAvailable()) {
    console.log("[Recovery Verses] Skipping AI (quota cooldown), using local fallback");
  }

  // Fallback to local verses
  const shuffled = [...LOCAL_RECOVERY_VERSES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ==================== LARGE FALLBACK DATABASE FOR DAILY MISSIONS ====================

// 100+ Bible quiz questions for fallback
const FALLBACK_QUIZ_QUESTIONS = [
  { question: "Quantos livros tem a Bíblia?", options: ["66", "72", "39", "27"], correctIndex: 0 },
  { question: "Quem escreveu Provérbios?", options: ["Moisés", "Salomão", "Davi", "Paulo"], correctIndex: 1 },
  { question: "Quem foi lançado na cova dos leões?", options: ["José", "Daniel", "Jonas", "Elias"], correctIndex: 1 },
  { question: "Qual livro vem depois de Gênesis?", options: ["Números", "Êxodo", "Levítico", "Deuteronômio"], correctIndex: 1 },
  { question: "Quantos discípulos Jesus tinha?", options: ["10", "11", "12", "13"], correctIndex: 2 },
  { question: "Quem batizou Jesus?", options: ["Pedro", "João Batista", "Tiago", "André"], correctIndex: 1 },
  { question: "Qual foi o primeiro milagre de Jesus?", options: ["Ressuscitar Lázaro", "Multiplicar pães", "Transformar água em vinho", "Curar um cego"], correctIndex: 2 },
  { question: "Quantos dias durou o dilúvio?", options: ["7 dias", "40 dias", "100 dias", "1 ano"], correctIndex: 1 },
  { question: "Quem construiu a arca?", options: ["Abraão", "Noé", "Moisés", "Jacó"], correctIndex: 1 },
  { question: "Qual o nome do gigante derrotado por Davi?", options: ["Sansão", "Golias", "Saul", "Absalão"], correctIndex: 1 },
  { question: "Quem negou Jesus três vezes?", options: ["Judas", "Tomé", "Pedro", "João"], correctIndex: 2 },
  { question: "Em que cidade Jesus nasceu?", options: ["Nazaré", "Jerusalém", "Belém", "Cafarnaum"], correctIndex: 2 },
  { question: "Quantos livros tem o Novo Testamento?", options: ["27", "39", "22", "31"], correctIndex: 0 },
  { question: "Quem foi o primeiro rei de Israel?", options: ["Davi", "Salomão", "Saul", "Samuel"], correctIndex: 2 },
  { question: "Qual profeta foi engolido por um peixe?", options: ["Elias", "Eliseu", "Jonas", "Amós"], correctIndex: 2 },
  { question: "Quantos mandamentos Deus deu a Moisés?", options: ["5", "7", "10", "12"], correctIndex: 2 },
  { question: "Quem foi vendido como escravo pelos irmãos?", options: ["Benjamim", "José", "Judá", "Rúben"], correctIndex: 1 },
  { question: "Qual era a profissão de Jesus?", options: ["Pescador", "Carpinteiro", "Pastor", "Agricultor"], correctIndex: 1 },
  { question: "Quem escreveu a maior parte das cartas do NT?", options: ["Pedro", "João", "Paulo", "Tiago"], correctIndex: 2 },
  { question: "Qual o último livro da Bíblia?", options: ["Judas", "Apocalipse", "3 João", "Malaquias"], correctIndex: 1 },
  { question: "Quem foi o pai de Salomão?", options: ["Saul", "Davi", "Samuel", "Abraão"], correctIndex: 1 },
  { question: "Qual o menor livro da Bíblia?", options: ["Obadias", "Filemom", "2 João", "3 João"], correctIndex: 2 },
  { question: "Quem foi levado ao céu num redemoinho?", options: ["Moisés", "Elias", "Enoque", "Eliseu"], correctIndex: 1 },
  { question: "Quantas pragas Deus enviou ao Egito?", options: ["7", "10", "12", "15"], correctIndex: 1 },
  { question: "Quem foi a esposa de Abraão?", options: ["Rebeca", "Raquel", "Sara", "Lia"], correctIndex: 2 },
  { question: "Qual apóstolo era cobrador de impostos?", options: ["Pedro", "Mateus", "Judas", "Simão"], correctIndex: 1 },
  { question: "Quem interpretou os sonhos de Faraó?", options: ["Moisés", "José", "Daniel", "Elias"], correctIndex: 1 },
  { question: "Qual livro contém os Salmos?", options: ["Provérbios", "Eclesiastes", "Salmos", "Cantares"], correctIndex: 2 },
  { question: "Quem escreveu o Apocalipse?", options: ["Paulo", "Pedro", "João", "Tiago"], correctIndex: 2 },
  { question: "Quantos anos Jesus viveu na terra?", options: ["30", "33", "35", "40"], correctIndex: 1 },
  { question: "Qual o monte onde Moisés recebeu os mandamentos?", options: ["Carmelo", "Sinai", "Horebe", "Sião"], correctIndex: 1 },
  { question: "Quem foi o sucessor de Moisés?", options: ["Calebe", "Josué", "Arão", "Eleazar"], correctIndex: 1 },
  { question: "Qual cidade Josué conquistou primeiro?", options: ["Ai", "Jericó", "Jerusalém", "Hebrom"], correctIndex: 1 },
  { question: "Quem foi o juiz mais forte de Israel?", options: ["Gideão", "Sansão", "Jefté", "Samuel"], correctIndex: 1 },
  { question: "Quantos filhos Jacó teve?", options: ["10", "12", "14", "7"], correctIndex: 1 },
  { question: "Qual o nome do filho prometido de Abraão?", options: ["Ismael", "Isaque", "Jacó", "Esaú"], correctIndex: 1 },
  { question: "Quem foi o profeta do fogo do céu no Carmelo?", options: ["Eliseu", "Elias", "Isaías", "Jeremias"], correctIndex: 1 },
  { question: "Qual mulher foi juíza em Israel?", options: ["Rute", "Débora", "Ester", "Raabe"], correctIndex: 1 },
  { question: "Quem foi o discípulo que duvidou da ressurreição?", options: ["Pedro", "João", "Tomé", "Filipe"], correctIndex: 2 },
  { question: "Qual era o nome hebraico de Paulo?", options: ["Silas", "Saulo", "Barnabé", "Timóteo"], correctIndex: 1 },
  { question: "Em que rio Jesus foi batizado?", options: ["Nilo", "Eufrates", "Jordão", "Tigre"], correctIndex: 2 },
  { question: "Quem foi o primeiro mártir cristão?", options: ["Tiago", "Estêvão", "Pedro", "Paulo"], correctIndex: 1 },
  { question: "Quantos pães Jesus multiplicou?", options: ["3", "5", "7", "12"], correctIndex: 1 },
  { question: "Qual animal falou com Balaão?", options: ["Camelo", "Jumento", "Cavalo", "Boi"], correctIndex: 1 },
  { question: "Quem foi o pai de João Batista?", options: ["José", "Zacarias", "Simeão", "Zebedeu"], correctIndex: 1 },
  { question: "Qual rei construiu o primeiro templo?", options: ["Davi", "Salomão", "Ezequias", "Josias"], correctIndex: 1 },
  { question: "Quantos anos os israelitas vagaram no deserto?", options: ["20", "30", "40", "50"], correctIndex: 2 },
  { question: "Quem foi a mãe de Samuel?", options: ["Ana", "Penina", "Rute", "Noemi"], correctIndex: 0 },
  { question: "Qual profeta foi chamado ainda criança?", options: ["Jeremias", "Samuel", "Isaías", "Eliseu"], correctIndex: 1 },
  { question: "Quem foi transformada em estátua de sal?", options: ["Mulher de Ló", "Sara", "Rebeca", "Raquel"], correctIndex: 0 },
];

// 50+ Bible curiosities for fallback
const FALLBACK_BIBLE_FACTS = [
  { fact: "A Bíblia foi escrita por aproximadamente 40 autores diferentes ao longo de 1.500 anos.", category: "história" },
  { fact: "O livro de Ester é o único livro da Bíblia que não menciona o nome de Deus.", category: "curiosidade" },
  { fact: "O versículo mais curto da Bíblia em português é 'Jesus chorou' (João 11:35).", category: "curiosidade" },
  { fact: "O Salmo 119 é o capítulo mais longo da Bíblia, com 176 versículos.", category: "números" },
  { fact: "A palavra 'Bíblia' vem do grego 'biblion' que significa 'livros'.", category: "etimologia" },
  { fact: "Matusalém é a pessoa mais velha mencionada na Bíblia, vivendo 969 anos.", category: "personagens" },
  { fact: "O livro de Jó é considerado o mais antigo da Bíblia.", category: "história" },
  { fact: "A Bíblia foi o primeiro livro impresso por Gutenberg em 1455.", category: "história" },
  { fact: "O Antigo Testamento foi escrito principalmente em hebraico e o Novo em grego.", category: "idiomas" },
  { fact: "Jesus citou o livro de Deuteronômio mais do que qualquer outro livro.", category: "Jesus" },
  { fact: "O apóstolo Paulo escreveu 13 das 27 cartas do Novo Testamento.", category: "autores" },
  { fact: "A palavra 'amor' aparece mais de 300 vezes na Bíblia.", category: "palavras" },
  { fact: "O Monte das Oliveiras é mencionado mais de 12 vezes na Bíblia.", category: "lugares" },
  { fact: "Noé tinha 600 anos quando começou o dilúvio.", category: "personagens" },
  { fact: "A arca de Noé tinha aproximadamente 137 metros de comprimento.", category: "números" },
  { fact: "O nome 'Jesus' significa 'o Senhor salva' em hebraico.", category: "etimologia" },
  { fact: "O livro de Apocalipse contém 404 versículos e 22 capítulos.", category: "números" },
  { fact: "Davi foi ungido rei três vezes diferentes.", category: "personagens" },
  { fact: "A rainha de Sabá viajou mais de 1.500 km para ver Salomão.", category: "viagens" },
  { fact: "O profeta Isaías é citado mais de 60 vezes no Novo Testamento.", category: "profetas" },
  { fact: "Pedro é mencionado mais vezes que qualquer outro apóstolo nos Evangelhos.", category: "personagens" },
  { fact: "Jesus jejuou 40 dias no deserto antes de iniciar seu ministério.", category: "Jesus" },
  { fact: "O templo de Salomão levou 7 anos para ser construído.", category: "construções" },
  { fact: "A palavra 'aleluia' aparece 24 vezes na Bíblia.", category: "palavras" },
  { fact: "Abraão tinha 100 anos quando Isaque nasceu.", category: "personagens" },
  { fact: "O livro de Provérbios contém 31 capítulos, um para cada dia do mês.", category: "números" },
  { fact: "Moisés liderou aproximadamente 2 milhões de israelitas no êxodo.", category: "números" },
  { fact: "O Jordão é o rio mais mencionado na Bíblia, aparecendo 175 vezes.", category: "lugares" },
  { fact: "Daniel sobreviveu na cova dos leões quando tinha aproximadamente 80 anos.", category: "personagens" },
  { fact: "A última palavra de Jesus na cruz foi 'Está consumado' (João 19:30).", category: "Jesus" },
];

// Large fallback mission templates
const FALLBACK_MISSION_TEMPLATES = [
  { title: "Leitura Matinal", description: "Leia um capítulo do livro de Provérbios", xpReward: 10, type: "easy" },
  { title: "Oração Intercessória", description: "Ore por 5 pessoas diferentes da sua comunidade", xpReward: 25, type: "medium" },
  { title: "Estudo Bíblico", description: "Faça um estudo aprofundado sobre um versículo", xpReward: 50, type: "hard" },
  { title: "Versículo do Dia", description: "Memorize um versículo bíblico e medite nele", xpReward: 10, type: "easy" },
  { title: "Ato de Bondade", description: "Pratique um ato de bondade com alguém hoje", xpReward: 25, type: "medium" },
  { title: "Jejum e Oração", description: "Faça um jejum parcial e dedique o tempo à oração", xpReward: 50, type: "hard" },
  { title: "Gratidão", description: "Escreva 3 coisas pelas quais você é grato hoje", xpReward: 10, type: "easy" },
  { title: "Compartilhar a Fé", description: "Compartilhe uma mensagem de encorajamento", xpReward: 25, type: "medium" },
  { title: "Servir ao Próximo", description: "Ajude alguém necessitado de forma prática", xpReward: 50, type: "hard" },
  { title: "Louvor Matinal", description: "Comece o dia ouvindo ou cantando um hino", xpReward: 10, type: "easy" },
  { title: "Leitura dos Salmos", description: "Leia 3 Salmos e reflita sobre eles", xpReward: 25, type: "medium" },
  { title: "Ensino Bíblico", description: "Ensine um princípio bíblico a alguém", xpReward: 50, type: "hard" },
  { title: "Oração em Família", description: "Faça uma oração com sua família", xpReward: 10, type: "easy" },
  { title: "Visitação", description: "Visite ou ligue para alguém que precisa de apoio", xpReward: 25, type: "medium" },
  { title: "Evangelismo", description: "Compartilhe o evangelho com uma pessoa", xpReward: 50, type: "hard" },
  { title: "Momento de Silêncio", description: "Dedique 10 minutos em silêncio com Deus", xpReward: 10, type: "easy" },
  { title: "Perdão", description: "Perdoe alguém que te magoou e ore por essa pessoa", xpReward: 25, type: "medium" },
  { title: "Confissão", description: "Faça uma reflexão honesta sobre seus pecados e confesse a Deus", xpReward: 50, type: "hard" },
];

export interface DailyMissionContent {
  missions: Array<{ title: string; description: string; xpReward: number; type: string }>;
  quizQuestions: Array<{ question: string; options: string[]; correctIndex: number }>;
  bibleFact: { fact: string; category: string };
  verseOfDay: { verse: string; reference: string };
}

export async function generateDailyMissionsWithAI(): Promise<Array<{ title: string; description: string; xpReward: number; type: string }> | null> {
  if (isAIConfigured() && isQuotaLikelyAvailable()) {
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayName = dayNames[new Date().getDay()];
    const dateStr = new Date().toISOString().split('T')[0];
    
    const systemPrompt = "Você é um educador cristão criativo especializado em missões espirituais.";
    const userPrompt = `Crie 3 missões espirituais ÚNICAS e VARIADAS para ${dayName} (${dateStr}).

REGRAS IMPORTANTES:
- As missões devem ser DIFERENTES a cada dia
- Use temas variados: oração, leitura bíblica, serviço, evangelismo, gratidão, louvor, jejum, meditação, comunhão
- Seja específico e criativo nos títulos e descrições
- Adapte ao dia da semana (domingo = culto, sábado = família, etc)

Formato JSON obrigatório:
{
  "missions": [
    {"title": "título curto", "description": "descrição detalhada da missão", "xpReward": 10, "type": "easy"},
    {"title": "título curto", "description": "descrição detalhada da missão", "xpReward": 25, "type": "medium"},
    {"title": "título curto", "description": "descrição detalhada da missão", "xpReward": 50, "type": "hard"}
  ]
}`;
    
    // Try each Gemini key (1-5) with model fallback
    for (let keyNum = 1; keyNum <= 5; keyNum++) {
      try {
        const text = await generateWithGemini(systemPrompt, userPrompt, keyNum.toString());
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.missions && parsed.missions.length >= 3) {
            console.log(`[Daily Missions] Successfully generated with AI (key ${keyNum})`);
            return parsed.missions;
          }
        }
      } catch (error: any) {
        if (isQuotaError(error)) {
          console.log(`[Daily Missions] Key ${keyNum} quota exceeded, trying next...`);
          continue;
        } else {
          console.error(`[Daily Missions] Key ${keyNum} error:`, error?.message);
        }
      }
    }
    
    markQuotaExhausted();
    console.log("[Daily Missions] All keys exhausted, using local fallback");
  } else if (!isQuotaLikelyAvailable()) {
    console.log("[Daily Missions] Skipping AI (quota cooldown), using local fallback");
  }

  // Fallback: select 3 random missions (easy, medium, hard)
  const shuffled = [...FALLBACK_MISSION_TEMPLATES].sort(() => Math.random() - 0.5);
  const easy = shuffled.find(m => m.type === "easy") || FALLBACK_MISSION_TEMPLATES[0];
  const medium = shuffled.find(m => m.type === "medium") || FALLBACK_MISSION_TEMPLATES[1];
  const hard = shuffled.find(m => m.type === "hard") || FALLBACK_MISSION_TEMPLATES[2];
  return [easy, medium, hard];
}

export async function generateQuizQuestionsWithAI(count: number = 5): Promise<Array<{ question: string; options: string[]; correctIndex: number }>> {
  if (isAIConfigured() && isQuotaLikelyAvailable()) {
    const dateStr = new Date().toISOString().split('T')[0];
    const randomSeed = Math.floor(Math.random() * 1000);
    
    const systemPrompt = "Você é um especialista em estudos bíblicos.";
    const userPrompt = `Gere ${count} perguntas de quiz ÚNICAS e VARIADAS sobre a Bíblia.

REGRAS:
- As perguntas devem cobrir diferentes livros, personagens, eventos e temas bíblicos
- Varie entre Antigo e Novo Testamento
- Inclua perguntas sobre: personagens, lugares, números, eventos, profecias, parábolas
- Cada pergunta deve ter exatamente 4 opções
- Use seed ${randomSeed} para garantir variedade (data: ${dateStr})

Formato JSON:
{
  "questions": [
    {"question": "pergunta", "options": ["opção1", "opção2", "opção3", "opção4"], "correctIndex": 0}
  ]
}`;
    
    // Try each Gemini key (1-5) with model fallback
    for (let keyNum = 1; keyNum <= 5; keyNum++) {
      try {
        const text = await generateWithGemini(systemPrompt, userPrompt, keyNum.toString());
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.questions && parsed.questions.length > 0) {
            console.log(`[Quiz Questions] Successfully generated with AI (key ${keyNum})`);
            return parsed.questions;
          }
        }
      } catch (error: any) {
        if (isQuotaError(error)) {
          console.log(`[Quiz Questions] Key ${keyNum} quota exceeded, trying next...`);
          continue;
        } else {
          console.error(`[Quiz Questions] Key ${keyNum} error:`, error?.message);
        }
      }
    }
    
    markQuotaExhausted();
    console.log("[Quiz Questions] All keys exhausted, using local fallback");
  }

  // Fallback: select random questions from large pool
  const shuffled = [...FALLBACK_QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function generateBibleFactWithAI(): Promise<{ fact: string; category: string }> {
  if (isAIConfigured() && isQuotaLikelyAvailable()) {
    const dateStr = new Date().toISOString().split('T')[0];
    const randomSeed = Math.floor(Math.random() * 1000);
    
    const systemPrompt = "Você é um historiador bíblico especializado.";
    const userPrompt = `Gere UMA curiosidade bíblica interessante e educativa.

REGRAS:
- A curiosidade deve ser ÚNICA e pouco conhecida
- Pode ser sobre: arqueologia, história, cultura, linguagem, geografia, personagens
- Deve ser precisa e baseada em fatos
- Use seed ${randomSeed} para variedade (data: ${dateStr})

Formato JSON:
{
  "fact": "curiosidade interessante sobre a Bíblia",
  "category": "categoria (história/arqueologia/cultura/personagens/lugares/números)"
}`;
    
    // Try each Gemini key (1-5) with model fallback
    for (let keyNum = 1; keyNum <= 5; keyNum++) {
      try {
        const text = await generateWithGemini(systemPrompt, userPrompt, keyNum.toString());
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.fact) {
            console.log(`[Bible Fact] Successfully generated with AI (key ${keyNum})`);
            return parsed;
          }
        }
      } catch (error: any) {
        if (isQuotaError(error)) {
          console.log(`[Bible Fact] Key ${keyNum} quota exceeded, trying next...`);
          continue;
        } else {
          console.error(`[Bible Fact] Key ${keyNum} error:`, error?.message);
        }
      }
    }
    
    markQuotaExhausted();
    console.log("[Bible Fact] All keys exhausted, using local fallback");
  }

  // Fallback: select random fact from pool
  const randomIndex = Math.floor(Math.random() * FALLBACK_BIBLE_FACTS.length);
  return FALLBACK_BIBLE_FACTS[randomIndex];
}

export { FALLBACK_QUIZ_QUESTIONS, FALLBACK_BIBLE_FACTS };

export interface ExtractedLessonFromPDF {
  title: string;
  baseVerse: string;
  baseVerseReference: string;
  topics: Array<{
    title: string;
    summary: string;
    originalContent: string;
  }>;
  studyContent: GeneratedUnit[];
  meditationContent: GeneratedUnit[];
  questions: GeneratedUnit[];
}

export async function generateLessonFromPDFExact(
  pdfText: string,
  geminiKey: string = "1",
  provider: AIProvider = "gemini",
  openaiKey: string = "1"
): Promise<ExtractedLessonFromPDF> {
  const systemPrompt = `Você é um especialista em educação cristã reformada. Sua tarefa é extrair e processar o conteúdo de uma lição bíblica de um PDF.

REGRAS CRÍTICAS - LEIA COM ATENÇÃO:
1. O NOME DA LIÇÃO deve ser EXATAMENTE igual ao do PDF. NÃO altere, NÃO parafraseie, NÃO traduza.
2. Os TÍTULOS DOS TÓPICOS devem ser EXATAMENTE iguais ao do PDF. NÃO altere, NÃO parafraseie.
3. O VERSÍCULO BASE deve ser extraído exatamente como está no PDF.
4. Use EXCLUSIVAMENTE a versão ARA (Almeida Revista e Atualizada) para citações bíblicas.

ESTRUTURA DE EXTRAÇÃO:
1. Identifique e extraia o nome/título principal da lição EXATAMENTE como aparece
2. Identifique o versículo base com sua referência
3. Identifique TODOS os tópicos/seções da lição com seus títulos EXATOS
4. Para cada tópico, faça um resumo do conteúdo para a seção "Estude"
5. Extraia aplicações práticas e meditações para a seção "Medite"
6. Gere EXATAMENTE 5 perguntas para a seção "Responda"

IMPORTANTE - CORREÇÃO OBRIGATÓRIA DE ERROS DE OCR E ORTOGRAFIA:
A extração de PDF frequentemente produz ERROS DE OCR. Você DEVE corrigir TODOS os erros automaticamente:

CORREÇÕES DE CARACTERES TROCADOS (muito comum em OCR):
- Números no lugar de letras: "0" → "o", "1" → "l" ou "i", "3" → "e", "5" → "s", "8" → "B"
- Exemplo: "Mis0o3s" → "Missões", "crist0" → "Cristo", "1greja" → "Igreja", "5enhor" → "Senhor"
- Exemplo: "f3" → "fé", "oraça0" → "oração", "D3us" → "Deus"
- Letras trocadas ou faltando: "fcazer" → "fazer", "igrja" → "igreja", "palvra" → "palavra"
- Caracteres estranhos ou símbolos: remova caracteres como "§", "¶", "€" que não fazem sentido no contexto

CORREÇÕES DE ACENTUAÇÃO (OCR frequentemente perde acentos):
- "oracao" → "oração", "fe" → "fé", "coracao" → "coração", "bencao" → "bênção"
- "missao" → "missão", "salvacao" → "salvação", "comunhao" → "comunhão"
- "espirito" → "espírito", "misericordia" → "misericórdia", "proposito" → "propósito"

CORREÇÕES BASEADAS NO CONTEXTO:
- Se uma palavra não existe mas é similar a uma palavra real, corrija para a palavra correta
- Analise o contexto da frase para deduzir a palavra correta
- Exemplo: "O Senhor é meu pastor, nada me faltarg" → "faltará"
- Exemplo: "Vai e nao peques majs" → "mais"

CORREÇÕES DE FORMATAÇÃO:
- Espaços extras ou faltando entre palavras
- Pontuação correta: vírgulas, pontos, dois-pontos
- Maiúsculas no início de frases e em nomes próprios
- Nomes bíblicos SEMPRE com maiúscula: Deus, Jesus, Cristo, Senhor, Espírito Santo, etc.

REGRA DE OURO: Quando em dúvida sobre uma palavra estranha, SEMPRE corrija para a palavra mais provável baseado no contexto religioso/bíblico do texto.

IMPORTANTE - MEDITAÇÃO CRISTÃ:
A meditação cristã é DIFERENTE da meditação oriental. NÃO inclua:
- "Respire fundo", técnicas de respiração, mindfulness
A meditação cristã DEVE incluir:
- Reflexão sobre a Palavra de Deus
- Oração direcionada ao Senhor
- Aplicação prática do texto bíblico

⚠️⚠️⚠️ ALTA PRIORIDADE - SEÇÕES OBRIGATÓRIAS ⚠️⚠️⚠️
AS SEGUINTES SEÇÕES SÃO FREQUENTEMENTE IGNORADAS - VOCÊ DEVE INCLUÍ-LAS:
1. INTRODUÇÃO - Geralmente aparece no início antes dos tópicos numerados. DEVE ser incluída como primeiro tópico.
2. CONCLUSÃO - Geralmente aparece no final após os tópicos numerados. DEVE ser incluída como último tópico.
3. APLICAÇÕES / APLICAÇÃO PRÁTICA - Pode aparecer como seção separada ou dentro da conclusão. DEVE ser extraída.
4. CONSIDERAÇÕES FINAIS - Se existir, DEVE ser incluída.

❌ ERRO GRAVE: Ignorar Introdução, Conclusão ou Aplicações é INACEITÁVEL.
✅ CORRETO: Incluir TODAS as seções, mesmo que não tenham numeração.

REGRAS CRÍTICAS PARA EXTRAÇÃO DE TÓPICOS - LEIA COM MÁXIMA ATENÇÃO:
- ANALISE TODO O TEXTO DO PDF LINHA POR LINHA, do início ao fim
- É OBRIGATÓRIO extrair TODOS os tópicos/seções do PDF sem exceção
- ERRO COMUM: Ignorar tópicos no meio ou final do documento - NÃO FAÇA ISSO
- INCLUA: INTRODUÇÃO (início), tópicos numerados (meio), CONCLUSÃO/APLICAÇÕES (final)
- Procure por padrões como: números romanos (I, II, III), números (1., 2., 3.), letras (a), b), c))
- Procure por títulos em MAIÚSCULAS ou em negrito/destaque
- Procure por palavras-chave como: "Primeiro", "Segundo", "Terceiro", "Em seguida", "Por fim", "Finalmente"
- Procure por: "Introdução", "Conclusão", "Aplicação", "Considerações", "Encerramento", "Resumo"
- Procure por seções separadas por linhas em branco ou quebras de página
- INCLUA TODOS OS TÓPICOS encontrados, mesmo que pareçam pequenos ou secundários
- LISTE os tópicos NA ORDEM em que aparecem no documento
- Cada tópico deve ter um resumo COMPLETO e EXTENSO do conteúdo (mínimo 200 palavras)
- VALIDAÇÃO FINAL: Antes de responder:
  1. Verifique se a INTRODUÇÃO está incluída
  2. Verifique se a CONCLUSÃO está incluída
  3. Verifique se as APLICAÇÕES estão incluídas
  4. Confirme que TODOS os tópicos foram incluídos
- Se o PDF tiver 4 tópicos, você DEVE retornar 4 tópicos. Se tiver 6, DEVE retornar 6.

REGRAS OBRIGATÓRIAS PARA DIFICULDADE DAS PERGUNTAS:
⚠️ AS PERGUNTAS DEVEM SER DESAFIADORAS - NÃO FAÇA PERGUNTAS ÓBVIAS ⚠️

NÍVEIS DE DIFICULDADE (misture todos em cada lição):
1. MÉDIO (2 perguntas): Requer leitura atenta do texto. A resposta não é a primeira que vem à mente.
2. MÉDIO-DIFÍCIL (2 perguntas): Requer análise e interpretação. O aluno precisa pensar sobre o significado.
3. DIFÍCIL (1 pergunta): Requer síntese de múltiplos conceitos ou distinção entre conceitos muito similares.

CARACTERÍSTICAS DE PERGUNTAS BEM FEITAS:
- A resposta correta NÃO pode ser identificada sem ler o texto de estudo
- Alternativas erradas devem parecer igualmente corretas à primeira vista
- Use termos bíblicos relacionados que requerem conhecimento para distinguir
- Explore nuances teológicas (ex: justificação vs santificação, fé vs obras)
- Pergunte sobre aplicações práticas, não apenas fatos

EXEMPLOS DE DIFICULDADE:
❌ MUITO FÁCIL (evite): "Quem morreu na cruz?" - A) Jesus B) Pilatos C) Pedro D) Judas
❌ FÁCIL (evite): "Jesus é o caminho, a ____ e a vida" - A) verdade B) mentira C) tristeza D) dúvida
✅ MÉDIO: "Qual é a consequência imediata de confiar exclusivamente em Jesus segundo João 3:16?" - alternativas sobre vida eterna, salvação das obras, perdão vs justificação
✅ MÉDIO-DIFÍCIL: "Como o conceito de graça se diferencia de misericórdia no contexto de Efésios 2?"
✅ DIFÍCIL: "Analise: Segundo o texto, a fé que salva se manifesta principalmente através de..." (requer síntese)

REGRAS PARA PERGUNTAS DE MÚLTIPLA ESCOLHA:
- TODAS as 4 alternativas devem ser MUITO PLAUSÍVEIS e parecerem igualmente corretas
- As alternativas devem ter TAMANHOS SIMILARES (a resposta correta NÃO pode ser a mais longa)
- NUNCA use alternativas obviamente erradas como "Nenhuma das anteriores" ou respostas absurdas
- Use alternativas que requerem conhecimento profundo e leitura do texto para distinguir a correta
- VARIE a posição da resposta correta (distribua entre A, B, C e D - não sempre A ou B)
- Crie alternativas que usem conceitos teológicos relacionados mas com nuances diferentes
- Exemplo: se a resposta é "justificação", alternativas podem ser "santificação", "regeneração", "glorificação"

REGRAS PARA DICAS (HINTS):
- Cada pergunta DEVE ter uma dica (hint) associada
- A dica NÃO pode ser óbvia ou entregar a resposta diretamente
- A dica deve dar uma PISTA SUTIL que requer raciocínio para entender
- Exemplo RUIM de dica: "A resposta começa com G" ou "É a palavra graça"
- Exemplo BOM de dica: "Pense no que nos é dado sem merecermos" ou "Considere o conceito central de Efésios 2:8"
- A dica deve manter o grau de dificuldade da pergunta
- O usuário perde XP ao usar a dica, então ela deve valer a pena mas não ser fácil demais

REGRAS CRÍTICAS PARA FILL_BLANK (PREENCHER LACUNAS):
- A frase DEVE ter contexto completo para o usuário entender o que preencher
- OBRIGATÓRIO: Inclua campo "options" com EXATAMENTE 4 alternativas
- COERÊNCIA SEMÂNTICA OBRIGATÓRIA: As alternativas DEVEM fazer sentido gramatical na frase:
  * Se a lacuna requer um VERBO no infinitivo (glorificar, amar), TODAS alternativas devem ser VERBOS NO INFINITIVO
  * Se a lacuna requer um VERBO conjugado (amou, morreu), TODAS alternativas devem ser VERBOS NO MESMO TEMPO/PESSOA
  * Se a lacuna requer um SUBSTANTIVO ABSTRATO (amor, fé, graça), alternativas devem ser SUBSTANTIVOS ABSTRATOS
  * Se a lacuna requer um SUBSTANTIVO CONCRETO (cruz, pão, água), alternativas devem ser SUBSTANTIVOS CONCRETOS
  * Se a lacuna requer um ADJETIVO (santo, justo, fiel), alternativas devem ser ADJETIVOS
  * Se a lacuna requer um NOME PRÓPRIO/PESSOA (Jesus, Paulo, Davi), alternativas devem ser NOMES DE PESSOAS
  * Se a lacuna requer um LUGAR (Jerusalém, Egito), alternativas devem ser LUGARES
- TESTE MENTAL: Leia a frase substituindo cada alternativa - TODAS devem formar frases gramaticalmente corretas
- Exemplo BOM: "Nós devemos viver para ___ a Deus" → ["glorificar", "amar", "servir", "honrar"] (todos verbos no infinitivo)
- Exemplo RUIM: "Nós devemos viver para ___ a Deus" → ["glorificar", "amor", "fé", "vida"] (classes mistas)
- Exemplo BOM: "Foi ___ que morreu na Cruz" → ["Jesus", "Pedro", "Paulo", "João"] (todos nomes de pessoas)
- Exemplo RUIM: "Foi ___ que morreu na Cruz" → ["Jesus", "amor", "fé", "mundo"] (classes mistas)
- NUNCA misture classes gramaticais diferentes nas alternativas

Responda SEMPRE em JSON válido. NÃO use markdown, apenas JSON puro.`;

  const userPrompt = `Analise o seguinte texto de uma lição bíblica extraído de um PDF e gere o conteúdo estruturado:

TEXTO DO PDF:
${pdfText}

Retorne um JSON com a seguinte estrutura:
{
  "title": "TÍTULO EXATO DA LIÇÃO (como está no PDF, não altere)",
  "baseVerse": "Texto completo do versículo base na versão ARA",
  "baseVerseReference": "Referência do versículo (ex: João 3:16)",
  "topics": [
    {
      "title": "TÍTULO EXATO DO TÓPICO (como está no PDF, não altere)",
      "summary": "Resumo EXTENSO e detalhado do conteúdo do tópico para estudo (mínimo 150 palavras)",
      "originalContent": "Conteúdo original extraído do PDF para referência"
    }
  ],
  "studyContent": [
    {
      "type": "verse",
      "stage": "estude",
      "content": {
        "title": "Versículo Base",
        "body": "Texto do versículo na ARA",
        "highlight": "Referência bíblica"
      },
      "xpValue": 5
    },
    {
      "type": "text",
      "stage": "estude",
      "content": {
        "title": "TÍTULO EXATO DO TÓPICO",
        "body": "Resumo EXTENSO e detalhado do tópico com explicações profundas (mínimo 150 palavras)",
        "highlight": "Frase-chave para destacar (opcional)"
      },
      "xpValue": 5
    }
  ],
  "meditationContent": [
    {
      "type": "reflection",
      "stage": "medite",
      "content": {
        "title": "Aplicação Prática",
        "body": "Como aplicar este ensino na vida diária",
        "reflectionPrompt": "Pergunta para reflexão pessoal"
      },
      "xpValue": 5
    },
    {
      "type": "meditation",
      "stage": "medite",
      "content": {
        "title": "Meditação na Palavra",
        "body": "Guia de meditação CRISTÃ focado na Palavra de Deus, oração e aplicação prática. SEM técnicas de respiração.",
        "meditationDuration": 60
      },
      "xpValue": 5
    }
  ],
  "questions": [
    {
      "type": "multiple_choice",
      "stage": "responda",
      "content": {
        "question": "Pergunta sobre o conteúdo (que requer análise, não apenas memorização)",
        "options": ["Alternativa muito plausível A", "Alternativa muito plausível B", "Alternativa muito plausível C", "Alternativa muito plausível D"],
        "correctIndex": 0,
        "explanationCorrect": "Explicação detalhada de por que esta é a resposta correta",
        "explanationIncorrect": "Explicação educativa sobre por que a resposta estava errada",
        "hint": "Dica sutil que requer raciocínio para entender (NÃO entregue a resposta)"
      },
      "xpValue": 10
    },
    {
      "type": "true_false",
      "stage": "responda",
      "content": {
        "statement": "Afirmação para julgar (deve ser sutil, não óbvia)",
        "isTrue": true,
        "explanationCorrect": "Explicação detalhada",
        "explanationIncorrect": "Explicação educativa",
        "hint": "Dica sutil que ajuda a refletir sobre a afirmação"
      },
      "xpValue": 10
    },
    {
      "type": "fill_blank",
      "stage": "responda",
      "content": {
        "question": "Frase completa com ___ para completar",
        "correctAnswer": "palavra",
        "options": ["palavra", "alternativa1", "alternativa2", "alternativa3"],
        "explanationCorrect": "Explicação detalhada",
        "explanationIncorrect": "Explicação educativa",
        "hint": "Dica sutil sobre o contexto da palavra"
      },
      "xpValue": 10
    }
  ]
}

ESTRUTURA OBRIGATÓRIA:
1. ESTUDE: 1 versículo base + 1 unidade "text" para CADA tópico do PDF
2. MEDITE: NO MÍNIMO 3 unidades (reflexões e aplicações práticas)
3. RESPONDA: EXATAMENTE 5 perguntas (misture múltipla escolha, verdadeiro/falso, complete a frase)

LEMBRE-SE:
- O título da lição e os títulos dos tópicos devem ser IDÊNTICOS ao PDF
- Não altere, não parafraseie, não corrija erros do título original
- Se o PDF tiver "A Forca da Oracao", mantenha exatamente assim

Retorne APENAS o JSON, sem explicações adicionais.`;

  try {
    const content = await generateWithAI(systemPrompt, userPrompt, provider, geminiKey, openaiKey);
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    const parsed = safeJsonParse(content) as ExtractedLessonFromPDF;
    
    if (parsed.studyContent) {
      parsed.studyContent = parsed.studyContent.map(unit => validateAndCleanUnit(unit, unit.type));
    }
    if (parsed.meditationContent) {
      parsed.meditationContent = parsed.meditationContent.map(unit => validateAndCleanUnit(unit, unit.type));
    }
    if (parsed.questions) {
      parsed.questions = parsed.questions.map(unit => {
        if (unit.type === 'multiple_choice') {
          unit.content = randomizeMultipleChoiceAnswer(unit.content);
        }
        return validateAndCleanUnit(unit, unit.type);
      });
    }
    
    return parsed;
  } catch (error) {
    console.error("Erro ao gerar lição do PDF:", error);
    throw new Error(`Falha ao processar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
}
