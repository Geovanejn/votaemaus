import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AccessibilityToolbar } from "./AccessibilityToolbar";

function formatQuestionWithBlank(question: string): string {
  const escaped = question
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return escaped.replace(/_{3,}/g, '<span class="inline-block w-20 h-6 mx-1 border-2 border-dashed border-primary rounded align-middle"></span>');
}

interface QuizQuestion {
  type: "multiple_choice" | "true_false" | "fill_blank";
  question: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string | boolean;
  hint?: string;
  explanation?: string;
}

interface RespondaScreenProps {
  lessonTitle: string;
  questions: QuizQuestion[];
  streak: number;
  initialQuestionIndex?: number;
  initialCorrectCount?: number;
  onAnswer: (questionIndex: number, answer: any, isCorrect: boolean) => void;
  onComplete: (correctCount: number, totalQuestions: number) => void;
  onClose: () => void;
  onQuestionChange?: (currentIndex: number) => void;
}

function generateFillBlankOptions(correctAnswer: string, question?: string): string[] {
  const verbosInfinitivo = ["amar", "salvar", "redimir", "perdoar", "libertar", "servir", "glorificar", "adorar", "orar", "crer", "seguir", "obedecer", "santificar", "curar", "buscar", "viver"];
  const substantivosAbstratos = ["amor", "fé", "esperança", "graça", "paz", "alegria", "salvação", "vida", "verdade", "luz", "caminho", "palavra", "oração", "louvor", "glória", "justiça", "misericórdia", "bem"];
  const pessoas = ["Cristo", "Jesus", "Deus", "Moisés", "Abraão", "Davi", "Paulo", "Pedro", "João", "Maria", "Salomão", "Elias", "Isaías", "Daniel"];
  const adjetivos = ["santo", "fiel", "justo", "eterno", "perfeito", "bom", "grande", "verdadeiro", "digno", "forte", "sábio"];
  
  const answerLower = correctAnswer.toLowerCase().trim();
  let candidates: string[] = [];
  
  const hasVerbContext = question && (
    question.includes("para ___") || 
    question.includes("devemos ___") || 
    question.includes("podemos ___") ||
    question.match(/\b(deve|pode|quer|precisa|vai)\s+___/)
  );
  
  const hasAdjectiveContext = question && (
    question.includes("é ___") || 
    question.includes("foi ___") ||
    question.includes("será ___") ||
    question.match(/\b(são|eram|serão)\s+___/)
  );
  
  if (hasVerbContext || verbosInfinitivo.some(v => v.toLowerCase() === answerLower)) {
    candidates = verbosInfinitivo.filter(v => v.toLowerCase() !== answerLower);
  } else if (hasAdjectiveContext || adjetivos.some(a => a.toLowerCase() === answerLower)) {
    candidates = adjetivos.filter(a => a.toLowerCase() !== answerLower);
  } else if (pessoas.some(p => p.toLowerCase() === answerLower)) {
    candidates = pessoas.filter(p => p.toLowerCase() !== answerLower);
  } else {
    candidates = substantivosAbstratos.filter(s => s.toLowerCase() !== answerLower);
  }
  
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  const options = [correctAnswer, ...shuffled.slice(0, 3)];
  return options.sort(() => Math.random() - 0.5);
}

