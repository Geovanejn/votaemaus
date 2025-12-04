import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  BottomNav,
  SoundSettings,
  NotificationSettings 
} from "@/components/study";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, 
  Flame, 
  Target, 
  BookOpen, 
  Settings,
  LogOut,
  ChevronRight,
  Star,
  Medal,
  Zap,
  UserPlus,
  Share2,
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
  Lock
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

function getIconComponent(iconName: string) {
  return iconMap[iconName.toLowerCase()] || Star;
}

function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  color 
}: { 
  icon: typeof Flame; 
  value: string | number; 
  label: string; 
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border"
    >
      <div 
        className="flex items-center justify-center w-10 h-10 rounded-full"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-black text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const IconComponent = getIconComponent(achievement.icon);
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "flex-shrink-0 w-20 flex flex-col items-center p-3 rounded-xl",
        achievement.unlocked 
          ? "bg-gradient-to-b from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/10" 
          : "bg-muted/50"
      )}
      data-testid={`achievement-${achievement.code}`}
    >
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center mb-2 relative",
        achievement.unlocked 
          ? "bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg"
          : "bg-muted"
      )}>
        {achievement.unlocked ? (
          <IconComponent className="h-6 w-6 text-white" />
        ) : (
          <>
            <IconComponent className="h-6 w-6 text-muted-foreground/30" />
            <Lock className="h-3 w-3 text-muted-foreground absolute bottom-0 right-0" />
          </>
        )}
      </div>
      <p className={cn(
        "text-[10px] text-center font-bold line-clamp-2",
        achievement.unlocked ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground/50"
      )}>
        {achievement.name}
      </p>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando perfil...</p>
      </div>
    </div>
  );
}

const mockProfile: StudyProfile = {
  id: 1,
  userId: 1,
  totalXp: 1250,
  currentLevel: 5,
  currentStreak: 7,
  longestStreak: 14,
  hearts: 4,
  heartsMax: 5,
  heartsRefillAt: null,
  lastActivityDate: new Date().toISOString(),
  dailyGoalMinutes: 15,
  timezone: "America/Sao_Paulo"
};

const mockAchievements: Achievement[] = [
  { id: 1, code: "first_lesson", name: "Primeiro Passo", description: "Complete sua primeira licao", icon: "book", xpReward: 5, category: "lessons", requirement: {}, isSecret: false, unlocked: true, unlockedAt: new Date().toISOString() },
  { id: 2, code: "streak_7", name: "Semana Perfeita", description: "7 dias de sequencia", icon: "flame", xpReward: 25, category: "streak", requirement: {}, isSecret: false, unlocked: true, unlockedAt: new Date().toISOString() },
  { id: 3, code: "lessons_5", name: "Estudante Aplicado", description: "Complete 5 licoes", icon: "book-open", xpReward: 20, category: "lessons", requirement: {}, isSecret: false, unlocked: false, unlockedAt: null },
  { id: 4, code: "streak_30", name: "Mes de Fe", description: "30 dias de sequencia", icon: "crown", xpReward: 100, category: "streak", requirement: {}, isSecret: false, unlocked: false, unlockedAt: null },
];

const mockUser = {
  fullName: "Usuario Demonstracao",
  email: "demo@emaus.com.br",
  photoUrl: ""
};

