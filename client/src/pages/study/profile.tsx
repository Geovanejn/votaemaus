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
import { Progress } from "@/components/ui/progress";
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
  Zap
} from "lucide-react";

const mockUser = {
  name: "João Silva",
  email: "joao@email.com",
  avatar: "",
  level: 5,
  totalXP: 450,
  xpForNextLevel: 800,
  streak: 7,
  longestStreak: 14,
  hearts: 4,
  maxHearts: 5,
  lessonsCompleted: 23,
  totalMinutes: 180,
  perfectLessons: 8,
  joinedDate: "Outubro 2024"
};

const mockAchievements = [
  { id: 1, name: "Primeiro Passo", icon: Star, unlocked: true, description: "Complete sua primeira lição" },
  { id: 2, name: "Semana Perfeita", icon: Flame, unlocked: true, description: "7 dias de sequência" },
  { id: 3, name: "Estudioso", icon: BookOpen, unlocked: true, description: "Complete 10 lições" },
  { id: 4, name: "Mês de Fé", icon: Medal, unlocked: false, description: "30 dias de sequência" },
  { id: 5, name: "Mestre", icon: Trophy, unlocked: false, description: "Alcance o nível 50" },
  { id: 6, name: "Perfeição", icon: Target, unlocked: false, description: "10 lições sem erros" },
];

export default function ProfilePage() {
  const [, setLocation] = useLocation();

  const unlockedCount = mockAchievements.filter(a => a.unlocked).length;

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="profile-page">
      <div className="bg-gradient-to-b from-primary/20 to-background pt-8 pb-12">
        <div className="max-w-lg mx-auto px-4 text-center">
          <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-background shadow-lg">
            <AvatarImage src={mockUser.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
              {mockUser.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <h1 className="text-2xl font-bold text-foreground mb-1" data-testid="text-user-name">
            {mockUser.name}
          </h1>
          <p className="text-muted-foreground text-sm mb-4">
            Membro desde {mockUser.joinedDate}
          </p>

          <div className="flex items-center justify-center gap-4">
            <StreakBadge days={mockUser.streak} />
            <LevelBadge 
              level={mockUser.level}
              currentXP={mockUser.totalXP}
              xpForNextLevel={mockUser.xpForNextLevel}
              showProgress={false}
            />
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 -mt-6 space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Progresso do Nível</span>
            <XPDisplay amount={mockUser.totalXP} showLabel />
          </div>
          <Progress 
            value={(mockUser.totalXP / mockUser.xpForNextLevel) * 100} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {mockUser.xpForNextLevel - mockUser.totalXP} XP para o nível {mockUser.level + 1}
          </p>
        </Card>

        <Card className="p-4">
          <h2 className="font-bold text-foreground mb-4">Estatísticas</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-lg font-bold">{mockUser.longestStreak}</p>
                <p className="text-xs text-muted-foreground">Maior sequência</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold">{mockUser.lessonsCompleted}</p>
                <p className="text-xs text-muted-foreground">Lições completas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-lg font-bold">{mockUser.totalMinutes}min</p>
                <p className="text-xs text-muted-foreground">Tempo total</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-lg font-bold">{mockUser.perfectLessons}</p>
                <p className="text-xs text-muted-foreground">Lições perfeitas</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">Conquistas</h2>
            <span className="text-sm text-muted-foreground">
              {unlockedCount}/{mockAchievements.length}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {mockAchievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={`flex flex-col items-center p-2 rounded-lg ${
                  achievement.unlocked 
                    ? "bg-amber-50 dark:bg-amber-900/20" 
                    : "bg-gray-100 dark:bg-gray-800 opacity-50"
                }`}
                data-testid={`achievement-${achievement.id}`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  achievement.unlocked 
                    ? "bg-amber-400" 
                    : "bg-gray-300 dark:bg-gray-600"
                }`}>
                  <achievement.icon className={`h-5 w-5 ${
                    achievement.unlocked ? "text-white" : "text-gray-500"
                  }`} />
                </div>
                <p className="text-xs text-center mt-1 font-medium line-clamp-2">
                  {achievement.name}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="divide-y">
          <button 
            className="w-full flex items-center justify-between p-4 hover-elevate"
            onClick={() => {}}
            data-testid="button-settings"
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span>Configurações</span>
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
              <span>Sair</span>
            </div>
            <ChevronRight className="h-5 w-5" />
          </button>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
