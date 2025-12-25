import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft,
  Loader2,
  BookOpen,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Sparkles,
  Trophy,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  question: string;
  options: string[];
  correctAnswer: number;
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

export default function EventLessonPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ eventId: string; dayNumber: string }>();
  const eventId = parseInt(params.eventId || "0");
  const dayNumber = parseInt(params.dayNumber || "0");
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<"content" | "quiz" | "result">("content");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizResults, setQuizResults] = useState<{ correct: number; total: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, error } = useQuery<LessonResponse>({
    queryKey: ["/api/study/events", eventId, "lessons", dayNumber],
    enabled: !!user && eventId > 0 && dayNumber > 0,
  });

  const lessonId = data?.lesson?.id || data?.progress?.lessonId;

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
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      toast({
        title: "Erro ao salvar progresso",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !data) {
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
          <p className="text-muted-foreground">Licao nao encontrada</p>
        </div>
      </div>
    );
  }

  const { lesson, progress } = data;
  const questions = lesson.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const isCompleted = progress?.completed || false;

  const handleStartQuiz = () => {
    if (questions.length > 0) {
      setCurrentStep("quiz");
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowExplanation(false);
    }
  };

  const handleSelectAnswer = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerIndex,
    }));
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      const correct = Object.entries(selectedAnswers).filter(
        ([idx, answer]) => questions[parseInt(idx)].correctAnswer === answer
      ).length;
      const total = questions.length;
      const score = Math.round((correct / total) * 100);
      
      setQuizResults({ correct, total });
      setCurrentStep("result");
      
      if (!isCompleted && lessonId && !isSubmitting) {
        setIsSubmitting(true);
        submitMutation.mutate({ correct, total, score, lessonId });
      }
    }
  };

  const progressPercentage = questions.length > 0 
    ? ((currentQuestionIndex + 1) / questions.length) * 100 
    : 0;

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
        {currentStep === "quiz" && (
          <div className="px-4 pb-3">
            <Progress value={progressPercentage} className="h-1" />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {currentQuestionIndex + 1}/{questions.length}
            </p>
          </div>
        )}
      </header>

      <main className="flex-1 p-4 pb-24">
        <AnimatePresence mode="wait">
          {currentStep === "content" && (
            <motion.div
              key="content"
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
                    dangerouslySetInnerHTML={{ __html: lesson.content }}
                  />
                </CardContent>
              </Card>

              {questions.length > 0 && !isCompleted && (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleStartQuiz}
                  data-testid="button-start-quiz"
                >
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Iniciar Quiz ({questions.length} perguntas)
                </Button>
              )}

              {isCompleted && (
                <Card className="border-green-500/50 bg-green-500/5">
                  <CardContent className="p-4 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="font-medium">Licao concluida!</p>
                    {progress && (
                      <p className="text-sm text-muted-foreground">
                        Voce acertou {progress.correctAnswers}/{progress.totalQuestions} questoes
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {currentStep === "quiz" && currentQuestion && (
            <motion.div
              key={`question-${currentQuestionIndex}`}
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

                  <RadioGroup
                    value={selectedAnswers[currentQuestionIndex]?.toString()}
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option, idx) => {
                      const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                      const isCorrect = currentQuestion.correctAnswer === idx;
                      const showResult = showExplanation;

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
                          onClick={() => handleSelectAnswer(idx)}
                          data-testid={`option-${currentQuestionIndex}-${idx}`}
                        >
                          <RadioGroupItem 
                            value={idx.toString()} 
                            id={`option-${idx}`}
                            disabled={showExplanation}
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

                  {showExplanation && currentQuestion.explanation && (
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

              {showExplanation && (
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

          {currentStep === "result" && quizResults && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    {quizResults.correct === quizResults.total ? (
                      <Trophy className="h-10 w-10 text-amber-500" />
                    ) : quizResults.correct >= quizResults.total * 0.8 ? (
                      <Sparkles className="h-10 w-10 text-primary" />
                    ) : (
                      <BookOpen className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>

                  <h2 className="text-2xl font-bold mb-2">
                    {quizResults.correct === quizResults.total
                      ? "Perfeito!"
                      : quizResults.correct >= quizResults.total * 0.8
                        ? "Muito bem!"
                        : "Continue estudando!"}
                  </h2>

                  <p className="text-muted-foreground mb-4">
                    Voce acertou {quizResults.correct} de {quizResults.total} perguntas
                  </p>

                  <div className="flex justify-center gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-500">
                        {quizResults.correct}
                      </div>
                      <div className="text-xs text-muted-foreground">Acertos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-500">
                        {quizResults.total - quizResults.correct}
                      </div>
                      <div className="text-xs text-muted-foreground">Erros</div>
                    </div>
                  </div>

                  {lesson.xpReward && (
                    <Badge className="bg-amber-500/10 text-amber-600 mb-4">
                      +{lesson.xpReward} XP ganho
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Button 
                className="w-full" 
                onClick={() => setLocation(`/study/events/${eventId}`)}
                data-testid="button-back-to-event"
              >
                Voltar ao Evento
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
