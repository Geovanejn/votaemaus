import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/study";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Flame, 
  BookOpen, 
  Settings,
  ChevronLeft,
  Star,
  Medal,
  Crown,
  Heart,
  Calendar,
  CheckCircle,
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
  crystals: number;
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

interface RecentActivity {
  id: number;
  type: "lesson" | "streak" | "ranking" | "achievement";
  title: string;
  subtitle: string;
  icon: "check" | "flame" | "trophy";
  color: string;
}

const iconMap: Record<string, typeof Flame> = {
  flame: Flame,
  book: BookOpen,
  "book-open": BookOpen,
  trophy: Trophy,
  crown: Crown,
  star: Star,
  medal: Medal,
  calendar: Calendar,
  heart: Heart,
  "check-circle": CheckCircle,
};

function getIconComponent(iconName: string) {
  return iconMap[iconName.toLowerCase()] || Star;
}

function getLevelTitle(level: number): { title: string; nextLevel: number } {
  const levelTitles = [
    { minLevel: 1, title: "Iniciante na Fe", nextLevel: 5 },
    { minLevel: 5, title: "Aprendiz das Escrituras", nextLevel: 10 },
    { minLevel: 10, title: "Estudante Dedicado", nextLevel: 20 },
    { minLevel: 20, title: "Discipulo Fiel", nextLevel: 40 },
    { minLevel: 40, title: "Mestre dos Estudos", nextLevel: 60 },
    { minLevel: 60, title: "Sabio Biblico", nextLevel: 80 },
    { minLevel: 80, title: "Guardiao da Palavra", nextLevel: 100 },
    { minLevel: 100, title: "Supremo Conhecedor das Escrituras", nextLevel: 999 },
  ];
  
  for (let i = levelTitles.length - 1; i >= 0; i--) {
    if (level >= levelTitles[i].minLevel) {
      return { title: levelTitles[i].title, nextLevel: levelTitles[i].nextLevel };
    }
  }
  return { title: "Iniciante na Fe", nextLevel: 5 };
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
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

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

  const currentXp = profile?.totalXp || 0;
  const currentLevel = profile?.currentLevel || 1;
  const xpForCurrentLevel = (currentLevel - 1) * 500;
  const xpForNextLevel = currentLevel * 500;
  const xpInLevel = currentXp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const xpRemaining = xpForNextLevel - currentXp;
  const progressPercent = Math.min((xpInLevel / xpNeeded) * 100, 100);

  const categoryColorMap: Record<string, { bgColor: string }> = {
    streak: { bgColor: "#F97316" },
    lessons: { bgColor: "#22C55E" },
    xp: { bgColor: "#FFC800" },
    special: { bgColor: "#1CB0F6" },
  };

  const displayAchievements = (achievements || []).slice(0, 6);
  const unlockedCount = (achievements || []).filter(a => a.unlocked).length;

  const recentActivities: RecentActivity[] = [
    {
      id: 1,
      type: "lesson",
      title: 'Licao "O Filho Prodigo" concluida',
      subtitle: "+150 XP - Hoje as 14:30",
      icon: "check",
      color: "#22C55E",
    },
    {
      id: 2,
      type: "streak",
      title: `${profile?.currentStreak || 12} dias de ofensiva alcancados`,
      subtitle: "Conquista desbloqueada - Hoje as 09:15",
      icon: "flame",
      color: "#F97316",
    },
    {
      id: 3,
      type: "ranking",
      title: "Subiu para 8o lugar no ranking",
      subtitle: "Ranking semanal - Ontem as 20:45",
      icon: "trophy",
      color: "#8B5CF6",
    },
  ];

  const lessonsCompleted = 18;
  const unitsCompleted = 3;
  const studyDays = 89;

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="profile-page">
      <div 
        className="relative pt-4 pb-6"
        style={{
          background: 'linear-gradient(180deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)'
        }}
      >
        <div className="flex items-center justify-between px-4 mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white/90"
            onClick={() => setLocation("/study")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold text-white">Perfil</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white/90"
            onClick={() => setLocation("/study/settings")}
            data-testid="button-settings-top"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative mb-3"
          >
            <Avatar className="h-24 w-24 ring-4 ring-white/30">
              <AvatarImage src={user?.photoUrl || ""} />
              <AvatarFallback 
                className="text-3xl font-bold bg-gradient-to-br from-purple-400 to-purple-600 text-white"
              >
                {user?.fullName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div 
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#FFC800" }}
            >
              <Crown className="h-4 w-4 text-white" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-4"
          >
            <h2 className="text-xl font-bold text-white" data-testid="text-user-name">
              {user?.fullName || "Usuario"}
            </h2>
            <p className="text-white/70 text-sm">
              {getLevelTitle(currentLevel).title}
            </p>
            <Badge 
              className="mt-1 text-xs bg-white/20 text-white border-0"
            >
              Nivel {currentLevel}
            </Badge>
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-6"
          >
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Flame className="h-5 w-5 text-orange-400" />
                <span className="text-lg font-bold text-white">{profile?.currentStreak || 12}</span>
              </div>
              <span className="text-xs text-white/70">Ofensiva</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="text-lg font-bold text-white">{currentLevel}</span>
              </div>
              <span className="text-xs text-white/70">Nivel</span>
            </div>
            <div className="flex flex-col items-center" data-testid="profile-crystals">
              <div className="flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <defs>
                    <linearGradient id="crystalGradProfile" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="50%" stopColor="#7C3AED" />
                      <stop offset="100%" stopColor="#6D28D9" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points="12,2 22,8 22,16 12,22 2,16 2,8"
                    fill="url(#crystalGradProfile)"
                    stroke="#8B5CF6"
                    strokeWidth="0.5"
                  />
                  <polygon
                    points="12,2 17,5 17,11 12,14 7,11 7,5"
                    fill="rgba(255,255,255,0.3)"
                  />
                </svg>
                <span className="text-lg font-bold text-white">{profile?.crystals || 0}</span>
              </div>
              <span className="text-xs text-white/70">Cristais</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Trophy className="h-5 w-5 text-blue-400" />
                <span className="text-lg font-bold text-white">8</span>
              </div>
              <span className="text-xs text-white/70">Posicao</span>
            </div>
          </motion.div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground">Progresso do Nivel</h3>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: "#8B5CF6" }}>Nivel {currentLevel}</p>
                <p className="text-xs text-muted-foreground">{currentXp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP</p>
              </div>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-3 mb-3"
              style={{ 
                background: "#E5E7EB"
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{xpRemaining} XP para o proximo nivel</p>
              <Badge 
                className="text-xs font-medium px-2 py-1"
                style={{ 
                  backgroundColor: "#FEF3C7",
                  color: "#D97706",
                  border: "none"
                }}
              >
                <Heart className="h-3 w-3 mr-1" style={{ color: "#EF4444" }} />
                Premio: +1 Vida
              </Badge>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#FEF3C7" }}
              >
                <Flame className="h-5 w-5" style={{ color: "#F97316" }} />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Ofensiva Atual</span>
            </div>
            <p className="text-2xl font-black text-foreground">{profile?.currentStreak || 12} dias</p>
            <p className="text-xs text-muted-foreground">Maior: {profile?.longestStreak || 25} dias</p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#FEF3C7" }}
              >
                <Calendar className="h-5 w-5" style={{ color: "#F59E0B" }} />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Dias Totais</span>
            </div>
            <p className="text-2xl font-black text-foreground">{studyDays}</p>
            <p className="text-xs text-muted-foreground">Desde marco</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-foreground">Conquistas</h3>
            <Button 
              variant="ghost" 
              className="text-sm px-2"
              style={{ color: "#8B5CF6" }}
              onClick={() => setLocation("/study/achievements")}
              data-testid="button-view-all-achievements"
            >
              Ver todas
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {displayAchievements.map((achievement) => {
              const IconComponent = getIconComponent(achievement.icon);
              const categoryStyle = categoryColorMap[achievement.category] || { bgColor: "#1CB0F6" };
              
              return (
                <div 
                  key={achievement.id}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-xl",
                    achievement.unlocked ? "bg-card" : "bg-muted/30"
                  )}
                  data-testid={`achievement-${achievement.code}`}
                >
                  <div 
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-2 relative"
                    )}
                    style={{ 
                      backgroundColor: achievement.unlocked ? categoryStyle.bgColor : "#E5E7EB"
                    }}
                  >
                    {achievement.unlocked ? (
                      <IconComponent className="h-6 w-6 text-white" />
                    ) : (
                      <>
                        <IconComponent className="h-6 w-6 text-gray-400" />
                        <div 
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "#9CA3AF" }}
                        >
                          <Lock className="h-3 w-3 text-white" />
                        </div>
                      </>
                    )}
                  </div>
                  <p className={cn(
                    "text-[10px] text-center font-medium",
                    achievement.unlocked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {achievement.name}
                  </p>
                  {achievement.unlocked ? (
                    <p className="text-[9px] text-muted-foreground">Completa!</p>
                  ) : (
                    <p className="text-[9px] text-muted-foreground">Bloqueado</p>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="p-4">
            <h3 className="text-lg font-bold text-foreground mb-4">Estatisticas</h3>
            <div className="grid grid-cols-2 gap-3">
              <div 
                className="p-4 rounded-xl text-center"
                style={{ backgroundColor: "#F3E8FF" }}
              >
                <p className="text-2xl font-black" style={{ color: "#8B5CF6" }}>{currentXp.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">XP Total</p>
              </div>
              <div 
                className="p-4 rounded-xl text-center"
                style={{ backgroundColor: "#F3E8FF" }}
              >
                <p className="text-2xl font-black" style={{ color: "#8B5CF6" }}>{lessonsCompleted}</p>
                <p className="text-xs text-muted-foreground">Licoes Completas</p>
              </div>
              <div 
                className="p-4 rounded-xl text-center"
                style={{ backgroundColor: "#F3E8FF" }}
              >
                <p className="text-2xl font-black" style={{ color: "#8B5CF6" }}>{unitsCompleted}</p>
                <p className="text-xs text-muted-foreground">Unidades Completas</p>
              </div>
              <div 
                className="p-4 rounded-xl text-center"
                style={{ backgroundColor: "#F3E8FF" }}
              >
                <p className="text-2xl font-black" style={{ color: "#8B5CF6" }}>{studyDays}</p>
                <p className="text-xs text-muted-foreground">Dias de Estudo</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-bold text-foreground mb-3">Atividade Recente</h3>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <Card key={activity.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: activity.color }}
                  >
                    {activity.icon === "check" && <CheckCircle className="h-5 w-5 text-white" />}
                    {activity.icon === "flame" && <Flame className="h-5 w-5 text-white" />}
                    {activity.icon === "trophy" && <Trophy className="h-5 w-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
