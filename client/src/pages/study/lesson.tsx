import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { HeartCrack, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  StudyHeader,
  MultipleChoiceExercise,
  TrueFalseExercise,
  TextContent,
  FeedbackOverlay,
  LessonComplete
} from "@/components/study";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UnitContent {
  title?: string;
  body?: string;
  highlight?: string;
  question?: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  statement?: string;
  isTrue?: boolean;
  explanationCorrect?: string;
  explanationIncorrect?: string;
  explanation?: string;
  hint?: string;
}

interface Unit {
  id: number;
  lessonId: number;
  orderIndex: number;
  type: "text" | "multiple_choice" | "true_false" | "fill_blank";
  content: UnitContent;
  xpValue: number;
}

interface LessonProgress {
  id?: number;
  userId: number;
  lessonId: number;
  startedAt?: string;
  completedAt?: string | null;
  xpEarned?: number;
  mistakesCount?: number;
  perfectScore?: boolean;
  timeSpentSeconds?: number;
}

interface LessonData {
  id: number;
  studyWeekId: number;
  orderIndex: number;
  title: string;
  type: string;
  description?: string;
  xpReward: number;
  estimatedMinutes: number;
  icon?: string;
  isBonus: boolean;
  units: Unit[];
  progress: LessonProgress | null;
}

interface StudyProfile {
  id: number;
  userId: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  hearts: number;
  maxHearts: number;
  weeklyXp: number;
  level: number;
  lastActivityAt: string | null;
  lastHeartRecoveryAt: string | null;
}

interface AnswerResult {
  correct: boolean;
  explanation?: string;
  unitProgress: {
    id: number;
    userId: number;
    unitId: number;
    isCompleted: boolean;
    isCorrect: boolean;
    attempts: number;
  };
  profile: StudyProfile;
}

