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
  Share2,
  Sparkles,
  Book
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  book: Book,
  "book-open": BookOpen,
  "book-heart": BookHeart,
  "book-marked": BookMarked,
  "graduation-cap": GraduationCap,
  trophy: Trophy,
  crown: Crown,
  star: Star,
  stars: Sparkles,
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

const categoryColors: Record<string, { primary: string; secondary: string; gradient: string; shadow: string; text: string }> = {
  streak: { 
    primary: "#FF9600", 
    secondary: "#FF6B00",
    gradient: "from-orange-400 via-orange-500 to-red-500",
    shadow: "shadow-orange-500/50",
    text: "text-orange-600 dark:text-orange-400"
  },
  lessons: { 
    primary: "#58CC02", 
    secondary: "#45A302",
    gradient: "from-green-400 via-green-500 to-emerald-600",
    shadow: "shadow-green-500/50",
    text: "text-green-600 dark:text-green-400"
  },
  xp: { 
    primary: "#FFC800", 
    secondary: "#FFAB00",
    gradient: "from-yellow-400 via-amber-500 to-orange-500",
    shadow: "shadow-yellow-500/50",
    text: "text-yellow-600 dark:text-yellow-400"
  },
  special: { 
    primary: "#1CB0F6", 
    secondary: "#0D9DE5",
    gradient: "from-blue-400 via-cyan-500 to-teal-500",
    shadow: "shadow-blue-500/50",
    text: "text-blue-600 dark:text-blue-400"
  },
};

const achievementIconStyles: Record<string, { gradient: string; shadow: string; innerGlow: string }> = {
  flame: { gradient: "from-orange-400 to-red-600", shadow: "shadow-orange-500/60", innerGlow: "bg-orange-300" },
  book: { gradient: "from-emerald-400 to-green-600", shadow: "shadow-green-500/60", innerGlow: "bg-green-300" },
  "book-open": { gradient: "from-green-400 to-emerald-600", shadow: "shadow-emerald-500/60", innerGlow: "bg-emerald-300" },
  "book-heart": { gradient: "from-pink-400 to-rose-600", shadow: "shadow-pink-500/60", innerGlow: "bg-pink-300" },
  "book-marked": { gradient: "from-teal-400 to-cyan-600", shadow: "shadow-teal-500/60", innerGlow: "bg-teal-300" },
  "graduation-cap": { gradient: "from-indigo-400 to-purple-600", shadow: "shadow-indigo-500/60", innerGlow: "bg-indigo-300" },
  trophy: { gradient: "from-amber-400 to-yellow-600", shadow: "shadow-amber-500/60", innerGlow: "bg-amber-300" },
  crown: { gradient: "from-yellow-400 via-amber-500 to-orange-500", shadow: "shadow-amber-500/60", innerGlow: "bg-yellow-200" },
  star: { gradient: "from-yellow-300 to-amber-500", shadow: "shadow-yellow-500/60", innerGlow: "bg-yellow-200" },
  stars: { gradient: "from-purple-400 to-pink-600", shadow: "shadow-purple-500/60", innerGlow: "bg-purple-300" },
  award: { gradient: "from-rose-400 to-red-600", shadow: "shadow-rose-500/60", innerGlow: "bg-rose-300" },
  zap: { gradient: "from-yellow-400 to-orange-500", shadow: "shadow-yellow-500/60", innerGlow: "bg-yellow-200" },
  shield: { gradient: "from-slate-400 to-zinc-600", shadow: "shadow-slate-500/60", innerGlow: "bg-slate-300" },
  medal: { gradient: "from-amber-300 via-yellow-400 to-amber-600", shadow: "shadow-amber-500/60", innerGlow: "bg-amber-200" },
  sunrise: { gradient: "from-orange-300 via-yellow-400 to-orange-500", shadow: "shadow-orange-500/60", innerGlow: "bg-orange-200" },
  moon: { gradient: "from-indigo-400 to-purple-700", shadow: "shadow-indigo-500/60", innerGlow: "bg-indigo-300" },
  calendar: { gradient: "from-blue-400 to-indigo-600", shadow: "shadow-blue-500/60", innerGlow: "bg-blue-300" },
  heart: { gradient: "from-red-400 to-pink-600", shadow: "shadow-red-500/60", innerGlow: "bg-red-300" },
  target: { gradient: "from-red-500 to-rose-600", shadow: "shadow-red-500/60", innerGlow: "bg-red-300" },
  "check-circle": { gradient: "from-green-400 to-emerald-600", shadow: "shadow-green-500/60", innerGlow: "bg-green-300" },
  "calendar-check": { gradient: "from-teal-400 to-cyan-600", shadow: "shadow-teal-500/60", innerGlow: "bg-teal-300" },
  "trending-up": { gradient: "from-cyan-400 to-blue-600", shadow: "shadow-cyan-500/60", innerGlow: "bg-cyan-300" },
};

