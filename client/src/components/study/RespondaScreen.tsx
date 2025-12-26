import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  onAnswer: (questionIndex: number, answer: any, isCorrect: boolean) => void;
  onComplete: (correctCount: number, totalQuestions: number) => void;
  onClose: () => void;
  onQuestionChange?: (currentIndex: number) => void;
}

function generateFillBlankOptions(correctAnswer: string): string[] {
  const optionsByType: Record<string, string[]> = {
    noun: ["amor", "fé", "esperança", "graça", "paz", "alegria", "salvação", "vida", "verdade", "luz", "caminho", "palavra", "oração", "louvor", "glória"],
    person: ["Cristo", "Jesus", "Deus", "Moisés", "Abraão", "Davi", "Paulo", "Pedro", "João", "Maria", "Salomão", "Elias", "Isaías", "Daniel"],
    place: ["céu", "terra", "Jerusalém", "Israel", "Egito", "Babilônia", "Galileia", "Judeia", "Samaria", "Éden"]
  };

  const distractors = (optionsByType.noun || [])
    .filter(d => d.toLowerCase() !== correctAnswer.toLowerCase())
    .sort(() => Math.random() - 0.5);

  const options = [correctAnswer, ...distractors.slice(0, 3)];
  return options.sort(() => Math.random() - 0.5);
}

export function RespondaScreen({
  lessonTitle,
  questions,
  streak,
  initialQuestionIndex = 0,
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
  const [correctCount, setCorrectCount] = useState(0);

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

    // Generate fill blank options if needed
    if (currentQuestion?.type === "fill_blank") {
      const answer = String(currentQuestion.correctAnswer || "");
      if (answer && answer !== "undefined" && answer !== "") {
        setFillBlankOptions(generateFillBlankOptions(answer));
      } else {
        // Fallback: generate empty options array
        setFillBlankOptions([]);
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
        // Ensure both are numbers for comparison
        const correctIdx = Number(currentQuestion.correctIndex);
        const selectedIdx = Number(selectedAnswer);
        isCorrect = selectedIdx === correctIdx;
        
        // Debug logging
        console.log(`[RespondaScreen Check] Answer check for: "${currentQuestion.question?.substring(0, 40)}..."`, {
          selectedAnswer: selectedIdx,
          selectedAnswerType: typeof selectedIdx,
          correctIdx,
          correctIdxType: typeof correctIdx,
          isCorrect,
          correctOption: currentQuestion.options?.[correctIdx],
          selectedOption: currentQuestion.options?.[selectedIdx]
        });
        break;
      }
      case "true_false": {
        answer = trueFalseAnswer;
        
        const rawCorrect = currentQuestion.correctAnswer;
        
        // Normalização robusta baseada estritamente no correctAnswer
        let correctBool = false;
        if (typeof rawCorrect === 'boolean') {
          correctBool = rawCorrect;
        } else if (typeof rawCorrect === 'string') {
          const lower = rawCorrect.toLowerCase().trim();
          correctBool = lower === 'true' || lower === 'verdadeiro' || lower === 'v' || lower === 'sim' || lower === 'yes';
        } else if (typeof rawCorrect === 'number') {
          correctBool = rawCorrect === 1;
        }
        
        // Verifica se a resposta do usuário é igual à resposta correta tratada
        isCorrect = trueFalseAnswer === correctBool;
        
        // Detailed debug logging with visual separation for the browser console
        console.group("%c[RespondaScreen DEBUG: Verdadeiro/Falso]", "color: #f59e0b; font-weight: bold; font-size: 12px;");
        console.log("%cPergunta:", "font-weight: bold;", currentQuestion.question);
        console.log("%cDados do Banco (correctAnswer):", "font-weight: bold;", rawCorrect);
        console.log("%cProcessamento:", "font-weight: bold;", {
          "Resolvido como Correto": correctBool,
          "Resposta do Usuário": trueFalseAnswer,
          "Resultado Final": isCorrect ? "CORRETO ✅" : "ERRADO ❌"
        });
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
      // correctCount already includes this answer, no need to add again
      onComplete(correctCount, totalQuestions);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
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
        let correctBool = false;
        if (typeof rawCorrect === 'boolean') {
          correctBool = rawCorrect;
        } else if (typeof rawCorrect === 'string') {
          const lower = rawCorrect.toLowerCase().trim();
          correctBool = lower === 'true' || lower === 'verdadeiro' || lower === 'v' || lower === 'sim' || lower === 'yes';
        } else if (typeof rawCorrect === 'number') {
          correctBool = rawCorrect === 1;
        }
        return trueFalseAnswer === correctBool;
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
    <div className="flex flex-col min-h-screen p-4">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        {/* Título */}
        <h2 className="text-2xl font-bold mb-2">{lessonTitle}</h2>

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
            className="flex-1"
          >
            <Card className="p-6 h-full flex flex-col">
              {/* Texto da questão */}
              <div className="mb-6 flex-1">
                <p className="text-lg font-semibold mb-4">
                  {currentQuestion.question}
                </p>

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
                        // Convert correctAnswer to boolean safely
                        const rawCorrect = currentQuestion.correctAnswer;
                        let correctBool = false;
                        if (typeof rawCorrect === 'boolean') {
                          correctBool = rawCorrect;
                        } else if (typeof rawCorrect === 'string') {
                          const lower = rawCorrect.toLowerCase().trim();
                          correctBool = lower === 'true' || lower === 'verdadeiro' || lower === 'v' || lower === 'sim' || lower === 'yes';
                        } else if (typeof rawCorrect === 'number') {
                          correctBool = rawCorrect === 1;
                        }
                        const isCorrect = value === correctBool;
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

        {/* Navegação */}
        <div className="flex gap-3 mt-6 items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            size="icon"
            data-testid="button-prev-question"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex gap-2">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === currentIndex ? "w-6 bg-primary" : "w-2 bg-muted"
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
                className="flex-1 ml-2"
              >
                Completar
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                data-testid="button-next-question"
              >
                Próxima
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
