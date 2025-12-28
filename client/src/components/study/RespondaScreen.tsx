import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, ChevronRight, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AccessibilityToolbar } from "./AccessibilityToolbar";
import { useSoundEffects } from "@/hooks/use-sound-effects";

function formatQuestionWithBlank(question: string): string {
  const escaped = question
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return escaped.replace(/_{3,}/g, '<span class="inline-block w-20 h-6 mx-1 border-2 border-dashed border-primary rounded align-middle"></span>');
}

function buildFullTextForSpeech(question: QuizQuestion, fillBlankOptions?: string[]): string {
  let text = question.question.replace(/_{3,}/g, "lacuna");
  
  if (question.type === "multiple_choice" && question.options) {
    text += ". Alternativas: ";
    text += question.options.map((opt, i) => `${String.fromCharCode(65 + i)}: ${opt}`).join(". ");
  } else if (question.type === "true_false") {
    text += ". Alternativas: Verdadeiro ou Falso.";
  } else if (question.type === "fill_blank" && fillBlankOptions) {
    text += ". Opções para preencher: ";
    text += fillBlankOptions.join(", ");
  }
  
  return text;
}

interface QuizQuestion {
  type: "multiple_choice" | "true_false" | "fill_blank";
  question: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string | boolean;
  hint?: string;
  explanation?: string;
  category?: string;
}

