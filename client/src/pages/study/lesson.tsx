import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { HeartCrack, Loader2, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  StudyHeader,
  MultipleChoiceExercise,
  TrueFalseExercise,
  TextContent,
  FillBlankExercise,
  FeedbackOverlay,
  LessonComplete,
  StudyContent,
  EstudeScreen,
  MediteScreen,
  RespondaScreen,
  StageCompleteModal,
  StreakIncrementAnimation,
  CrystalGainAnimation,
  AchievementUnlockAnimation
} from "@/components/study";
import type { StudySection, MeditationSection, QuizQuestion } from "@/components/study";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MedalAchievementAnimation } from "@/components/study/MedalAchievementAnimation";

interface UnitContent {
  title?: string;
  body?: string;
  highlight?: string;
  question?: string;
  sentence?: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  statement?: string;
  isTrue?: boolean;
  explanationCorrect?: string;
  explanationIncorrect?: string;
  explanation?: string;
  hint?: string;
  reflectionPrompt?: string;
  meditationDuration?: number;
  meditationGuide?: string;
  verseReference?: string;
  verseText?: string;
}

interface Unit {
  id: number;
  lessonId: number;
  orderIndex: number;
  type: "text" | "multiple_choice" | "true_false" | "fill_blank" | "verse" | "meditation" | "reflection";
  content: UnitContent;
  xpValue: number;
  stage: "estude" | "medite" | "responda";
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

interface StreakInfo {
  newStreak: number;
  isNewRecord: boolean;
  crystalsAwarded: number;
  crystalRewards: Array<{ type: string; amount: number; description: string }>;
  milestoneReward: { milestone: any; crystalsAwarded: number; xpAwarded: number } | null;
}

interface CompletionResult {
  progress: LessonProgress;
  profile: StudyProfile;
  streakInfo: StreakInfo;
  unlockedAchievements?: any[];
}

function useQueryParam(param: string): string | null {
  const searchParams = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search) 
    : new URLSearchParams();
  return searchParams.get(param);
}

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const lessonId = parseInt(id || "0");
  const stageParam = useQueryParam('stage');
  
  const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
  const [initialStageSet, setInitialStageSet] = useState(false);
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
  const [alreadyCompletedError, setAlreadyCompletedError] = useState(false);
  const [finalProfile, setFinalProfile] = useState<StudyProfile | null>(null);
  const [finalXpFromServer, setFinalXpFromServer] = useState<number | null>(null);
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);
  const heartsBeforeAnswer = useRef<number>(5);
  const [showStageComplete, setShowStageComplete] = useState(false);
  const [stageCompleteData, setStageCompleteData] = useState<{
    xp: number;
    stageType: "estude" | "medite" | "responda";
    nextStage: string | null;
    nextIndex: number;
  } | null>(null);
  const [studyProgress, setStudyProgress] = useState<{ current: number; total: number } | null>(null);
  
  const [animationPhase, setAnimationPhase] = useState<"none" | "streak" | "crystal" | "achievement" | "complete">("none");
  const [unlockedAchievementsList, setUnlockedAchievementsList] = useState<any[]>([]);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);
  const [streakAnimationData, setStreakAnimationData] = useState<{ previousStreak: number; newStreak: number } | null>(null);
  const [crystalAnimationData, setCrystalAnimationData] = useState<{ amount: number; reason: string } | null>(null);
  const previousStreakRef = useRef<number>(0);

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
      } else if (error.message.includes("concluida") || error.message.includes("alreadyCompleted") || error.message.includes("completed")) {
        setAlreadyCompletedError(true);
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
      queryClient.invalidateQueries({ queryKey: ['/api/study/weeks'] });
    }
  });

  const completeLessonMutation = useMutation({
    mutationFn: async (completionData: { xpEarned: number; mistakesCount: number; timeSpentSeconds: number }) => {
      previousStreakRef.current = profileData?.currentStreak ?? 0;
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
      queryClient.invalidateQueries({ queryKey: ['/api/study/weekly-goal'] });
      queryClient.invalidateQueries({ queryKey: ['/api/study/practice'] });
      
      const streakInfo = result.streakInfo;
      const previousStreak = previousStreakRef.current;
      const streakIncreased = streakInfo && streakInfo.newStreak > previousStreak;
      const crystalsAwarded = streakInfo?.crystalsAwarded || 0;
      const achievements = result.unlockedAchievements || [];
      
      if (achievements.length > 0) {
        setUnlockedAchievementsList(achievements);
        setCurrentAchievementIndex(0);
      }
      
      if (streakIncreased) {
        setStreakAnimationData({
          previousStreak,
          newStreak: streakInfo.newStreak
        });
        if (crystalsAwarded > 0) {
          const reasons = streakInfo.crystalRewards?.length > 0 
            ? streakInfo.crystalRewards.map(r => r.description).join(', ')
            : 'Recompensa por lição';
          setCrystalAnimationData({
            amount: crystalsAwarded,
            reason: reasons
          });
        }
        setAnimationPhase("streak");
      } else if (crystalsAwarded > 0) {
        const reasons = streakInfo?.crystalRewards?.length > 0 
          ? streakInfo.crystalRewards.map(r => r.description).join(', ')
          : 'Recompensa por lição';
        setCrystalAnimationData({
          amount: crystalsAwarded,
          reason: reasons
        });
        setAnimationPhase("crystal");
      } else if (achievements.length > 0) {
        setAnimationPhase("achievement");
      } else {
        setAnimationPhase("complete");
      }
      
      setIsCompleted(true);
    }
  });

  const completeUnitMutation = useMutation({
    mutationFn: async (unitId: number) => {
      const res = await apiRequest("POST", `/api/study/units/${unitId}/complete`);
      return res.json();
    },
    onSuccess: (result) => {
      if (result.profile) {
        queryClient.setQueryData<StudyProfile>(['/api/study/profile'], result.profile);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/study/weeks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/study/lessons', lessonId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['/api/study/weekly-goal'] });
    }
  });

  useEffect(() => {
    if (lessonData && !lessonStarted && !startLessonMutation.isPending && !noHeartsError && !alreadyCompletedError && !startLessonMutation.isError) {
      startLessonMutation.mutate();
    }
  }, [lessonData, lessonStarted, noHeartsError, alreadyCompletedError]);

  useEffect(() => {
    if (lessonData?.units && stageParam && !initialStageSet) {
      const validStages = ['estude', 'medite', 'responda'];
      if (validStages.includes(stageParam)) {
        // When filtering by stage, always start at index 0 of the filtered units
        // The filtering happens later, so we just need to reset to beginning
        setCurrentUnitIndex(0);
      }
      setInitialStageSet(true);
    }
  }, [lessonData, stageParam, initialStageSet]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="not-authenticated">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Não Autenticado</h1>
          <p className="text-muted-foreground mb-4">Faça login para acessar as lições.</p>
          <Button onClick={() => setLocation("/login")} data-testid="button-login">
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  if (alreadyCompletedError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4" data-testid="already-completed">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Licao ja concluida!
          </h1>
          <p className="text-muted-foreground mb-6">
            Voce ja completou esta licao. Continue sua jornada de estudo com outras licoes disponiveis.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setLocation("/study")}
              className="w-full py-6 font-bold"
              data-testid="button-continue-study"
            >
              CONTINUAR ESTUDANDO
            </Button>
          </div>
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
            Leia versículos bíblicos para recuperar vidas, ou aguarde 6 horas para recuperar automaticamente.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setLocation("/study/verses")}
              className="w-full py-6 font-bold"
              data-testid="button-read-verses"
            >
              LER VERSÍCULOS
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/study")}
              className="w-full py-6"
              data-testid="button-go-home"
            >
              Voltar ao Início
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
          <p className="text-muted-foreground">Carregando lição...</p>
        </div>
      </div>
    );
  }

  if (lessonError || startLessonMutation.isError) {
    const errorMessage = lessonError 
      ? (lessonError as Error).message 
      : (startLessonMutation.error as Error)?.message || "Erro ao iniciar lição";
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="error-lesson">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Erro ao carregar lição</h1>
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
          <h1 className="text-xl font-bold text-foreground mb-2">Lição Vazia</h1>
          <p className="text-muted-foreground mb-4">Esta lição ainda não tem conteúdo.</p>
          <Button onClick={() => setLocation("/study")} data-testid="button-back-empty">
            Voltar ao Estudo
          </Button>
        </div>
      </div>
    );
  }

  const allUnits = [...lessonData.units].sort((a, b) => {
    // Special ordering for medite stage: reflection (applications) before meditation (prayer)
    if (a.stage === 'medite' && b.stage === 'medite') {
      // reflection comes before meditation
      if (a.type === 'reflection' && b.type === 'meditation') return -1;
      if (a.type === 'meditation' && b.type === 'reflection') return 1;
    }
    const orderDiff = (a.orderIndex || 0) - (b.orderIndex || 0);
    return orderDiff !== 0 ? orderDiff : (a.id || 0) - (b.id || 0);
  });
  
  const targetStage = stageParam as "estude" | "medite" | "responda" | null;
  const filteredUnits = targetStage 
    ? allUnits.filter(u => u.stage === targetStage)
    : null;
  
  const hasFilteredUnits = filteredUnits !== null && filteredUnits.length > 0;
  const units = hasFilteredUnits ? filteredUnits : allUnits;
  const safeIndex = Math.max(0, Math.min(currentUnitIndex, units.length - 1));
  const currentUnit = units[safeIndex];
  const totalUnits = units.length;
  const currentHearts = serverHearts ?? 5;
  
  const isStudyStage = currentUnit?.stage === 'estude';
  const isTextType = currentUnit?.type === 'text' || currentUnit?.type === 'verse';
  const studyUnits = allUnits
    .filter(u => u.stage === 'estude' && (u.type === 'text' || u.type === 'verse'));
  
  let topicCounter = 0;
  const studySections: StudySection[] = studyUnits.map((unit) => {
    if (unit.type === 'verse') {
      return {
        type: 'verse' as const,
        title: unit.content.title || 'Versículo Base',
        content: unit.content.body || unit.content.verseText || '',
        reference: unit.content.highlight || unit.content.verseReference || ''
      };
    }
    
    const isConclusion = unit.content.title?.toLowerCase().includes('conclus');
    if (isConclusion) {
      return {
        type: 'conclusion' as const,
        title: unit.content.title || 'Conclusão',
        content: unit.content.body || ''
      };
    }
    
    topicCounter++;
    return {
      type: 'topic' as const,
      title: unit.content.title || '',
      content: unit.content.body || '',
      topicNumber: topicCounter
    };
  });
  
  const isMediteStage = currentUnit?.stage === 'medite';
  const isMediteType = currentUnit?.type === 'meditation' || currentUnit?.type === 'reflection';
  const mediteUnits = allUnits
    .filter(u => u.stage === 'medite' && (u.type === 'meditation' || u.type === 'reflection'));
  
  const mediteSections: MeditationSection[] = mediteUnits.map((unit) => {
    return {
      type: unit.type as 'reflection' | 'meditation',
      title: unit.content.title || (unit.type === 'meditation' ? 'Meditacao' : 'Reflexao'),
      content: unit.content.body || unit.content.meditationGuide || unit.content.reflectionPrompt || '',
      prompt: unit.content.reflectionPrompt,
      duration: unit.content.meditationDuration
    };
  });
  
  const isRespondaStage = currentUnit?.stage === 'responda';
  const isQuestionType = currentUnit?.type === 'multiple_choice' || currentUnit?.type === 'true_false' || currentUnit?.type === 'fill_blank';
  const respondaUnits = allUnits.filter(u => u.stage === 'responda' && (u.type === 'multiple_choice' || u.type === 'true_false'));
  
  const respondaQuestions: QuizQuestion[] = respondaUnits.map((unit) => ({
    type: unit.type as 'multiple_choice' | 'true_false',
    question: unit.content.question || unit.content.statement || '',
    options: unit.content.options,
    correctIndex: unit.content.correctIndex,
    correctAnswer: unit.content.isTrue,
    hint: unit.content.hint,
    explanation: unit.content.explanation
  }));
  
  if (targetStage && filteredUnits !== null && filteredUnits.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="empty-stage">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Sem conteúdo</h1>
          <p className="text-muted-foreground mb-4">
            Este estágio ainda não tem conteúdo disponível.
          </p>
          <Button onClick={() => setLocation("/study")} data-testid="button-back-empty-stage">
            Voltar ao Estudo
          </Button>
        </div>
      </div>
    );
  }

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
      if (targetStage === 'responda') {
        handleRespondaComplete();
      } else {
        handleLessonCompletion();
      }
    }
  };

  const handleRespondaComplete = async () => {
    const respondaUnits = allUnits.filter(u => u.stage === 'responda');
    const totalXpFromResponda = displayXp;
    
    // Mark all responda units as completed (ensures text-type units are also marked)
    for (const unit of respondaUnits) {
      try {
        await completeUnitMutation.mutateAsync(unit.id);
      } catch (error) {
        console.error("Error completing responda unit:", error);
      }
    }
    
    setStageCompleteData({
      xp: totalXpFromResponda,
      stageType: "responda",
      nextStage: null,
      nextIndex: allUnits.length
    });
    setShowStageComplete(true);
  };

  const handleMeditateComplete = async () => {
    const meditateUnits = allUnits.filter(u => u.stage === 'medite');
    const totalXp = meditateUnits.reduce((sum, u) => sum + (u.xpValue || 3), 0);
    
    for (const unit of meditateUnits) {
      try {
        await completeUnitMutation.mutateAsync(unit.id);
      } catch (error) {
        console.error("Error completing meditate unit:", error);
      }
    }
    
    const lastMeditateIndex = allUnits.reduce((lastIdx, u, idx) => 
      u.stage === 'medite' ? idx : lastIdx, -1
    );
    
    const nextIndex = lastMeditateIndex + 1;
    const nextUnit = nextIndex < allUnits.length ? allUnits[nextIndex] : null;
    
    setStageCompleteData({
      xp: totalXp,
      stageType: "medite",
      nextStage: nextUnit?.stage || null,
      nextIndex: nextIndex
    });
    setShowStageComplete(true);
  };

  const handleTextContinue = async () => {
    try {
      await completeUnitMutation.mutateAsync(currentUnit.id);
    } catch (error) {
      console.error("Error completing unit:", error);
    }
    
    if (currentUnit.stage === 'medite') {
      const meditateUnitsInFiltered = units.filter(u => u.stage === 'medite');
      const currentMeditateIndex = meditateUnitsInFiltered.findIndex(u => u.id === currentUnit.id);
      const isLastMeditateUnit = currentMeditateIndex === meditateUnitsInFiltered.length - 1;
      
      if (isLastMeditateUnit) {
        handleMeditateComplete();
        return;
      }
      
      if (currentUnitIndex < totalUnits - 1) {
        setCurrentUnitIndex(prev => prev + 1);
      }
      return;
    }
    
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
    if (window.confirm("Tem certeza que deseja sair? Seu progresso será perdido.")) {
      setLocation("/study");
    }
  };

  const handleLessonComplete = () => {
    setLocation(`/study?lesson=${lessonId}`);
  };

  if (isCompleted) {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const streakDays = finalProfile?.currentStreak ?? profileData?.currentStreak ?? 0;
    const isPerfect = mistakes === 0;
    const bonusXp = isPerfect ? 10 : 0;
    const fallbackXp = displayXp + lessonData.xpReward + bonusXp;
    const finalXp = finalXpFromServer ?? fallbackXp;
    
    const handleStreakAnimationComplete = () => {
      if (crystalAnimationData) {
        setAnimationPhase("crystal");
      } else if (unlockedAchievementsList.length > 0) {
        setAnimationPhase("achievement");
      } else {
        setAnimationPhase("complete");
      }
    };
    
    const handleCrystalAnimationComplete = () => {
      if (unlockedAchievementsList.length > 0) {
        setAnimationPhase("achievement");
      } else {
        setAnimationPhase("complete");
      }
    };
    
    const handleAchievementAnimationComplete = () => {
      if (currentAchievementIndex < unlockedAchievementsList.length - 1) {
        setCurrentAchievementIndex(currentAchievementIndex + 1);
      } else {
        setAnimationPhase("complete");
      }
    };
    
    if (animationPhase === "streak" && streakAnimationData) {
      return (
        <StreakIncrementAnimation
          previousStreak={streakAnimationData.previousStreak}
          newStreak={streakAnimationData.newStreak}
          onComplete={handleStreakAnimationComplete}
        />
      );
    }
    
    if (animationPhase === "crystal" && crystalAnimationData) {
      return (
        <CrystalGainAnimation
          crystalsGained={crystalAnimationData.amount}
          reason={crystalAnimationData.reason}
          onComplete={handleCrystalAnimationComplete}
        />
      );
    }
    
    if (animationPhase === "achievement" && unlockedAchievementsList.length > 0) {
      const currentAchievement = unlockedAchievementsList[currentAchievementIndex];
      return (
        <AchievementUnlockAnimation
          achievement={currentAchievement}
          onComplete={handleAchievementAnimationComplete}
        />
      );
    }
    
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

  const handleFillBlankAnswer = (_isCorrect: boolean, userAnswer: string) => {
    handleAnswerSubmit(userAnswer);
  };

  const currentStage = targetStage || currentUnit?.stage || 'responda';
  
  const handleStudyComplete = async () => {
    const totalXp = studyUnits.reduce((sum, u) => sum + (u.xpValue || 2), 0);
    
    for (const unit of studyUnits) {
      try {
        await completeUnitMutation.mutateAsync(unit.id);
      } catch (error) {
        console.error("Error completing study unit:", error);
      }
    }
    
    const lastStudyIndex = allUnits.reduce((lastIdx, u, idx) => 
      u.stage === 'estude' ? idx : lastIdx, -1
    );
    
    const nextIndex = lastStudyIndex + 1;
    const nextUnit = nextIndex < allUnits.length ? allUnits[nextIndex] : null;
    
    setStageCompleteData({
      xp: totalXp,
      stageType: "estude",
      nextStage: nextUnit?.stage || null,
      nextIndex: nextIndex
    });
    setShowStageComplete(true);
  };

  const handleStageModalClose = async () => {
    if (!stageCompleteData) return;
    
    const { xp, stageType, nextStage } = stageCompleteData;
    
    if (stageType !== 'responda') {
      setDisplayXp(prev => prev + xp);
    }
    
    setShowStageComplete(false);
    setStageCompleteData(null);
    
    queryClient.invalidateQueries({ queryKey: ['/api/study/weeks'] });
    queryClient.invalidateQueries({ queryKey: ['/api/study/profile'] });
    queryClient.invalidateQueries({ queryKey: ['/api/study/weekly-goal'] });
    
    if (stageType === 'responda') {
      await handleLessonCompletion();
    } else {
      setLocation(`/study?lesson=${lessonId}&stage=${nextStage || 'medite'}`);
    }
  };

  const showStudyContent = isStudyStage && isTextType && studyUnits.length > 0;
  const showMediteContent = isMediteStage && isMediteType && mediteUnits.length > 0;
  const showRespondaContent = isRespondaStage && isQuestionType && respondaUnits.length > 0;
  
  const handleRespondaAnswer = async (questionIndex: number, answer: any, _isCorrect: boolean) => {
    const unit = respondaUnits[questionIndex];
    if (!unit) return;
    
    try {
      const result = await submitAnswerMutation.mutateAsync({ 
        unitId: unit.id, 
        answer: answer 
      });
      
      if (result.correct) {
        setDisplayXp(prev => prev + (unit.xpValue || 5));
      } else {
        setMistakes(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error submitting responda answer:", error);
      setMistakes(prev => prev + 1);
    }
  };
  
  // Handle progress updates from StudyContent
  const handleStudyProgress = (current: number, total: number) => {
    setStudyProgress({ current, total });
  };
  
  // Calculate header progress - use study progress when in study mode, otherwise use unit progress
  const headerCurrentStep = (showStudyContent || showMediteContent || showRespondaContent) && studyProgress 
    ? studyProgress.current 
    : currentUnitIndex + 1;
  const headerTotalSteps = (showStudyContent || showMediteContent || showRespondaContent) && studyProgress 
    ? studyProgress.total 
    : totalUnits;

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="lesson-page">
      <StudyHeader
        currentStep={headerCurrentStep}
        totalSteps={headerTotalSteps}
        hearts={currentHearts}
        maxHearts={profileData?.maxHearts || 5}
        onClose={handleClose}
        currentStage={currentStage}
        showStages={!targetStage}
      />

      <main className="flex-1 flex flex-col">
        {showStudyContent ? (
          <EstudeScreen
            lessonTitle={lessonData.title}
            sections={studySections}
            verseReference={studySections.find(s => s.type === 'verse')?.reference}
            onComplete={handleStudyComplete}
            onClose={handleClose}
            onProgress={handleStudyProgress}
          />
        ) : showMediteContent ? (
          <MediteScreen
            lessonTitle={lessonData.title}
            sections={mediteSections}
            onComplete={handleMeditateComplete}
            onClose={handleClose}
            onProgress={handleStudyProgress}
          />
        ) : showRespondaContent ? (
          <RespondaScreen
            lessonTitle={lessonData.title}
            questions={respondaQuestions}
            streak={profileData?.currentStreak || 0}
            onAnswer={handleRespondaAnswer}
            onComplete={handleRespondaComplete}
            onClose={handleClose}
            onProgress={handleStudyProgress}
          />
        ) : (
          <>
            {currentUnit.type === "text" && (
              <TextContent
                title={currentUnit.content.title || ""}
                body={currentUnit.content.body || ""}
                highlight={currentUnit.content.highlight}
                onContinue={handleTextContinue}
              />
            )}

            {currentUnit.type === "verse" && (
              <TextContent
                title={currentUnit.content.title || "Versículo"}
                body={currentUnit.content.body || currentUnit.content.verseText || ""}
                highlight={currentUnit.content.highlight || currentUnit.content.verseReference}
                onContinue={handleTextContinue}
              />
            )}

            {currentUnit.type === "meditation" && (
              <TextContent
                title={currentUnit.content.title || "Meditação"}
                body={currentUnit.content.body || currentUnit.content.meditationGuide || ""}
                highlight={currentUnit.content.meditationDuration ? `Duração: ${currentUnit.content.meditationDuration} segundos` : undefined}
                onContinue={handleTextContinue}
              />
            )}

            {currentUnit.type === "reflection" && (
              <TextContent
                title={currentUnit.content.title || "Reflexão"}
                body={currentUnit.content.body || currentUnit.content.reflectionPrompt || ""}
                highlight={currentUnit.content.highlight}
                onContinue={handleTextContinue}
              />
            )}

            {currentUnit.type === "multiple_choice" && (
              <MultipleChoiceExercise
                key={`mc-${currentUnitIndex}-${currentUnit.id}`}
                question={currentUnit.content.question || ""}
                options={currentUnit.content.options || []}
                correctIndex={currentUnit.content.correctIndex || 0}
                onAnswer={handleMultipleChoiceAnswer}
              />
            )}

            {currentUnit.type === "true_false" && (
              <TrueFalseExercise
                key={`tf-${currentUnitIndex}-${currentUnit.id}`}
                statement={currentUnit.content.statement || ""}
                isTrue={currentUnit.content.isTrue || false}
                onAnswer={handleTrueFalseAnswer}
              />
            )}

            {currentUnit.type === "fill_blank" && (
              <FillBlankExercise
                key={`fb-${currentUnitIndex}-${currentUnit.id}`}
                question={currentUnit.content.question || currentUnit.content.sentence || ""}
                correctAnswer={currentUnit.content.correctAnswer || ""}
                onAnswer={handleFillBlankAnswer}
              />
            )}
          </>
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

      {stageCompleteData && (
        <StageCompleteModal
          isOpen={showStageComplete}
          onClose={handleStageModalClose}
          xpEarned={stageCompleteData.xp}
          stageType={stageCompleteData.stageType}
          nextStage={stageCompleteData.nextStage as "estude" | "medite" | "responda" | null}
        />
      )}
    </div>
  );
}
