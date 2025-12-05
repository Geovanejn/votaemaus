import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/study";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  BookOpen, 
  Trophy, 
  Lock, 
  Check, 
  Star, 
  Loader2,
  Flame,
  Crown,
  Play,
  Award,
  ChevronRight
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

const lessonColors = [
  { bg: "#FF9600", shadow: "#CC7700" },
  { bg: "#58CC02", shadow: "#46A302" },
  { bg: "#1CB0F6", shadow: "#1899D6" },
  { bg: "#A560E8", shadow: "#8A4DC7" },
  { bg: "#FF4B4B", shadow: "#CC3B3B" },
];

function getLessonColor(index: number) {
  return lessonColors[index % lessonColors.length];
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
  const color = getLessonColor(index);
  const isCompleted = lesson.status === 'completed';
  const isAvailable = !lesson.isLocked && previousCompleted;
  const isLocked = lesson.isLocked || !previousCompleted;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
    >
      {index > 0 && (
        <div className={cn(
          "absolute left-7 -top-4 w-0.5 h-4",
          isLocked ? "bg-muted" : "bg-[#58CC02]"
        )} />
      )}
      
      <motion.button
        whileHover={!isLocked ? { scale: 1.02, x: 4 } : undefined}
        whileTap={!isLocked ? { scale: 0.98 } : undefined}
        onClick={!isLocked ? onClick : undefined}
        disabled={isLocked}
        className={cn(
          "w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all",
          "bg-card border-2",
          isLocked 
            ? "opacity-60 cursor-not-allowed border-muted" 
            : isCompleted 
              ? "border-[#58CC02]" 
              : "border-border"
        )}
        data-testid={`lesson-card-${lesson.id}`}
      >
        <div 
          className={cn(
            "flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center relative"
          )}
          style={{
            backgroundColor: isLocked ? '#9CA3AF' : isCompleted ? '#58CC02' : color.bg,
            boxShadow: `0 4px 0 0 ${isLocked ? '#6B7280' : isCompleted ? '#46A302' : color.shadow}`
          }}
        >
          {isLocked ? (
            <Lock className="h-6 w-6 text-white/70" />
          ) : isCompleted ? (
            <Check className="h-6 w-6 text-white stroke-[3]" />
          ) : (
            <span className="text-xl font-black text-white">{lesson.lessonNumber}</span>
          )}
          
          {isCompleted && (
            <motion.div 
              className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 + 0.3, type: "spring" }}
            >
              <Star className="h-3 w-3 text-[#FFD700] fill-[#FFD700]" />
            </motion.div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "font-bold text-base",
              isLocked ? "text-muted-foreground/50" : "text-foreground"
            )}>
              Lição {lesson.lessonNumber}
            </h3>
            {lesson.isBonus && (
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                Bônus
              </Badge>
            )}
          </div>
          <p className={cn(
            "text-sm truncate",
            isLocked ? "text-muted-foreground/40" : "text-muted-foreground"
          )}>
            {lesson.title}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className={cn(
              "text-xs flex items-center gap-1",
              isLocked ? "text-muted-foreground/40" : "text-muted-foreground"
            )}>
              <Flame className="h-3 w-3" />
              {lesson.xpReward} XP
            </span>
            <span className={cn(
              "text-xs",
              isLocked ? "text-muted-foreground/40" : "text-muted-foreground"
            )}>
              ~{lesson.estimatedMinutes} min
            </span>
          </div>
        </div>

        {!isLocked && !isCompleted && (
          <div 
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: color.bg }}
          >
            <Play className="h-5 w-5 text-white ml-0.5" />
          </div>
        )}
        
        {isCompleted && (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
      </motion.button>
    </motion.div>
  );
}

