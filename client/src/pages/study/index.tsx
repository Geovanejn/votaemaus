import { useState } from "react";
import { useLocation } from "wouter";
import { 
  LessonMap, 
  HeartsDisplay, 
  XPDisplay, 
  StreakBadge, 
  LevelBadge,
  BottomNav,
  DailyMissions,
  useCelebration
} from "@/components/study";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Flame, Zap } from "lucide-react";
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

const mockMissions = [
  { id: "1", title: "Comece uma ofensiva", current: 1, target: 1, icon: "streak" as const, isCompleted: true },
  { id: "2", title: "Leia a proxima historia na sua trilha", current: 0, target: 1, icon: "lesson" as const, isCompleted: false },
  { id: "3", title: "Faca 2 licoes perfeitas", current: 0, target: 2, icon: "perfect" as const, isCompleted: false },
];

function StatBadge({ 
  icon: Icon, 
  value, 
  color,
  onClick
}: { 
  icon: typeof Flame; 
  value: number | string; 
  color: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl",
        "bg-muted/50 border border-border/50"
      )}
    >
      <Icon className="h-5 w-5" style={{ color }} />
      <span className="font-bold text-sm" style={{ color }}>{value}</span>
    </motion.button>
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
            <Avatar className="h-10 w-10 border-2 border-[#FFA500]/30">
              <AvatarImage src={mockUserProfile.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-[#FFA500] to-[#D68A00] text-white font-bold text-sm">
                {mockUserProfile.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <StatBadge icon={Flame} value={mockUserProfile.streak} color="#FF9600" />
            <StatBadge icon={Zap} value={mockUserProfile.totalXP} color="#FFC800" />
            <HeartsDisplay 
              current={mockUserProfile.hearts} 
              max={mockUserProfile.maxHearts} 
              size="sm"
            />
          </motion.div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6">
        <LessonMap
          weekTitle="Converse sobre habitos"
          weekNumber={48}
          sectionNumber={1}
          unitNumber={9}
          lessons={mockLessons}
          onLessonClick={handleLessonClick}
        />

        <div className="mt-8">
          <DailyMissions 
            missions={mockMissions}
            hoursRemaining={13}
          />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
