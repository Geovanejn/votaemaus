import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  BottomNav,
  SoundSettings,
  NotificationSettings,
  CrystalBalanceCard
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

export default function ProfilePage() {
  const [location, setLocation] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery<StudyProfile>({
    queryKey: ['/api/study/profile'],
    enabled: isAuthenticated,
  });

  const { data: achievements, isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/study/achievements'],
    enabled: isAuthenticated,
  });

  if (profileLoading || achievementsLoading) {
    return <LoadingState />;
  }

  const unlockedAchievements = achievements?.filter(a => a.unlocked) || [];
  const displayAchievements = achievements?.slice(0, 4) || [];

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
              <AvatarImage src={user?.photoUrl || ""} />
              <AvatarFallback 
                className="text-4xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #87CEEB 0%, #4A90D9 100%)',
                  color: 'white'
                }}
              >
                {user?.fullName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-2xl font-black text-foreground mb-0.5" data-testid="text-user-name">
              {user?.fullName || "Usuario"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {user?.email}
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
              <span className="font-bold">Nivel {profile?.currentLevel || 1}</span>
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
              value={profile?.currentStreak || 0} 
              label="Dias seguidos" 
              color="#FF9600" 
            />
            <StatCard 
              icon={Zap} 
              value={(profile?.totalXp || 0).toLocaleString()} 
              label="Total de XP" 
              color="#FFC800" 
            />
            <StatCard 
              icon={Trophy} 
              value={getDivision(profile?.currentLevel || 1)} 
              label="Divisao" 
              color="#1CB0F6" 
            />
            <StatCard 
              icon={Star} 
              value={profile?.currentLevel || 1} 
              label="Nivel atual" 
              color="#58CC02" 
            />
          </div>
          <CrystalBalanceCard className="mt-3" />
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
              onClick={() => setLocation("/study/achievements")}
              data-testid="button-view-all-achievements"
            >
              Ver todas ({achievements?.length || 0})
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
          transition={{ delay: 0.55 }}
        >
          <h2 className="text-xl font-black text-foreground mb-3">Recorde de Ofensiva</h2>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                  <Flame className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-black text-foreground">{profile?.longestStreak || 0}</p>
                  <p className="text-sm text-muted-foreground">dias de recorde</p>
                </div>
              </div>
              {(profile?.currentStreak || 0) > 0 && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Atual</p>
                  <p className="text-xl font-bold text-orange-500">{profile?.currentStreak} dias</p>
                </div>
              )}
            </div>
            
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground mb-3 font-medium">MEDALHAS DE OFENSIVA</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { days: 7, icon: "flame", label: "Semana", color: "from-amber-400 to-amber-500" },
                  { days: 14, icon: "flame", label: "Quinzena", color: "from-orange-400 to-orange-500" },
                  { days: 30, icon: "flame", label: "Mes", color: "from-orange-500 to-red-500" },
                  { days: 60, icon: "crown", label: "Lenda", color: "from-red-500 to-red-600" },
                  { days: 90, icon: "crown", label: "Trimestre", color: "from-purple-500 to-purple-600" },
                  { days: 180, icon: "crown", label: "Semestre", color: "from-indigo-500 to-indigo-600" },
                  { days: 365, icon: "sparkles", label: "Ano", color: "from-cyan-500 to-blue-500" },
                ].map((milestone) => {
                  const unlocked = (profile?.longestStreak || 0) >= milestone.days;
                  return (
                    <div
                      key={milestone.days}
                      className={cn(
                        "flex-shrink-0 flex flex-col items-center p-2 rounded-lg w-16",
                        unlocked 
                          ? `bg-gradient-to-b ${milestone.color} shadow-md` 
                          : "bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center mb-1",
                        unlocked ? "bg-white/20" : "bg-muted"
                      )}>
                        {milestone.icon === "crown" ? (
                          <Crown className={cn("h-4 w-4", unlocked ? "text-white" : "text-muted-foreground/40")} />
                        ) : milestone.icon === "sparkles" ? (
                          <Star className={cn("h-4 w-4", unlocked ? "text-white" : "text-muted-foreground/40")} />
                        ) : (
                          <Flame className={cn("h-4 w-4", unlocked ? "text-white" : "text-muted-foreground/40")} />
                        )}
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold",
                        unlocked ? "text-white" : "text-muted-foreground/50"
                      )}>
                        {milestone.days}
                      </span>
                      <span className={cn(
                        "text-[8px]",
                        unlocked ? "text-white/80" : "text-muted-foreground/40"
                      )}>
                        {milestone.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
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
                <Heart className="h-5 w-5 text-red-500" />
                <span className="text-muted-foreground">Coracoes</span>
              </div>
              <span className="font-bold">{profile?.hearts || 0}/{profile?.heartsMax || 5}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span className="text-muted-foreground">Conquistas</span>
              </div>
              <span className="font-bold">{unlockedAchievements.length}/{achievements?.length || 0}</span>
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
