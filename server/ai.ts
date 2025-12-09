import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
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

async function generateWithGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  
  const result = await model.generateContent({
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
  year: number
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
            // Para "multiple_choice" (stage: "responda"): { "question": "Pergunta clara sobre o conteúdo", "options": ["Opção A", "Opção B", "Opção C", "Opção D"], "correctIndex": 0, "explanationCorrect": "Explicação quando acertar", "explanationIncorrect": "Explicação quando errar", "hint": "Dica opcional" }
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
- Unidades "reflection" com APLICAÇÕES PRÁTICAS
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
    const content = await generateWithGemini(systemPrompt, userPrompt);
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    const parsed = JSON.parse(content) as GeneratedWeekContent;
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

    const parsed = JSON.parse(content);
    return parsed.exercises || [];
  } catch (error) {
    console.error("Erro ao gerar exercicios:", error);
    throw new Error(`Falha ao gerar exercicios: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
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

    const parsed = JSON.parse(content);
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
  year: number
): Promise<GeneratedWeekContent> {
  // Clean the PDF text first
  const cleanedText = await extractTextFromPDFContent(pdfText);
  
  // Use the same generation function
  return generateStudyContentFromText(cleanedText, weekNumber, year);
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
    const estudeUnits = lesson.units.filter(u => u.stage === "estude");
    const respondaUnits = lesson.units.filter(u => u.stage === "responda" && 
      (u.type === "multiple_choice" || u.type === "true_false" || u.type === "fill_blank"));
    
    // Log warnings if content doesn't meet requirements
    if (estudeUnits.length < 6) {
      console.warn(`[AI Validation] Lesson "${lesson.title}" has only ${estudeUnits.length} study screens (minimum 6 required)`);
    }
    if (respondaUnits.length < 5) {
      console.warn(`[AI Validation] Lesson "${lesson.title}" has only ${respondaUnits.length} questions (minimum 5 required)`);
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

// NOTA: Este projeto usa EXCLUSIVAMENTE Gemini AI (Google)
// OpenAI foi completamente removido do projeto
