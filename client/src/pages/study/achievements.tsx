import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BottomNav } from "@/components/study";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Flame, 
  Target, 
  BookOpen, 
  ArrowLeft,
  Star,
  Medal,
  Zap,
  Crown,
  Award,
  TrendingUp,
  Heart,
  Sunrise,
  Moon,
  Calendar,
  CheckCircle,
  CalendarCheck,
  BookMarked,
  BookHeart,
  Shield,
  GraduationCap,
  Loader2,
  Lock,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  category: string;
  requirement: any;
  isSecret: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
}

const iconMap: Record<string, typeof Flame> = {
  flame: Flame,
  book: BookOpen,
  "book-open": BookOpen,
  "book-heart": BookHeart,
  "book-marked": BookMarked,
  "graduation-cap": GraduationCap,
  trophy: Trophy,
  crown: Crown,
  star: Star,
  stars: Star,
  award: Award,
  zap: Zap,
  shield: Shield,
  medal: Medal,
  sunrise: Sunrise,
  moon: Moon,
  calendar: Calendar,
  heart: Heart,
  target: Target,
  "check-circle": CheckCircle,
  "calendar-check": CalendarCheck,
  "trending-up": TrendingUp,
};

const categoryLabels: Record<string, string> = {
  streak: "Sequencia",
  lessons: "Licoes",
  xp: "Experiencia",
  special: "Especiais",
};

const categoryColors: Record<string, string> = {
  streak: "#FF9600",
  lessons: "#58CC02",
  xp: "#FFC800",
  special: "#1CB0F6",
};

