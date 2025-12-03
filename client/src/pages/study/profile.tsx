import { useLocation } from "wouter";
import { 
  HeartsDisplay, 
  XPDisplay, 
  StreakBadge, 
  LevelBadge,
  BottomNav 
} from "@/components/study";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, 
  Flame, 
  Target, 
  BookOpen, 
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
  Star,
  Medal,
  Zap,
  Users,
  UserPlus,
  Share2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const mockUser = {
  name: "João Silva",
  username: "@joaosilva",
  email: "joao@email.com",
  avatar: "",
  level: 5,
  totalXP: 6081,
  xpForNextLevel: 8000,
  streak: 7,
  longestStreak: 14,
  hearts: 4,
  maxHearts: 5,
  lessonsCompleted: 23,
  totalMinutes: 180,
  perfectLessons: 8,
  joinedDate: "outubro de 2024",
  following: 5,
  followers: 4,
  division: "Safira"
};

const mockAchievements = [
  { id: 1, name: "Primeiro Passo", icon: Star, unlocked: true, description: "Complete sua primeira lição" },
  { id: 2, name: "Semana Perfeita", icon: Flame, unlocked: true, description: "7 dias de sequência" },
  { id: 3, name: "Estudioso", icon: BookOpen, unlocked: true, description: "Complete 10 lições" },
  { id: 4, name: "Mês de Fé", icon: Medal, unlocked: false, description: "30 dias de sequência" },
  { id: 5, name: "Mestre", icon: Trophy, unlocked: false, description: "Alcance o nível 50" },
  { id: 6, name: "Perfeição", icon: Target, unlocked: false, description: "10 lições sem erros" },
];

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

export default function ProfilePage() {
  const [, setLocation] = useLocation();

  const unlockedCount = mockAchievements.filter(a => a.unlocked).length;

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
              <AvatarImage src={mockUser.avatar} />
              <AvatarFallback 
                className="text-4xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #87CEEB 0%, #4A90D9 100%)',
                  color: 'white'
                }}
              >
                {mockUser.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-2xl font-black text-foreground mb-0.5" data-testid="text-user-name">
              {mockUser.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              {mockUser.username} - Aqui desde {mockUser.joinedDate}
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-6 mt-4 text-sm"
          >
            <div className="flex items-center gap-1">
              <span className="font-bold">{mockUser.following}</span>
              <span className="text-muted-foreground">Segue</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1">
              <span className="font-bold">{mockUser.followers}</span>
              <span className="text-muted-foreground">Seguidores</span>
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
              value={mockUser.streak} 
              label="Dias seguidos" 
              color="#FF9600" 
            />
            <StatCard 
              icon={Zap} 
              value={mockUser.totalXP.toLocaleString()} 
              label="Total de XP" 
              color="#FFC800" 
            />
            <StatCard 
              icon={Trophy} 
              value={mockUser.division} 
              label="Divisao" 
              color="#1CB0F6" 
            />
            <StatCard 
              icon={Star} 
              value={mockUser.level} 
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
              data-testid="button-view-all-achievements"
            >
              Ver todas
            </Button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {mockAchievements.slice(0, 4).map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className={cn(
                  "flex-shrink-0 w-20 flex flex-col items-center p-3 rounded-xl",
                  achievement.unlocked 
                    ? "bg-gradient-to-b from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/10" 
                    : "bg-muted/50"
                )}
                data-testid={`achievement-${achievement.id}`}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-2",
                  achievement.unlocked 
                    ? "bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg"
                    : "bg-muted"
                )}>
                  <achievement.icon className={cn(
                    "h-6 w-6",
                    achievement.unlocked ? "text-white" : "text-muted-foreground/50"
                  )} />
                </div>
                <p className={cn(
                  "text-[10px] text-center font-bold line-clamp-2",
                  achievement.unlocked ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground/50"
                )}>
                  {achievement.name}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="overflow-hidden divide-y divide-border">
            <button 
              className="w-full flex items-center justify-between p-4 hover-elevate"
              onClick={() => {}}
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
              onClick={() => setLocation("/")}
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
