import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/study";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Compass, 
  BookOpen, 
  Heart, 
  Sparkles, 
  Star, 
  Sun, 
  Shield, 
  Flame,
  ChevronRight,
  Lock,
  Check,
  Loader2,
  BookMarked
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { StudyProfile } from "@shared/schema";

interface VerseCategory {
  id: string;
  name: string;
  icon: typeof Heart;
  color: string;
  shadowColor: string;
  versesCount: number;
  completedCount: number;
  isLocked: boolean;
}

interface DailyVerse {
  verse: string;
  reference: string;
}

interface DailyVerseStatusResponse {
  isRead: boolean;
  dateKey: string;
}

const iconMap: Record<string, typeof Heart> = {
  faith: Star,
  love: Heart,
  hope: Sun,
  strength: Shield,
  wisdom: Sparkles,
  peace: Flame
};

const categoryConfig: Record<string, { color: string; shadowColor: string }> = {
  faith: { color: "#FFC800", shadowColor: "#CC9F00" },
  love: { color: "#FF4B4B", shadowColor: "#CC3B3B" },
  hope: { color: "#58CC02", shadowColor: "#46A302" },
  strength: { color: "#1CB0F6", shadowColor: "#1899D6" },
  wisdom: { color: "#A560E8", shadowColor: "#8A4DC7" },
  peace: { color: "#FF9600", shadowColor: "#CC7700" }
};

const defaultCategories: VerseCategory[] = [
  { id: "faith", name: "Fe", icon: Star, color: "#FFC800", shadowColor: "#CC9F00", versesCount: 0, completedCount: 0, isLocked: false },
  { id: "love", name: "Amor", icon: Heart, color: "#FF4B4B", shadowColor: "#CC3B3B", versesCount: 0, completedCount: 0, isLocked: false },
  { id: "hope", name: "Esperanca", icon: Sun, color: "#58CC02", shadowColor: "#46A302", versesCount: 0, completedCount: 0, isLocked: false },
  { id: "strength", name: "Forca", icon: Shield, color: "#1CB0F6", shadowColor: "#1899D6", versesCount: 0, completedCount: 0, isLocked: false },
  { id: "wisdom", name: "Sabedoria", icon: Sparkles, color: "#A560E8", shadowColor: "#8A4DC7", versesCount: 0, completedCount: 0, isLocked: true },
  { id: "peace", name: "Paz", icon: Flame, color: "#FF9600", shadowColor: "#CC7700", versesCount: 0, completedCount: 0, isLocked: true }
];

function CategoryCard({ 
  category, 
  onClick,
  index 
}: { 
  category: VerseCategory; 
  onClick: () => void;
  index: number;
}) {
  const Icon = category.icon;
  const progress = category.versesCount > 0 
    ? (category.completedCount / category.versesCount) * 100 
    : 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={!category.isLocked ? { scale: 1.02 } : undefined}
      whileTap={!category.isLocked ? { scale: 0.98 } : undefined}
      onClick={!category.isLocked ? onClick : undefined}
      disabled={category.isLocked}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all",
        "bg-card border-2 border-border",
        category.isLocked && "opacity-60 cursor-not-allowed"
      )}
      data-testid={`category-${category.id}`}
    >
      <div 
        className={cn(
          "flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center",
          category.isLocked && "bg-muted"
        )}
        style={!category.isLocked ? { 
          backgroundColor: category.color,
          boxShadow: `0 4px 0 0 ${category.shadowColor}`
        } : {
          boxShadow: "0 4px 0 0 #CECECE"
        }}
      >
        {category.isLocked ? (
          <Lock className="h-6 w-6 text-muted-foreground/50" />
        ) : (
          <Icon className="h-6 w-6 text-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-bold text-base",
            category.isLocked ? "text-muted-foreground/50" : "text-foreground"
          )}>
            {category.name}
          </h3>
          {category.completedCount === category.versesCount && category.versesCount > 0 && (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#58CC02]">
              <Check className="h-3 w-3 text-white stroke-[3]" />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
              className="h-full rounded-full"
              style={{ backgroundColor: category.isLocked ? "#CECECE" : category.color }}
            />
          </div>
          <span className={cn(
            "text-xs font-bold",
            category.isLocked ? "text-muted-foreground/40" : "text-muted-foreground"
          )}>
            {category.completedCount}/{category.versesCount}
          </span>
        </div>
      </div>

      <ChevronRight className={cn(
        "h-5 w-5",
        category.isLocked ? "text-muted-foreground/30" : "text-muted-foreground"
      )} />
    </motion.button>
  );
}

