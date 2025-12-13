import { useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  BottomNav,
  useCelebration,
  WeeklyGoalsWidget
} from "@/components/study";
import type { StageType, QuestionResult } from "@/components/study";
import { 
  ArrowLeft, 
  MoreVertical, 
  BookOpen, 
  Clock, 
  Filter,
  Check,
  Lock,
  BookText,
  Heart,
  PenLine,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface StudyProfile {
  id: number;
  userId: number;
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  hearts: number;
  heartsMax: number;
  heartsRefillAt: string | null;
  lastActivityDate: string | null;
  dailyGoalMinutes: number;
  timezone: string;
}

interface StudyWeek {
  id: number;
  weekNumber: number;
  year: number;
  title: string;
  description: string;
  pdfUrl: string | null;
  status: string;
  publishedAt: string | null;
  createdBy: number | null;
}

interface StageProgress {
  completed: number;
  total: number;
  questionResults?: QuestionResult[];
}

interface LessonWithProgress {
  id: number;
  studyWeekId: number;
  orderIndex: number;
  title: string;
  type: string;
  description: string;
  xpReward: number;
  estimatedMinutes: number;
  icon: string | null;
  isBonus: boolean;
  status: string;
  progress?: {
    completedUnits: number;
    totalUnits: number;
    xpEarned: number;
    stageProgress?: {
      estude: StageProgress;
      medite: StageProgress;
      responda: StageProgress;
    };
  };
}

interface WeekWithLessons {
  week: StudyWeek;
  lessons: LessonWithProgress[];
}

interface TransformedLesson {
  id: number;
  number: number;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'locked';
  sectionsCompleted: number;
  totalSections: number;
  xpReward: number;
  stages: {
    estude: { status: 'completed' | 'current' | 'locked'; completed: number; total: number };
    medite: { status: 'completed' | 'current' | 'locked'; completed: number; total: number };
    responda: { status: 'completed' | 'current' | 'locked'; completed: number; total: number };
  };
}

function StudyHeader({ onBack }: { onBack: () => void }) {
  return (
    <div 
      className="px-4 py-4 flex items-center justify-between"
      style={{
        background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      }}
    >
      <button 
        onClick={onBack}
        className="w-10 h-10 flex items-center justify-center"
        data-testid="button-back"
      >
        <ArrowLeft className="h-6 w-6 text-white" />
      </button>
      <h1 className="text-lg font-bold text-white">Estudos</h1>
      <button className="w-10 h-10 flex items-center justify-center" data-testid="button-menu">
        <MoreVertical className="h-6 w-6 text-white" />
      </button>
    </div>
  );
}

function TrimestreCard({ 
  title, 
  subtitle, 
  totalLessons, 
  estimatedMinutes 
}: { 
  title: string; 
  subtitle: string; 
  totalLessons: number;
  estimatedMinutes: number;
}) {
  return (
    <div 
      className="mx-4 p-5 rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, #EC4899 0%, #A855F7 50%, #8B5CF6 100%)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <BookText className="h-5 w-5 text-white" />
        </div>
        <span 
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: '#A3E635', color: '#365314' }}
        >
          Trimestre 2024
        </span>
      </div>
      <h2 className="text-2xl font-bold text-white mb-1" data-testid="text-trimestre-title">
        {title}
      </h2>
      <p className="text-white/80 text-sm mb-4">{subtitle}</p>
      <div className="flex items-center gap-4 text-white/90 text-sm">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4" />
          <span>{totalLessons} Licoes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span>~{estimatedMinutes} min cada</span>
        </div>
      </div>
    </div>
  );
}

function ProgressSection({ 
  progress, 
  completed, 
  inProgress, 
  locked 
}: { 
  progress: number; 
  completed: number; 
  inProgress: number; 
  locked: number;
}) {
  return (
    <Card className="mx-4 mt-4 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-foreground">Seu Progresso</span>
        <span className="font-bold text-green-500">{progress}%</span>
      </div>
      <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #22C55E 0%, #16A34A 100%)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <span className="text-xl font-bold text-foreground">{completed}</span>
          <p className="text-xs text-muted-foreground">Completas</p>
        </div>
        <div className="border-l border-r border-border">
          <span className="text-xl font-bold text-foreground">{inProgress}</span>
          <p className="text-xs text-muted-foreground">Em Progresso</p>
        </div>
        <div>
          <span className="text-xl font-bold text-foreground">{locked}</span>
          <p className="text-xs text-muted-foreground">Bloqueadas</p>
        </div>
      </div>
    </Card>
  );
}

