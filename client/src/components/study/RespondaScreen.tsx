import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  X,
  Flame,
  Star,
  Clock,
  Lightbulb,
  BookOpen,
  Leaf,
  HelpCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
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
  onAnswer: (questionIndex: number, answer: any, isCorrect: boolean) => void;
  onComplete: () => void;
  onClose: () => void;
  onProgress?: (current: number, total: number) => void;
}

function Timer({ isActive, questionIndex, onTimeUp }: { isActive: boolean; questionIndex: number; onTimeUp?: () => void }) {
  const [seconds, setSeconds] = useState(30);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    setSeconds(30);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [questionIndex]);
  
  useEffect(() => {
    if (isActive && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            onTimeUp?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, seconds, onTimeUp]);
  
  const progress = (seconds / 30) * 100;
  const isLow = seconds <= 10;
  
  return (
    <div className="flex items-center gap-2">
      <Clock className={cn("h-4 w-4", isLow ? "text-red-500 animate-pulse" : "text-orange-600 dark:text-orange-400")} />
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all",
            isLow ? "bg-red-500" : "bg-orange-600"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className={cn("text-sm font-medium", isLow ? "text-red-500" : "text-muted-foreground")}>
        {seconds}s
      </span>
    </div>
  );
}

function MultipleChoiceCard({
  question,
  options,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect
}: {
  question: string;
  options: string[];
  selectedIndex: number | null;
  correctIndex: number;
  showResult: boolean;
  onSelect: (index: number) => void;
}) {
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-800/50 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <p className="text-foreground font-medium leading-relaxed">{question}</p>
          </div>
        </div>
      </Card>
      
      <div className="space-y-2">
        {options.map((option, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = idx === correctIndex;
          const showCorrect = showResult && isCorrect;
          const showIncorrect = showResult && isSelected && !isCorrect;
          
          return (
            <button
              key={idx}
              onClick={() => !showResult && onSelect(idx)}
              disabled={showResult}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                showCorrect && "border-green-500 bg-green-50 dark:bg-green-900/30",
                showIncorrect && "border-red-500 bg-red-50 dark:bg-red-900/30",
                isSelected && !showResult && "border-orange-500 bg-orange-50 dark:bg-orange-900/30",
                !isSelected && !showResult && "border-muted hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-900/10",
                !showResult && "cursor-pointer"
              )}
              data-testid={`option-${optionLabels[idx]}`}
            >
              <span className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0",
                showCorrect && "bg-green-500 text-white",
                showIncorrect && "bg-red-500 text-white",
                isSelected && !showResult && "bg-orange-500 text-white",
                !isSelected && !showResult && "bg-muted text-muted-foreground"
              )}>
                {showCorrect ? <CheckCircle className="h-4 w-4" /> : 
                 showIncorrect ? <XCircle className="h-4 w-4" /> : 
                 optionLabels[idx]}
              </span>
              <span className={cn(
                "flex-1",
                (showCorrect || (isSelected && !showResult)) && "font-medium"
              )}>
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TrueFalseCard({
  statement,
  selectedAnswer,
  correctAnswer,
  showResult,
  onSelect
}: {
  statement: string;
  selectedAnswer: boolean | null;
  correctAnswer: boolean;
  showResult: boolean;
  onSelect: (answer: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-800/50 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <p className="text-foreground font-medium leading-relaxed">{statement}</p>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-2 gap-3">
        {[true, false].map((answer) => {
          const isSelected = selectedAnswer === answer;
          const isCorrect = answer === correctAnswer;
          const showCorrect = showResult && isCorrect;
          const showIncorrect = showResult && isSelected && !isCorrect;
          
          return (
            <button
              key={String(answer)}
              onClick={() => !showResult && onSelect(answer)}
              disabled={showResult}
              className={cn(
                "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all font-medium",
                showCorrect && "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                showIncorrect && "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300",
                isSelected && !showResult && "border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
                !isSelected && !showResult && "border-muted hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-900/10",
                !showResult && "cursor-pointer"
              )}
              data-testid={`option-${answer ? 'true' : 'false'}`}
            >
              {showCorrect ? <CheckCircle className="h-5 w-5" /> : 
               showIncorrect ? <XCircle className="h-5 w-5" /> : null}
              <span>{answer ? "Verdadeiro" : "Falso"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RespondaScreen({ 
  lessonTitle, 
  questions: rawQuestions, 
  streak,
  onAnswer,
  onComplete, 
  onClose,
  onProgress 
}: RespondaScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [points, setPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  
  const questions = rawQuestions.length > 0 ? rawQuestions : [
    { type: "multiple_choice" as const, question: "Pergunta nao disponivel.", options: ["Opcao A"], correctIndex: 0 }
  ];
  
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;
  
  useEffect(() => {
    if (onProgress) {
      onProgress(currentIndex + 1, totalQuestions);
    }
  }, [currentIndex, totalQuestions, onProgress]);
  
  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setShowHint(false);
    setTimerActive(true);
  }, [currentIndex]);
  
  const checkAnswer = () => {
    if (selectedAnswer === null) return;
    
    setTimerActive(false);
    setShowResult(true);
    
    let isCorrect = false;
    if (currentQuestion.type === "multiple_choice") {
      isCorrect = selectedAnswer === currentQuestion.correctIndex;
    } else if (currentQuestion.type === "true_false") {
      isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    }
    
    if (isCorrect) {
      setPoints(prev => prev + 10);
      setCorrectCount(prev => prev + 1);
    }
    
    onAnswer(currentIndex, selectedAnswer, isCorrect);
  };
  
  const goNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };
  
  const goPrev = () => {
    if (!isFirst) {
      setCurrentIndex(prev => prev - 1);
    }
  };
  
  const handleTimeUp = () => {
    if (!showResult && selectedAnswer === null) {
      setTimerActive(false);
      setShowResult(true);
      onAnswer(currentIndex, null, false);
    }
  };
  
  const handleTimeoutContinue = () => {
    goNext();
  };
  
  return (
    <div className="flex flex-col h-full bg-background" data-testid="responda-screen">
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white hover:bg-white/20"
            data-testid="button-close-responda"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            <span className="font-bold uppercase tracking-wide">Responda</span>
          </div>
          <div className="w-9" />
        </div>
        <p className="text-center text-white/90 text-sm">
          Quiz Interativo
        </p>
      </div>
      
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-foreground">{streak}</span>
            <span className="text-xs text-muted-foreground">Sequencia</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium text-foreground">{points}</span>
            <span className="text-xs text-muted-foreground">Pontos</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Pergunta {currentIndex + 1} de {totalQuestions}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-center py-2 border-b bg-muted/10">
        <Timer isActive={timerActive && !showResult} questionIndex={currentIndex} onTimeUp={handleTimeUp} />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentQuestion.type === 'multiple_choice' && (
                <MultipleChoiceCard
                  question={currentQuestion.question}
                  options={currentQuestion.options || []}
                  selectedIndex={selectedAnswer}
                  correctIndex={currentQuestion.correctIndex || 0}
                  showResult={showResult}
                  onSelect={setSelectedAnswer}
                />
              )}
              
              {currentQuestion.type === 'true_false' && (
                <TrueFalseCard
                  statement={currentQuestion.question}
                  selectedAnswer={selectedAnswer}
                  correctAnswer={currentQuestion.correctAnswer as boolean}
                  showResult={showResult}
                  onSelect={setSelectedAnswer}
                />
              )}
              
              {showHint && currentQuestion.hint && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <Card className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        {currentQuestion.hint}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              )}
              
              {showResult && currentQuestion.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <Card className="p-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {currentQuestion.explanation}
                    </p>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      <div className="border-t bg-background p-4">
        <div className="flex items-center justify-between max-w-lg mx-auto gap-3">
          {!showResult && currentQuestion.hint && (
            <Button
              variant="outline"
              onClick={() => setShowHint(!showHint)}
              className="border-yellow-300 text-yellow-700 dark:text-yellow-300"
              data-testid="button-hint"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Dica
            </Button>
          )}
          
          {showResult && !isLast && (
            <div className="flex-1" />
          )}
          
          {!showResult ? (
            <Button
              onClick={checkAnswer}
              disabled={selectedAnswer === null}
              className={cn(
                "flex-1 bg-orange-600 hover:bg-orange-700",
                selectedAnswer === null && "opacity-50"
              )}
              data-testid="button-confirm"
            >
              Confirmar
            </Button>
          ) : (
            <Button
              onClick={goNext}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              data-testid="button-next-responda"
            >
              {isLast ? "Concluir Quiz" : "Proxima"}
              {!isLast && <ChevronRight className="h-4 w-4 ml-2" />}
            </Button>
          )}
        </div>
      </div>
      
      <div className="border-t bg-muted/50 px-4 py-3">
        <div className="flex justify-center gap-8 max-w-lg mx-auto">
          <button 
            className="flex flex-col items-center gap-1 text-muted-foreground opacity-50"
            data-testid="tab-estude-responda"
          >
            <div className="h-1.5 w-12 bg-transparent rounded-full mb-1" />
            <BookOpen className="h-5 w-5" />
            <span className="text-xs font-medium">Estude</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 text-muted-foreground opacity-50"
            data-testid="tab-medite-responda"
          >
            <div className="h-1.5 w-12 bg-transparent rounded-full mb-1" />
            <Leaf className="h-5 w-5" />
            <span className="text-xs font-medium">Medite</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 text-orange-600 dark:text-orange-400"
            data-testid="tab-responda-active"
          >
            <div className="h-1.5 w-12 bg-orange-600 rounded-full mb-1" />
            <HelpCircle className="h-5 w-5" />
            <span className="text-xs font-medium">Responda</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export type { QuizQuestion };
