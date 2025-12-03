import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

async function generateWithGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });

  const response = result.response;
  const text = response.text();
  
  // Extract JSON from response (Gemini may wrap it in markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  return jsonMatch[1]?.trim() || text.trim();
}

export async function generateStudyContentFromText(
  text: string,
  weekNumber: number,
  year: number
): Promise<GeneratedWeekContent> {
  const systemPrompt = `Voce e um especialista em educacao crista e criacao de conteudo educacional interativo no estilo DeoGlory/Duolingo.
Sua tarefa e transformar o texto fornecido em um conteudo de estudo semanal completo para jovens da UMP (Uniao da Mocidade Presbiteriana).

O Sistema DeoGlory segue uma estrutura pedagogica especifica:
1. PRIMEIRO: Apresentar o TEXTO DE LEITURA (conteudo principal para estudo)
2. SEGUNDO: Apresentar o VERSICULO BASE (texto biblico central da licao)
3. TERCEIRO: Apresentar TITULO e TOPICOS principais
4. QUARTO: Somente DEPOIS apresentar os DESAFIOS (perguntas e exercicios)

O conteudo deve ser:
- Biblicamente fundamentado com versiculos relevantes
- Engajante e interativo
- Adequado para jovens (18-35 anos)
- Com exercicios variados e gamificados
- Em portugues brasileiro

Responda SEMPRE em JSON valido com a estrutura exata especificada. NAO use markdown, apenas JSON puro.`;

  const userPrompt = `Transforme o seguinte texto em um conteudo de estudo semanal (Semana ${weekNumber} de ${year}).

TEXTO BASE:
${text}

Gere um JSON com a seguinte estrutura:
{
  "weekTitle": "Titulo da semana baseado no tema principal",
  "weekDescription": "Descricao breve do conteudo da semana",
  "lessons": [
    {
      "title": "Titulo da licao",
      "description": "Descricao breve",
      "type": "intro|study|meditation|challenge|review",
      "xpReward": 10-50,
      "estimatedMinutes": 5-15,
      "units": [
        {
          "type": "text|multiple_choice|true_false|fill_blank|meditation|reflection|verse",
          "content": {
            // Para "text": { "title": "Titulo do Topico", "body": "Conteudo principal de leitura. Deve ser rico e educativo.", "highlight": "Frase chave para destacar (opcional)" }
            // Para "verse": { "title": "Versiculo Base", "body": "Texto completo do versiculo", "highlight": "Referencia: Joao 3:16" }
            // Para "multiple_choice": { "question": "Pergunta clara sobre o conteudo", "options": ["Opcao A", "Opcao B", "Opcao C", "Opcao D"], "correctIndex": 0, "explanationCorrect": "Explicacao quando acertar", "explanationIncorrect": "Explicacao quando errar", "hint": "Dica opcional" }
            // Para "true_false": { "statement": "Afirmacao para julgar verdadeiro ou falso", "isTrue": true, "explanationCorrect": "Explicacao quando acertar", "explanationIncorrect": "Explicacao quando errar" }
            // Para "fill_blank": { "question": "Complete: ___ e o caminho, a verdade e a vida.", "correctAnswer": "Jesus", "explanationCorrect": "Explicacao quando acertar", "explanationIncorrect": "Explicacao quando errar" }
            // Para "meditation": { "title": "Titulo da Meditacao", "body": "Guia de meditacao detalhado", "meditationDuration": 60 }
            // Para "reflection": { "title": "Reflexao Pessoal", "body": "Contexto para reflexao", "reflectionPrompt": "Pergunta para reflexao pessoal" }
          },
          "xpValue": 2-10
        }
      ]
    }
  ]
}

ESTRUTURA OBRIGATORIA DAS LICOES (Sistema DeoGlory):
Cada licao DEVE seguir esta ordem de unidades:
1. PRIMEIRO: Uma unidade "text" com o TEXTO DE LEITURA principal (conteudo educativo sobre o tema)
2. SEGUNDO: Uma unidade "verse" com o VERSICULO BASE da licao
3. TERCEIRO: Uma unidade "text" com TOPICOS e SUBTOPICOS do estudo
4. DEPOIS: Unidades de exercicios (multiple_choice, true_false, fill_blank)
5. FINAL: Uma unidade "reflection" ou "meditation" para conclusao

Regras Adicionais:
1. Crie 3-5 licoes variadas
2. Cada licao deve ter 5-8 unidades seguindo a estrutura acima
3. Inicie com uma licao "intro" e termine com "review"
4. O texto de leitura deve ser substantivo (minimo 100 palavras)
5. Inclua 2-4 perguntas de multipla escolha ou verdadeiro/falso por licao
6. Use versiculos biblicos relevantes ao tema em cada licao
7. As perguntas devem testar compreensao do texto de leitura
8. O conteudo deve ser edificante e encorajador

Retorne APENAS o JSON, sem explicacoes adicionais.`;

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
      if (!content.correctAnswer) {
        content.correctAnswer = "";
      }
      if (!content.question) {
        content.question = "Complete a frase: ___";
      }
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

    lesson.units = lesson.units.map(unit => {
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
      
      return normalizeUnitContent(unit);
    });

    return lesson;
  });

  return content;
}

export function isAIConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

// Keep backward compatibility
export function isOpenAIConfigured(): boolean {
  return isAIConfigured();
}