function getIconComponent(iconName: string) {
  return iconMap[iconName.toLowerCase()] || Star;
}

function getIconStyles(iconName: string) {
  return achievementIconStyles[iconName.toLowerCase()] || { 
    gradient: "from-amber-400 to-amber-600", 
    shadow: "shadow-amber-500/60",
    innerGlow: "bg-amber-300"
  };
}

function AchievementIcon({ icon, unlocked, size = "normal" }: { icon: string; unlocked: boolean; size?: "normal" | "large" }) {
  const IconComponent = getIconComponent(icon);
  const styles = getIconStyles(icon);
  const sizeClasses = size === "large" ? "w-24 h-24" : "w-16 h-16";
  const iconSizeClasses = size === "large" ? "h-12 w-12" : "h-8 w-8";
  
  if (!unlocked) {
    return (
      <div className={cn(
        sizeClasses,
        "rounded-full flex items-center justify-center relative bg-muted border-2 border-muted-foreground/20"
      )}>
        <IconComponent className={cn(iconSizeClasses, "text-muted-foreground/30")} />
        <div className="absolute bottom-0 right-0 w-6 h-6 bg-muted-foreground/50 rounded-full flex items-center justify-center">
          <Lock className="h-3 w-3 text-white" />
        </div>
      </div>
    );
  }
  
  return (
    <motion.div 
      className={cn(
        sizeClasses,
        "rounded-full flex items-center justify-center relative",
        `bg-gradient-to-br ${styles.gradient}`,
        `shadow-lg ${styles.shadow}`
      )}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className={cn(
        "absolute inset-1 rounded-full opacity-30",
        styles.innerGlow
      )} />
      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent" />
      <IconComponent className={cn(iconSizeClasses, "text-white relative z-10 drop-shadow-md")} />
      <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent opacity-50 blur-sm" />
    </motion.div>
  );
}

