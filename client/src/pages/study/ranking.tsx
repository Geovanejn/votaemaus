import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  BottomNav,
  XPDisplay 
} from "@/components/study";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown, TrendingUp, Flame, ChevronUp, ChevronDown, Minus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface RankingUser {
  rank: number;
  userId: number;
  username: string;
  photoUrl: string | null;
  totalXp: number;
  level: number;
  currentStreak: number;
  isCurrentUser?: boolean;
}

interface LeaderboardResponse {
  periodType: string;
  periodKey: string;
  entries: RankingUser[];
}

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

function TopThreePodium({ users }: { users: RankingUser[] }) {
  const top3 = users.slice(0, 3);
  const order = [1, 0, 2];

  if (top3.length === 0) {
    return null;
  }

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
            key={user.userId}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: displayOrder * 0.15 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-2">
              <Avatar className={cn(avatarSizes[idx], "border-4", colors.border, colors.glow)}>
                <AvatarImage src={user.photoUrl || ""} />
                <AvatarFallback className={cn(colors.bg, colors.text, "font-bold text-lg")}>
                  {user.username.charAt(0)}
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
              {user.username.split(" ")[0]}
            </p>
            <div className="flex items-center gap-0.5 text-amber-500">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs font-bold">{user.totalXp}</span>
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

function RankingList({ users, currentUserId }: { users: RankingUser[]; currentUserId?: number }) {
  const listUsers = users.slice(3);
  
  if (listUsers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {listUsers.map((user, index) => {
        const position = index + 4;
        const isCurrentUser = user.userId === currentUserId;
        
        return (
          <motion.div
            key={user.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className={cn(
                "p-3 flex items-center gap-3",
                isCurrentUser && "ring-2 ring-[#FFA500] bg-[#FFA500]/5"
              )}
              data-testid={`ranking-user-${user.userId}`}
            >
              <div className="w-8 flex justify-center">
                {getRankIcon(position)}
              </div>
              
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={user.photoUrl || ""} />
                <AvatarFallback className="bg-muted font-semibold">
                  {user.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className={cn(
                    "font-bold truncate",
                    isCurrentUser && "text-[#FFA500]"
                  )}>
                    {user.username}
                  </p>
                  {isCurrentUser && (
                    <span className="text-xs text-muted-foreground">(voce)</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Nivel {user.level}</span>
                  {user.currentStreak > 0 && (
                    <span className="flex items-center gap-0.5 text-orange-500">
                      <Flame className="h-3 w-3 fill-orange-500/30" />
                      {user.currentStreak}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <XPDisplay amount={user.totalXp} size="sm" />
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
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {period === "weekly" ? "Esta semana" : "Este mes"}
            </p>
            <div className="flex items-center justify-end gap-1 mt-1">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold text-amber-500">{user.totalXp}</span>
              <span className="text-sm text-muted-foreground">XP</span>
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
        <p className="text-muted-foreground">Carregando ranking...</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Trophy className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <h3 className="text-lg font-bold text-muted-foreground">Nenhum participante ainda</h3>
      <p className="text-sm text-muted-foreground text-center mt-1">
        Complete licoes para aparecer no ranking
      </p>
    </div>
  );
}

export default function RankingPage() {
  const [period, setPeriod] = useState("weekly");
  const { user, isAuthenticated } = useAuth();

  const { data: weeklyData, isLoading: weeklyLoading } = useQuery<LeaderboardResponse>({
    queryKey: ['/api/study/leaderboard', { period: 'weekly' }],
    queryFn: async () => {
      const res = await fetch('/api/study/leaderboard?period=weekly', { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao carregar ranking');
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery<LeaderboardResponse>({
    queryKey: ['/api/study/leaderboard', { period: 'monthly' }],
    queryFn: async () => {
      const res = await fetch('/api/study/leaderboard?period=monthly', { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao carregar ranking');
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const isLoading = period === "weekly" ? weeklyLoading : monthlyLoading;
  const currentData = period === "weekly" ? weeklyData : monthlyData;
  const entries = currentData?.entries || [];
  
  const currentUserEntry = entries.find(e => e.userId === user?.id);
  const currentPosition = currentUserEntry ? entries.findIndex(e => e.userId === user?.id) + 1 : 0;

  if (isLoading) {
    return <LoadingState />;
  }

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
            {currentUserEntry && currentPosition > 0 && (
              <UserPositionCard user={currentUserEntry} position={currentPosition} period="weekly" />
            )}
            {entries.length > 0 ? (
              <>
                <TopThreePodium users={entries} />
                <RankingList users={entries} currentUserId={user?.id} />
              </>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          <TabsContent value="monthly" className="mt-0">
            {currentUserEntry && currentPosition > 0 && (
              <UserPositionCard user={currentUserEntry} position={currentPosition} period="monthly" />
            )}
            {entries.length > 0 ? (
              <>
                <TopThreePodium users={entries} />
                <RankingList users={entries} currentUserId={user?.id} />
              </>
            ) : (
              <EmptyState />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
