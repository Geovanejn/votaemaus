import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  MoreVertical,
  Flame,
  Star,
  Clock,
  Lightbulb,
  BookOpen,
  Heart,
  HelpCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
  Check,
  X,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSounds } from "@/hooks/use-sounds";

interface QuizQuestion {
  type: "multiple_choice" | "true_false" | "fill_blank";
  question: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string | boolean;
  hint?: string;
  explanation?: string;
  category?: string;
  points?: number;
  verseReference?: string;
}

interface RespondaScreenProps {
  lessonTitle: string;
  questions: QuizQuestion[];
  streak: number;
  onAnswer: (questionIndex: number, answer: any, isCorrect: boolean) => void;
  onComplete: () => void;
  onClose: () => void;
  onProgress?: (current: number, total: number) => void;
  onSwitchTab?: (tab: "estude" | "medite" | "responda") => void;
}

function detectAnswerType(answer: string): string {
  const versePattern = /^\d+:\d+$/;
  if (versePattern.test(answer)) return "verse_reference";
  
  const numberPattern = /^\d+$/;
  if (numberPattern.test(answer)) return "number";
  
  const adjectives = ["santo", "justo", "eterno", "divino", "celestial", "perfeito", "fiel", "verdadeiro", "puro", "bom", "mau", "grande", "pequeno", "forte", "fraco", "novo", "velho", "primeiro", "ultimo"];
  if (adjectives.includes(answer.toLowerCase())) return "adjective";
  
  const people = ["Cristo", "Jesus", "Deus", "Espirito", "Pai", "Moisés", "Abraão", "Davi", "Paulo", "Pedro", "João", "Maria", "José", "Salomão", "Elias", "Isaías", "Jeremias", "Daniel", "Jonas"];
  if (people.some(p => answer.toLowerCase() === p.toLowerCase())) return "person";
  
  const places = ["céu", "terra", "Jerusalém", "Israel", "Egito", "Babilônia", "Roma", "Galileia", "Judeia", "Samaria", "Éden", "Canaã", "Sinai"];
  if (places.some(p => answer.toLowerCase() === p.toLowerCase())) return "place";
  
  return "noun";
}

function generateFillBlankOptions(correctAnswer: string): string[] {
  const answerType = detectAnswerType(correctAnswer);
  
  const optionsByType: Record<string, string[]> = {
    verse_reference: ["1:1", "3:16", "23:1", "12:25", "5:8", "8:28", "6:33", "4:13", "11:25", "15:13", "7:7", "10:9", "14:6", "16:31", "19:14"],
    number: ["1", "2", "3", "4", "5", "6", "7", "10", "12", "40", "70", "100", "7000"],
    adjective: ["santo", "justo", "eterno", "divino", "celestial", "perfeito", "fiel", "verdadeiro", "puro", "bom", "forte", "grande", "misericordioso", "gracioso", "amoroso"],
    person: ["Cristo", "Jesus", "Deus", "Moisés", "Abraão", "Davi", "Paulo", "Pedro", "João", "Maria", "Salomão", "Elias", "Isaías", "Daniel", "Samuel"],
    place: ["céu", "terra", "Jerusalém", "Israel", "Egito", "Babilônia", "Galileia", "Judeia", "Samaria", "Éden", "Canaã", "Sinai", "Roma", "Damasco"],
    noun: ["amor", "fé", "esperança", "graça", "paz", "alegria", "salvação", "vida", "verdade", "luz", "caminho", "palavra", "oração", "louvor", "glória", "justiça", "misericórdia", "perdão"]
  };
  
  const distractors = optionsByType[answerType] || optionsByType.noun;
  
  const shuffled = distractors
    .filter(d => d.toLowerCase() !== correctAnswer.toLowerCase())
    .sort(() => Math.random() - 0.5);
  
  const options = [correctAnswer, ...shuffled.slice(0, 3)];
  return options.sort(() => Math.random() - 0.5);
}