function ShareableAchievementCard({ achievement, onClose }: { achievement: Achievement; onClose: () => void }) {
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const categoryStyle = categoryColors[achievement.category] || categoryColors.special;
  
  const handleShare = async () => {
    try {
      const shareText = `Desbloqueei a conquista "${achievement.name}" no DeoGlory! ${achievement.description} - ${window.location.origin}`;
      const shareData = {
        title: `Conquista Desbloqueada: ${achievement.name}`,
        text: `Desbloqueei a conquista "${achievement.name}" no DeoGlory! ${achievement.description}`,
        url: window.location.origin
      };
      
      const canUseNativeShare = navigator.share && 
        (typeof navigator.canShare === 'function' ? navigator.canShare(shareData) : true);
      
      if (canUseNativeShare) {
        await navigator.share(shareData);
        toast({
          title: "Compartilhado!",
          description: "Sua conquista foi compartilhada com sucesso."
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Link copiado!",
          description: "O texto foi copiado para a area de transferencia."
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(
            `Desbloqueei a conquista "${achievement.name}" no DeoGlory! ${achievement.description} - ${window.location.origin}`
          );
          toast({
            title: "Link copiado!",
            description: "O texto foi copiado para a area de transferencia."
          });
        } catch {
          console.error("Share error:", error);
        }
      }
    }
  };
  
  return (
    <div className="flex flex-col items-center p-6">
      <div 
        ref={cardRef}
        className="relative w-full max-w-sm p-8 rounded-xl bg-gradient-to-br from-background to-muted border-2 shadow-2xl"
        style={{ borderColor: categoryStyle.primary }}
      >
        <div className="absolute top-0 left-0 right-0 h-24 rounded-t-xl bg-gradient-to-br opacity-20"
          style={{ 
            background: `linear-gradient(135deg, ${categoryStyle.primary}, ${categoryStyle.secondary})` 
          }}
        />
        
        <div className="relative flex flex-col items-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          >
            <AchievementIcon icon={achievement.icon} unlocked={true} size="large" />
          </motion.div>
          
          <motion.div 
            className="mt-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Badge 
              variant="secondary"
              className="mb-2"
              style={{ 
                backgroundColor: `${categoryStyle.primary}20`, 
                color: categoryStyle.primary 
              }}
            >
              {categoryLabels[achievement.category] || achievement.category}
            </Badge>
            
            <h2 className={cn("text-2xl font-black mt-2", categoryStyle.text)}>
              {achievement.name}
            </h2>
            
            <p className="text-muted-foreground mt-2 text-sm">
              {achievement.description}
            </p>
            
            <div className="flex items-center justify-center gap-2 mt-4">
              <Zap className="h-5 w-5 text-amber-500" />
              <span className="text-lg font-bold">+{achievement.xpReward} XP</span>
            </div>
            
            {achievement.unlockedAt && (
              <p className="text-xs text-muted-foreground mt-3">
                Desbloqueada em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
              </p>
            )}
          </motion.div>
        </div>
        
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground/50 font-medium">
          DeoGlory
        </div>
      </div>
      
      <motion.div 
        className="flex gap-3 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button variant="outline" onClick={onClose} data-testid="button-close-share">
          Fechar
        </Button>
        <Button onClick={handleShare} data-testid="button-share-achievement">
          <Share2 className="h-4 w-4 mr-2" />
          Compartilhar
        </Button>
      </motion.div>
    </div>
  );
}

function AchievementCard({ achievement, onShare }: { achievement: Achievement; onShare: (a: Achievement) => void }) {
  const categoryStyle = categoryColors[achievement.category] || categoryColors.special;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card 
        className={cn(
          "p-4 transition-all cursor-pointer",
          achievement.unlocked 
            ? "border-2" 
            : "opacity-60 border"
        )}
        style={achievement.unlocked ? { borderColor: `${categoryStyle.primary}40` } : {}}
        onClick={() => achievement.unlocked && onShare(achievement)}
        data-testid={`achievement-card-${achievement.code}`}
      >
        <div className="flex items-start gap-4">
          <AchievementIcon icon={achievement.icon} unlocked={achievement.unlocked} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn(
                "font-bold",
                achievement.unlocked ? categoryStyle.text : "text-muted-foreground"
              )}>
                {achievement.name}
              </h3>
              <Badge 
                variant="secondary" 
                className="text-[10px]"
                style={{ 
                  backgroundColor: `${categoryStyle.primary}20`, 
                  color: categoryStyle.primary 
                }}
              >
                {categoryLabels[achievement.category] || achievement.category}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mt-1">
              {achievement.description}
            </p>
            
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className="flex items-center gap-1 text-sm">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="font-medium">+{achievement.xpReward} XP</span>
              </div>
              
              {achievement.unlocked && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(achievement);
                  }}
                  data-testid={`button-share-${achievement.code}`}
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  Compartilhar
                </Button>
              )}
              
              {achievement.unlocked && achievement.unlockedAt && (
                <span className="text-xs text-muted-foreground">
                  {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
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
        Complete licoes para desbloquear conquistas
      </p>
    </div>
  );
}

export default function AchievementsPage() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<string>("all");
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const { isAuthenticated } = useAuth();

  const { data: achievements, isLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/study/achievements'],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  const categories = ["all", ...Array.from(new Set(achievements?.map(a => a.category) || []))];
  
  const filteredAchievements = achievements?.filter(a => 
    filter === "all" || a.category === filter
  ) || [];

  const unlockedCount = achievements?.filter(a => a.unlocked).length || 0;
  const totalCount = achievements?.length || 0;

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="achievements-page">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/study/profile")}
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/40">
              <Trophy className="h-8 w-8 text-white drop-shadow-md" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-amber-700 dark:text-amber-400">
                {unlockedCount}/{totalCount}
              </h2>
              <p className="text-sm text-amber-600 dark:text-amber-500">
                Conquistas desbloqueadas
              </p>
              <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-2 mt-2">
                <motion.div 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
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
                  transition={{ delay: index * 0.03 }}
                >
                  <AchievementCard 
                    achievement={achievement} 
                    onShare={setSelectedAchievement}
                  />
                </motion.div>
              ))
            }
          </div>
        )}
      </main>

      <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Compartilhar Conquista</DialogTitle>
          </DialogHeader>
          <AnimatePresence>
            {selectedAchievement && (
              <ShareableAchievementCard 
                achievement={selectedAchievement} 
                onClose={() => setSelectedAchievement(null)}
              />
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
