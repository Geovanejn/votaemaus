import { useLocation } from "wouter";
import { 
  BottomNav,
  LearningPath,
  useCelebration
} from "@/components/study";
import type { LessonItem } from "@/components/study";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Flame, Zap } from "lucide-react";
import { motion } from "framer-motion";

const mockUserProfile = {
  name: "Maria Silva",
  avatar: "",
  level: 5,
  totalXP: 450,
  streak: 7,
};

const mockLessons: LessonItem[] = [
  { 
    id: 1, 
    lessonNumber: 1,
    title: "Licao 1", 
    subtitle: "Uma paixao unica pela qual viver", 
    status: "completed", 
    progress: 5, 
    totalSections: 5,
  },
  { 
    id: 2, 
    lessonNumber: 2,
    title: "Licao 2", 
    subtitle: "Nao desperdice sua vida", 
    status: "completed", 
    progress: 5, 
    totalSections: 5,
  },
  { 
    id: 3, 
    lessonNumber: 3,
    title: "Licao 3", 
    subtitle: "Gloria somente na cruz", 
    status: "current", 
    progress: 2, 
    totalSections: 5,
  },
  { 
    id: 4, 
    lessonNumber: 4,
    title: "Licao 4", 
    subtitle: "Glorificando a Cristo por meio de dor e morte (1)", 
    status: "locked", 
    progress: 0, 
    totalSections: 5,
  },
  { 
    id: 5, 
    lessonNumber: 5,
    title: "Licao 5", 
    subtitle: "Glorificando a Cristo por meio de dor e morte (2)", 
    status: "locked", 
    progress: 0, 
    totalSections: 5,
  },
];

const mockDailyGoal = {
  current: 3,
  target: 5,
};

function UserProfileHeader({ user }: { user: typeof mockUserProfile }) {
  return (
    <div 
      className="px-4 pt-6 pb-8"
      style={{
        background: 'linear-gradient(180deg, #FFC800 0%, #FFD633 100%)',
      }}
    >
      <div className="max-w-lg mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border-3 border-white shadow-lg">
              <AvatarImage src={user.avatar} />
              <AvatarFallback 
                className="text-xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #87CEEB 0%, #4A90D9 100%)',
                  color: 'white'
                }}
              >
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-white/80 font-medium">Ola,</p>
              <h1 className="text-lg font-bold text-white" data-testid="text-user-name">
                {user.name}
              </h1>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full bg-white/20"
            data-testid="button-settings"
          >
            <Settings className="h-5 w-5 text-white" />
          </motion.button>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF9600] shadow-lg"
            style={{ boxShadow: '0 4px 0 0 #CC7700' }}
          >
            <Flame className="h-5 w-5 text-white" />
            <span className="font-bold text-white">{user.streak}</span>
            <span className="text-white/80 text-sm">dias</span>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#58CC02] shadow-lg"
            style={{ boxShadow: '0 4px 0 0 #46A302' }}
          >
            <Zap className="h-5 w-5 text-white" />
            <span className="font-bold text-white">{user.totalXP}</span>
            <span className="text-white/80 text-sm">XP</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function DailyGoalSection({ current, target }: { current: number; target: number }) {
  const percentage = Math.min((current / target) * 100, 100);
  const remaining = target - current;
  
  return (
    <div className="px-4 py-4 bg-background border-b border-border">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-foreground">Meta Diaria</h2>
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
            ? `Mais ${remaining} licoes para completar sua meta!`
            : "Parabens! Voce completou sua meta diaria!"
          }
        </p>
      </div>
    </div>
  );
}

export default function StudyHomePage() {
  const [, setLocation] = useLocation();
  const { CelebrationComponent } = useCelebration();

  const handleLessonClick = (lessonId: number) => {
    const lesson = mockLessons.find(l => l.id === lessonId);
    if (lesson && lesson.status !== "locked") {
      setLocation(`/study/lesson/${lessonId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="study-home">
      <CelebrationComponent />
      
      <UserProfileHeader user={mockUserProfile} />
      
      <DailyGoalSection 
        current={mockDailyGoal.current} 
        target={mockDailyGoal.target} 
      />
      
      <LearningPath 
        lessons={mockLessons}
        onLessonClick={handleLessonClick}
        onPracticeClick={() => setLocation('/study/practice')}
        showPractice={true}
      />

      <BottomNav />
    </div>
  );
}
