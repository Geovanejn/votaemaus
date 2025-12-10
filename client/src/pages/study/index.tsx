import { useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  BottomNav,
  LearningPath,
  useCelebration,
  WeeklyGoalsWidget
} from "@/components/study";
import type { LessonItem, StageType, StageItem, QuestionResult } from "@/components/study";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Flame, Zap, Heart, Loader2, Target } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/NotificationCenter";

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

function UserProfileHeader({ 
  userName, 
  userPhoto,
  profile 
}: { 
  userName: string;
  userPhoto?: string | null;
  profile: StudyProfile;
}) {
  const [, setLocation] = useLocation();
  
  return (
    <div 
      className="px-4 pt-4 pb-4"
      style={{
        background: 'linear-gradient(180deg, #FFC800 0%, #FFD633 100%)',
      }}
    >
      <div className="max-w-lg mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border-3 border-white shadow-lg">
              <AvatarImage src={userPhoto || undefined} />
              <AvatarFallback 
                className="text-xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #87CEEB 0%, #4A90D9 100%)',
                  color: 'white'
                }}
              >
                {userName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-white/80 font-medium">Olá,</p>
              <h1 className="text-lg font-bold text-white" data-testid="text-user-name">
                {userName}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-full bg-white/20">
              <NotificationCenter />
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full bg-white/20"
              onClick={() => setLocation('/study/profile')}
              data-testid="button-settings"
            >
              <Settings className="h-5 w-5 text-white" />
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center justify-center px-2 py-2.5 rounded-lg bg-[#FF9600] shadow-md"
            style={{ boxShadow: '0 3px 0 0 #CC7700' }}
          >
            <Flame className="h-4 w-4 text-white" />
            <span className="font-bold text-white text-sm">{profile.currentStreak}</span>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center justify-center px-2 py-1.5 rounded-lg bg-[#58CC02] shadow-md"
            style={{ boxShadow: '0 3px 0 0 #46A302' }}
          >
            <Zap className="h-4 w-4 text-white" />
            <span className="font-bold text-white text-sm">{profile.totalXp}</span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center justify-center px-2 py-1.5 rounded-lg bg-[#FF4B4B] shadow-md cursor-pointer"
            style={{ boxShadow: '0 3px 0 0 #CC3333' }}
            onClick={() => setLocation('/study/verses')}
            data-testid="button-hearts"
          >
            <Heart className="h-4 w-4 text-white fill-white" />
            <span className="font-bold text-white text-sm">{profile.hearts}/{profile.heartsMax}</span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center justify-center px-2 py-1.5 rounded-lg bg-[#1CB0F6] shadow-md cursor-pointer"
            style={{ boxShadow: '0 3px 0 0 #0D94D7' }}
            onClick={() => setLocation('/study/missions')}
            data-testid="button-missions"
          >
            <Target className="h-4 w-4 text-white" />
            <span className="font-bold text-white text-xs">Missões</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function DailyGoalSection({ 
  lessonsCompleted, 
  totalLessons 
}: { 
  lessonsCompleted: number; 
  totalLessons: number;
}) {
  const target = Math.min(totalLessons, 5);
  const current = Math.min(lessonsCompleted, target);
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const remaining = target - current;
  
  return (
    <div className="px-4 py-4 bg-background border-b border-border">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-2 gap-2">
          <h2 className="font-bold text-foreground">Meta Diária</h2>
          <span className="text-sm font-bold text-[#58CC02]">{current}/{target}</span>
        </div>
        
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 bg-[#58CC02] rounded-full"
          />
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          {remaining > 0 
            ? `Mais ${remaining} lições para completar sua meta!`
            : "Parabéns! Você completou sua meta diária!"
          }
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" data-testid="study-loading">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#FFA500]" />
        <p className="text-muted-foreground">Carregando estudos...</p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="study-error">
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-bold text-foreground mb-2">Erro ao carregar</h1>
        <p className="text-muted-foreground mb-4">
          Não foi possível carregar os dados do estudo. Por favor, tente novamente.
        </p>
        <Button onClick={onRetry} data-testid="button-retry">
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}

function NotAuthenticatedState() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="study-not-auth">
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-bold text-foreground mb-2">Faça login para continuar</h1>
        <p className="text-muted-foreground mb-4">
          Você precisa estar logado para acessar os estudos.
        </p>
        <Button onClick={() => setLocation('/')} data-testid="button-login">
          Fazer Login
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-4" data-testid="study-empty">
      <div className="text-center max-w-sm">
        <h2 className="text-xl font-bold text-foreground mb-2">Nenhum estudo disponível</h2>
        <p className="text-muted-foreground">
          Os estudos semanais serão liberados em breve. Volte mais tarde!
        </p>
      </div>
    </div>
  );
}

export default function StudyHomePage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { CelebrationComponent } = useCelebration();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const scrollAttemptedRef = useRef(false);

  const { data: profile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useQuery<StudyProfile>({
    queryKey: ['/api/study/profile'],
    enabled: isAuthenticated,
  });

  const { data: weeks, isLoading: weeksLoading, error: weeksError, refetch: refetchWeeks } = useQuery<StudyWeek[]>({
    queryKey: ['/api/study/weeks'],
    enabled: isAuthenticated && !!profile,
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
  
  const lessons: LessonItem[] = rawLessons.map((lesson, index) => {
    const previousLesson = index > 0 ? rawLessons[index - 1] : null;
    const isPreviousLessonComplete = !previousLesson || previousLesson.status === 'completed';
    
    let status: 'completed' | 'current' | 'locked' = 'locked';
    if (lesson.status === 'completed') {
      status = 'completed';
    } else if ((lesson.status === 'in_progress' || lesson.status === 'available') && isPreviousLessonComplete) {
      status = 'current';
    } else if (isPreviousLessonComplete && lesson.status !== 'completed') {
      status = 'current';
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
    
    if (status === 'completed') {
      estudeStatus = 'completed';
      mediteStatus = 'completed';
      respondaStatus = 'completed';
    } else if (status === 'current') {
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
    
    const respondaQuestionResults = stageProgress?.responda?.questionResults;
    
    const stages: StageItem[] = [
      {
        type: 'estude' as StageType,
        status: estudeStatus,
        completedUnits: estudeCompleted,
        totalUnits: estudeUnits
      },
      {
        type: 'medite' as StageType,
        status: mediteStatus,
        completedUnits: mediteCompleted,
        totalUnits: mediteUnits
      },
      {
        type: 'responda' as StageType,
        status: respondaStatus,
        completedUnits: respondaCompleted,
        totalUnits: respondaUnits,
        questionResults: respondaQuestionResults
      }
    ];

    return {
      id: lesson.id,
      lessonNumber: lesson.orderIndex + 1,
      title: `Lição ${lesson.orderIndex + 1}`,
      subtitle: lesson.title,
      status,
      progress: completedUnits,
      totalSections: totalUnits,
      stages
    };
  });

  const lessonsCompleted = lessons.filter(l => l.status === 'completed').length;

  const handleLessonClick = (lessonId: number, stage?: StageType) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson && lesson.status !== 'locked') {
      const stageParam = stage ? `?stage=${stage}` : '';
      setLocation(`/study/lesson/${lessonId}${stageParam}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="study-home">
      <CelebrationComponent />
      
      <UserProfileHeader 
        userName={user.fullName} 
        userPhoto={user.photoUrl}
        profile={profile} 
      />
      
      <div className="px-4 py-4">
        <div className="max-w-lg mx-auto">
          <WeeklyGoalsWidget />
        </div>
      </div>

      {lessons.length > 0 ? (
        <LearningPath 
          lessons={lessons}
          onLessonClick={handleLessonClick}
          onPracticeClick={() => setLocation('/study/practice')}
          showPractice={lessonsCompleted > 0}
        />
      ) : (
        <EmptyState />
      )}

      <BottomNav />
    </div>
  );
}
