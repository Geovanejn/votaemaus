import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, 
  BookMarked, 
  Target, 
  Calendar,
  Trophy,
  Flame,
  Check,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GoalItem {
  current: number;
  target: number;
  completed: boolean;
}

interface WeeklyGoalStatus {
  goals: {
    lessons: GoalItem;
    verses: GoalItem;
    missions: GoalItem;
    devotionals: GoalItem;
  };
  overallProgress: number;
  isGoalMet: boolean;
  xpBonus: number;
}

interface GoalCardProps {
  icon: typeof BookOpen;
  label: string;
  current: number;
  target: number;
  completed: boolean;
  color: string;
  bgColor: string;
  delay?: number;
}

function GoalCard({ 
  icon: Icon, 
  label, 
  current, 
  target, 
  completed,
  color,
  bgColor,
  delay = 0
}: GoalCardProps) {
  const progress = Math.min((current / target) * 100, 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="relative"
    >
      <div 
        className={cn(
          "flex flex-col items-center p-3 rounded-lg border transition-all",
          completed ? "border-green-500/50" : "border-border",
          bgColor
        )}
      >
        <div 
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center mb-2 relative",
            completed ? "bg-green-500" : color
          )}
        >
          {completed ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Check className="w-5 h-5 text-white" />
            </motion.div>
          ) : (
            <Icon className="w-5 h-5 text-white" />
          )}
          
          {completed && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </motion.div>
          )}
        </div>
        
        <span className="text-xs text-muted-foreground text-center mb-1">{label}</span>
        
        <div className="flex items-baseline gap-0.5">
          <span className={cn(
            "text-lg font-bold",
            completed ? "text-green-500" : "text-foreground"
          )}>
            {current}
          </span>
          <span className="text-xs text-muted-foreground">/{target}</span>
        </div>
        
        <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: delay + 0.2, duration: 0.5 }}
            className={cn(
              "h-full rounded-full",
              completed ? "bg-green-500" : color.replace("bg-", "bg-")
            )}
            style={{ backgroundColor: completed ? undefined : undefined }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function WeeklyGoalsWidgetSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-5 h-5" />
        <Skeleton className="w-32 h-5" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center p-3">
            <Skeleton className="w-10 h-10 rounded-full mb-2" />
            <Skeleton className="w-12 h-3 mb-1" />
            <Skeleton className="w-8 h-5" />
          </div>
        ))}
      </div>
    </Card>
  );
}

interface WeeklyGoalsWidgetProps {
  compact?: boolean;
  showTitle?: boolean;
}

function NotAuthenticatedPlaceholder() {
  return (
    <Card className="p-4" data-testid="widget-weekly-goals-placeholder">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
          <Flame className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Meta Semanal</h3>
          <p className="text-xs text-muted-foreground">Faca login para acompanhar</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 opacity-50">
        {[BookOpen, BookMarked, Target, Calendar].map((Icon, i) => (
          <div key={i} className="flex flex-col items-center p-3 rounded-lg border bg-muted/30">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
              <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground text-center">--</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-bold text-muted-foreground">0</span>
              <span className="text-xs text-muted-foreground">/0</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ErrorPlaceholder({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="p-4" data-testid="widget-weekly-goals-error">
      <div className="text-center py-4">
        <Flame className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-3">Erro ao carregar metas semanais</p>
        <button 
          onClick={onRetry}
          className="text-sm text-primary hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    </Card>
  );
}

export function WeeklyGoalsWidget({ compact = false, showTitle = true }: WeeklyGoalsWidgetProps) {
  const { isAuthenticated } = useAuth();

  const { data: weeklyGoal, isLoading, isError, refetch } = useQuery<WeeklyGoalStatus>({
    queryKey: ["/api/study/weekly-goal"],
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  if (!isAuthenticated) {
    return <NotAuthenticatedPlaceholder />;
  }

  if (isLoading) {
    return <WeeklyGoalsWidgetSkeleton />;
  }

  if (isError || !weeklyGoal) {
    return <ErrorPlaceholder onRetry={() => refetch()} />;
  }

  const { goals, overallProgress, isGoalMet, xpBonus } = weeklyGoal;

  const goalItems = [
    {
      key: "lessons",
      icon: BookOpen,
      label: "Licoes",
      ...goals.lessons,
      color: "bg-blue-500",
      bgColor: goals.lessons.completed ? "bg-green-500/5" : "bg-blue-500/5",
    },
    {
      key: "verses",
      icon: BookMarked,
      label: "Versiculos",
      ...goals.verses,
      color: "bg-purple-500",
      bgColor: goals.verses.completed ? "bg-green-500/5" : "bg-purple-500/5",
    },
    {
      key: "missions",
      icon: Target,
      label: "Missoes",
      ...goals.missions,
      color: "bg-orange-500",
      bgColor: goals.missions.completed ? "bg-green-500/5" : "bg-orange-500/5",
    },
    {
      key: "devotionals",
      icon: Calendar,
      label: "Devocionais",
      ...goals.devotionals,
      color: "bg-teal-500",
      bgColor: goals.devotionals.completed ? "bg-green-500/5" : "bg-teal-500/5",
    },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium">{Math.round(overallProgress)}%</span>
        </div>
        <div className="flex gap-1">
          {goalItems.map((item) => (
            <div
              key={item.key}
              className={cn(
                "w-2 h-2 rounded-full",
                item.completed ? "bg-green-500" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="p-4" data-testid="widget-weekly-goals">
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Meta Semanal</h3>
              <p className="text-xs text-muted-foreground">Seu progresso esta semana</p>
            </div>
          </div>
          
          {isGoalMet && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                <Trophy className="w-3 h-3 mr-1" />
                +{xpBonus} XP
              </Badge>
            </motion.div>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 mb-4">
        {goalItems.map((item, index) => (
          <GoalCard
            key={item.key}
            icon={item.icon}
            label={item.label}
            current={item.current}
            target={item.target}
            completed={item.completed}
            color={item.color}
            bgColor={item.bgColor}
            delay={index * 0.1}
          />
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso geral</span>
          <span className="font-semibold">{Math.round(overallProgress)}%</span>
        </div>
        
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              isGoalMet 
                ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                : "bg-gradient-to-r from-blue-500 to-purple-500"
            )}
          />
        </div>

        {!isGoalMet && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Complete todas as metas para ganhar{" "}
            <span className="font-semibold text-yellow-500">+{xpBonus || 50} XP</span> de bonus!
          </p>
        )}

        <AnimatePresence>
          {isGoalMet && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-2"
            >
              <p className="text-sm font-medium text-green-500 flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4" />
                Parabens! Voce completou sua meta semanal!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
