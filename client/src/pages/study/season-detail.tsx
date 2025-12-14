import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/study";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  BookOpen, 
  Lock, 
  Check, 
  Loader2,
  Clock,
  MoreVertical,
  Filter,
  FileText,
  Lightbulb,
  Pen,
  BookMarked
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Season {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  coverImageUrl: string | null;
  status: string;
  totalLessons: number;
  publishedAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

interface Lesson {
  id: number;
  seasonId: number;
  orderIndex: number;
  lessonNumber: number;
  title: string;
  type: string;
  description: string | null;
  xpReward: number;
  estimatedMinutes: number;
  icon: string | null;
  isBonus: boolean;
  isLocked: boolean;
  status: string;
  studyCompleted?: boolean;
  meditationCompleted?: boolean;
  quizCompleted?: boolean;
  sectionsCompleted?: number;
  totalSections?: number;
}

interface SeasonDetail {
  season: Season;
  lessons: Lesson[];
  userProgress?: {
    lessonsCompleted: number;
    totalLessons: number;
    xpEarned: number;
    isMastered: boolean;
    completedAt: string | null;
  };
  finalChallenge?: {
    id: number;
    isUnlocked: boolean;
    isCompleted: boolean;
    bestScore: number | null;
  };
}

function ActionButton({ 
  icon: Icon, 
  label, 
  completed, 
  disabled,
  onClick
}: { 
  icon: typeof FileText; 
  label: string; 
  completed: boolean;
  disabled: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all flex-1 min-w-0",
        completed 
          ? "border-2 border-emerald-500 bg-white dark:bg-gray-900" 
          : disabled 
            ? "border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60" 
            : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
      )}
      data-testid={`button-action-${label.toLowerCase()}`}
    >
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center",
        completed 
          ? "bg-emerald-50 dark:bg-emerald-900/30" 
          : disabled 
            ? "bg-gray-100 dark:bg-gray-800" 
            : "bg-indigo-50 dark:bg-indigo-900/30"
      )}>
        {disabled ? (
          <Lock className="h-4 w-4 text-gray-400" />
        ) : (
          <Icon className={cn(
            "h-4 w-4",
            completed 
              ? "text-emerald-600 dark:text-emerald-400" 
              : "text-indigo-600 dark:text-indigo-400"
          )} />
        )}
      </div>
      <span className={cn(
        "text-xs font-medium",
        completed 
          ? "text-emerald-600 dark:text-emerald-400" 
          : disabled 
            ? "text-gray-400" 
            : "text-gray-700 dark:text-gray-300"
      )}>
        {label}
      </span>
      {completed && (
        <Check className="h-3 w-3 text-emerald-500" />
      )}
    </button>
  );
}