function Timer({ isActive, onTimeUp }: { isActive: boolean; onTimeUp?: () => void }) {
  const [seconds, setSeconds] = useState(90);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasTimedOut = useRef(false);
  
  useEffect(() => {
    setSeconds(90);
    hasTimedOut.current = false;
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (isActive && seconds > 0 && !hasTimedOut.current) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            hasTimedOut.current = true;
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
  }, [isActive, onTimeUp]);
  
  const formatTime = () => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const isLow = seconds <= 30;
  
  return (
    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
      <Clock className={cn("h-4 w-4", isLow && "animate-pulse text-red-500")} />
      <span className="text-sm text-muted-foreground">Tempo restante</span>
      <span className={cn(
        "text-lg font-bold",
        isLow ? "text-red-500" : "text-orange-500"
      )}>
        {formatTime()}
      </span>
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
  onProgress,
  onSwitchTab
}: RespondaScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<boolean | null>(null);
  const [fillBlankAnswer, setFillBlankAnswer] = useState("");
  const [fillBlankOptions, setFillBlankOptions] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [points, setPoints] = useState(340);
  const [correctCount, setCorrectCount] = useState(12);
  const [wrongCount, setWrongCount] = useState(3);
  const [timerActive, setTimerActive] = useState(true);
  const [hintUsed, setHintUsed] = useState(false);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { playSound } = useSounds();
  
  const questions = useMemo(() => {
    return rawQuestions.length > 0 ? rawQuestions : [
      { 
        type: "multiple_choice" as const, 
        question: "Qual e o significado central de 'Deus amou o mundo' em Joao 3:16?",
        options: [
          "O amor de Deus e apenas para aqueles que seguem as leis religiosas",
          "O amor de Deus e universal e alcanca toda a humanidade sem distincao",
          "O amor de Deus e condicional baseado em nossos meritos",
          "O amor de Deus e limitado a uma regiao geografica especifica"
        ],
        correctIndex: 1,
        category: "Interpretacao",
        points: 15,
        verseReference: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigenito..."
      }
    ];
  }, [rawQuestions]);
  
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);
  const accuracy = correctCount + wrongCount > 0 
    ? Math.round((correctCount / (correctCount + wrongCount)) * 100) 
    : 0;
  
  const clearAutoAdvanceTimeout = () => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
  };
  
  useEffect(() => {
    if (onProgress) {
      onProgress(currentIndex + 1, totalQuestions);
    }
  }, [currentIndex, totalQuestions, onProgress]);
  
  useEffect(() => {
    clearAutoAdvanceTimeout();
    setSelectedAnswer(null);
    setTrueFalseAnswer(null);
    setFillBlankAnswer("");
    setShowResult(false);
    setShowHint(false);
    setHintUsed(false);
    setTimerActive(true);
    
    // Get the question at current index
    const question = questions[currentIndex];
    if (question && question.type === "fill_blank" && question.correctAnswer) {
      const options = generateFillBlankOptions(String(question.correctAnswer));
      setFillBlankOptions(options);
    }
    
    return () => {
      clearAutoAdvanceTimeout();
    };
  }, [currentIndex]);
  
  const checkAnswer = () => {
    let isCorrect = false;
    let userAnswer: any = null;
    
    if (currentQuestion.type === "multiple_choice") {
      if (selectedAnswer === null) return;
      userAnswer = selectedAnswer;
      isCorrect = selectedAnswer === currentQuestion.correctIndex;
    } else if (currentQuestion.type === "true_false") {
      if (trueFalseAnswer === null) return;
      userAnswer = trueFalseAnswer;
      isCorrect = trueFalseAnswer === currentQuestion.correctAnswer;
    } else if (currentQuestion.type === "fill_blank") {
      if (!fillBlankAnswer.trim()) return;
      userAnswer = fillBlankAnswer;
      const correctAns = String(currentQuestion.correctAnswer || "").toLowerCase().trim();
      const userAns = fillBlankAnswer.toLowerCase().trim();
      isCorrect = userAns === correctAns;
    }
    
    setTimerActive(false);
    setShowResult(true);
    
    if (isCorrect) {
      playSound('practiceCorrect');
      const earnedPoints = (currentQuestion.points || 10) - (hintUsed ? 5 : 0);
      setPoints(prev => prev + earnedPoints);
      setCorrectCount(prev => prev + 1);
    } else {
      playSound('practiceError');
      setWrongCount(prev => prev + 1);
    }
    
    onAnswer(currentIndex, userAnswer, isCorrect);
  };
  
  const hasAnswer = () => {
    if (currentQuestion.type === "multiple_choice") return selectedAnswer !== null;
    if (currentQuestion.type === "true_false") return trueFalseAnswer !== null;
    if (currentQuestion.type === "fill_blank") return fillBlankAnswer.trim().length > 0;
    return false;
  };
  
  const goNext = () => {
    clearAutoAdvanceTimeout();
    if (currentIndex === totalQuestions - 1) {
      onComplete();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };
  
  const handleTimeUp = () => {
    if (!showResult && selectedAnswer === null) {
      setTimerActive(false);
      setShowResult(true);
      setWrongCount(prev => prev + 1);
      onAnswer(currentIndex, null, false);
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        goNext();
      }, 2000);
    }
  };
  
  const useHint = () => {
    if (!hintUsed) {
      setShowHint(true);
      setHintUsed(true);
    }
  };
  
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900" data-testid="responda-screen">
      <div 
        className="text-white p-4 pb-6 rounded-b-3xl"
        style={{ background: 'linear-gradient(135deg, #EA580C 0%, #F97316 50%, #FB923C 100%)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white hover:bg-white/20"
            data-testid="button-close-responda"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="font-bold text-lg">Responda</h1>
            <p className="text-white/80 text-sm">Joao 3:16-21</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20"
            data-testid="button-menu-responda"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Flame className="h-4 w-4" />
            <span className="font-medium">Sequencia</span>
          </div>
          <div>
            <span className="font-medium">Pontos totais</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-yellow-300">{streak} dias</span>
          <span className="text-2xl font-bold">{points}</span>
        </div>
        
        <div className="mt-3 flex items-center justify-between text-sm">
          <span>Pergunta {currentIndex + 1} de {totalQuestions}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="mt-1 h-2 bg-white/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 -mt-4">
        <div className="max-w-lg mx-auto space-y-4">
          <Card className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-0">
            <Timer key={currentIndex} isActive={timerActive && !showResult} onTimeUp={handleTimeUp} />
          </Card>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-0">
                <div className="flex items-center justify-between mb-3">
                  {currentQuestion.category && (
                    <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-0">
                      {currentQuestion.category}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">+{currentQuestion.points || 15} pts</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-foreground mb-3">
                  {currentQuestion.question}
                </h3>
                
                {currentQuestion.verseReference && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 mb-4">
                    <p className="text-orange-800 dark:text-orange-200 text-sm italic">
                      "{currentQuestion.verseReference}"
                    </p>
                  </div>
                )}
                
                {/* Multiple Choice Options */}
                {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
                  <div className="space-y-2">
                    {currentQuestion.options.map((option, idx) => {
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
                            "w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left",
                            showCorrect && "border-green-500 bg-green-50 dark:bg-green-900/30",
                            showIncorrect && "border-red-500 bg-red-50 dark:bg-red-900/30",
                            isSelected && !showResult && "border-orange-500 bg-orange-50 dark:bg-orange-900/20",
                            !isSelected && !showResult && "border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-900/10",
                            !showResult && "cursor-pointer"
                          )}
                          data-testid={`option-${optionLabels[idx]}`}
                        >
                          <span className={cn(
                            "h-7 w-7 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5",
                            showCorrect && "bg-green-500 text-white",
                            showIncorrect && "bg-red-500 text-white",
                            isSelected && !showResult && "bg-orange-500 text-white",
                            !isSelected && !showResult && "bg-gray-200 dark:bg-gray-700 text-muted-foreground"
                          )}>
                            {showCorrect ? <CheckCircle className="h-4 w-4" /> : 
                             showIncorrect ? <XCircle className="h-4 w-4" /> : 
                             optionLabels[idx]}
                          </span>
                          <span className={cn(
                            "flex-1 text-sm",
                            (showCorrect || (isSelected && !showResult)) && "font-medium"
                          )}>
                            {option}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* True/False Options */}
                {currentQuestion.type === "true_false" && (
                  <div className="flex gap-4">
                    {[
                      { value: true, label: "Verdadeiro", icon: Check },
                      { value: false, label: "Falso", icon: X }
                    ].map(({ value, label, icon: Icon }) => {
                      const isSelected = trueFalseAnswer === value;
                      const isCorrectAnswer = currentQuestion.correctAnswer === value;
                      const showCorrect = showResult && isCorrectAnswer;
                      const showIncorrect = showResult && isSelected && !isCorrectAnswer;
                      
                      return (
                        <button
                          key={label}
                          onClick={() => !showResult && setTrueFalseAnswer(value)}
                          disabled={showResult}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all",
                            showCorrect && "border-green-500 bg-green-50 dark:bg-green-900/30",
                            showIncorrect && "border-red-500 bg-red-50 dark:bg-red-900/30",
                            isSelected && !showResult && "border-orange-500 bg-orange-50 dark:bg-orange-900/20",
                            !isSelected && !showResult && "border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-900/10",
                            !showResult && "cursor-pointer"
                          )}
                          data-testid={`option-${label.toLowerCase()}`}
                        >
                          <div className={cn(
                            "h-14 w-14 rounded-full flex items-center justify-center",
                            showCorrect && "bg-green-500",
                            showIncorrect && "bg-red-500",
                            isSelected && !showResult && "bg-orange-500",
                            !isSelected && !showResult && (value ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30")
                          )}>
                            {showCorrect ? (
                              <CheckCircle className="h-7 w-7 text-white" />
                            ) : showIncorrect ? (
                              <XCircle className="h-7 w-7 text-white" />
                            ) : (
                              <Icon className={cn(
                                "h-7 w-7",
                                isSelected && !showResult ? "text-white" : (value ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")
                              )} />
                            )}
                          </div>
                          <span className={cn(
                            "font-bold text-lg",
                            showCorrect && "text-green-600 dark:text-green-400",
                            showIncorrect && "text-red-600 dark:text-red-400",
                            isSelected && !showResult && "text-orange-600 dark:text-orange-400",
                            !isSelected && !showResult && "text-foreground"
                          )}>
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* Fill in the Blank */}
                {currentQuestion.type === "fill_blank" && (
                  <div className="space-y-4">
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                      <p className="text-foreground text-center">
                        {currentQuestion.question.split("___").map((part, idx, arr) => (
                          <span key={idx}>
                            {part}
                            {idx < arr.length - 1 && (
                              <span className={cn(
                                "inline-block mx-1 px-4 py-1 min-w-[100px] text-center font-bold rounded-lg transition-all",
                                showResult 
                                  ? fillBlankAnswer.toLowerCase().trim() === String(currentQuestion.correctAnswer).toLowerCase().trim()
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-2 border-green-500"
                                    : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-2 border-red-500"
                                  : fillBlankAnswer 
                                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-2 border-orange-400"
                                    : "border-b-2 border-orange-400 text-orange-600 dark:text-orange-400"
                              )}>
                                {showResult ? String(currentQuestion.correctAnswer) : (fillBlankAnswer || "______")}
                              </span>
                            )}
                          </span>
                        ))}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {fillBlankOptions.map((option, index) => {
                        const isSelected = fillBlankAnswer === option;
                        const isCorrect = option.trim().toLowerCase() === String(currentQuestion.correctAnswer).toLowerCase().trim();
                        
                        return (
                          <Button
                            key={index}
                            variant="outline"
                            className={cn(
                              "min-h-[56px] h-auto py-3 px-4 text-base font-semibold transition-all",
                              "border-2 whitespace-normal break-words",
                              !showResult && isSelected && "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
                              !showResult && !isSelected && "border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-900/10",
                              showResult && isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300",
                              showResult && isSelected && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                            )}
                            onClick={() => !showResult && setFillBlankAnswer(option)}
                            disabled={showResult}
                            data-testid={`button-fill-option-${index}`}
                          >
                            {option}
                            {showResult && isCorrect && (
                              <CheckCircle2 className="h-5 w-5 ml-2 flex-shrink-0" />
                            )}
                          </Button>
                        );
                      })}
                    </div>

                    {showResult && fillBlankAnswer.toLowerCase().trim() !== String(currentQuestion.correctAnswer).toLowerCase().trim() && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-center text-muted-foreground">
                          Resposta correta: <span className="font-bold text-green-600 dark:text-green-400">{String(currentQuestion.correctAnswer)}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>
          
          {showHint && currentQuestion.hint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border-0">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {currentQuestion.hint}
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
          
          <div className="flex gap-3">
            {!showResult && (
              <Button
                variant="outline"
                onClick={useHint}
                disabled={hintUsed}
                className={cn(
                  "flex-shrink-0 border-yellow-300 text-yellow-700 dark:text-yellow-300 rounded-xl",
                  hintUsed && "opacity-50"
                )}
                data-testid="button-hint"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Dica (-5 pts)
              </Button>
            )}
            
            {!showResult ? (
              <Button
                onClick={checkAnswer}
                disabled={!hasAnswer()}
                className={cn(
                  "flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-xl",
                  !hasAnswer() && "opacity-50"
                )}
                data-testid="button-confirm"
              >
                Confirmar
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={goNext}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
                data-testid="button-next-responda"
              >
                {currentIndex === totalQuestions - 1 ? "Concluir Quiz" : "Proxima"}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
          
          <Card className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-0">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Seu Desempenho
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-1">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xl font-bold text-foreground">{correctCount}</span>
                <span className="text-xs text-muted-foreground">Corretas</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-1">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-xl font-bold text-foreground">{wrongCount}</span>
                <span className="text-xs text-muted-foreground">Erradas</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-1">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xl font-bold text-foreground">{accuracy}%</span>
                <span className="text-xs text-muted-foreground">Precisao</span>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-0">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Atividade Recente
              </h4>
              <button className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                Ver todas
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">Quiz completo: Evangelho de Joao</p>
                  <p className="text-xs text-muted-foreground">Ha 2 dias - 95 pontos</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">Conquista desbloqueada</p>
                  <p className="text-xs text-muted-foreground">Ha 3 dias - Estudante dedicado</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 border-t px-4 py-3 safe-area-inset-bottom">
        <div className="flex justify-around max-w-lg mx-auto">
          <button 
            className="flex flex-col items-center gap-1 text-muted-foreground"
            onClick={() => onSwitchTab?.("estude")}
            data-testid="tab-estude-responda"
          >
            <BookOpen className="h-6 w-6" />
            <span className="text-xs font-medium">Estude</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 text-muted-foreground"
            onClick={() => onSwitchTab?.("medite")}
            data-testid="tab-medite-responda"
          >
            <Heart className="h-6 w-6" />
            <span className="text-xs font-medium">Medite</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 text-orange-600 dark:text-orange-400"
            onClick={() => onSwitchTab?.("responda")}
            data-testid="tab-responda-active"
          >
            <HelpCircle className="h-6 w-6" />
            <span className="text-xs font-medium">Responda</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export type { QuizQuestion };