function getIconComponent(iconName: string) {
  return iconMap[iconName.toLowerCase()] || Star;
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const IconComponent = getIconComponent(achievement.icon);
  const categoryColor = categoryColors[achievement.category] || "#888";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card 
        className={cn(
          "p-4 transition-all",
          achievement.unlocked 
            ? "bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800" 
            : "opacity-60"
        )}
        data-testid={`achievement-card-${achievement.code}`}
      >
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 relative",
            achievement.unlocked 
              ? "bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg"
              : "bg-muted"
          )}>
            {achievement.unlocked ? (
              <IconComponent className="h-7 w-7 text-white" />
            ) : (
              <>
                <IconComponent className="h-7 w-7 text-muted-foreground/30" />
                <Lock className="h-4 w-4 text-muted-foreground absolute bottom-0 right-0" />
              </>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn(
                "font-bold",
                achievement.unlocked ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
              )}>
                {achievement.name}
              </h3>
              <Badge 
                variant="secondary" 
                className="text-[10px]"
                style={{ 
                  backgroundColor: `${categoryColor}20`, 
                  color: categoryColor 
                }}
              >
                {categoryLabels[achievement.category] || achievement.category}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mt-1">
              {achievement.description}
            </p>
            
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-sm">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="font-medium">+{achievement.xpReward} XP</span>
              </div>
              
              {achievement.unlocked && achievement.unlockedAt && (
                <span className="text-xs text-muted-foreground">
                  Desbloqueada em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando conquistas...</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Medal className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <h3 className="text-lg font-bold text-muted-foreground">Nenhuma conquista encontrada</h3>
      <p className="text-sm text-muted-foreground text-center mt-1">
        Execute o seed do sistema para popular as conquistas
      </p>
    </div>
  );
}

const mockAchievements: Achievement[] = [
  { id: 1, code: "first_lesson", name: "Primeiro Passo", description: "Complete sua primeira licao no sistema de estudos", icon: "book", xpReward: 5, category: "lessons", requirement: {}, isSecret: false, unlocked: true, unlockedAt: new Date().toISOString() },
  { id: 2, code: "streak_3", name: "Persistente", description: "Mantenha uma sequencia de 3 dias", icon: "flame", xpReward: 10, category: "streak", requirement: {}, isSecret: false, unlocked: true, unlockedAt: new Date().toISOString() },
  { id: 3, code: "streak_7", name: "Semana Perfeita", description: "Complete 7 dias consecutivos de estudo", icon: "flame", xpReward: 25, category: "streak", requirement: {}, isSecret: false, unlocked: true, unlockedAt: new Date().toISOString() },
  { id: 4, code: "lessons_5", name: "Estudante Aplicado", description: "Complete 5 licoes no total", icon: "book-open", xpReward: 20, category: "lessons", requirement: {}, isSecret: false, unlocked: false, unlockedAt: null },
  { id: 5, code: "lessons_10", name: "Dedicado", description: "Complete 10 licoes no total", icon: "graduation-cap", xpReward: 50, category: "lessons", requirement: {}, isSecret: false, unlocked: false, unlockedAt: null },
  { id: 6, code: "xp_100", name: "Centena", description: "Acumule 100 pontos de XP", icon: "zap", xpReward: 10, category: "xp", requirement: {}, isSecret: false, unlocked: true, unlockedAt: new Date().toISOString() },
  { id: 7, code: "xp_500", name: "Meio Mil", description: "Acumule 500 pontos de XP", icon: "star", xpReward: 25, category: "xp", requirement: {}, isSecret: false, unlocked: false, unlockedAt: null },
  { id: 8, code: "streak_30", name: "Mes de Fe", description: "Complete 30 dias consecutivos de estudo", icon: "crown", xpReward: 100, category: "streak", requirement: {}, isSecret: false, unlocked: false, unlockedAt: null },
  { id: 9, code: "early_bird", name: "Madrugador", description: "Complete uma licao antes das 7h da manha", icon: "sunrise", xpReward: 15, category: "special", requirement: {}, isSecret: false, unlocked: false, unlockedAt: null },
  { id: 10, code: "night_owl", name: "Coruja Noturna", description: "Complete uma licao apos as 23h", icon: "moon", xpReward: 15, category: "special", requirement: {}, isSecret: false, unlocked: false, unlockedAt: null },
];

export default function AchievementsPage() {
  const [location, setLocation] = useLocation();
  const [filter, setFilter] = useState<string>("all");
  const { isAuthenticated } = useAuth();
  
  const isPreview = location.startsWith("/study-preview");

  const { data: achievements, isLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/study/achievements'],
    enabled: isAuthenticated && !isPreview,
  });

  const isPageLoading = !isPreview && isLoading;
  
  if (isPageLoading) {
    return <LoadingState />;
  }
  
  const effectiveAchievements = isPreview ? mockAchievements : achievements;

  const categories = ["all", ...Array.from(new Set(effectiveAchievements?.map(a => a.category) || []))];
  
  const filteredAchievements = effectiveAchievements?.filter(a => 
    filter === "all" || a.category === filter
  ) || [];

  const unlockedCount = effectiveAchievements?.filter(a => a.unlocked).length || 0;
  const totalCount = effectiveAchievements?.length || 0;

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="achievements-page">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation(isPreview ? "/study-preview/profile" : "/study/profile")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Conquistas</h1>
              <p className="text-xs text-muted-foreground">
                {unlockedCount} de {totalCount} desbloqueadas
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 overflow-x-auto">
          {categories.map(category => (
            <Button
              key={category}
              variant={filter === category ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(category)}
              className={cn(
                "flex-shrink-0",
                filter === category && "bg-primary"
              )}
              data-testid={`filter-${category}`}
            >
              {category === "all" ? "Todas" : categoryLabels[category] || category}
            </Button>
          ))}
        </div>

        <Card className="p-4 bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/10 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-amber-700 dark:text-amber-400">
                {unlockedCount}/{totalCount}
              </h2>
              <p className="text-sm text-amber-600 dark:text-amber-500">
                Conquistas desbloqueadas
              </p>
              <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-2 mt-2">
                <div 
                  className="bg-amber-500 h-2 rounded-full transition-all"
                  style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {filteredAchievements.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {filteredAchievements
              .sort((a, b) => {
                if (a.unlocked && !b.unlocked) return -1;
                if (!a.unlocked && b.unlocked) return 1;
                return 0;
              })
              .map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AchievementCard achievement={achievement} />
                </motion.div>
              ))
            }
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