export default function ProfilePage() {
  const [location, setLocation] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  
  const isPreview = location.startsWith("/study-preview");

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<StudyProfile>({
    queryKey: ['/api/study/profile'],
    enabled: isAuthenticated && !isPreview,
  });

  const { data: achievements, isLoading: achievementsLoading, error: achievementsError } = useQuery<Achievement[]>({
    queryKey: ['/api/study/achievements'],
    enabled: isAuthenticated && !isPreview,
  });

  const isLoading = !isPreview && (profileLoading || achievementsLoading);
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  const effectiveProfile = isPreview ? mockProfile : profile;
  const effectiveAchievements = isPreview ? mockAchievements : achievements;
  const effectiveUser = isPreview ? mockUser : user;

  const unlockedAchievements = effectiveAchievements?.filter(a => a.unlocked) || [];
  const displayAchievements = effectiveAchievements?.slice(0, 4) || [];

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const getDivision = (level: number) => {
    if (level >= 50) return "Diamante";
    if (level >= 30) return "Esmeralda";
    if (level >= 20) return "Rubi";
    if (level >= 10) return "Safira";
    if (level >= 5) return "Ouro";
    return "Bronze";
  };

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="profile-page">
      <div 
        className="relative pt-8 pb-16"
        style={{
          background: 'linear-gradient(180deg, #FFE4D6 0%, #FFF5F0 50%, hsl(var(--background)) 100%)'
        }}
      >
        <div className="absolute top-4 right-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground"
            onClick={() => setLocation("/study/settings")}
            data-testid="button-settings-top"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>

        <div className="max-w-lg mx-auto px-4 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative inline-block mb-4"
          >
            <Avatar className="h-28 w-28 ring-4 ring-white shadow-xl">
              <AvatarImage src={effectiveUser?.photoUrl || ""} />
              <AvatarFallback 
                className="text-4xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #87CEEB 0%, #4A90D9 100%)',
                  color: 'white'
                }}
              >
                {effectiveUser?.fullName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-2xl font-black text-foreground mb-0.5" data-testid="text-user-name">
              {effectiveUser?.fullName || "Usuario"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {effectiveUser?.email}
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-6 mt-4 text-sm"
          >
            <div className="flex items-center gap-1">
              <span className="font-bold">{unlockedAchievements.length}</span>
              <span className="text-muted-foreground">Conquistas</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1">
              <span className="font-bold">Nivel {effectiveProfile?.currentLevel || 1}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-3 mt-5"
          >
            <Button 
              variant="outline" 
              className="flex-1 max-w-[200px] border-2 border-[#1CB0F6] text-[#1CB0F6] font-bold"
              data-testid="button-add-friends"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Amigos
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              className="border-2 border-border"
              data-testid="button-share"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 -mt-6 space-y-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-black text-foreground mb-3">Visao geral</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard 
              icon={Flame} 
              value={effectiveProfile?.currentStreak || 0} 
              label="Dias seguidos" 
              color="#FF9600" 
            />
            <StatCard 
              icon={Zap} 
              value={(effectiveProfile?.totalXp || 0).toLocaleString()} 
              label="Total de XP" 
              color="#FFC800" 
            />
            <StatCard 
              icon={Trophy} 
              value={getDivision(effectiveProfile?.currentLevel || 1)} 
              label="Divisao" 
              color="#1CB0F6" 
            />
            <StatCard 
              icon={Star} 
              value={effectiveProfile?.currentLevel || 1} 
              label="Nivel atual" 
              color="#58CC02" 
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-black text-foreground">Medalhas</h2>
            <Button 
              variant="ghost" 
              className="text-[#1CB0F6] font-bold text-sm px-2"
              onClick={() => setLocation(isPreview ? "/study-preview/achievements" : "/study/achievements")}
              data-testid="button-view-all-achievements"
            >
              Ver todas ({effectiveAchievements?.length || 0})
            </Button>
          </div>
          
          {displayAchievements.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {displayAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <AchievementBadge achievement={achievement} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Medal className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Nenhuma conquista disponivel</p>
              <p className="text-sm">Execute o seed para popular as conquistas</p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-xl font-black text-foreground mb-3">Estatisticas</h2>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="text-muted-foreground">Maior sequencia</span>
              </div>
              <span className="font-bold">{effectiveProfile?.longestStreak || 0} dias</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="text-muted-foreground">Coracoes</span>
              </div>
              <span className="font-bold">{effectiveProfile?.hearts || 0}/{effectiveProfile?.heartsMax || 5}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span className="text-muted-foreground">Conquistas</span>
              </div>
              <span className="font-bold">{unlockedAchievements.length}/{effectiveAchievements?.length || 0}</span>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-xl font-black text-foreground mb-3">Preferencias</h2>
          <div className="space-y-3">
            <SoundSettings />
            <NotificationSettings />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="overflow-hidden divide-y divide-border">
            <button 
              className="w-full flex items-center justify-between p-4 hover-elevate"
              onClick={() => setLocation("/study/settings")}
              data-testid="button-settings"
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Configuracoes</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            
            <button 
              className="w-full flex items-center justify-between p-4 text-red-500 hover-elevate"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Sair</span>
              </div>
              <ChevronRight className="h-5 w-5" />
            </button>
          </Card>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