interface RespondaScreenProps {
  lessonTitle: string;
  questions: QuizQuestion[];
  streak: number;
  hearts?: number;
  maxHearts?: number;
  initialQuestionIndex?: number;
  initialCorrectCount?: number;
  onAnswer: (questionIndex: number, answer: any, isCorrect: boolean) => void;
  onComplete: (correctCount: number, totalQuestions: number) => void;
  onClose: () => void;
  onQuestionChange?: (currentIndex: number) => void;
  showHearts?: boolean;
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

function HeartsDisplay({ hearts, maxHearts }: { hearts: number; maxHearts: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5" data-testid="hearts-display">
      {Array.from({ length: maxHearts }).map((_, i) => (
        <Heart
          key={i}
          className={cn(
            "h-6 w-6 transition-all",
            i < hearts 
              ? "text-red-500 fill-red-500" 
              : "text-white/30"
          )}
        />
      ))}
    </div>
  );
}

export function RespondaScreen({
  lessonTitle,
  questions,
  streak,
  hearts = 5,
  maxHearts = 5,
  initialQuestionIndex = 0,
  initialCorrectCount = 0,
  onAnswer,
  onComplete,
  onClose,
  onQuestionChange,
  showHearts = true
}: RespondaScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(initialQuestionIndex);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<boolean | null>(null);
  const [fillBlankAnswer, setFillBlankAnswer] = useState("");
  const [fillBlankOptions, setFillBlankOptions] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(initialCorrectCount);

  const { playCorrect, playWrong } = useSoundEffects();

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const totalQuestions = questions.length;

  useEffect(() => {
    onQuestionChange?.(currentIndex);
    setSelectedAnswer(null);
    setTrueFalseAnswer(null);
    setFillBlankAnswer("");
    setShowResult(false);

    if (currentQuestion?.type === "fill_blank") {
      const hasAIOptions = currentQuestion.options && Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0;
      
      if (hasAIOptions && currentQuestion.options!.length >= 4) {
        setFillBlankOptions([...currentQuestion.options!].sort(() => Math.random() - 0.5));
      } else if (hasAIOptions && currentQuestion.options!.length >= 2) {
        const existing = currentQuestion.options!.slice();
        const answer = String(currentQuestion.correctAnswer || existing[0] || "");
        const generated = generateFillBlankOptions(answer, currentQuestion.question);
        const merged = Array.from(new Set([...existing, ...generated])).slice(0, 4);
        setFillBlankOptions(merged.sort(() => Math.random() - 0.5));
      } else {
        const answer = String(currentQuestion.correctAnswer || "");
        if (answer && answer !== "undefined" && answer !== "") {
          setFillBlankOptions(generateFillBlankOptions(answer, currentQuestion.question));
        } else {
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
        const rawCorrect = currentQuestion.correctAnswer;
        const isTrue = typeof rawCorrect === 'boolean' ? rawCorrect : 
                      (typeof rawCorrect === 'string' ? (rawCorrect.toLowerCase().trim() === 'true' || rawCorrect.toLowerCase().trim() === 'verdadeiro') : 
                      !!rawCorrect);
        
        isCorrect = trueFalseAnswer === isTrue;
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
      playCorrect();
    } else {
      playWrong();
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

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Nenhuma questão disponível</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
      <div className="flex flex-col">
        {/* Header Gradient Section */}
        <div 
          className="relative px-6 pt-12 pb-16 rounded-b-[40px] shadow-lg overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #d946ef 100%)'
          }}
        >
          <div className="max-w-md mx-auto relative z-10 flex flex-col items-center gap-6">
            <div className="flex items-center justify-center gap-2">
              <span className="text-white/90 text-sm font-medium uppercase tracking-wider">Questão</span>
              <span className="text-white text-3xl font-black">
                {currentIndex + 1} <span className="text-white/60 text-xl font-medium">/ {totalQuestions}</span>
              </span>
            </div>
            
            {showHearts && <HeartsDisplay hearts={hearts} maxHearts={maxHearts} />}
            
            {/* ProgressBar */}
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mt-2">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                className="h-full bg-white rounded-full"
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-md mx-auto w-full px-4 -mt-10 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-2xl rounded-[32px] bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md">
                      <span className="text-xl font-bold">?</span>
                    </div>
                    <span className="text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest text-xs">
                      {currentQuestion.category || "Estudo"}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-8 leading-tight">
                    {currentQuestion.type === "fill_blank" ? (
                      <span dangerouslySetInnerHTML={{ __html: formatQuestionWithBlank(currentQuestion.question) }} />
                    ) : currentQuestion.question}
                  </h3>

                  {/* Feedback Explanation - Only if answered */}
                  {showResult && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mb-8 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800"
                    >
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                        {currentQuestion.explanation || "Resposta enviada para análise."}
                      </p>
                    </motion.div>
                  )}
                </div>
              </Card>

              {/* Options Section */}
              <div className="mt-8 space-y-4">
                {currentQuestion.type === "multiple_choice" && currentQuestion.options?.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === currentQuestion.correctIndex;
                  const showCorrect = showResult && isCorrect;
                  const showIncorrect = showResult && isSelected && !isCorrect;

                  return (
                    <motion.button
                      key={idx}
                      whileHover={!showResult ? { scale: 1.02 } : {}}
                      whileTap={!showResult ? { scale: 0.98 } : {}}
                      onClick={() => !showResult && setSelectedAnswer(idx)}
                      disabled={showResult}
                      className={cn(
                        "w-full p-5 rounded-[24px] text-left font-bold transition-all border-2 flex items-center gap-4",
                        !showResult && isSelected ? "border-purple-500 bg-purple-50 dark:bg-purple-900/10" : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900",
                        showCorrect && "border-green-500 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400",
                        showIncorrect && "border-red-500 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center border-2 font-black",
                        !showResult && isSelected ? "border-purple-500 bg-purple-500 text-white" : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-400",
                        showCorrect && "border-green-500 bg-green-500 text-white",
                        showIncorrect && "border-red-500 bg-red-500 text-white"
                      )}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="flex-1">{option}</span>
                    </motion.button>
                  );
                })}

                {currentQuestion.type === "true_false" && [true, false].map((value) => {
                  const isSelected = trueFalseAnswer === value;
                  const rawCorrect = currentQuestion.correctAnswer;
                  const isTrue = typeof rawCorrect === 'boolean' ? rawCorrect : 
                                (typeof rawCorrect === 'string' ? (rawCorrect.toLowerCase().trim() === 'true' || rawCorrect.toLowerCase().trim() === 'verdadeiro') : 
                                !!rawCorrect);
                  const isCorrect = value === isTrue;
                  const showCorrect = showResult && isCorrect;
                  const showIncorrect = showResult && isSelected && !isCorrect;

                  return (
                    <motion.button
                      key={String(value)}
                      whileHover={!showResult ? { scale: 1.02 } : {}}
                      whileTap={!showResult ? { scale: 0.98 } : {}}
                      onClick={() => !showResult && setTrueFalseAnswer(value)}
                      disabled={showResult}
                      className={cn(
                        "w-full p-5 rounded-[24px] text-left font-bold transition-all border-2 flex items-center gap-4",
                        !showResult && isSelected ? "border-purple-500 bg-purple-50 dark:bg-purple-900/10" : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900",
                        showCorrect && "border-green-500 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400",
                        showIncorrect && "border-red-500 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center border-2 font-black",
                        !showResult && isSelected ? "border-purple-500 bg-purple-500 text-white" : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-400",
                        showCorrect && "border-green-500 bg-green-500 text-white",
                        showIncorrect && "border-red-500 bg-red-500 text-white"
                      )}>
                        {value ? 'V' : 'F'}
                      </div>
                      <span className="flex-1">{value ? "Verdadeiro" : "Falso"}</span>
                    </motion.button>
                  );
                })}

                {currentQuestion.type === "fill_blank" && (
                  <div className="grid grid-cols-2 gap-4">
                    {fillBlankOptions.map((option, idx) => {
                      const isSelected = fillBlankAnswer === option;
                      const isCorrect = option.toLowerCase().trim() === String(currentQuestion.correctAnswer).toLowerCase().trim();
                      const showCorrect = showResult && isCorrect;
                      const showIncorrect = showResult && isSelected && !isCorrect;

                      return (
                        <motion.button
                          key={idx}
                          whileHover={!showResult ? { scale: 1.02 } : {}}
                          whileTap={!showResult ? { scale: 0.98 } : {}}
                          onClick={() => !showResult && setFillBlankAnswer(option)}
                          disabled={showResult}
                          className={cn(
                            "p-4 rounded-[20px] font-bold transition-all border-2 text-center",
                            !showResult && isSelected ? "border-purple-500 bg-purple-50 dark:bg-purple-900/10" : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900",
                            showCorrect && "border-green-500 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400",
                            showIncorrect && "border-red-500 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400"
                          )}
                        >
                          {option}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Action Bar (Fixed at Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 px-6 py-6 pb-10 border-t border-zinc-100 dark:border-zinc-800 z-50">
        <div className="max-w-md mx-auto">
          {!showResult ? (
            <Button
              onClick={checkAnswer}
              disabled={!hasAnswer}
              className="w-full h-16 rounded-[24px] bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white text-lg font-black shadow-xl shadow-purple-500/25 border-0"
              data-testid="button-confirm"
            >
              Confirmar Resposta
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="w-full h-16 rounded-[24px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-lg font-black shadow-xl shadow-purple-500/25 border-0"
              data-testid="button-next-question"
            >
              {isLastQuestion ? "Completar Lição" : "Próxima Pergunta"}
              <ChevronRight className="h-6 w-6 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