function FinalChallengeCard({ 
  isUnlocked, 
  isCompleted,
  bestScore,
  onClick 
}: { 
  isUnlocked: boolean;
  isCompleted: boolean;
  bestScore: number | null;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card 
        className={cn(
          "overflow-hidden border-2",
          isUnlocked 
            ? isCompleted 
              ? "border-[#FFD700]" 
              : "border-purple-500" 
            : "border-muted"
        )}
      >
        <div 
          className="p-5"
          style={{
            background: isUnlocked 
              ? isCompleted
                ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                : 'linear-gradient(135deg, #A560E8 0%, #7C3AED 100%)'
              : 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)',
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center bg-white/20"
                style={{ 
                  boxShadow: isUnlocked 
                    ? isCompleted 
                      ? '0 4px 0 0 #CC8400' 
                      : '0 4px 0 0 #6D28D9' 
                    : '0 4px 0 0 #4B5563' 
                }}
              >
                {isUnlocked ? (
                  isCompleted ? (
                    <Crown className="h-7 w-7 text-white" />
                  ) : (
                    <Trophy className="h-7 w-7 text-white" />
                  )
                ) : (
                  <Lock className="h-7 w-7 text-white/70" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Desafio Final</h3>
                <p className="text-sm text-white/80">
                  {isUnlocked 
                    ? isCompleted 
                      ? 'Temporada dominada!' 
                      : '15 perguntas em 2:30 min'
                    : 'Complete todas as lições'
                  }
                </p>
              </div>
            </div>
            
            {isCompleted && bestScore !== null && (
              <Badge className="bg-white/20 text-white border-0">
                <Star className="h-3 w-3 mr-1 fill-white" />
                {bestScore}%
              </Badge>
            )}
          </div>
        </div>

        <div className="p-4 bg-card">
          {isUnlocked ? (
            <Button
              onClick={onClick}
              className={cn(
                "w-full font-bold",
                isCompleted 
                  ? "bg-[#FFD700] hover:bg-[#E6C200] text-[#8B6914]"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              )}
              style={{ 
                boxShadow: isCompleted 
                  ? '0 4px 0 0 #CC9F00' 
                  : '0 4px 0 0 #7C3AED' 
              }}
              data-testid="button-final-challenge"
            >
              {isCompleted ? (
                <span className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  JOGAR NOVAMENTE
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  INICIAR DESAFIO
                </span>
              )}
            </Button>
          ) : (
            <p className="text-sm text-center text-muted-foreground">
              Complete todas as lições para desbloquear
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" data-testid="season-detail-loading">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#FFA500]" />
        <p className="text-muted-foreground">Carregando temporada...</p>
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
          Não foi possível carregar a temporada. Por favor, tente novamente.
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
    setLocation('/study/seasons');
  };

  const handleLessonClick = (lessonId: number) => {
    setLocation(`/study/lesson/${lessonId}`);
  };

  const handleFinalChallenge = () => {
    setLocation(`/study/season/${seasonId}/challenge`);
  };

  if (authLoading || isLoading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return <ErrorState onRetry={refetch} onBack={handleBack} />;
  }

  const { season, lessons, userProgress, finalChallenge } = data;
  const progress = userProgress 
    ? (userProgress.lessonsCompleted / userProgress.totalLessons) * 100 
    : 0;
  const allLessonsCompleted = userProgress?.lessonsCompleted === season.totalLessons && season.totalLessons > 0;

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="season-detail-page">
      <header 
        className="sticky top-0 z-50 border-b border-border/50"
        style={{
          background: 'linear-gradient(180deg, #FFA500 0%, #FFD700 100%)',
        }}
      >
        <div className="flex items-center gap-3 p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="text-white hover:bg-white/20"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-black text-lg text-white truncate">{season.title}</h1>
            {season.subtitle && (
              <p className="text-sm text-white/80 truncate">{season.subtitle}</p>
            )}
          </div>
          {userProgress && userProgress.isMastered && (
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="h-6 w-6 text-white drop-shadow-lg" />
            </motion.div>
          )}
        </div>

        {userProgress && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white/80">Seu progresso</span>
              <span className="text-sm font-bold text-white">
                {userProgress.lessonsCompleted}/{userProgress.totalLessons} lições
              </span>
            </div>
            <div className="h-3 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8 }}
                className="h-full rounded-full bg-white"
              />
            </div>
            {userProgress.xpEarned > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <Flame className="h-4 w-4 text-white" />
                <span className="text-sm font-bold text-white">{userProgress.xpEarned} XP ganhos</span>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {season.description && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-2"
          >
            <p className="text-sm text-muted-foreground">{season.description}</p>
          </motion.div>
        )}

        <div className="space-y-4">
          <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#FFA500]" />
            Lições
          </h2>
          
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

        <FinalChallengeCard
          isUnlocked={allLessonsCompleted}
          isCompleted={finalChallenge?.isCompleted || false}
          bestScore={finalChallenge?.bestScore || null}
          onClick={handleFinalChallenge}
        />
      </main>

      <BottomNav />
    </div>
  );
}
