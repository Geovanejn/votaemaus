import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, Heart, Settings, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { useAccessibility } from "@/hooks/use-accessibility";
import { Volume2, Type } from "lucide-react";

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
  const { fontSize, increaseFontSize, speak, isSpeaking } = useAccessibility();

  const { playCorrect, playWrong } = useSoundEffects();
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const currentOptions = currentQuestion?.options && currentQuestion.options.length > 0 
    ? currentQuestion.options 
    : (currentQuestion?.type === "true_false" 
        ? ["Falso", "Verdadeiro"] 
        : (currentQuestion?.type === "fill_blank" && currentQuestion.correctAnswer 
            ? [
                String(currentQuestion.correctAnswer),
                "Renovar",
                "Seguir",
                "Praticar"
              ] 
            : []));

  useEffect(() => {
    onQuestionChange?.(currentIndex);
    setSelectedAnswer(null);
    setShowResult(false);
  }, [currentIndex, onQuestionChange]);

  useEffect(() => {
    if (!currentQuestion) return;
    
    if (currentQuestion.type === "true_false" && (!currentQuestion.options || currentQuestion.options.length === 0)) {
      currentQuestion.options = ["Falso", "Verdadeiro"];
    }
  }, [currentQuestion, currentIndex]);

  const checkAnswer = () => {
    const isCorrect = currentQuestion.type === "multiple_choice" 
      ? selectedAnswer === currentQuestion.correctIndex
      : currentQuestion.type === "true_false"
        ? (selectedAnswer === 1) === (String(currentQuestion.correctAnswer).toLowerCase() === "true" || currentQuestion.correctAnswer === true)
        : String(currentOptions[selectedAnswer as number]).trim().toLowerCase() === String(currentQuestion.correctAnswer).trim().toLowerCase();
    
    onAnswer(currentIndex, selectedAnswer, isCorrect);
    
    setShowResult(true);
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      playCorrect();
      
      setTimeout(() => {
        handleNext();
      }, 1500);
    } else {
      playWrong();
      setTimeout(() => {
        setShowResult(false);
        setSelectedAnswer(null);
        if (currentIndex < totalQuestions - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          onComplete(correctCount, totalQuestions);
        }
      }, 1500);
    }
  };

  const handleNext = () => {
    // Correctly pass the updated count to onComplete
    const finalCorrectCount = correctCount; 
    // Wait, if it was correct, it was already incremented in setCorrectCount(prev => prev + 1)
    // But since state is async, we should use a local variable or functional update
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Use a trick to get the most recent count
      setCorrectCount(current => {
        onComplete(current, totalQuestions);
        return current;
      });
    }
  };

  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FC] dark:bg-zinc-950">
      <div 
        className="relative px-6 pt-4 pb-6 rounded-b-[24px] overflow-hidden shadow-sm"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #f472b6 100%)' }}
      >
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-3">
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
            <div className="flex gap-1 mb-3">
              {Array.from({ length: maxHearts }).map((_, i) => (
                <Heart key={i} className={cn("h-4 w-4", i < hearts ? "text-[#FF4B4B] fill-[#FF4B4B]" : "text-white/30")} />
              ))}
            </div>
          )}

          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 -mt-3 flex-1 flex flex-col pb-6">
        <Card className="border-0 shadow-sm rounded-[20px] bg-white dark:bg-zinc-900 p-5 mb-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white font-bold text-xs">?</div>
              <span className="text-[#7c3aed] text-[9px] font-black uppercase tracking-widest">Responda</span>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={() => increaseFontSize()} className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <Type className="h-4 w-4 text-zinc-500" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => speak(currentQuestion.question)} 
                className={cn(
                  "h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                  isSpeaking && "bg-purple-100 dark:bg-purple-900/40 text-purple-600 shadow-inner"
                )}
              >
                <Volume2 className={cn("h-4 w-4 text-zinc-500", isSpeaking && "text-purple-600")} />
              </Button>
            </div>
          </div>
          <h3 className="font-bold text-[#2D3142] dark:text-zinc-100 leading-snug"
              style={{ fontSize: `${fontSize}px` }}>
            {currentQuestion.type === "fill_blank" ? (
              <span className="inline">
                {(currentQuestion.question || "").split(/_{2,}|\[\.{3}\]/).map((part, i, arr) => (
                  <span key={`${currentIndex}-part-${i}`} className="inline">
                    {part}
                    {i < arr.length - 1 && (
                      <span className={cn(
                        "inline-flex items-center justify-center min-w-[36px] h-[22px] px-2 border-2 rounded-md transition-all text-[10px] font-bold mx-1 align-middle",
                        selectedAnswer !== null 
                          ? "border-[#7c3aed] bg-[#7c3aed]/10 text-[#7c3aed] shadow-sm" 
                          : "border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                      )}>
                        {selectedAnswer !== null ? currentOptions[selectedAnswer] : ""}
                      </span>
                    )}
                  </span>
                ))}
              </span>
            ) : (
              currentQuestion.question
            )}
          </h3>
        </Card>

        <div className={cn(
          "mb-8",
          currentQuestion.type === "true_false" ? "grid grid-cols-2 gap-4" : "space-y-2"
        )}>
          {currentOptions.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isThisOptionCorrect = currentQuestion.type === "multiple_choice" 
              ? idx === currentQuestion.correctIndex
              : currentQuestion.type === "true_false"
                ? (idx === 1) === (String(currentQuestion.correctAnswer).toLowerCase() === "true" || currentQuestion.correctAnswer === true)
                : String(option).trim().toLowerCase() === String(currentQuestion.correctAnswer).trim().toLowerCase();
            
            const showCorrect = showResult && isThisOptionCorrect;
            const showIncorrect = showResult && isSelected && !isThisOptionCorrect;
            
            // Critical fix: Ensure feedback classes are applied consistently for ALL types
            const feedbackClasses = showCorrect 
              ? "border-[#22C55E] bg-[#F0FDF4] dark:bg-[#064E3B]/20 text-[#166534] dark:text-[#4ADE80]" 
              : showIncorrect 
                ? "border-[#EF4444] bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 text-[#991B1B] dark:text-[#FCA5A5]"
                : (!showResult && isSelected) 
                  ? "border-[#7c3aed] bg-[#7c3aed]/5 text-[#7c3aed]" 
                  : "border-white dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm text-[#4B5563] dark:text-zinc-300";

            return (
              <button
                key={`${currentIndex}-${idx}`}
                onClick={() => !showResult && setSelectedAnswer(idx)}
                disabled={showResult}
                className={cn(
                  "p-3 rounded-[16px] text-left transition-all border-2 flex items-center gap-3 min-h-[52px]",
                  currentQuestion.type === "true_false" ? "flex-col justify-center text-center py-6" : "w-full",
                  feedbackClasses
                )}
              >
                {(currentQuestion.type === "multiple_choice" || currentQuestion.type === "fill_blank") && (
                  <div className={cn(
                    "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-black text-xs border-2",
                    showCorrect
                      ? "bg-[#22C55E] text-white border-[#22C55E]"
                      : showIncorrect
                        ? "bg-[#EF4444] text-white border-[#EF4444]"
                        : (!showResult && isSelected)
                          ? "bg-[#7c3aed] text-white border-[#7c3aed]"
                          : "bg-[#F8F9FC] dark:bg-zinc-800 text-[#2D3142] dark:text-zinc-100 border-[#F0F2F5] dark:border-zinc-700"
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                )}
                <span className={cn(
                  "font-bold text-[14px] leading-tight",
                  currentQuestion.type === "true_false" ? "text-lg" : "text-[#4B5563]"
                )}>
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
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