interface CompletionResult {
  progress: LessonProgress;
  profile: StudyProfile;
}

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const lessonId = parseInt(id || "0");
  
  const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{
    isCorrect: boolean;
    explanation: string;
    hint?: string;
    xpEarned: number;
    heartsLost: number;
  } | null>(null);
  const [displayXp, setDisplayXp] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [lessonStarted, setLessonStarted] = useState(false);
  const [noHeartsError, setNoHeartsError] = useState(false);
  const [finalProfile, setFinalProfile] = useState<StudyProfile | null>(null);
  const [finalXpFromServer, setFinalXpFromServer] = useState<number | null>(null);
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);
  const heartsBeforeAnswer = useRef<number>(5);

  const { 
    data: lessonData, 
    isLoading: isLoadingLesson, 
    error: lessonError,
    refetch: refetchLesson 
  } = useQuery<LessonData>({
    queryKey: ['/api/study/lessons', lessonId.toString()],
    enabled: !!user && lessonId > 0,
  });

  const { data: profileData, refetch: refetchProfile } = useQuery<StudyProfile>({
    queryKey: ['/api/study/profile'],
    enabled: !!user,
  });

  const serverHearts = finalProfile?.hearts ?? profileData?.hearts;

  const startLessonMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/study/lessons/${lessonId}/start`);
      return res.json();
    },
    onSuccess: () => {
      setLessonStarted(true);
      refetchProfile();
    },
    onError: (error: Error) => {
      if (error.message.includes("vidas") || error.message.includes("hearts") || error.message.includes("heartsNeeded")) {
        setNoHeartsError(true);
      }
    }
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ unitId, answer }: { unitId: number; answer: any }) => {
      const res = await apiRequest("POST", `/api/study/units/${unitId}/answer`, { answer });
      return res.json() as Promise<AnswerResult>;
    },
    onSuccess: (result) => {
      queryClient.setQueryData<StudyProfile>(['/api/study/profile'], result.profile);
    }
  });

  const completeLessonMutation = useMutation({
    mutationFn: async (completionData: { xpEarned: number; mistakesCount: number; timeSpentSeconds: number }) => {
      const res = await apiRequest("POST", `/api/study/lessons/${lessonId}/complete`, completionData);
      return res.json() as Promise<CompletionResult>;
    },
    onSuccess: (result) => {
      setFinalProfile(result.profile);
      if (result.progress?.xpEarned !== undefined) {
        setFinalXpFromServer(result.progress.xpEarned);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/study/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/study/weeks'] });
    }
  });

  useEffect(() => {
    if (lessonData && !lessonStarted && !startLessonMutation.isPending && !noHeartsError && !startLessonMutation.isError) {
      startLessonMutation.mutate();
    }
  }, [lessonData, lessonStarted, noHeartsError]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="not-authenticated">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Nao Autenticado</h1>
          <p className="text-muted-foreground mb-4">Faca login para acessar as licoes.</p>
          <Button onClick={() => setLocation("/login")} data-testid="button-login">
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  if (noHeartsError || (serverHearts !== undefined && serverHearts <= 0)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4" data-testid="no-hearts">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <HeartCrack className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Suas vidas acabaram!
          </h1>
          <p className="text-muted-foreground mb-6">
            Leia versiculos biblicos para recuperar vidas, ou aguarde 6 horas para recuperar automaticamente.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setLocation("/study/verses")}
              className="w-full py-6 font-bold"
              data-testid="button-read-verses"
            >
              LER VERSICULOS
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/study")}
              className="w-full py-6"
              data-testid="button-go-home"
            >
              Voltar ao Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingLesson || startLessonMutation.isPending || !profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="loading-lesson">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando licao...</p>
        </div>
      </div>
    );
  }

  if (lessonError || startLessonMutation.isError) {
    const errorMessage = lessonError 
      ? (lessonError as Error).message 
      : (startLessonMutation.error as Error)?.message || "Erro ao iniciar licao";
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="error-lesson">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Erro ao carregar licao</h1>
          <p className="text-muted-foreground mb-4">{errorMessage}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => {
              if (lessonError) refetchLesson();
              else startLessonMutation.reset();
            }} variant="outline" data-testid="button-retry">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button onClick={() => setLocation("/study")} data-testid="button-back">
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!lessonData || !lessonData.units || lessonData.units.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="empty-lesson">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Licao Vazia</h1>
          <p className="text-muted-foreground mb-4">Esta licao ainda nao tem conteudo.</p>
          <Button onClick={() => setLocation("/study")} data-testid="button-back-empty">
            Voltar ao Estudo
          </Button>
        </div>
      </div>
    );
  }

  const units = lessonData.units;
  const currentUnit = units[currentUnitIndex];
  const totalUnits = units.length;
  const currentHearts = serverHearts ?? 5;

  const handleAnswerSubmit = async (userAnswer: any) => {
    if (waitingForAnswer) return;
    setWaitingForAnswer(true);
    heartsBeforeAnswer.current = currentHearts;

    try {
      const result = await submitAnswerMutation.mutateAsync({ 
        unitId: currentUnit.id, 
        answer: userAnswer 
      });

      const isCorrect = result.correct;
      const xpForUnit = currentUnit.xpValue || 5;
      const heartsAfter = result.profile.hearts;
      const heartsLost = Math.max(0, heartsBeforeAnswer.current - heartsAfter);

      if (isCorrect) {
        setDisplayXp(prev => prev + xpForUnit);
      } else {
        setMistakes(prev => prev + 1);
      }

      setFeedbackData({
        isCorrect,
        explanation: result.explanation || (isCorrect 
          ? currentUnit.content.explanationCorrect || currentUnit.content.explanation || "Correto!"
          : currentUnit.content.explanationIncorrect || currentUnit.content.explanation || "Incorreto"),
        hint: !isCorrect ? currentUnit.content.hint : undefined,
        xpEarned: isCorrect ? xpForUnit : 0,
        heartsLost
      });
      setShowFeedback(true);
    } catch (error) {
      console.error("Error submitting answer:", error);
      setFeedbackData({
        isCorrect: false,
        explanation: "Erro ao enviar resposta. Tente novamente.",
        xpEarned: 0,
        heartsLost: 0
      });
      setShowFeedback(true);
    } finally {
      setWaitingForAnswer(false);
    }
  };

  const handleContinue = () => {
    setShowFeedback(false);
    setFeedbackData(null);

    if (currentUnitIndex < totalUnits - 1) {
      setCurrentUnitIndex(prev => prev + 1);
    } else {
      handleLessonCompletion();
    }
  };

  const handleTextContinue = () => {
    const xp = currentUnit.xpValue || 2;
    setDisplayXp(prev => prev + xp);
    
    if (currentUnitIndex < totalUnits - 1) {
      setCurrentUnitIndex(prev => prev + 1);
    } else {
      handleLessonCompletion();
    }
  };

  const handleLessonCompletion = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const isPerfect = mistakes === 0;
    const bonusXp = isPerfect ? 10 : 0;
    const estimatedXp = displayXp + lessonData.xpReward + bonusXp;
    
    try {
      await completeLessonMutation.mutateAsync({
        xpEarned: estimatedXp,
        mistakesCount: mistakes,
        timeSpentSeconds: timeSpent
      });
    } catch (error) {
      console.error("Error completing lesson:", error);
    }
    
    setIsCompleted(true);
  };

  const handleClose = () => {
    if (window.confirm("Tem certeza que deseja sair? Seu progresso sera perdido.")) {
      setLocation("/study");
    }
  };

  const handleLessonComplete = () => {
    setLocation("/study");
  };

  if (isCompleted) {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const streakDays = finalProfile?.currentStreak ?? profileData?.currentStreak ?? 0;
    const isPerfect = mistakes === 0;
    const bonusXp = isPerfect ? 10 : 0;
    const fallbackXp = displayXp + lessonData.xpReward + bonusXp;
    const finalXp = finalXpFromServer ?? fallbackXp;
    
    return (
      <LessonComplete
        xpEarned={finalXp}
        isPerfect={isPerfect}
        streakDays={streakDays}
        mistakesCount={mistakes}
        timeSpentSeconds={timeSpent}
        onContinue={handleLessonComplete}
      />
    );
  }

  const handleMultipleChoiceAnswer = (_isCorrect: boolean, selectedIndex: number) => {
    handleAnswerSubmit(selectedIndex);
  };

  const handleTrueFalseAnswer = (_isCorrect: boolean, userAnswer: boolean) => {
    handleAnswerSubmit(userAnswer);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="lesson-page">
      <StudyHeader
        currentStep={currentUnitIndex + 1}
        totalSteps={totalUnits}
        hearts={currentHearts}
        maxHearts={profileData?.maxHearts || 5}
        onClose={handleClose}
      />

      <main className="flex-1 flex flex-col">
        {currentUnit.type === "text" && (
          <TextContent
            title={currentUnit.content.title || ""}
            body={currentUnit.content.body || ""}
            highlight={currentUnit.content.highlight}
            onContinue={handleTextContinue}
          />
        )}

        {currentUnit.type === "multiple_choice" && (
          <MultipleChoiceExercise
            question={currentUnit.content.question || ""}
            options={currentUnit.content.options || []}
            correctIndex={currentUnit.content.correctIndex || 0}
            onAnswer={handleMultipleChoiceAnswer}
          />
        )}

        {currentUnit.type === "true_false" && (
          <TrueFalseExercise
            statement={currentUnit.content.statement || ""}
            isTrue={currentUnit.content.isTrue || false}
            onAnswer={handleTrueFalseAnswer}
          />
        )}
      </main>

      {feedbackData && (
        <FeedbackOverlay
          isVisible={showFeedback}
          isCorrect={feedbackData.isCorrect}
          explanation={feedbackData.explanation}
          hint={feedbackData.hint}
          xpEarned={feedbackData.xpEarned}
          heartsLost={feedbackData.heartsLost}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