export function RespondaScreen({
  lessonTitle,
  questions,
  streak,
  initialQuestionIndex = 0,
  initialCorrectCount = 0,
  onAnswer,
  onComplete,
  onClose,
  onQuestionChange
}: RespondaScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(initialQuestionIndex);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<boolean | null>(null);
  const [fillBlankAnswer, setFillBlankAnswer] = useState("");
  const [fillBlankOptions, setFillBlankOptions] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  // Initialize correctCount from persisted value (for resumed sessions)
  const [correctCount, setCorrectCount] = useState(initialCorrectCount);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const totalQuestions = questions.length;

  useEffect(() => {
    onQuestionChange?.(currentIndex);
    // Reset state for new question
    setSelectedAnswer(null);
    setTrueFalseAnswer(null);
    setFillBlankAnswer("");
    setShowResult(false);

    if (currentQuestion?.type === "fill_blank") {
      const hasAIOptions = currentQuestion.options && Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0;
      
      if (hasAIOptions && currentQuestion.options!.length >= 4) {
        setFillBlankOptions([...currentQuestion.options!].sort(() => Math.random() - 0.5));
      } else if (hasAIOptions && currentQuestion.options!.length >= 2) {
        console.warn(`[fill_blank] Question has ${currentQuestion.options!.length} options, expected 4. Using available options.`);
        const existing = currentQuestion.options!.slice();
        const answer = String(currentQuestion.correctAnswer || existing[0] || "");
        const generated = generateFillBlankOptions(answer, currentQuestion.question);
        const merged = Array.from(new Set([...existing, ...generated])).slice(0, 4);
        setFillBlankOptions(merged.sort(() => Math.random() - 0.5));
      } else {
        const answer = String(currentQuestion.correctAnswer || "");
        if (answer && answer !== "undefined" && answer !== "") {
          console.warn(`[fill_blank] No AI options provided, generating fallback for: "${answer}"`);
          setFillBlankOptions(generateFillBlankOptions(answer, currentQuestion.question));
        } else {
          console.error(`[fill_blank] Invalid question: no options and no correctAnswer`);
          setFillBlankOptions([]);
        }
      }
    }
  }, [currentIndex]);

  const hasAnswer = useMemo(() => {
    switch (currentQuestion?.type) {
      case "multiple_choice":
        return selectedAnswer !== null;
      case "true_false":
        return trueFalseAnswer !== null;
      case "fill_blank":
        return fillBlankAnswer.trim() !== "";
      default:
        return false;
    }
  }, [currentQuestion?.type, selectedAnswer, trueFalseAnswer, fillBlankAnswer]);

  const checkAnswer = () => {
    let isCorrect = false;
    let answer: any;

    switch (currentQuestion.type) {
      case "multiple_choice": {
        answer = selectedAnswer;
        const correctIdx = Number(currentQuestion.correctIndex);
        const selectedIdx = Number(selectedAnswer);
        isCorrect = selectedIdx === correctIdx;
        break;
      }
      case "true_false": {
        answer = trueFalseAnswer;
        // Use EXATAMENTE a mesma lógica do TrueFalseExercise
        const rawCorrect = currentQuestion.correctAnswer;
        const isTrue = typeof rawCorrect === 'boolean' ? rawCorrect : 
                      (typeof rawCorrect === 'string' ? (rawCorrect.toLowerCase().trim() === 'true' || rawCorrect.toLowerCase().trim() === 'verdadeiro') : 
                      !!rawCorrect);
        
        isCorrect = trueFalseAnswer === isTrue;

        // Logs de debug detalhados para monitorar a validação
        console.group("%c[DEBUG RespondaScreen] Validação Verdadeiro/Falso", "color: #ff9800; font-weight: bold;");
        console.log("Pergunta:", currentQuestion.question);
        console.log("Resposta do Banco (raw):", rawCorrect);
        console.log("Tipo do dado do Banco:", typeof rawCorrect);
        console.log("Interpretado como (isTrue):", isTrue);
        console.log("Resposta do Usuário:", trueFalseAnswer);
        console.log("Resultado da Validação (isCorrect):", isCorrect ? "CORRETO ✅" : "ERRADO ❌");
        console.groupEnd();

        break;
      }
      case "fill_blank": {
        answer = fillBlankAnswer;
        isCorrect = fillBlankAnswer.toLowerCase().trim() === String(currentQuestion.correctAnswer).toLowerCase().trim();
        break;
      }
    }

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    onAnswer(currentIndex, answer, isCorrect);
    setShowResult(true);
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(correctCount, totalQuestions);
    }
  };

  const isAnswerCorrect = (): boolean => {
    switch (currentQuestion?.type) {
      case "multiple_choice": {
        const correctIdx = Number(currentQuestion.correctIndex);
        const selectedIdx = Number(selectedAnswer);
        return selectedIdx === correctIdx;
      }
      case "true_false": {
        const rawCorrect = currentQuestion.correctAnswer;
        const isTrue = typeof rawCorrect === 'boolean' ? rawCorrect : 
                      (typeof rawCorrect === 'string' ? (rawCorrect.toLowerCase().trim() === 'true' || rawCorrect.toLowerCase().trim() === 'verdadeiro') : 
                      !!rawCorrect);
        return trueFalseAnswer === isTrue;
      }
      case "fill_blank":
        return fillBlankAnswer.toLowerCase().trim() === String(currentQuestion.correctAnswer).toLowerCase().trim();
      default:
        return false;
    }
  };

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Nenhuma questão disponível</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4">
      <div className="max-w-2xl mx-auto w-full flex flex-col">
        {/* Header com acessibilidade */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <AccessibilityToolbar textContent={currentQuestion?.question || ""} />
        </div>

        {/* Barra de progresso */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Questão {currentIndex + 1} de {totalQuestions}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentIndex + 1) / totalQuestions) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Questão */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 flex flex-col">
              {/* Texto da questão */}
              <div className="mb-4">
                {currentQuestion.type === "fill_blank" ? (
                  <p 
                    className="text-lg font-semibold mb-4"
                    style={{ fontSize: 'var(--study-font-size, 16px)' }}
                    dangerouslySetInnerHTML={{ __html: formatQuestionWithBlank(currentQuestion.question) }}
                  />
                ) : (
                  <p className="text-lg font-semibold mb-4" style={{ fontSize: 'var(--study-font-size, 16px)' }}>
                    {currentQuestion.question}
                  </p>
                )}

                {/* Opções */}
                <div className="space-y-3">
                  {currentQuestion.type === "multiple_choice" && (
                    <div className="space-y-2">
                      {currentQuestion.options?.map((option, idx) => {
                        const isSelected = selectedAnswer === idx;
                        const isCorrect = idx === currentQuestion.correctIndex;
                        const showCorrect = showResult && isCorrect;
                        const showIncorrect = showResult && isSelected && !isCorrect;

                        return (
                          <button
                            key={idx}
                            onClick={() => !showResult && setSelectedAnswer(idx)}
                            disabled={showResult}
                            className={cn(
                              "w-full p-3 rounded-lg text-left font-medium transition-all border-2",
                              !showResult && isSelected && "border-primary bg-primary/10",
                              !showResult && !isSelected && "border-muted hover:border-primary/50",
                              showCorrect && "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
                              showIncorrect && "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
                            )}
                            data-testid={`button-option-${idx}`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              {showResult && (
                                <>
                                  {isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                  {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                                </>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQuestion.type === "true_false" && (
                    <div className="flex gap-3">
                      {[true, false].map((value) => {
                        const isSelected = trueFalseAnswer === value;
                        const rawCorrect = currentQuestion.correctAnswer;
                        const isTrue = typeof rawCorrect === 'boolean' ? rawCorrect : 
                                      (typeof rawCorrect === 'string' ? (rawCorrect.toLowerCase().trim() === 'true' || rawCorrect.toLowerCase().trim() === 'verdadeiro') : 
                                      !!rawCorrect);
                        const isCorrect = value === isTrue;
                        const showCorrect = showResult && isCorrect;
                        const showIncorrect = showResult && isSelected && !isCorrect;

                        return (
                          <button
                            key={String(value)}
                            onClick={() => !showResult && setTrueFalseAnswer(value)}
                            disabled={showResult}
                            className={cn(
                              "flex-1 p-3 rounded-lg font-medium transition-all border-2",
                              !showResult && isSelected && "border-primary bg-primary/10",
                              !showResult && !isSelected && "border-muted hover:border-primary/50",
                              showCorrect && "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
                              showIncorrect && "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
                            )}
                            data-testid={`button-${value}`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{value ? "Verdadeiro" : "Falso"}</span>
                              {showResult && (
                                <>
                                  {isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                  {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                                </>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQuestion.type === "fill_blank" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {fillBlankOptions.map((option, idx) => {
                          const isSelected = fillBlankAnswer === option;
                          const isCorrect = option.toLowerCase().trim() === String(currentQuestion.correctAnswer).toLowerCase().trim();
                          const showCorrect = showResult && isCorrect;
                          const showIncorrect = showResult && isSelected && !isCorrect;

                          return (
                            <button
                              key={idx}
                              onClick={() => !showResult && setFillBlankAnswer(option)}
                              disabled={showResult}
                              className={cn(
                                "p-3 rounded-lg font-medium transition-all border-2 text-sm",
                                !showResult && isSelected && "border-primary bg-primary/10",
                                !showResult && !isSelected && "border-muted hover:border-primary/50",
                                showCorrect && "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
                                showIncorrect && "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
                              )}
                              data-testid={`button-fill-option-${idx}`}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <span>{option}</span>
                                {showResult && (
                                  <>
                                    {isCorrect && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                    {isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-500" />}
                                  </>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Explicação */}
                {showResult && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      <strong>Explicação:</strong> {currentQuestion.explanation || "Resposta enviada para análise."}
                    </p>
                  </div>
                )}
              </div>

              {/* Botão confirmar */}
              {!showResult && (
                <Button
                  onClick={checkAnswer}
                  disabled={!hasAnswer}
                  className="w-full"
                  data-testid="button-confirm"
                >
                  Confirmar
                </Button>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navegação - apenas indicador de progresso e botão próxima (sem voltar) */}
        <div className="flex gap-3 mt-4 items-center justify-center">
          {/* Progress dots (apenas indicativo, não clicável) */}
          <div className="flex gap-2 flex-1 justify-center">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === currentIndex ? "w-6 bg-primary" : i < currentIndex ? "w-2 bg-primary/50" : "w-2 bg-muted"
                )}
                data-testid={`dot-${i}`}
              />
            ))}
          </div>

          {showResult && (
            isLastQuestion ? (
              <Button
                onClick={handleNext}
                data-testid="button-responda-complete"
              >
                Completar
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                data-testid="button-next-question"
              >
                Proxima
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
