import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

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

// Get Gemini model with specific key
export function getGeminiModel(keyNumber: string = "1"): GenerativeModel {
  const apiKey = getGeminiApiKey(keyNumber);
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

// Initialize default Gemini AI (backward compatibility)
const genAI = new GoogleGenerativeAI(getGeminiApiKey("1"));
// Using gemini-2.5-flash as specified by user
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
  const selectedModel = getGeminiModel(geminiKey);
  
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
  
  // Extract JSON from response using robust parsing
  return extractJsonFromResponse(text);
}

export async function generateStudyContentFromText(
  text: string,
  weekNumber: number,
  year: number,
  geminiKey: string = "1"
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

REGRAS CRÍTICAS PARA EXERCÍCIOS DE MÚLTIPLA ESCOLHA:
- TODAS as 4 alternativas devem ser PLAUSÍVEIS e parecer corretas à primeira vista
- As alternativas devem ter TAMANHOS SIMILARES (não coloque uma resposta muito maior ou menor que as outras)
- NUNCA use alternativas obviamente erradas como "Ignorar a Bíblia", "Desistir de tudo", "Nada disso"
- As alternativas incorretas devem ser SUTILMENTE erradas, exigindo compreensão real do texto
- Use conceitos bíblicos similares que poderiam ser confundidos (ex: fé vs obras, graça vs lei)
- Evite padrões como "Todas as alternativas", "Nenhuma das alternativas"
- A resposta correta NÃO deve ser sempre a mais longa ou mais completa
- Embaralhe a posição da resposta correta (não sempre A ou B)

EXEMPLOS DE ALTERNATIVAS BEM FEITAS:
❌ RUIM: "Qual é o fruto do Espírito?" - A) Amor B) Ódio C) Inveja D) Maldade
✅ BOM: "Qual é o fruto do Espírito?" - A) Alegria, paz e paciência B) Justiça, poder e glória C) Amor, fé e esperança D) Sabedoria, força e coragem

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
            // Para "fill_blank" (stage: "responda"): IMPORTANTE - A frase DEVE ter contexto completo! Exemplos:
            //   - { "question": "Jesus disse: Eu sou o ___, a verdade e a vida.", "correctAnswer": "caminho", "explanationCorrect": "João 14:6 - Jesus se apresenta como o único caminho ao Pai", "explanationIncorrect": "A resposta correta é 'caminho'. Releia João 14:6" }
            //   - { "question": "Segundo Romanos 8:28, Deus coopera em todas as coisas para o ___ daqueles que O amam.", "correctAnswer": "bem", "explanationCorrect": "Deus trabalha para nosso benefício!", "explanationIncorrect": "A resposta é 'bem'. Romanos 8:28 nos ensina sobre a providência divina." }
            //   - { "question": "O fruto do Espírito inclui amor, alegria, paz, ___ e bondade.", "correctAnswer": "paciência", "explanationCorrect": "Gálatas 5:22 lista os frutos do Espírito", "explanationIncorrect": "A resposta é 'paciência'. Veja Gálatas 5:22." }
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
5. O texto de leitura deve ser substantivo (mínimo 100 palavras por tópico)
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
    const content = await generateWithGemini(systemPrompt, userPrompt, geminiKey);
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
Responda SEMPRE em JSON valido. NAO use markdown, apenas JSON puro.`;

  const userPrompt = `Crie ${count} exercicios variados sobre o topico: "${topic}"

Retorne um JSON com a estrutura:
{
  "exercises": [
    {
      "type": "multiple_choice|true_false|fill_blank|reflection",
      "content": {
        "question": "...",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": 0,
        "explanation": "..."
      },
      "xpValue": 5
    }
  ]
}

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
IMPORTANTE: Para perguntas de multipla escolha, VARIE a posicao da resposta correta entre A, B, C e D (nao coloque sempre na mesma posicao).`;

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
  geminiKey: string = "1"
): Promise<GeneratedWeekContent> {
  // Clean the PDF text first
  const cleanedText = await extractTextFromPDFContent(pdfText);
  
  // Use the same generation function with selected Gemini key
  return generateStudyContentFromText(cleanedText, weekNumber, year, geminiKey);
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

export async function generateRecoveryVersesWithAI(count: number = 5): Promise<Array<{ verse: string; reference: string; reflection: string }> | null> {
  const { getRecoveryVerses } = await import("./bible-api.js");
  
  try {
    const bibleApiResult = await getRecoveryVerses(count);
    if (bibleApiResult && bibleApiResult.length > 0) {
      console.log(`[BibleAPI] ${bibleApiResult.length} recovery verses fetched successfully from ABíbliaDigital`);
      return bibleApiResult;
    }
  } catch (error) {
    console.warn("[BibleAPI] Failed to fetch recovery verses, falling back to Gemini:", error);
  }

  if (!isAIConfigured()) {
    console.log("[AI] Gemini not configured and Bible API failed");
    return null;
  }

  try {
    const prompt = `Você é um conselheiro espiritual experiente. Gere ${count} versículos bíblicos de conforto e recuperação para pessoas que estão passando por momentos difíceis.

