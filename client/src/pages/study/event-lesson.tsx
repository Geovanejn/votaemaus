import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft,
  Loader2,
  BookOpen,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Sparkles,
  Trophy,
  Heart,
  Brain,
  MessageSquare,
  Star,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EventLesson {
  id: number;
  eventId: number;
  dayNumber: number;
  title: string;
  content: string;
  verseReference: string | null;
  verseText: string | null;
  questions: Question[];
  xpReward: number | null;
  status: string | null;
}

interface Question {
  id: string;
  type?: "multiple_choice" | "true_false" | "fill_blank";
  question: string;
  options?: string[];
  correctAnswer: number | boolean | string;
  explanation?: string;
}

interface UserProgress {
  id: number;
  lessonId: number;
  completed: boolean;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
}

interface LessonResponse {
  lesson: EventLesson;
  progress: UserProgress | null;
}

type Stage = "estude" | "medite" | "responda";

interface StageCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  xpEarned: number;
  stageType: Stage;
  nextStage: Stage | null;
  correctAnswers?: number;
  totalQuestions?: number;
}

function StageCompleteModal({ 
  isOpen, 
  onClose, 
  xpEarned, 
  stageType, 
  nextStage,
  correctAnswers,
  totalQuestions 
}: StageCompleteModalProps) {
  const stageLabels: Record<Stage, string> = {
    estude: "Estude",
    medite: "Medite",
    responda: "Responda"
  };

  const stageIcons: Record<Stage, JSX.Element> = {
    estude: <BookOpen className="h-8 w-8" />,
    medite: <Heart className="h-8 w-8" />,
    responda: <Brain className="h-8 w-8" />
  };

  const isLessonComplete = stageType === "responda" && !nextStage;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center sr-only">
            {isLessonComplete ? "Lição Completa" : `${stageLabels[stageType]} Concluído`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isLessonComplete 
                ? "bg-amber-500/20 text-amber-500" 
                : "bg-primary/20 text-primary"
            }`}
          >
            {isLessonComplete ? (
              <Trophy className="h-10 w-10" />
            ) : (
              stageIcons[stageType]
            )}
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold mb-2"
          >
            {isLessonComplete ? "Lição Concluída!" : `${stageLabels[stageType]} Concluído!`}
          </motion.h2>

          {isLessonComplete && correctAnswers !== undefined && totalQuestions !== undefined && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground mb-4"
            >
              Você acertou {correctAnswers} de {totalQuestions} questões
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <Badge className="bg-amber-500/10 text-amber-600 text-lg px-4 py-2">
              <Star className="h-5 w-5 mr-2 fill-amber-500" />
              +{xpEarned} XP
            </Badge>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button onClick={onClose} className="w-full" size="lg" data-testid="button-stage-continue">
              {nextStage ? (
                <>
                  Continuar para {stageLabels[nextStage]}
                  <ChevronRight className="h-5 w-5 ml-2" />
                </>
              ) : (
                "Voltar ao Evento"
              )}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function parseContentSections(content: string): { estude: string; medite: string } {
  const estudeMatch = content.match(/<h2[^>]*>\s*Estude\s*<\/h2>([\s\S]*?)(?=<h2|$)/i);
  const mediteMatch = content.match(/<h2[^>]*>\s*Medite\s*<\/h2>([\s\S]*?)(?=<h2|$)/i);
  
  const estudeContent = estudeMatch ? estudeMatch[1].trim() : content;
  const mediteContent = mediteMatch ? mediteMatch[1].trim() : "";
  
  return { estude: estudeContent, medite: mediteContent };
}

export default function EventLessonPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ eventId: string; dayNumber: string }>();
  const eventId = parseInt(params.eventId || "0");
  const dayNumber = parseInt(params.dayNumber || "0");
  const { toast } = useToast();

  const audioCorrect = useRef<HTMLAudioElement | null>(null);
  const audioIncorrect = useRef<HTMLAudioElement | null>(null);
  const audioComplete = useRef<HTMLAudioElement | null>(null);
  const audioModal = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioCorrect.current = new Audio("/sounds/correct.mp3");
    audioIncorrect.current = new Audio("/sounds/incorrect.mp3");
    audioComplete.current = new Audio("/sounds/complete.mp3");
    audioModal.current = new Audio("/sounds/modal.mp3");
  }, []);

  const playSound = (type: "correct" | "incorrect" | "complete" | "modal") => {
    const audio = {
      correct: audioCorrect.current,
      incorrect: audioIncorrect.current,
      complete: audioComplete.current,
      modal: audioModal.current
    }[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  };

  const [currentStage, setCurrentStage] = useState<Stage>(() => {
    const saved = localStorage.getItem(`lesson_${eventId}_${dayNumber}_stage`);
    return (saved as Stage) || "estude";
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    const saved = localStorage.getItem(`lesson_${eventId}_${dayNumber}_questionIndex`);
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem(`lesson_${eventId}_${dayNumber}_stage`, currentStage);
  }, [currentStage, eventId, dayNumber]);

  useEffect(() => {
    localStorage.setItem(`lesson_${eventId}_${dayNumber}_questionIndex`, currentQuestionIndex.toString());
  }, [currentQuestionIndex, eventId, dayNumber]);

  const [selectedAnswer, setSelectedAnswer] = useState<string | number | boolean | null>(null);
  const [fillBlankAnswer, setFillBlankAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [accumulatedXp, setAccumulatedXp] = useState(0);
  const [showStageComplete, setShowStageComplete] = useState(false);
  const [stageCompleteData, setStageCompleteData] = useState<{
    xp: number;
    stageType: Stage;
    nextStage: Stage | null;
    correctAnswers?: number;
    totalQuestions?: number;
  } | null>(null);

  const { data, isLoading, error } = useQuery<LessonResponse>({
    queryKey: ["/api/study/events", eventId, "lessons", dayNumber],
    enabled: !!user && eventId > 0 && dayNumber > 0,
  });

  const submitMutation = useMutation({
    mutationFn: async (results: { correct: number; total: number; score: number; lessonId: number }) => {
      return apiRequest("POST", `/api/study/events/${eventId}/lessons/${results.lessonId}/complete`, {
        correctAnswers: results.correct,
        totalQuestions: results.total,
        score: results.score,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/events", eventId, "lessons", dayNumber] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/profile"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar progresso",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const lesson = data?.lesson;
  const progress = data?.progress;
  const isCompleted = progress?.completed || false;
  const lessonId = lesson?.id;

  const contentSections = useMemo(() => {
    if (!lesson?.content) return { estude: "", medite: "" };
    return parseContentSections(lesson.content);
  }, [lesson?.content]);

  const questions = lesson?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const baseXp = lesson?.xpReward || 50;
  const xpPerStage = Math.floor(baseXp / 3);

  const handleEstudeContinue = () => {
    const xp = xpPerStage;
    setAccumulatedXp(prev => prev + xp);
    setStageCompleteData({
      xp,
      stageType: "estude",
      nextStage: contentSections.medite ? "medite" : (questions.length > 0 ? "responda" : null)
    });
    setShowStageComplete(true);
  };

  const handleMediteContinue = () => {
    const xp = xpPerStage;
    setAccumulatedXp(prev => prev + xp);
    setStageCompleteData({
      xp,
      stageType: "medite",
      nextStage: questions.length > 0 ? "responda" : null
    });
    setShowStageComplete(true);
  };

  const handleStageModalClose = () => {
    setShowStageComplete(false);
    if (stageCompleteData?.nextStage) {
      setCurrentStage(stageCompleteData.nextStage);
    } else {
      setLocation(`/study/events/${eventId}`);
    }
  };

  const checkAnswer = (question: Question, answer: string | number | boolean): boolean => {
    if (question.type === "true_false") {
      return answer === question.correctAnswer;
    } else if (question.type === "fill_blank") {
      const correct = String(question.correctAnswer).toLowerCase().trim();
      const given = String(answer).toLowerCase().trim();
      return correct === given;
    } else {
      return answer === question.correctAnswer;
    }
  };

  const handleAnswerSelect = (answer: string | number | boolean) => {
    if (showFeedback) return;
    setSelectedAnswer(answer);
    setShowFeedback(true);
    
    if (checkAnswer(currentQuestion, answer)) {
      setCorrectAnswers(prev => prev + 1);
    }
  };

  const handleFillBlankSubmit = () => {
    if (showFeedback || !fillBlankAnswer.trim()) return;
    handleAnswerSelect(fillBlankAnswer.trim());
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setFillBlankAnswer("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      const total = questions.length;
      const correct = correctAnswers + (checkAnswer(currentQuestion, selectedAnswer!) ? 0 : 0);
      const finalCorrect = correctAnswers;
      const score = Math.round((finalCorrect / total) * 100);
      const xp = xpPerStage + Math.floor((finalCorrect / total) * xpPerStage);
      
      setAccumulatedXp(prev => prev + xp);
      setStageCompleteData({
        xp,
        stageType: "responda",
        nextStage: null,
        correctAnswers: finalCorrect,
        totalQuestions: total
      });
      setShowStageComplete(true);

      if (lessonId && !isCompleted) {
        submitMutation.mutate({ 
          correct: finalCorrect, 
          total, 
          score, 
          lessonId 
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !data || !lesson) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background border-b p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation(`/study/events/${eventId}`)}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-muted-foreground">Lição não encontrada</p>
        </div>
      </div>
    );
  }

  const stageProgress = currentStage === "estude" ? 33 : currentStage === "medite" ? 66 : 100;
  const questionProgress = questions.length > 0 
    ? ((currentQuestionIndex + 1) / questions.length) * 100 
    : 0;

  const stageLabels: Record<Stage, { label: string; icon: JSX.Element }> = {
    estude: { label: "Estude", icon: <BookOpen className="h-4 w-4" /> },
    medite: { label: "Medite", icon: <Heart className="h-4 w-4" /> },
    responda: { label: "Responda", icon: <Brain className="h-4 w-4" /> }
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background border-b">
          <div className="flex items-center gap-3 p-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation(`/study/events/${eventId}`)}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <span className="text-xs text-muted-foreground">Dia {dayNumber}</span>
              <h1 className="text-lg font-semibold truncate">{lesson.title}</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 flex items-center justify-center">
          <Card className="max-w-md w-full text-center border-green-500/50 bg-green-500/5">
            <CardContent className="p-6">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Lição Concluída!</h2>
              {progress && (
                <p className="text-muted-foreground mb-4">
                  Você acertou {progress.correctAnswers}/{progress.totalQuestions} questões
                </p>
              )}
              <Button 
                onClick={() => setLocation(`/study/events/${eventId}`)}
                data-testid="button-back-to-event"
              >
                Voltar ao Evento
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation(`/study/events/${eventId}`)}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <span className="text-xs text-muted-foreground">Dia {dayNumber}</span>
            <h1 className="text-lg font-semibold truncate">{lesson.title}</h1>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            {stageLabels[currentStage].icon}
            {stageLabels[currentStage].label}
          </Badge>
        </div>
        <div className="px-4 pb-3">
          <div className="flex gap-1 mb-2">
            {(["estude", "medite", "responda"] as Stage[]).map((stage) => (
              <div 
                key={stage}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  (stage === "estude" && currentStage !== "estude") ||
                  (stage === "medite" && currentStage === "responda")
                    ? "bg-primary"
                    : stage === currentStage
                      ? "bg-primary/50"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
          {currentStage === "responda" && questions.length > 0 && (
            <p className="text-xs text-muted-foreground text-right">
              Questao {currentQuestionIndex + 1}/{questions.length}
            </p>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 pb-24">
        <AnimatePresence mode="wait">
          {currentStage === "estude" && (
            <motion.div
              key="estude"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {lesson.verseReference && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-primary mb-1">
                          {lesson.verseReference}
                        </p>
                        {lesson.verseText && (
                          <p className="text-sm italic text-muted-foreground">
                            "{lesson.verseText}"
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-4">
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: contentSections.estude }}
                  />
                </CardContent>
              </Card>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleEstudeContinue}
                data-testid="button-estude-continue"
              >
                Continuar
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </motion.div>
          )}

          {currentStage === "medite" && (
            <motion.div
              key="medite"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Card className="border-pink-500/20 bg-pink-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-pink-600 dark:text-pink-400 mb-2">
                        Momento de Reflexão
                      </p>
                      <div 
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: contentSections.medite || "<p>Medite sobre o que você aprendeu na seção anterior. Ore e peça a Deus sabedoria para aplicar esses ensinamentos em sua vida.</p>" }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleMediteContinue}
                data-testid="button-medite-continue"
              >
                Continuar
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </motion.div>
          )}

          {currentStage === "responda" && currentQuestion && (
            <motion.div
              key={`responda-${currentQuestionIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-4" data-testid={`text-question-${currentQuestionIndex}`}>
                    {currentQuestion.question}
                  </h3>

                  {currentQuestion.type === "true_false" ? (
                    <div className="space-y-3">
                      {[
                        { value: true, label: "Verdadeiro" },
                        { value: false, label: "Falso" }
                      ].map((option) => {
                        const isSelected = selectedAnswer === option.value;
                        const isCorrect = option.value === currentQuestion.correctAnswer;
                        const showResult = showFeedback;

                        return (
                          <div
                            key={option.label}
                            className={`flex items-center space-x-3 p-3 rounded-md border cursor-pointer transition-colors ${
                              showResult
                                ? isCorrect
                                  ? "border-green-500 bg-green-500/10"
                                  : isSelected
                                    ? "border-red-500 bg-red-500/10"
                                    : "border-border"
                                : isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                            }`}
                            onClick={() => handleAnswerSelect(option.value)}
                            data-testid={`option-tf-${option.label.toLowerCase()}`}
                          >
                            <Checkbox checked={isSelected} />
                            <span className="flex-1">{option.label}</span>
                            {showResult && isCorrect && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            {showResult && isSelected && !isCorrect && (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : currentQuestion.type === "fill_blank" ? (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={fillBlankAnswer}
                          onChange={(e) => setFillBlankAnswer(e.target.value)}
                          placeholder="Digite sua resposta..."
                          disabled={showFeedback}
                          className={showFeedback 
                            ? checkAnswer(currentQuestion, fillBlankAnswer)
                              ? "border-green-500"
                              : "border-red-500"
                            : ""
                          }
                          data-testid="input-fill-blank"
                        />
                        {!showFeedback && (
                          <Button onClick={handleFillBlankSubmit} data-testid="button-submit-fill">
                            Verificar
                          </Button>
                        )}
                      </div>
                      {showFeedback && (
                        <div className={`p-3 rounded-md ${
                          checkAnswer(currentQuestion, fillBlankAnswer)
                            ? "bg-green-500/10 border border-green-500/30"
                            : "bg-red-500/10 border border-red-500/30"
                        }`}>
                          <p className="text-sm">
                            {checkAnswer(currentQuestion, fillBlankAnswer)
                              ? "Correto!"
                              : `Incorreto. A resposta correta e: ${currentQuestion.correctAnswer}`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <RadioGroup
                      value={selectedAnswer?.toString()}
                      className="space-y-3"
                    >
                      {(currentQuestion.options || []).map((option, idx) => {
                        const isSelected = selectedAnswer === idx;
                        const isCorrect = currentQuestion.correctAnswer === idx;
                        const showResult = showFeedback;

                        return (
                          <div
                            key={idx}
                            className={`flex items-center space-x-3 p-3 rounded-md border cursor-pointer transition-colors ${
                              showResult
                                ? isCorrect
                                  ? "border-green-500 bg-green-500/10"
                                  : isSelected
                                    ? "border-red-500 bg-red-500/10"
                                    : "border-border"
                                : isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                            }`}
                            onClick={() => handleAnswerSelect(idx)}
                            data-testid={`option-${currentQuestionIndex}-${idx}`}
                          >
                            <RadioGroupItem 
                              value={idx.toString()} 
                              id={`option-${idx}`}
                              disabled={showFeedback}
                            />
                            <Label 
                              htmlFor={`option-${idx}`} 
                              className="flex-1 cursor-pointer"
                            >
                              {option}
                            </Label>
                            {showResult && isCorrect && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            {showResult && isSelected && !isCorrect && (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        );
                      })}
                    </RadioGroup>
                  )}

                  {showFeedback && currentQuestion.explanation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-muted rounded-md"
                    >
                      <p className="text-sm text-muted-foreground">
                        {currentQuestion.explanation}
                      </p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {showFeedback && (
                <Button 
                  className="w-full" 
                  onClick={handleNextQuestion}
                  data-testid="button-next-question"
                >
                  {currentQuestionIndex < questions.length - 1 ? (
                    <>
                      Proxima Pergunta
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    "Ver Resultado"
                  )}
                </Button>
              )}
            </motion.div>
          )}

          {currentStage === "responda" && questions.length === 0 && (
            <motion.div
              key="no-questions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Nao ha questões para esta licao.
              </p>
              <Button onClick={() => setLocation(`/study/events/${eventId}`)}>
                Voltar ao Evento
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {stageCompleteData && (
        <StageCompleteModal
          isOpen={showStageComplete}
          onClose={handleStageModalClose}
          xpEarned={stageCompleteData.xp}
          stageType={stageCompleteData.stageType}
          nextStage={stageCompleteData.nextStage}
          correctAnswers={stageCompleteData.correctAnswers}
          totalQuestions={stageCompleteData.totalQuestions}
        />
      )}
    </div>
  );
}
