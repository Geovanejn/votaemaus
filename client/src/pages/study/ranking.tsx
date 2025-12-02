import { useState } from "react";
import { 
  BottomNav,
  XPDisplay 
} from "@/components/study";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown, TrendingUp, Flame, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface RankingUser {
  id: number;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  isCurrentUser?: boolean;
  streak?: number;
  change?: "up" | "down" | "same";
}

const mockWeeklyRanking: RankingUser[] = [
  { id: 1, name: "Maria Santos", avatar: "", xp: 520, level: 8, streak: 14, change: "same" },
  { id: 2, name: "Pedro Lima", avatar: "", xp: 480, level: 7, streak: 10, change: "up" },
  { id: 3, name: "Ana Costa", avatar: "", xp: 450, level: 6, streak: 7, change: "up" },
  { id: 4, name: "Joao Silva", avatar: "", xp: 420, level: 5, isCurrentUser: true, streak: 7, change: "down" },
  { id: 5, name: "Lucas Oliveira", avatar: "", xp: 380, level: 5, streak: 5, change: "up" },
  { id: 6, name: "Julia Ferreira", avatar: "", xp: 350, level: 4, streak: 3, change: "same" },
  { id: 7, name: "Gabriel Souza", avatar: "", xp: 320, level: 4, streak: 2, change: "down" },
  { id: 8, name: "Beatriz Alves", avatar: "", xp: 280, level: 3, streak: 1, change: "up" },
  { id: 9, name: "Rafael Mendes", avatar: "", xp: 250, level: 3, streak: 4, change: "same" },
  { id: 10, name: "Camila Rocha", avatar: "", xp: 220, level: 2, streak: 2, change: "down" },
];

const mockMonthlyRanking: RankingUser[] = [
  { id: 1, name: "Pedro Lima", avatar: "", xp: 2100, level: 7, streak: 10, change: "up" },
  { id: 2, name: "Maria Santos", avatar: "", xp: 1950, level: 8, streak: 14, change: "down" },
  { id: 3, name: "Joao Silva", avatar: "", xp: 1800, level: 5, isCurrentUser: true, streak: 7, change: "up" },
  { id: 4, name: "Ana Costa", avatar: "", xp: 1650, level: 6, streak: 7, change: "down" },
  { id: 5, name: "Lucas Oliveira", avatar: "", xp: 1500, level: 5, streak: 5, change: "same" },
];

const podiumColors = {
  1: {
    bg: "bg-gradient-to-br from-[#FFD700] via-[#FFC800] to-[#E6B400]",
    text: "text-[#7A5C00]",
    border: "border-[#FFE55C]",
    shadow: "shadow-[0_4px_0_0_#CC9F00]",
    glow: "shadow-[0_0_30px_rgba(255,215,0,0.4)]"
  },
  2: {
    bg: "bg-gradient-to-br from-[#C0C0C0] via-[#B0B0B0] to-[#A0A0A0]",
    text: "text-[#4A4A4A]",
    border: "border-[#D0D0D0]",
    shadow: "shadow-[0_4px_0_0_#808080]",
    glow: ""
  },
  3: {
    bg: "bg-gradient-to-br from-[#CD7F32] via-[#B87333] to-[#A0522D]",
    text: "text-white",
    border: "border-[#DDA15E]",
    shadow: "shadow-[0_4px_0_0_#8B4513]",
    glow: ""
  }
};

function getRankIcon(position: number) {
  switch (position) {
    case 1:
      return <Crown className="h-6 w-6 text-[#FFD700] fill-[#FFD700]" />;
    case 2:
      return <Medal className="h-5 w-5 text-[#C0C0C0] fill-[#C0C0C0]" />;
    case 3:
      return <Medal className="h-5 w-5 text-[#CD7F32] fill-[#CD7F32]" />;
    default:
      return (
        <span className="text-base font-black text-muted-foreground w-6 text-center">
          {position}
        </span>
      );
  }
}