function LessonCard({ 
  lesson, 
  previousLessonNumber,
  onStageClick,
  onContinue
}: { 
  lesson: TransformedLesson;
  previousLessonNumber?: number;
  onStageClick: (lessonId: number, stage: 'estude' | 'medite' | 'responda') => void;
  onContinue: (lessonId: number) => void;
}) {
  const isCompleted = lesson.status === 'completed';
  const isInProgress = lesson.status === 'in_progress';
  const isLocked = lesson.status === 'locked';

  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="h-5 w-5 text-white" strokeWidth={3} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">LICAO {lesson.number}</p>
            <p className="text-sm font-bold text-green-600">Completa</p>
          </div>
        </div>
      );
    }
    if (isInProgress) {
      return (
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}
          >
            {lesson.number}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">LICAO {lesson.number}</p>
            <p className="text-sm font-bold text-purple-600">Em Progresso</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
          style={{ background: 'linear-gradient(135deg, #D1D5DB 0%, #9CA3AF 100%)' }}
        >
          {lesson.number}
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">LICAO {lesson.number}</p>
          <p className="text-sm font-bold text-gray-400">Bloqueada</p>
        </div>
      </div>
    );
  };

  const getXpDisplay = () => {
    if (isCompleted) {
      return <span className="text-green-500 font-bold">+{lesson.xpReward} XP</span>;
    }
    if (isInProgress) {
      return <span className="text-purple-500 font-bold">+{Math.round(lesson.xpReward * (lesson.sectionsCompleted / lesson.totalSections) || 0)} XP</span>;
    }
    return <span className="text-gray-400 font-medium">{lesson.xpReward} XP</span>;
  };

  const StageButton = ({ 
    stage, 
    label, 
    icon: Icon,
    stageData
  }: { 
    stage: 'estude' | 'medite' | 'responda';
    label: string;
    icon: typeof BookText;
    stageData: { status: 'completed' | 'current' | 'locked'; completed: number; total: number };
  }) => {
    const stageCompleted = stageData.status === 'completed';
    const stageLocked = stageData.status === 'locked' || isLocked;

    return (
      <button
        onClick={() => !stageLocked && onStageClick(lesson.id, stage)}
        disabled={stageLocked}
        className={`flex-1 py-3 px-2 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
          stageCompleted 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : stageLocked
              ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
              : 'bg-white dark:bg-card border-gray-200 dark:border-gray-700 hover:border-purple-300'
        }`}
        data-testid={`button-stage-${stage}-${lesson.id}`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          stageCompleted 
            ? 'bg-green-100 dark:bg-green-800' 
            : stageLocked 
              ? 'bg-gray-100 dark:bg-gray-700' 
              : 'bg-purple-100 dark:bg-purple-900/30'
        }`}>
          {stageLocked && !stageCompleted ? (
            <Lock className={`h-4 w-4 ${stageLocked ? 'text-gray-400' : 'text-purple-600'}`} />
          ) : (
            <Icon className={`h-4 w-4 ${stageCompleted ? 'text-green-600' : 'text-purple-600'}`} />
          )}
        </div>
        <span className={`text-xs font-medium ${
          stageCompleted 
            ? 'text-green-600' 
            : stageLocked 
              ? 'text-gray-400' 
              : 'text-foreground'
        }`}>
          {label}
        </span>
        {stageCompleted && (
          <Check className="h-3 w-3 text-green-500" />
        )}
      </button>
    );
  };

  return (
    <Card className={`p-4 ${isLocked ? 'opacity-70' : ''}`} data-testid={`lesson-card-${lesson.id}`}>
      <div className="flex items-start justify-between mb-3">
        {getStatusBadge()}
        <div className="text-right">
          {getXpDisplay()}
          <p className="text-xs text-muted-foreground">
            {lesson.sectionsCompleted}/{lesson.totalSections} secoes
          </p>
        </div>
      </div>

      <h3 className={`text-lg font-bold mb-1 ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
        {lesson.title}
      </h3>
      <p className={`text-sm mb-4 ${isLocked ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
        {lesson.description}
      </p>

      <div className="flex gap-2 mb-3">
        <StageButton 
          stage="estude" 
          label="Estude" 
          icon={BookText}
          stageData={lesson.stages.estude}
        />
        <StageButton 
          stage="medite" 
          label="Medite" 
          icon={Heart}
          stageData={lesson.stages.medite}
        />
        <StageButton 
          stage="responda" 
          label="Responda" 
          icon={PenLine}
          stageData={lesson.stages.responda}
        />
      </div>

      {isInProgress && (
        <Button 
          onClick={() => onContinue(lesson.id)}
          className="w-full"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
          }}
          data-testid={`button-continue-${lesson.id}`}
        >
          Continuar Licao
        </Button>
      )}

      {isLocked && previousLessonNumber && (
        <p className="text-center text-sm text-muted-foreground">
          Complete a Licao {previousLessonNumber} para desbloquear
        </p>
      )}
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando estudos...</p>
      </div>
    </div>
  );
}

function NotAuthenticatedState() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-sm">
        <BookOpen className="h-16 w-16 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Area de Estudos</h2>
        <p className="text-muted-foreground mb-6">
          Faca login para acessar suas licoes e acompanhar seu progresso.
        </p>
        <Button onClick={() => setLocation('/membro')} className="w-full">
          Fazer Login
        </Button>
      </Card>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-sm">
        <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Erro ao Carregar</h2>
        <p className="text-muted-foreground mb-6">
          Nao foi possivel carregar os estudos. Tente novamente.
        </p>
        <Button onClick={onRetry} className="w-full">
          Tentar Novamente
        </Button>
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="mx-4 p-8 text-center">
      <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-bold mb-2">Nenhuma Licao Disponivel</h2>
      <p className="text-muted-foreground">
        As licoes serao publicadas em breve.
      </p>
    </Card>
  );
}

export default function StudyHomePage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const scrollAttemptedRef = useRef(false);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { CelebrationComponent } = useCelebration();
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'in_progress' | 'locked'>('all');

  const { data: profile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useQuery<StudyProfile>({
    queryKey: ['/api/study/profile'],
    enabled: isAuthenticated,
  });

  const { data: weeks, isLoading: weeksLoading, error: weeksError, refetch: refetchWeeks } = useQuery<StudyWeek[]>({
    queryKey: ['/api/study/weeks'],
    enabled: isAuthenticated,
  });

  const currentWeek = weeks?.[0];

  const { data: weekData, isLoading: lessonsLoading, error: lessonsError, refetch: refetchLessons } = useQuery<WeekWithLessons>({
    queryKey: ['/api/study/weeks', currentWeek?.id?.toString()],
    enabled: isAuthenticated && !!currentWeek?.id,
  });

  const isLoading = authLoading || profileLoading || weeksLoading || lessonsLoading;
  const hasError = profileError || weeksError || lessonsError;

  useEffect(() => {
    if (!isLoading && weekData?.lessons && searchString && !scrollAttemptedRef.current) {
      const params = new URLSearchParams(searchString);
      const lessonId = params.get('lesson');
      
      if (lessonId) {
        scrollAttemptedRef.current = true;
        setTimeout(() => {
          const element = document.getElementById(`lesson-${lessonId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          window.history.replaceState({}, '', '/study');
        }, 100);
      }
    }
  }, [isLoading, weekData, searchString]);

  const handleRetry = () => {
    refetchProfile();
    refetchWeeks();
    refetchLessons();
  };

  if (authLoading) {
    return <LoadingState />;
  }

  if (!isAuthenticated || !user) {
    return <NotAuthenticatedState />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (hasError || !profile) {
    return <ErrorState onRetry={handleRetry} />;
  }

  const rawLessons = weekData?.lessons || [];
  
  const transformedLessons: TransformedLesson[] = rawLessons.map((lesson, index) => {
    const previousLesson = index > 0 ? rawLessons[index - 1] : null;
    const isPreviousLessonComplete = !previousLesson || previousLesson.status === 'completed';
    
    let lessonStatus: 'completed' | 'in_progress' | 'locked' = 'locked';
    if (lesson.status === 'completed') {
      lessonStatus = 'completed';
    } else if ((lesson.status === 'in_progress' || lesson.status === 'available') && isPreviousLessonComplete) {
      lessonStatus = 'in_progress';
    } else if (isPreviousLessonComplete && lesson.status !== 'completed') {
      lessonStatus = 'in_progress';
    }

    const stageProgress = lesson.progress?.stageProgress;
    const estudeUnits = stageProgress?.estude?.total || 3;
    const mediteUnits = stageProgress?.medite?.total || 2;
    const respondaUnits = stageProgress?.responda?.total || 3;
    const estudeCompleted = stageProgress?.estude?.completed || 0;
    const mediteCompleted = stageProgress?.medite?.completed || 0;
    const respondaCompleted = stageProgress?.responda?.completed || 0;
    
    const completedUnits = estudeCompleted + mediteCompleted + respondaCompleted;
    const totalUnits = estudeUnits + mediteUnits + respondaUnits;
    
    let estudeStatus: 'completed' | 'current' | 'locked' = 'locked';
    let mediteStatus: 'completed' | 'current' | 'locked' = 'locked';
    let respondaStatus: 'completed' | 'current' | 'locked' = 'locked';
    
    if (lessonStatus === 'completed') {
      estudeStatus = 'completed';
      mediteStatus = 'completed';
      respondaStatus = 'completed';
    } else if (lessonStatus === 'in_progress') {
      const estudeComplete = estudeCompleted >= estudeUnits && estudeUnits > 0;
      const mediteComplete = mediteCompleted >= mediteUnits && mediteUnits > 0;
      
      if (estudeComplete) {
        estudeStatus = 'completed';
        if (mediteComplete) {
          mediteStatus = 'completed';
          respondaStatus = 'current';
        } else {
          mediteStatus = 'current';
        }
      } else {
        estudeStatus = 'current';
      }
    }

    return {
      id: lesson.id,
      number: lesson.orderIndex + 1,
      title: lesson.title,
      description: lesson.description || '',
      status: lessonStatus,
      sectionsCompleted: completedUnits,
      totalSections: totalUnits,
      xpReward: lesson.xpReward || 50,
      stages: {
        estude: { status: estudeStatus, completed: estudeCompleted, total: estudeUnits },
        medite: { status: mediteStatus, completed: mediteCompleted, total: mediteUnits },
        responda: { status: respondaStatus, completed: respondaCompleted, total: respondaUnits }
      }
    };
  });

  const lessonsCompleted = transformedLessons.filter(l => l.status === 'completed').length;
  const lessonsInProgress = transformedLessons.filter(l => l.status === 'in_progress').length;
  const lessonsLocked = transformedLessons.filter(l => l.status === 'locked').length;
  const totalLessons = transformedLessons.length;
  const progress = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;

  const filteredLessons = filterStatus === 'all' 
    ? transformedLessons 
    : transformedLessons.filter(l => l.status === filterStatus);

  const handleLessonStageClick = (lessonId: number, stage: 'estude' | 'medite' | 'responda') => {
    const lesson = transformedLessons.find(l => l.id === lessonId);
    if (lesson && lesson.status !== 'locked') {
      setLocation(`/study/lesson/${lessonId}?stage=${stage}`);
    }
  };
  
  const handleContinueLearning = (lessonId: number) => {
    setLocation(`/study/lesson/${lessonId}`);
  };

  const weekTitle = currentWeek?.title || 'Parabolas de Jesus';
  const weekDescription = currentWeek?.description || 'Ensinamentos praticos para vida crista';

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="study-home">
      <CelebrationComponent />
      
      <StudyHeader onBack={() => setLocation('/membro')} />
      
      <TrimestreCard 
        title={weekTitle}
        subtitle={weekDescription}
        totalLessons={totalLessons}
        estimatedMinutes={45}
      />

      <ProgressSection 
        progress={progress}
        completed={lessonsCompleted}
        inProgress={lessonsInProgress}
        locked={lessonsLocked}
      />

      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Todas as Licoes</h2>
          <button 
            className="flex items-center gap-1 text-purple-600 font-medium text-sm"
            data-testid="button-filter"
          >
            <Filter className="h-4 w-4" />
            Filtrar
          </button>
        </div>

        {transformedLessons.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {filteredLessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                id={`lesson-${lesson.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <LessonCard 
                  lesson={lesson}
                  previousLessonNumber={index > 0 ? filteredLessons[index - 1].number : undefined}
                  onStageClick={handleLessonStageClick}
                  onContinue={handleContinueLearning}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
