import { useState, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { BottomNav, ContinueLearning } from "@/components/study";
import type { ContinueLearningData } from "@/components/study";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Lock, 
  Check, 
  Loader2,
  Clock,
  ArrowLeft,
  MoreVertical,
  Filter,
  FileText,
  Lightbulb,
  Pen,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

interface SeasonDetailResponse extends Season {
  lessons: Lesson[];
  progress?: {
    lessonsCompleted: number;
    totalLessons: number;
    xpEarned: number;
    isMastered: boolean;
    completedAt: string | null;
  };
  finalChallenge?: {
    id: number;
    title: string;
    description: string | null;
    timeLimitSeconds: number;
    questionCount: number;
    isActive: boolean;
  } | null;
}

function ActionButton({ 
  icon: Icon, 
  label, 
  completed, 
  disabled,
  active,
  onClick
}: { 
  icon: typeof FileText; 
  label: string; 
  completed: boolean;
  disabled: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  const isActive = active && !completed && !disabled;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all flex-1 min-w-0",
        isActive 
          ? "bg-violet-50 dark:bg-violet-900/20 border-2 border-violet-400" 
          : completed 
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500" 
            : "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
      )}
      data-testid={`button-action-${label.toLowerCase()}`}
    >
      {disabled && !completed ? (
        <Lock className="h-5 w-5 text-gray-400" />
      ) : (
        <Icon className={cn(
          "h-5 w-5",
          isActive 
            ? "text-violet-600 dark:text-violet-400" 
            : completed 
              ? "text-emerald-600 dark:text-emerald-400" 
              : "text-gray-500"
        )} />
      )}
      <span className={cn(
        "text-xs font-semibold",
        isActive 
          ? "text-violet-700 dark:text-violet-300" 
          : completed 
            ? "text-emerald-600 dark:text-emerald-400" 
            : "text-gray-500"
      )}>
        {label}
      </span>
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

  const getStatusText = () => {
    if (isCompleted) return "Completa";
    if (isInProgress) return "Em Progresso";
    return "Bloqueada";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
      data-testid={`lesson-card-${lesson.id}`}
    >
      <Card className={cn(
        "overflow-hidden transition-all bg-white dark:bg-gray-900 border-0 shadow-md relative"
      )}>
        <div 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg",
            isCompleted 
              ? "bg-emerald-500" 
              : isInProgress 
                ? "bg-violet-500"
                : "bg-gray-300 dark:bg-gray-600"
          )}
        />
        
        <div className="p-4 pl-5">
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center",
              isCompleted 
                ? "bg-emerald-500" 
                : isInProgress 
                  ? "bg-violet-500"
                  : "bg-gray-300 dark:bg-gray-600"
            )}>
              {isCompleted ? (
                <Check className="h-5 w-5 text-white stroke-[3]" />
              ) : (
                <span className={cn(
                  "text-base font-bold",
                  isLocked ? "text-gray-500" : "text-white"
                )}>
                  {lesson.lessonNumber}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400 block">
                    LICAO
                  </span>
                  <span className={cn(
                    "text-xs font-semibold",
                    isCompleted 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : isInProgress 
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-gray-400"
                  )}>
                    {getStatusText()}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={cn(
                    "text-sm font-bold",
                    isCompleted 
                      ? "text-emerald-500" 
                      : isInProgress 
                        ? "text-violet-500"
                        : "text-gray-400"
                  )}>
                    +{lesson.xpReward} XP
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {sectionsCompleted}/{totalSections} secoes
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className={cn(
              "font-bold text-base uppercase leading-tight",
              isLocked ? "text-gray-400" : "text-foreground"
            )}>
              {lesson.title} ({lesson.lessonNumber})
            </h3>
            {lesson.description && (
              <p className={cn(
                "text-sm mt-1",
                isLocked ? "text-gray-300 dark:text-gray-600" : "text-muted-foreground"
              )}>
                Versiculo base: {lesson.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <ActionButton
              icon={BookOpen}
              label="Estude"
              completed={studyDone}
              disabled={isLocked}
              active={!studyDone && !isLocked}
              onClick={!isLocked ? onClick : undefined}
            />
            <ActionButton
              icon={Lightbulb}
              label="Medite"
              completed={meditationDone}
              disabled={isLocked || !studyDone}
              active={studyDone && !meditationDone && !isLocked}
            />
            <ActionButton
              icon={Pen}
              label="Responda"
              completed={quizDone}
              disabled={isLocked || !meditationDone}
              active={meditationDone && !quizDone && !isLocked}
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
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" data-testid="seasons-loading">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
        <p className="text-muted-foreground">Carregando estudos...</p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="seasons-error">
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-bold text-foreground mb-2">Erro ao carregar</h1>
        <p className="text-muted-foreground mb-4">
          Nao foi possivel carregar os estudos. Por favor, tente novamente.
        </p>
        <Button onClick={onRetry} data-testid="button-retry">
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" data-testid="seasons-empty">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4"
      >
        <BookOpen className="h-12 w-12 text-muted-foreground" />
      </motion.div>
      <h2 className="text-xl font-bold text-foreground mb-2">Nenhum estudo disponivel</h2>
      <p className="text-muted-foreground mb-4">
        Os estudos serao liberados em breve. Enquanto isso, continue estudando as licoes da semana!
      </p>
      <Button 
        onClick={() => setLocation('/study')} 
        className="font-bold"
        style={{ 
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          boxShadow: '0 4px 0 0 #c2410c' 
        }}
        data-testid="button-go-to-study"
      >
        Ir para Estudos
      </Button>
    </div>
  );
}

function ProgressCard({ 
  progress, 
  completedCount, 
  inProgressCount, 
  lockedCount 
}: { 
  progress: number;
  completedCount: number;
  inProgressCount: number;
  lockedCount: number;
}) {
  return (
    <Card className="p-5 shadow-lg bg-white dark:bg-gray-900 border-0 rounded-2xl">
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="font-semibold text-foreground text-base">Seu Progresso</span>
        <span className="text-2xl font-bold text-emerald-500" data-testid="text-progress-percent">{progress}%</span>
      </div>
      
      <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-5">
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
  );
}

function SeasonCard({ 
  season, 
  lessonsCount,
  avgMinutes,
  isExpanded,
  onToggle
}: { 
  season: Season;
  lessonsCount: number;
  avgMinutes: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      className="cursor-pointer"
    >
      <Card 
        className="overflow-hidden border-0 shadow-lg rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #c026d3 0%, #a855f7 50%, #8b5cf6 100%)',
        }}
      >
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <Badge 
              className="bg-yellow-400 text-yellow-900 font-bold text-xs px-3 py-1 rounded-full border-0"
            >
              Trimestre 2024
            </Badge>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">{season.title}</h2>
          <p className="text-white/80 text-sm mb-4">
            {season.description || season.subtitle || "Ensinamentos praticos para vida crista"}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-white/90 text-sm">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                <span>{lessonsCount} Licoes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>~{avgMinutes} min cada</span>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-white/80" />
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function SeasonContent({ 
  season, 
  lessons, 
  userProgress,
  onBack,
  onLessonClick
}: { 
  season: Season;
  lessons: Lesson[];
  userProgress?: SeasonDetailResponse['progress'];
  onBack: () => void;
  onLessonClick: (lessonId: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const lessonRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const progress = userProgress 
    ? Math.round((userProgress.lessonsCompleted / userProgress.totalLessons) * 100)
    : 0;

  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const inProgressCount = lessons.filter(l => l.status === 'in_progress').length;
  const lockedCount = lessons.filter(l => l.isLocked || l.status === 'locked').length;

  const estimatedTotalMinutes = lessons.reduce((acc, l) => acc + (l.estimatedMinutes || 45), 0);
  const avgMinutesPerLesson = lessons.length > 0 ? Math.round(estimatedTotalMinutes / lessons.length) : 45;

  const inProgressLesson = lessons.find((lesson, index) => {
    const previousLesson = lessons[index - 1];
    const previousCompleted = index === 0 || previousLesson?.status === 'completed';
    const isCompleted = lesson.status === 'completed';
    const isInProgress = lesson.status === 'in_progress' || (previousCompleted && !isCompleted && !lesson.isLocked);
    return isInProgress && !lesson.isLocked;
  });

  const continueLearningData: ContinueLearningData | null = inProgressLesson ? {
    unitNumber: 1,
    unitTitle: season.title,
    lessonNumber: inProgressLesson.lessonNumber,
    lessonTitle: inProgressLesson.title,
    sectionsRemaining: Math.max(0, (inProgressLesson.totalSections || 3) - (inProgressLesson.sectionsCompleted || 0)),
    totalSections: inProgressLesson.totalSections || 3,
    progress: inProgressLesson.totalSections 
      ? Math.min(100, Math.round(((inProgressLesson.sectionsCompleted || 0) / inProgressLesson.totalSections) * 100))
      : 0,
    lessonId: inProgressLesson.id
  } : null;

  const handleContinueClick = (lessonId: number) => {
    if (!isExpanded) {
      setIsExpanded(true);
      setTimeout(() => {
        lessonRefs.current[lessonId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
    } else {
      lessonRefs.current[lessonId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <>
      <header 
        className="sticky top-0 z-50"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="text-white no-default-hover-elevate no-default-active-elevate"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg text-white">Estudos</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white no-default-hover-elevate no-default-active-elevate"
            data-testid="button-menu"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <ProgressCard 
          progress={progress}
          completedCount={completedCount}
          inProgressCount={inProgressCount}
          lockedCount={lockedCount}
        />

        {continueLearningData && (
          <ContinueLearning 
            data={continueLearningData}
            onContinue={handleContinueClick}
          />
        )}

        <SeasonCard 
          season={season}
          lessonsCount={season.totalLessons}
          avgMinutes={avgMinutesPerLesson}
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
        />

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-2">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <h3 className="font-bold text-lg text-foreground">Todas as Licoes</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-indigo-600 dark:text-indigo-400 gap-1.5 font-medium" 
                    data-testid="button-filter"
                  >
                    <Filter className="h-4 w-4" />
                    Filtrar
                  </Button>
                </div>
                
                <div className="space-y-5">
                  {lessons.map((lesson, index) => {
                    const previousLesson = lessons[index - 1];
                    const previousCompleted = index === 0 || previousLesson?.status === 'completed';
                    
                    return (
                      <div 
                        key={lesson.id} 
                        ref={el => { lessonRefs.current[lesson.id] = el; }}
                      >
                        <LessonCard
                          key={lesson.id}
                          lesson={lesson}
                          index={index}
                          onClick={() => onLessonClick(lesson.id)}
                          previousCompleted={previousCompleted}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

export default function SeasonsPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: seasons, isLoading: seasonsLoading, error: seasonsError, refetch: refetchSeasons } = useQuery<Season[]>({
    queryKey: ['/api/study/seasons'],
    enabled: isAuthenticated,
  });

  const currentSeason = seasons?.[0];

  const { data: seasonDetail, isLoading: detailLoading } = useQuery<SeasonDetailResponse>({
    queryKey: ['/api/study/seasons', currentSeason?.id?.toString()],
    enabled: isAuthenticated && !!currentSeason?.id,
  });

  const isLoading = authLoading || seasonsLoading || (currentSeason && detailLoading);

  const handleBack = () => {
    setLocation('/study');
  };

  const handleLessonClick = (lessonId: number) => {
    setLocation(`/study/lesson/${lessonId}`);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (seasonsError) {
    return <ErrorState onRetry={refetchSeasons} />;
  }

  const hasSeasons = seasons && seasons.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24" data-testid="seasons-page">
      {hasSeasons && seasonDetail?.id ? (
        <SeasonContent 
          season={{
            id: seasonDetail.id,
            title: seasonDetail.title,
            subtitle: seasonDetail.subtitle,
            description: seasonDetail.description,
            coverImageUrl: seasonDetail.coverImageUrl,
            status: seasonDetail.status,
            totalLessons: seasonDetail.totalLessons,
            publishedAt: seasonDetail.publishedAt,
            startsAt: seasonDetail.startsAt,
            endsAt: seasonDetail.endsAt,
          }}
          lessons={seasonDetail.lessons || []}
          userProgress={seasonDetail.progress}
          onBack={handleBack}
          onLessonClick={handleLessonClick}
        />
      ) : (
        <>
          <header 
            className="sticky top-0 z-50"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBack}
                className="text-white no-default-hover-elevate no-default-active-elevate"
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="font-bold text-lg text-white">Estudos</h1>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white no-default-hover-elevate no-default-active-elevate"
                data-testid="button-menu"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </header>
          <EmptyState />
        </>
      )}

      <BottomNav />
    </div>
  );
}
