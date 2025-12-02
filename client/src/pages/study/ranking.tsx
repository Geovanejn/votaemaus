import { useState } from "react";
import { 
  BottomNav,
  XPDisplay 
} from "@/components/study";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankingUser {
  id: number;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  isCurrentUser?: boolean;
}

const mockWeeklyRanking: RankingUser[] = [
  { id: 1, name: "Maria Santos", avatar: "", xp: 520, level: 8 },
  { id: 2, name: "Pedro Lima", avatar: "", xp: 480, level: 7 },
  { id: 3, name: "Ana Costa", avatar: "", xp: 450, level: 6 },
  { id: 4, name: "João Silva", avatar: "", xp: 420, level: 5, isCurrentUser: true },
  { id: 5, name: "Lucas Oliveira", avatar: "", xp: 380, level: 5 },
  { id: 6, name: "Julia Ferreira", avatar: "", xp: 350, level: 4 },
  { id: 7, name: "Gabriel Souza", avatar: "", xp: 320, level: 4 },
  { id: 8, name: "Beatriz Alves", avatar: "", xp: 280, level: 3 },
  { id: 9, name: "Rafael Mendes", avatar: "", xp: 250, level: 3 },
  { id: 10, name: "Camila Rocha", avatar: "", xp: 220, level: 2 },
];

const mockMonthlyRanking: RankingUser[] = [
  { id: 1, name: "Pedro Lima", avatar: "", xp: 2100, level: 7 },
  { id: 2, name: "Maria Santos", avatar: "", xp: 1950, level: 8 },
  { id: 3, name: "João Silva", avatar: "", xp: 1800, level: 5, isCurrentUser: true },
  { id: 4, name: "Ana Costa", avatar: "", xp: 1650, level: 6 },
  { id: 5, name: "Lucas Oliveira", avatar: "", xp: 1500, level: 5 },
];

function getRankIcon(position: number) {
  switch (position) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{position}</span>;
  }
}

function RankingList({ users }: { users: RankingUser[] }) {
  return (
    <div className="space-y-2">
      {users.map((user, index) => (
        <Card 
          key={user.id}
          className={cn(
            "p-3 flex items-center gap-3",
            user.isCurrentUser && "ring-2 ring-primary bg-primary/5",
            index < 3 && "bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10"
          )}
          data-testid={`ranking-user-${user.id}`}
        >
          <div className="w-8 flex justify-center">
            {getRankIcon(index + 1)}
          </div>
          
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className={cn(
              index === 0 && "bg-yellow-400 text-yellow-900",
              index === 1 && "bg-gray-300 text-gray-700",
              index === 2 && "bg-amber-600 text-white",
              index > 2 && "bg-muted"
            )}>
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-medium truncate",
              user.isCurrentUser && "text-primary"
            )}>
              {user.name}
              {user.isCurrentUser && " (você)"}
            </p>
            <p className="text-xs text-muted-foreground">Nível {user.level}</p>
          </div>
          
          <XPDisplay amount={user.xp} size="sm" />
        </Card>
      ))}
    </div>
  );
}

export default function RankingPage() {
  const [period, setPeriod] = useState("weekly");

  const currentUserWeekly = mockWeeklyRanking.find(u => u.isCurrentUser);
  const currentUserMonthly = mockMonthlyRanking.find(u => u.isCurrentUser);

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="ranking-page">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-center gap-2 p-3">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h1 className="font-bold text-lg">Ranking</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <Tabs value={period} onValueChange={setPeriod} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="weekly" data-testid="tab-weekly">Semanal</TabsTrigger>
            <TabsTrigger value="monthly" data-testid="tab-monthly">Mensal</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            {currentUserWeekly && (
              <Card className="p-4 mb-4 bg-gradient-to-r from-primary/10 to-primary/5 text-center">
                <p className="text-sm text-muted-foreground">Sua posição</p>
                <p className="text-3xl font-bold text-primary">
                  #{mockWeeklyRanking.findIndex(u => u.isCurrentUser) + 1}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentUserWeekly.xp} XP esta semana
                </p>
              </Card>
            )}
            <RankingList users={mockWeeklyRanking} />
          </TabsContent>

          <TabsContent value="monthly">
            {currentUserMonthly && (
              <Card className="p-4 mb-4 bg-gradient-to-r from-primary/10 to-primary/5 text-center">
                <p className="text-sm text-muted-foreground">Sua posição</p>
                <p className="text-3xl font-bold text-primary">
                  #{mockMonthlyRanking.findIndex(u => u.isCurrentUser) + 1}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentUserMonthly.xp} XP este mês
                </p>
              </Card>
            )}
            <RankingList users={mockMonthlyRanking} />
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