Cada versículo deve:
- Ser um versículo real da Bíblia na versão ARA (Almeida Revista e Atualizada)
- Trazer conforto, paz e esperança
- Ser apropriado para momentos de dificuldade ou desânimo
- Incluir uma breve reflexão de como aplicar na vida
- Use APENAS texto da versão ARA

Responda APENAS em formato JSON:
{
  "verses": [
    {
      "verse": "Texto completo do versículo na versão ARA",
      "reference": "Livro Capítulo:Versículo (ARA)",
      "reflection": "Breve reflexão de aplicação (1-2 frases)"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[AI] Could not extract JSON from recovery verses response");
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.verses;
  } catch (error) {
    console.error("[AI] Error generating recovery verses:", error);
    return null;
  }
}

export async function generateDailyMissionsWithAI(): Promise<Array<{ title: string; description: string; xpReward: number; type: string }> | null> {
  if (!isAIConfigured()) {
    console.log("[AI] Gemini not configured, cannot generate daily missions");
    return null;
  }

  try {
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const today = new Date();
    const dayName = dayNames[today.getDay()];
    
    const prompt = `Você é um mentor espiritual. Crie 3 missões diárias para ${dayName} que incentivem o crescimento espiritual e prática da fé.

As missões devem:
- Ser práticas e alcançáveis em um dia
- Variar em dificuldade (fácil, média, desafiadora)
- Incluir ações como: leitura bíblica, oração, atos de bondade, reflexão, gratidão
- Ter recompensas de XP proporcionais (10 para fácil, 25 para média, 50 para desafiadora)

Responda APENAS em formato JSON:
{
  "missions": [
    {
      "title": "Título curto da missão",
      "description": "Descrição clara do que fazer",
      "xpReward": 10,
      "type": "easy"
    },
    {
      "title": "Título curto da missão",
      "description": "Descrição clara do que fazer",
      "xpReward": 25,
      "type": "medium"
    },
    {
      "title": "Título curto da missão",
      "description": "Descrição clara do que fazer",
      "xpReward": 50,
      "type": "hard"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[AI] Could not extract JSON from daily missions response");
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.missions;
  } catch (error) {
    console.error("[AI] Error generating daily missions:", error);
    return null;
  }
}

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
  geminiKey: string = "1"
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

IMPORTANTE - ORTOGRAFIA E ACENTUAÇÃO:
- Use SEMPRE português brasileiro correto com acentuação apropriada.
- Use "é", "á", "ã", "ç", "ê", "í", "ó", "ú" corretamente.

IMPORTANTE - MEDITAÇÃO CRISTÃ:
A meditação cristã é DIFERENTE da meditação oriental. NÃO inclua:
- "Respire fundo", técnicas de respiração, mindfulness
A meditação cristã DEVE incluir:
- Reflexão sobre a Palavra de Deus
- Oração direcionada ao Senhor
- Aplicação prática do texto bíblico

REGRAS CRÍTICAS PARA EXTRAÇÃO DE TÓPICOS:
- ANALISE TODO O TEXTO DO PDF COM ATENÇÃO para não perder nenhum tópico
- Procure por padrões como: números romanos (I, II, III), números (1., 2., 3.), letras (a), b), c))
- Procure por títulos em MAIÚSCULAS ou em negrito/destaque
- Procure por palavras-chave como: "Primeiro", "Segundo", "Terceiro", "Em seguida", "Por fim"
- Procure por seções separadas por linhas em branco ou quebras de página
- INCLUA TODOS OS TÓPICOS encontrados, mesmo que pareçam pequenos
- Cada tópico deve ter um resumo COMPLETO do conteúdo (mínimo 150 palavras)

REGRAS PARA PERGUNTAS DE MÚLTIPLA ESCOLHA:
- TODAS as 4 alternativas devem ser MUITO PLAUSÍVEIS e parecerem corretas
- As alternativas devem ter TAMANHOS SIMILARES
- NUNCA use alternativas obviamente erradas como "Nenhuma das anteriores" ou respostas absurdas
- Use alternativas que requerem conhecimento profundo para distinguir a correta
- VARIE a posição da resposta correta (distribua entre A, B, C e D)
- Crie alternativas que usem conceitos relacionados mas com nuances diferentes
- Exemplo: se a resposta é "graça", alternativas podem ser "misericórdia", "amor", "perdão"

REGRAS PARA DICAS (HINTS):
- Cada pergunta DEVE ter uma dica (hint) associada
- A dica NÃO pode ser óbvia ou entregar a resposta diretamente
- A dica deve dar uma PISTA SUTIL que requer raciocínio para entender
- Exemplo RUIM de dica: "A resposta começa com G" ou "É a palavra graça"
- Exemplo BOM de dica: "Pense no que nos é dado sem merecermos" ou "Considere o conceito central de Efésios 2:8"
- A dica deve manter o grau de dificuldade da pergunta
- O usuário perde XP ao usar a dica, então ela deve valer a pena mas não ser fácil demais

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
      "summary": "Resumo do conteúdo do tópico para estudo (mínimo 100 palavras)",
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
        "body": "Resumo explicativo do tópico (mínimo 100 palavras)",
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
    const content = await generateWithGemini(systemPrompt, userPrompt, geminiKey);
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
