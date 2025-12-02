import { useState } from "react";
import { useLocation } from "wouter";
import { 
  LessonMap, 
  HeartsDisplay, 
  XPDisplay, 
  StreakBadge, 
  LevelBadge,
  BottomNav,
  useCelebration
} from "@/components/study";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Bell, ChevronRight, Target, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const mockUserProfile = {
  name: "Joao Silva",
  avatar: "",
  level: 5,
  totalXP: 450,
  xpForNextLevel: 800,
  streak: 7,
  hearts: 4,
  maxHearts: 5,
  heartsRefillMinutes: 180,
  dailyGoalMinutes: 10,
  dailyProgressMinutes: 6
};

const mockLessons = [
  { id: 1, title: "Introducao", type: "intro" as const, status: "completed" as const, xpReward: 10 },
  { id: 2, title: "O que e fe?", type: "study" as const, status: "completed" as const, xpReward: 15 },
  { id: 3, title: "Meditacao", type: "meditation" as const, status: "available" as const, xpReward: 20 },
  { id: 4, title: "Exemplos de fe", type: "study" as const, status: "locked" as const, xpReward: 15 },
  { id: 5, title: "Desafio", type: "challenge" as const, status: "locked" as const, xpReward: 30, isBonus: true },
];

function DailyGoalCard({ 
  goalMinutes, 
  progressMinutes 
}: { 
  goalMinutes: number; 
  progressMinutes: number;
}) {
  const progress = Math.min(100, (progressMinutes / goalMinutes) * 100);
  const isComplete = progressMinutes >= goalMinutes;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-4",
        "bg-gradient-to-br from-[#FFA500]/10 via-[#FFD700]/5 to-transparent",
        "dark:from-[#FFA500]/20 dark:via-[#FFD700]/10 dark:to-transparent",
        "border border-[#FFA500]/20"
      )}
      data-testid="daily-goal-card"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.div 
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl",
              isComplete 
                ? "bg-gradient-to-br from-[#58CC02] to-[#46A302]" 
                : "bg-gradient-to-br from-[#FFA500] to-[#D68A00]"
            )}
            animate={isComplete ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Target className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <p className="text-sm font-bold text-foreground">Meta Diaria</p>
            <p className="text-xs text-muted-foreground">
              {progressMinutes} de {goalMinutes} minutos
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <span className={cn(
            "text-2xl font-black",
            isComplete ? "text-[#58CC02]" : "text-[#FFA500]"
          )}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      
      <div className="mt-3 h-2 bg-muted/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            isComplete 
              ? "bg-gradient-to-r from-[#58CC02] to-[#7BD937]" 
              : "bg-gradient-to-r from-[#FFA500] to-[#FFD700]"
          )}
        />
      </div>
    </motion.div>
  );
}

function StreakCard({ streak }: { streak: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-gradient-to-br from-[#FF9600]/10 to-[#FF6B00]/5",
        "dark:from-[#FF9600]/20 dark:to-[#FF6B00]/10",
        "border border-[#FF9600]/20"
      )}
      data-testid="streak-card"
    >
      <motion.div
        animate={{ 
          rotate: [0, -5, 5, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        <Flame className="h-8 w-8 text-[#FF9600] fill-[#FF9600]/30" />
      </motion.div>
      <div>
        <p className="text-2xl font-black text-[#FF9600]">{streak}</p>
        <p className="text-xs font-medium text-muted-foreground">
          {streak === 1 ? "dia de ofensiva" : "dias de ofensiva"}
        </p>
      </div>
    </motion.div>
  );
}

export default function StudyHomePage() {
  const [, setLocation] = useLocation();
  const { celebrating, CelebrationComponent, celebrate } = useCelebration();

  const handleLessonClick = (lessonId: number) => {
    const lesson = mockLessons.find(l => l.id === lessonId);
    if (lesson && lesson.status !== "locked") {
      setLocation(`/study/lesson/${lessonId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="study-home">
      <CelebrationComponent />
      
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between p-3 max-w-lg mx-auto">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Avatar className="h-11 w-11 border-2 border-[#FFA500]/30">
              <AvatarImage src={mockUserProfile.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-[#FFA500] to-[#D68A00] text-white font-bold">
                {mockUserProfile.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-sm text-foreground" data-testid="text-user-name">
                {mockUserProfile.name}
              </p>
              <XPDisplay amount={mockUserProfile.totalXP} size="sm" />
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <StreakBadge days={mockUserProfile.streak} size="sm" showLabel={false} />
            <div className="w-px h-6 bg-border mx-1" />
            <HeartsDisplay 
              current={mockUserProfile.hearts} 
              max={mockUserProfile.maxHearts} 
              size="sm"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-1"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
            </Button>
          </motion.div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <DailyGoalCard 
            goalMinutes={mockUserProfile.dailyGoalMinutes}
            progressMinutes={mockUserProfile.dailyProgressMinutes}
          />
          <StreakCard streak={mockUserProfile.streak} />
        </div>

        <motion.div 
          className="flex items-center justify-center mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <LevelBadge 
            level={mockUserProfile.level}
            currentXP={mockUserProfile.totalXP}
            xpForNextLevel={mockUserProfile.xpForNextLevel}
            size="lg"
          />
        </motion.div>

        <LessonMap
          weekTitle="A Fe que Transforma"
          weekNumber={48}
          lessons={mockLessons}
          onLessonClick={handleLessonClick}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 mb-4"
        >
          <Button 
            variant="outline" 
            className="w-full justify-between group"
            onClick={() => celebrate("confetti")}
            data-testid="button-test-celebration"
          >
            <span>Testar Celebracao</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
