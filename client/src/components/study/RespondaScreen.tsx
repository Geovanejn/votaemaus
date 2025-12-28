import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, Heart, Settings, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useSoundEffects } from "@/hooks/use-sound-effects";

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
  onAnswer: (questionIndex: number, answer: any, isCorrect: boolean) => void;
  onComplete: (correctCount: number, totalQuestions: number) => void;
  onClose: () => void;
  onQuestionChange?: (currentIndex: number) => void;
  showHearts?: boolean;
}

export function RespondaScreen({
  questions,
  hearts = 5,
  maxHearts = 5,
  initialQuestionIndex = 0,
  onAnswer,
  onComplete,
  onClose,
  onQuestionChange,
  showHearts = true
}: RespondaScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(initialQuestionIndex);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const { playCorrect, playWrong } = useSoundEffects();
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  useEffect(() => {
    onQuestionChange?.(currentIndex);
    setSelectedAnswer(null);
    setShowResult(false);
  }, [currentIndex]);

  const checkAnswer = () => {
    let isCorrect = false;
    if (currentQuestion.type === "multiple_choice") {
      isCorrect = selectedAnswer === currentQuestion.correctIndex;
    }
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      playCorrect();
    } else {
      playWrong();
    }

    onAnswer(currentIndex, selectedAnswer, isCorrect);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(correctCount, totalQuestions);
    }
  };

  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FC] dark:bg-zinc-950">
      <div 
        className="relative px-6 pt-6 pb-8 rounded-b-[24px] overflow-hidden shadow-sm"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #f472b6 100%)' }}
      >
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-4">
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="text-center">
              <p className="text-white/80 text-[9px] font-bold uppercase tracking-wider">Questão</p>
              <p className="text-white text-xl font-black">{currentIndex + 1} / {totalQuestions}</p>
            </div>
            <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Settings className="h-4 w-4" />
            </button>
          </div>

          {showHearts && (
            <div className="flex gap-1 mb-4">
              {Array.from({ length: maxHearts }).map((_, i) => (
                <Heart key={i} className={cn("h-5 w-5", i < hearts ? "text-[#FF4B4B] fill-[#FF4B4B]" : "text-white/30")} />
              ))}
            </div>
          )}

          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 -mt-4 flex-1 flex flex-col">
        <Card className="border-0 shadow-sm rounded-[20px] bg-white dark:bg-zinc-900 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white font-bold text-xs">?</div>
            <span className="text-[#7c3aed] text-[9px] font-black uppercase tracking-widest">{currentQuestion.category || "HISTÓRIA"}</span>
          </div>
          <h3 className="text-[17px] font-bold text-[#2D3142] dark:text-zinc-100 leading-snug">
            {currentQuestion.question}
          </h3>
        </Card>

        <div className="space-y-2 mb-20">
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
                  "w-full p-3 rounded-[16px] text-left transition-all border-2 flex items-center gap-3 min-h-[56px]",
                  !showResult && isSelected ? "border-[#7c3aed] bg-white" : "border-white bg-white shadow-sm",
                  showCorrect && "border-[#22C55E] bg-[#F0FDF4]",
                  showIncorrect && "border-[#EF4444] bg-[#FEF2F2]"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-black text-xs border-2",
                  !showResult && isSelected ? "bg-[#7c3aed] text-white border-[#7c3aed]" : "bg-[#F8F9FC] text-[#2D3142] border-[#F0F2F5]",
                  showCorrect && "bg-[#22C55E] text-white border-[#22C55E]",
                  showIncorrect && "bg-[#EF4444] text-white border-[#EF4444]"
                )}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="text-[#4B5563] font-bold text-[14px] leading-tight">{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-transparent pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          {!showResult ? (
            <Button
              onClick={checkAnswer}
              disabled={selectedAnswer === null}
              className="w-full h-[52px] rounded-[16px] bg-gradient-to-r from-[#7c3aed] to-[#f472b6] text-white text-base font-bold shadow-md border-0"
            >
              Confirmar Resposta
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="w-full h-[52px] rounded-[16px] bg-[#7c3aed] text-white text-base font-bold shadow-md border-0"
            >
              {currentIndex === totalQuestions - 1 ? "Finalizar" : "Continuar"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