function ChangeIndicator({ change }: { change?: "up" | "down" | "same" }) {
  if (!change || change === "same") {
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
  if (change === "up") {
    return <ChevronUp className="h-4 w-4 text-[#58CC02]" />;
  }
  return <ChevronDown className="h-4 w-4 text-[#FF4B4B]" />;
}

function TopThreePodium({ users }: { users: RankingUser[] }) {
  const top3 = users.slice(0, 3);
  const order = [1, 0, 2];

  return (
    <div className="flex items-end justify-center gap-2 mb-6 px-4">
      {order.map((idx, displayOrder) => {
        const user = top3[idx];
        if (!user) return null;
        const position = idx + 1;
        const colors = podiumColors[position as 1 | 2 | 3];
        const heights: Record<number, string> = { 0: "h-28", 1: "h-20", 2: "h-16" };
        const avatarSizes: Record<number, string> = { 0: "h-16 w-16", 1: "h-14 w-14", 2: "h-12 w-12" };

        return (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: displayOrder * 0.15 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-2">
              <Avatar className={cn(avatarSizes[idx], "border-4", colors.border, colors.glow)}>
                <AvatarImage src={user.avatar} />
                <AvatarFallback className={cn(colors.bg, colors.text, "font-bold text-lg")}>
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: displayOrder * 0.15 + 0.2, type: "spring" }}
                className={cn(
                  "absolute -bottom-2 left-1/2 -translate-x-1/2",
                  "flex items-center justify-center w-7 h-7 rounded-full",
                  colors.bg, colors.border, "border-2"
                )}
              >
                <span className={cn("text-sm font-black", colors.text)}>{position}</span>
              </motion.div>
            </div>
            
            <p className="text-xs font-bold text-foreground text-center max-w-[80px] truncate mt-2">
              {user.name.split(" ")[0]}
            </p>
            <div className="flex items-center gap-0.5 text-amber-500">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs font-bold">{user.xp}</span>
            </div>
            
            <div className={cn(
              "w-20 rounded-t-xl mt-2",
              heights[idx],
              colors.bg, colors.shadow
            )} />
          </motion.div>
        );
      })}
    </div>
  );
}

function RankingList({ users }: { users: RankingUser[] }) {
  const listUsers = users.slice(3);
  
  return (
    <div className="space-y-2">
      {listUsers.map((user, index) => {
        const position = index + 4;
        
        return (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className={cn(
                "p-3 flex items-center gap-3",
                user.isCurrentUser && "ring-2 ring-[#FFA500] bg-[#FFA500]/5"
              )}
              data-testid={`ranking-user-${user.id}`}
            >
              <div className="w-8 flex justify-center">
                {getRankIcon(position)}
              </div>
              
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-muted font-semibold">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className={cn(
                    "font-bold truncate",
                    user.isCurrentUser && "text-[#FFA500]"
                  )}>
                    {user.name}
                  </p>
                  {user.isCurrentUser && (
                    <span className="text-xs text-muted-foreground">(voce)</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Nivel {user.level}</span>
                  {user.streak && user.streak > 0 && (
                    <span className="flex items-center gap-0.5 text-orange-500">
                      <Flame className="h-3 w-3 fill-orange-500/30" />
                      {user.streak}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <ChangeIndicator change={user.change} />
                <XPDisplay amount={user.xp} size="sm" />
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

function UserPositionCard({ user, position, period }: { user: RankingUser; position: number; period: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className="p-4 mb-6 bg-gradient-to-br from-[#FFA500]/10 via-[#FFD700]/5 to-transparent border-[#FFA500]/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Sua posicao</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-4xl font-black text-[#FFA500]">#{position}</span>
              <ChangeIndicator change={user.change} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {period === "weekly" ? "Esta semana" : "Este mes"}
            </p>
            <div className="flex items-center justify-end gap-1 mt-1">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold text-amber-500">{user.xp}</span>
              <span className="text-sm text-muted-foreground">XP</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function RankingPage() {
  const [period, setPeriod] = useState("weekly");

  const currentRanking = period === "weekly" ? mockWeeklyRanking : mockMonthlyRanking;
  const currentUser = currentRanking.find(u => u.isCurrentUser);
  const currentPosition = currentRanking.findIndex(u => u.isCurrentUser) + 1;

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="ranking-page">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-center gap-2 p-4">
          <Trophy className="h-6 w-6 text-[#FFD700]" />
          <h1 className="font-black text-xl">Ranking</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <Tabs value={period} onValueChange={setPeriod} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
            <TabsTrigger 
              value="weekly" 
              className="font-bold data-[state=active]:bg-[#FFA500] data-[state=active]:text-white"
              data-testid="tab-weekly"
            >
              Semanal
            </TabsTrigger>
            <TabsTrigger 
              value="monthly"
              className="font-bold data-[state=active]:bg-[#FFA500] data-[state=active]:text-white"
              data-testid="tab-monthly"
            >
              Mensal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="mt-0">
            {currentUser && (
              <UserPositionCard user={currentUser} position={currentPosition} period="weekly" />
            )}
            <TopThreePodium users={mockWeeklyRanking} />
            <RankingList users={mockWeeklyRanking} />
          </TabsContent>

          <TabsContent value="monthly" className="mt-0">
            {currentUser && (
              <UserPositionCard user={currentUser} position={currentPosition} period="monthly" />
            )}
            <TopThreePodium users={mockMonthlyRanking} />
            <RankingList users={mockMonthlyRanking} />
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
