import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/study";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, Loader2, Sparkles } from "lucide-react";
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
  dailyXp?: number;
  isCurrentUser?: boolean;
}

interface LeaderboardResponse {
  periodType: string;
  periodKey: string;
  entries: RankingUser[];
}

function TopThreePodium({ users }: { users: RankingUser[] }) {
  const top3 = users.slice(0, 3);

  if (top3.length === 0) {
    return null;
  }

  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-center mb-6">Top 3 Participantes</h2>
      
      <div className="flex items-end justify-center gap-4 px-4">
        {second && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <Avatar className="h-16 w-16 border-4 border-gray-400">
                <AvatarImage src={second.photoUrl || ""} />
                <AvatarFallback className="bg-gray-400 text-white font-bold text-lg">
                  {second.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -left-2 w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-sm border-2 border-background">
                2
              </div>
            </div>
            <p className="text-sm font-bold mt-3">{second.username.split(" ")[0]}</p>
            <p className="text-xs text-amber-500 font-semibold">{second.totalXp.toLocaleString()} XP</p>
            <div className="w-20 h-24 bg-gray-400 rounded-t-lg mt-3" />
          </motion.div>
        )}

        {first && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="flex flex-col items-center -mt-4"
          >
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-amber-400 shadow-lg shadow-amber-400/30">
                <AvatarImage src={first.photoUrl || ""} />
                <AvatarFallback className="bg-amber-400 text-amber-900 font-bold text-xl">
                  {first.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Trophy className="h-6 w-6 text-amber-400 fill-amber-400" />
              </div>
            </div>
            <p className="text-sm font-bold mt-3">{first.username.split(" ")[0]}</p>
            <p className="text-xs text-amber-500 font-semibold">{first.totalXp.toLocaleString()} XP</p>
            <div className="w-20 h-32 bg-amber-400 rounded-t-lg mt-3" />
          </motion.div>
        )}

        {third && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <Avatar className="h-14 w-14 border-4 border-orange-700">
                <AvatarImage src={third.photoUrl || ""} />
                <AvatarFallback className="bg-orange-700 text-white font-bold">
                  {third.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-orange-700 flex items-center justify-center text-white font-bold text-sm border-2 border-background">
                3
              </div>
            </div>
            <p className="text-sm font-bold mt-3">{third.username.split(" ")[0]}</p>
            <p className="text-xs text-amber-500 font-semibold">{third.totalXp.toLocaleString()} XP</p>
            <div className="w-20 h-16 bg-orange-700 rounded-t-lg mt-3" />
          </motion.div>
        )}
      </div>
    </div>
  );
}

function RankingList({ users, currentUserId }: { users: RankingUser[]; currentUserId?: number }) {
  return (
    <div className="space-y-3">
      {users.map((user, index) => {
        const position = index + 1;
        const isCurrentUser = user.userId === currentUserId;
        const dailyXp = user.dailyXp || 0;

        return (
          <motion.div
            key={user.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card
              className={cn(
                "p-4 flex items-center gap-3",
                isCurrentUser && "ring-2 ring-amber-500 bg-amber-500/5"
              )}
              data-testid={`ranking-user-${user.userId}`}
            >
              <div className="w-8 flex justify-center">
                {position <= 3 ? (
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm",
                      position === 1 && "bg-amber-400 text-amber-900",
                      position === 2 && "bg-gray-400 text-white",
                      position === 3 && "bg-orange-700 text-white"
                    )}
                  >
                    {position}
                  </div>
                ) : (
                  <span className="text-base font-bold text-muted-foreground">
                    {position}
                  </span>
                )}
              </div>

              <Avatar className="h-12 w-12 border-2 border-border">
                <AvatarImage src={user.photoUrl || ""} />
                <AvatarFallback className="bg-muted font-semibold">
                  {user.username.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn("font-bold truncate", isCurrentUser && "text-amber-500")}>
                    {user.username}
                  </p>
                  {isCurrentUser && (
                    <span className="text-xs text-muted-foreground">(Voce)</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Nivel {user.level}</span>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    {user.currentStreak} dias
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-amber-500">{user.totalXp.toLocaleString()} XP</p>
                {dailyXp > 0 && (
                  <p className="text-xs text-green-500">+{dailyXp} hoje</p>
                )}
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

function RecentAchievements({ streak }: { streak: number }) {
  if (streak < 7) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <Card className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Conquistas Recentes
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold">Sequencia de {streak} dias!</p>
            <p className="text-sm text-muted-foreground">Continue assim para manter sua ofensiva</p>
          </div>
          <div className="text-amber-500 font-bold">+100 XP</div>
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
  const [period, setPeriod] = useState("geral");
  const { user, isAuthenticated } = useAuth();

  const { data: geralData, isLoading: geralLoading } = useQuery<LeaderboardResponse>({
    queryKey: ["/api/study/leaderboard", { period: "weekly" }],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/study/leaderboard?period=weekly", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Erro ao carregar ranking");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: anualData, isLoading: anualLoading } = useQuery<LeaderboardResponse>({
    queryKey: ["/api/study/leaderboard", { period: "monthly" }],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/study/leaderboard?period=monthly", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Erro ao carregar ranking");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const isLoading = isAuthenticated && (period === "geral" ? geralLoading : anualLoading);
  const currentData = period === "geral" ? geralData : period === "anual" ? anualData : geralData;
  const entries = currentData?.entries || [];

  const currentUserEntry = entries.find((e) => e.userId === user?.id);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background pb-24" data-testid="ranking-page">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center justify-center gap-2 p-4">
            <h1 className="font-bold text-xl">Ranking</h1>
          </div>
        </header>
        <main className="max-w-lg mx-auto p-4">
          <EmptyState />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="ranking-page">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-center gap-2 p-4">
          <h1 className="font-bold text-xl">Ranking</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <TopThreePodium users={entries} />

        <Tabs value={period} onValueChange={setPeriod} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-11 bg-muted/50">
            <TabsTrigger
              value="geral"
              className="font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
              data-testid="tab-geral"
            >
              Geral
            </TabsTrigger>
            <TabsTrigger
              value="anual"
              className="font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
              data-testid="tab-anual"
            >
              Anual
            </TabsTrigger>
            <TabsTrigger
              value="revista"
              className="font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
              data-testid="tab-revista"
            >
              Revista
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="mt-0">
            {entries.length > 0 ? (
              <>
                <RankingList users={entries} currentUserId={user?.id} />
                {currentUserEntry && (
                  <RecentAchievements streak={currentUserEntry.currentStreak} />
                )}
              </>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          <TabsContent value="anual" className="mt-0">
            {entries.length > 0 ? (
              <>
                <RankingList users={entries} currentUserId={user?.id} />
                {currentUserEntry && (
                  <RecentAchievements streak={currentUserEntry.currentStreak} />
                )}
              </>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          <TabsContent value="revista" className="mt-0">
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Trophy className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-bold text-muted-foreground">Em breve</h3>
              <p className="text-sm text-muted-foreground text-center mt-1">
                O ranking por revista estara disponivel em breve
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
