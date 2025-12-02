import { useLocation } from "wouter";
import { 
  BottomNav,
  UnitCard,
  PracticeCard,
  useCelebration
} from "@/components/study";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Flame, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const mockUserProfile = {
  name: "Maria Silva",
  avatar: "",
  level: 5,
  totalXP: 450,
  streak: 7,
};

const mockUnits = [
  { 
    id: 1, 
    title: "Unidade 1", 
    subtitle: "Forme frases basicas", 
    status: "completed" as const, 
    progress: 3, 
    totalLessons: 5,
    icon: "star" as const
  },
  { 
    id: 2, 
    title: "Unidade 2", 
    subtitle: "Cumprimentos basicos", 
    status: "current" as const, 
    progress: 1, 
    totalLessons: 5,
    icon: "message" as const
  },
  { 
    id: 3, 
    title: "Unidade 3", 
    subtitle: "Apresentacoes", 
    status: "locked" as const, 
    progress: 0, 
    totalLessons: 5,
    icon: "presentation" as const
  },
  { 
    id: 4, 
    title: "Unidade 4", 
    subtitle: "Comida e bebida", 
    status: "locked" as const, 
    progress: 0, 
    totalLessons: 5,
    icon: "presentation" as const
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

function LearningPathSection({ 
  units, 
  onUnitClick 
}: { 
  units: typeof mockUnits; 
  onUnitClick: (unitId: number) => void;
}) {
  const currentUnitIndex = units.findIndex(u => u.status === "current");
  
  return (
    <div className="px-4 py-6">
      <div className="max-w-lg mx-auto">
        <h2 className="font-bold text-xl text-foreground mb-4">Seu Caminho</h2>
        
        <div className="relative">
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-3">
            {units.map((unit, index) => (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {index < units.length - 1 && unit.status !== "locked" && (
                  <div 
                    className={cn(
                      "absolute left-7 top-14 w-0.5 h-3 z-10",
                      unit.status === "completed" ? "bg-[#58CC02]" : "bg-border"
                    )}
                  />
                )}
                
                <UnitCard
                  id={unit.id}
                  title={unit.title}
                  subtitle={unit.subtitle}
                  status={unit.status}
                  progress={unit.progress}
                  totalLessons={unit.totalLessons}
                  icon={unit.icon}
                  onClick={() => onUnitClick(unit.id)}
                />
              </motion.div>
            ))}
            
            {currentUnitIndex !== -1 && currentUnitIndex < units.length - 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (currentUnitIndex + 1) * 0.1 }}
              >
                <PracticeCard onClick={() => {}} />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudyHomePage() {
  const [, setLocation] = useLocation();
  const { CelebrationComponent } = useCelebration();

  const handleUnitClick = (unitId: number) => {
    const unit = mockUnits.find(u => u.id === unitId);
    if (unit && unit.status !== "locked") {
      setLocation(`/study/lesson/${unitId}`);
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
      
      <LearningPathSection 
        units={mockUnits} 
        onUnitClick={handleUnitClick} 
      />

      <BottomNav />
    </div>
  );
}
