import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    question?: string;
    options?: string[];
    correctAnswer?: string | number | boolean;
    explanation?: string;
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

export async function generateStudyContentFromText(
  text: string,
  weekNumber: number,
  year: number
): Promise<GeneratedWeekContent> {
  const systemPrompt = `Voce e um especialista em educacao crista e criacao de conteudo educacional interativo no estilo Duolingo.
Sua tarefa e transformar o texto fornecido em um conteudo de estudo semanal completo para jovens da UMP (Uniao da Mocidade Presbiteriana).

O conteudo deve ser:
- Biblicamente fundamentado
- Engajante e interativo
- Adequado para jovens (18-35 anos)
- Com exercicios variados e gamificados
- Em portugues brasileiro

Responda SEMPRE em JSON valido com a estrutura exata especificada.`;

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
            // Para "text": { "title": "...", "text": "..." }
            // Para "multiple_choice": { "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..." }
            // Para "true_false": { "question": "...", "correctAnswer": true/false, "explanation": "..." }
            // Para "fill_blank": { "question": "Complete: ___ e o caminho...", "correctAnswer": "Jesus", "explanation": "..." }
            // Para "meditation": { "title": "...", "meditationDuration": 60, "meditationGuide": "..." }
            // Para "reflection": { "title": "...", "reflectionPrompt": "..." }
            // Para "verse": { "verseReference": "Joao 3:16", "verseText": "...", "reflectionPrompt": "..." }
          },
          "xpValue": 2-10
        }
      ]
    }
  ]
}

Regras:
1. Crie 3-5 licoes variadas
2. Cada licao deve ter 4-8 unidades
3. Inicie com uma licao "intro" e termine com "review"
4. Inclua pelo menos uma licao de "meditation" ou exercicios de reflexao
5. Varie os tipos de exercicios para manter o engajamento
6. Use versiculos biblicos relevantes ao tema
7. As perguntas devem testar compreensao, nao decoreba
8. O conteudo deve ser edificante e encorajador`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const content = response.choices[0].message.content;
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
Responda SEMPRE em JSON valido.`;

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

Varie os tipos de exercicios e mantenha as perguntas educativas e engajantes.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4096,
    });

    const content = response.choices[0].message.content;
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
Responda SEMPRE em JSON valido.`;

  const userPrompt = `Baseado no seguinte texto, crie ${count} perguntas de reflexao para discussao em grupo:

${text}

Retorne um JSON: { "questions": ["pergunta1", "pergunta2", ...] }

As perguntas devem:
1. Promover autoavaliacao espiritual
2. Conectar o texto com a vida pratica
3. Ser abertas (sem resposta certa/errada)
4. Encorajar compartilhamento de experiencias`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const content = response.choices[0].message.content;
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
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { 
          role: "system", 
          content: "Voce e um resumidor de textos cristao. Crie resumos claros e edificantes em portugues brasileiro." 
        },
        { 
          role: "user", 
          content: `Resuma o seguinte texto em 2-3 paragrafos, mantendo os pontos principais e a mensagem espiritual:\n\n${text}` 
        }
      ],
      max_completion_tokens: 1024,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Erro ao resumir texto:", error);
    throw new Error(`Falha ao resumir: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
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
        unit.content = { text: "Conteudo nao disponivel" };
      }
      if (!unit.xpValue || unit.xpValue < 1) {
        unit.xpValue = 2;
      }
      return unit;
    });

    return lesson;
  });

  return content;
}

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