function DailyVerseCard({ verse, isRead, onMarkAsRead, isMarking, isLoading }: { 
  verse: DailyVerse | null; 
  isRead: boolean;
  onMarkAsRead: () => void;
  isMarking: boolean;
  isLoading?: boolean;
}) {
  if (isLoading || !verse) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card 
          className="overflow-hidden border-2 border-[#FFC800]/30"
          data-testid="daily-verse-card"
        >
          <div 
            className="p-4"
            style={{
              background: 'linear-gradient(135deg, #FFC800 0%, #FFD633 100%)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-white" />
              <span className="text-sm font-bold text-white/90">Versiculo do Dia</span>
            </div>
            <div className="flex items-center gap-2">
              {isLoading && <Loader2 className="h-5 w-5 text-white animate-spin" />}
              <p className="text-white font-bold text-lg">{isLoading ? 'Carregando...' : 'Indisponivel no momento'}</p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
    >
      <Card 
        className="overflow-hidden border-2 border-[#FFC800]/30"
        data-testid="daily-verse-card"
      >
        <div 
          className="p-4"
          style={{
            background: 'linear-gradient(135deg, #FFC800 0%, #FFD633 100%)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-white" />
              <span className="text-sm font-bold text-white/90">Versiculo do Dia</span>
            </div>
            {isRead && (
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
                <Check className="h-3 w-3 text-white" />
                <span className="text-xs font-bold text-white">Lido</span>
              </div>
            )}
          </div>
          <p className="text-white font-bold text-lg">{verse.reference}</p>
        </div>
        
        <div className="p-4">
          <p className="text-foreground text-base italic leading-relaxed mb-4">
            "{verse.verse}"
          </p>
          
          {isRead ? (
            <div className="w-full py-3 px-4 rounded-lg bg-[#58CC02]/10 border-2 border-[#58CC02]/30 flex items-center justify-center gap-2">
              <Check className="h-5 w-5 text-[#58CC02]" />
              <span className="font-bold text-[#58CC02]">Leitura concluida hoje</span>
            </div>
          ) : (
            <Button
              onClick={onMarkAsRead}
              disabled={isMarking}
              className="w-full font-bold bg-[#FFC800] hover:bg-[#E6B400] text-[#7A5C00]"
              style={{ boxShadow: '0 4px 0 0 #CC9F00' }}
              data-testid="button-mark-verse-read"
            >
              {isMarking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <BookMarked className="h-4 w-4" />
                  MARCAR COMO LIDO
                </span>
              )}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function HeartsRecoveryCard({ profile }: { profile: StudyProfile | undefined }) {
  const [, setLocation] = useLocation();
  const currentHearts = profile?.hearts ?? 5;
  const maxHearts = profile?.heartsMax ?? 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card 
        className="p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border-red-200 dark:border-red-900"
        data-testid="hearts-recovery-card"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-foreground mb-1">Recuperar Vidas</p>
            <p className="text-sm text-muted-foreground">
              Leia versiculos para ganhar vidas
            </p>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: maxHearts }).map((_, i) => (
              <Heart
                key={i}
                className={cn(
                  "h-5 w-5 transition-colors",
                  i < currentHearts 
                    ? "fill-[#FF4B4B] text-[#FF4B4B]" 
                    : "fill-gray-200 text-gray-300 dark:fill-gray-700"
                )}
              />
            ))}
          </div>
        </div>
        
        {currentHearts < maxHearts && (
          <Button
            onClick={() => setLocation("/study/verses")}
            variant="outline"
            className="w-full mt-3 font-bold border-[#FF4B4B] text-[#FF4B4B]"
            data-testid="button-recover-hearts"
          >
            <Heart className="h-4 w-4 mr-2 fill-[#FF4B4B]" />
            RECUPERAR {maxHearts - currentHearts} VIDA{maxHearts - currentHearts > 1 ? 'S' : ''}
          </Button>
        )}
      </Card>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery<StudyProfile>({
    queryKey: ['/api/study/profile'],
    enabled: isAuthenticated,
  });

  const { data: dailyVerseData, isLoading: dailyVerseLoading } = useQuery<DailyVerse>({
    queryKey: ['/api/study/daily-verse'],
    enabled: isAuthenticated,
  });

  const { data: dailyVerseStatus, isLoading: statusLoading } = useQuery<DailyVerseStatusResponse>({
    queryKey: ['/api/study/daily-verse/status'],
    enabled: isAuthenticated,
  });

  const { data: weeklyGoal } = useQuery<{ versesRead: number; versesGoal: number }>({
    queryKey: ['/api/study/weekly-goal'],
    enabled: isAuthenticated,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/study/daily-verse/confirm");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study/daily-verse/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/study/weekly-goal'] });
    }
  });

  const dailyVerseRead = dailyVerseStatus?.isRead ?? false;

  const handleCategoryClick = (categoryId: string) => {
    setLocation(`/study/verses?category=${categoryId}`);
  };

  const handleMarkAsRead = () => {
    markAsReadMutation.mutate();
  };

  if (profileLoading) {
    return <LoadingState />;
  }

  const categories: VerseCategory[] = defaultCategories.map(cat => {
    const config = categoryConfig[cat.id] || { color: "#888888", shadowColor: "#666666" };
    return {
      ...cat,
      icon: iconMap[cat.id] || Star,
      ...config
    };
  });

  const dailyVerse: DailyVerse | null = dailyVerseData ? {
    verse: dailyVerseData.verse,
    reference: dailyVerseData.reference
  } : null;

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="explore-page">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-center gap-2 p-4">
          <Compass className="h-6 w-6 text-[#1CB0F6]" />
          <h1 className="font-black text-xl">Explorar</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-6">
        <DailyVerseCard 
          verse={dailyVerse} 
          isRead={dailyVerseRead}
          onMarkAsRead={handleMarkAsRead}
          isMarking={markAsReadMutation.isPending}
          isLoading={dailyVerseLoading}
        />
        
        <HeartsRecoveryCard profile={profile} />

        <div>
          <h2 className="font-bold text-lg text-foreground mb-4">Categorias de Versiculos</h2>
          
          <div className="space-y-3">
            {categories.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                onClick={() => handleCategoryClick(category.id)}
                index={index}
              />
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