function LessonCard({ 
  lesson, 
  index,
  onClick,
  previousCompleted
}: { 
  lesson: Lesson; 
  index: number;
  onClick: () => void;
  previousCompleted: boolean;
}) {
  const isCompleted = lesson.status === 'completed';
  const isInProgress = lesson.status === 'in_progress' || (previousCompleted && !isCompleted && !lesson.isLocked);
  const isLocked = lesson.isLocked || (!previousCompleted && !isCompleted);
  
  const sectionsCompleted = lesson.sectionsCompleted || 0;
  const totalSections = lesson.totalSections || 3;
  
  const studyDone = lesson.studyCompleted || isCompleted;
  const meditationDone = lesson.meditationCompleted || isCompleted;
  const quizDone = lesson.quizCompleted || isCompleted;

  const getXpDisplay = () => {
    if (isCompleted) return `+${lesson.xpReward} XP`;
    if (isInProgress) return `+${Math.floor(lesson.xpReward * 0.66)} XP`;
    return `${lesson.xpReward} XP`;
  };

  const getXpColor = () => {
    if (isCompleted) return "text-emerald-500";
    if (isInProgress) return "text-purple-500";
    return "text-gray-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
    >
      {index > 0 && (
        <div className={cn(
          "absolute left-6 -top-3 w-0.5 h-3",
          isLocked ? "bg-gray-200 dark:bg-gray-700" : "bg-emerald-400"
        )} />
      )}
      
      <Card className={cn(
        "overflow-hidden transition-all bg-white dark:bg-gray-900 shadow-sm",
        isLocked 
          ? "border-gray-200 dark:border-gray-700" 
          : isCompleted 
            ? "border-emerald-100 dark:border-emerald-900/50" 
            : isInProgress
              ? "border-purple-100 dark:border-purple-900/50"
              : "border-border"
      )} data-testid={`lesson-card-${lesson.id}`}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center",
              isCompleted 
                ? "bg-emerald-500" 
                : isInProgress 
                  ? "bg-purple-500"
                  : "bg-gray-200 dark:bg-gray-700"
            )}>
              {isCompleted ? (
                <Check className="h-5 w-5 text-white stroke-[3]" />
              ) : (
                <span className={cn(
                  "text-base font-bold",
                  isLocked ? "text-gray-400" : "text-white"
                )}>
                  {lesson.lessonNumber}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={cn(
                    "text-xs font-semibold uppercase tracking-wide block",
                    isCompleted 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : isInProgress 
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-gray-400"
                  )}>
                    LICAO {lesson.lessonNumber}
                  </span>
                  <span className={cn(
                    "text-xs font-medium",
                    isCompleted 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : isInProgress 
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-gray-400"
                  )}>
                    {isCompleted ? "Completa" : isInProgress ? "Em Progresso" : "Bloqueada"}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={cn("text-sm font-bold", getXpColor())}>
                    {getXpDisplay()}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {sectionsCompleted}/{totalSections} secoes
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <h3 className={cn(
              "font-bold text-base",
              isLocked ? "text-gray-400" : "text-foreground"
            )}>
              {lesson.title}
            </h3>
            {lesson.description && (
              <p className={cn(
                "text-sm mt-1 line-clamp-2",
                isLocked ? "text-gray-300 dark:text-gray-600" : "text-muted-foreground"
              )}>
                {lesson.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <ActionButton
              icon={FileText}
              label="Estude"
              completed={studyDone}
              disabled={isLocked}
              onClick={!isLocked ? onClick : undefined}
            />
            <ActionButton
              icon={Lightbulb}
              label="Medite"
              completed={meditationDone}
              disabled={isLocked || !studyDone}
            />
            <ActionButton
              icon={Pen}
              label="Responda"
              completed={quizDone}
              disabled={isLocked || !meditationDone}
            />
          </div>

          {isInProgress && !isLocked && (
            <Button
              onClick={onClick}
              className="w-full mt-4 font-bold text-white rounded-xl h-12"
              style={{ 
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                boxShadow: '0 4px 0 0 #6d28d9' 
              }}
              data-testid="button-continue-lesson"
            >
              Continuar Licao
            </Button>
          )}
        </div>
      </Card>

      {isLocked && (
        <p className="text-xs text-center text-muted-foreground mt-2">
          Complete a Licao {lesson.lessonNumber - 1} para desbloquear
        </p>
      )}
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" data-testid="season-detail-loading">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
        <p className="text-muted-foreground">Carregando estudos...</p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="season-detail-error">
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-bold text-foreground mb-2">Erro ao carregar</h1>
        <p className="text-muted-foreground mb-4">
          Nao foi possivel carregar os estudos. Por favor, tente novamente.
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={onBack} data-testid="button-back">
            Voltar
          </Button>
          <Button onClick={onRetry} data-testid="button-retry">
            Tentar novamente
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SeasonDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const seasonId = params.id;

  const { data, isLoading, error, refetch } = useQuery<SeasonDetail>({
    queryKey: ['/api/study/seasons', seasonId],
    enabled: isAuthenticated && !!seasonId,
  });

  const handleBack = () => {
    setLocation('/study/estudos');
  };

  const handleLessonClick = (lessonId: number) => {
    setLocation(`/study/lesson/${lessonId}`);
  };

  if (authLoading || isLoading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return <ErrorState onRetry={refetch} onBack={handleBack} />;
  }

  const { season, lessons, userProgress } = data;
  const progress = userProgress 
    ? Math.round((userProgress.lessonsCompleted / userProgress.totalLessons) * 100)
    : 0;

  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const inProgressCount = lessons.filter(l => l.status === 'in_progress').length;
  const lockedCount = lessons.filter(l => l.isLocked || l.status === 'locked').length;

  const estimatedTotalMinutes = lessons.reduce((acc, l) => acc + (l.estimatedMinutes || 45), 0);
  const avgMinutesPerLesson = lessons.length > 0 ? Math.round(estimatedTotalMinutes / lessons.length) : 45;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24" data-testid="season-detail-page">
      <header 
        className="sticky top-0 z-50"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="text-white hover:bg-white/20"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg text-white">Estudos</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20"
            data-testid="button-menu"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        <div 
          className="px-5 pt-5 pb-8"
          style={{
            background: 'linear-gradient(180deg, #c026d3 0%, #a855f7 50%, #8b5cf6 100%)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <BookMarked className="h-5 w-5 text-white" />
            </div>
            <span 
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: '#a3e635', color: '#365314' }}
            >
              Trimestre 2024
            </span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">{season.title}</h2>
          <p className="text-white/80 text-sm mb-5">
            {season.description || season.subtitle || "Ensinamentos praticos para vida crista"}
          </p>
          
          <div className="flex items-center gap-5 text-white/90 text-sm">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span>{season.totalLessons} Licoes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>~{avgMinutesPerLesson} min cada</span>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-5">
          <Card className="p-5 shadow-lg bg-white dark:bg-gray-900 border-0">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-foreground">Seu Progresso</span>
              <span className="text-xl font-bold text-emerald-500" data-testid="text-progress-percent">{progress}%</span>
            </div>
            
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8 }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)' }}
              />
            </div>

            <div className="flex items-center justify-around text-center">
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-completed-count">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Completas</p>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-inprogress-count">{inProgressCount}</p>
                <p className="text-xs text-muted-foreground">Em Progresso</p>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-locked-count">{lockedCount}</p>
                <p className="text-xs text-muted-foreground">Bloqueadas</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="font-bold text-lg text-foreground">Todas as Licoes</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-purple-600 dark:text-purple-400 gap-1.5 font-medium" 
              data-testid="button-filter"
            >
              <Filter className="h-4 w-4" />
              Filtrar
            </Button>
          </div>
          
          <div className="space-y-4">
            {lessons.map((lesson, index) => {
              const previousLesson = lessons[index - 1];
              const previousCompleted = index === 0 || previousLesson?.status === 'completed';
              
              return (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  index={index}
                  onClick={() => handleLessonClick(lesson.id)}
                  previousCompleted={previousCompleted}
                />
              );
            })}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
