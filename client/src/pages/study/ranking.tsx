import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/study";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Trophy, Filter, Loader2, Star, Flame, Medal, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Season {
  id: number;
  title: string;
  status: string;
  aiExtractedTitle?: string;
}

interface Achievement {
  id: number;
  code: string;
  name: string;
  icon: string;
  unlockedAt: string;
  xpReward: number;
}

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

function HeaderSection({ userPosition, userXp, userPhoto, userName }: { userPosition: number; userXp: number; userPhoto?: string | null; userName?: string }) {
  return (
    <div 
      className="px-4 pt-4 pb-8"
      style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #dc2626 100%)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-emerald-400">
            <AvatarImage src={userPhoto || ""} />
            <AvatarFallback className="bg-amber-100 text-amber-700 font-bold">
              {userName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-bold text-xl text-white">Ranking</h1>
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-amber-300" />
              <span className="text-white/90 text-sm">Posição #{userPosition || "-"}</span>
            </div>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Filter className="h-5 w-5 text-white" />
        </button>
      </div>
      
      <div 
        className="rounded-2xl p-5 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.6) 0%, rgba(245, 158, 11, 0.4) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <p className="text-4xl font-black text-white drop-shadow-md">
          {userXp.toLocaleString('pt-BR')} XP
        </p>
        <p className="text-white/80 text-sm mt-1">Seu Total de Pontos</p>
      </div>
    </div>
  );
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
    <div className="bg-background -mt-4 rounded-t-3xl pt-6 pb-4">
      <h2 className="text-lg font-bold text-center mb-6">Top 3 Participantes</h2>
      
      <div className="flex items-end justify-center gap-6 px-4">
        {second && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <Avatar className="h-16 w-16 border-4 border-gray-300">
                <AvatarImage src={second.photoUrl || ""} />
                <AvatarFallback className="bg-gray-300 text-gray-700 font-bold text-lg">
                  {second.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-xs border-2 border-white">
                2
              </div>
            </div>
            <p className="text-sm font-semibold mt-2 text-center">{second.username.split(" ")[0]}</p>
            <p className="text-xs text-muted-foreground">{second.totalXp.toLocaleString()} XP</p>
          </motion.div>
        )}

        {first && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="flex flex-col items-center -mt-6"
          >
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-amber-400 shadow-lg">
                <AvatarImage src={first.photoUrl || ""} />
                <AvatarFallback className="bg-amber-100 text-amber-700 font-bold text-xl">
                  {first.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <p className="text-sm font-bold mt-2 text-center">{first.username.split(" ")[0]}</p>
            <p className="text-xs font-semibold text-amber-500">{first.totalXp.toLocaleString()} XP</p>
          </motion.div>
        )}

        {third && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <Avatar className="h-14 w-14 border-4 border-orange-400">
                <AvatarImage src={third.photoUrl || ""} />
                <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">
                  {third.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs border-2 border-white">
                3
              </div>
            </div>
            <p className="text-sm font-semibold mt-2 text-center">{third.username.split(" ")[0]}</p>
            <p className="text-xs text-muted-foreground">{third.totalXp.toLocaleString()} XP</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function RankingList({ users, currentUserId }: { users: RankingUser[]; currentUserId?: number }) {
  const getPositionColor = (position: number) => {
    if (position === 1) return "bg-amber-400 text-amber-900";
    if (position === 2) return "bg-gray-300 text-gray-700";
    if (position === 3) return "bg-orange-400 text-white";
    return "bg-violet-500 text-white";
  };

  const getXpColor = (position: number) => {
    if (position === 1) return "text-amber-500";
    if (position === 2) return "text-gray-500";
    if (position === 3) return "text-orange-500";
    return "text-violet-500";
  };

  return (
    <div className="space-y-2 px-4">
      {users.map((user, index) => {
        const position = index + 1;
        const isCurrentUser = user.userId === currentUserId;
        const dailyXp = user.dailyXp || Math.floor(50 + position * 10);

        return (
          <motion.div
            key={user.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl",
              isCurrentUser 
                ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white" 
                : "bg-card border border-border"
            )}
            data-testid={`ranking-user-${user.userId}`}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0",
              isCurrentUser ? "bg-white/20 text-white" : getPositionColor(position)
            )}>
              {position}
            </div>

            <Avatar className={cn(
              "h-11 w-11 border-2 flex-shrink-0",
              isCurrentUser ? "border-white/30" : "border-border"
            )}>
              <AvatarImage src={user.photoUrl || ""} />
              <AvatarFallback className={cn(
                "font-semibold",
                isCurrentUser ? "bg-white/20 text-white" : "bg-muted"
              )}>
                {user.username.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-bold truncate",
                isCurrentUser ? "text-white" : "text-foreground"
              )}>
                {user.username}
                {isCurrentUser && " (Você)"}
              </p>
              <p className={cn(
                "text-xs",
                isCurrentUser ? "text-white/70" : "text-muted-foreground"
              )}>
                Nível {user.level} • {user.currentStreak} dias
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className={cn(
                "font-bold",
                isCurrentUser ? "text-white" : getXpColor(position)
              )}>
                {user.totalXp.toLocaleString()} XP
              </p>
              <p className={cn(
                "text-xs",
                isCurrentUser ? "text-white/70" : "text-orange-500"
              )}>
                +{dailyXp} hoje
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function ConquistasRecentes() {
  const { data: achievements, isLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/study/achievements/recent'],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/study/achievements?limit=5", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data || []).filter((a: any) => a.unlocked).slice(0, 5);
    },
  });

  const iconMap: Record<string, typeof Star> = {
    flame: Flame,
    book: BookOpen,
    trophy: Trophy,
    star: Star,
    medal: Medal,
  };

  const getIcon = (iconName: string) => iconMap[iconName?.toLowerCase()] || Star;

  if (isLoading || !achievements || achievements.length === 0) {
    return null;
  }

  return (
    <div className="px-4 mt-6 mb-4">
      <h3 className="font-bold text-lg mb-3">Conquistas Recentes</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {achievements.map((achievement) => {
          const IconComponent = getIcon(achievement.icon);
          return (
            <Card 
              key={achievement.id} 
              className="flex-shrink-0 p-3 flex flex-col items-center gap-2 min-w-[80px]"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <IconComponent className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-[10px] text-center font-medium line-clamp-2">
                {achievement.name}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
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
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const { user, isAuthenticated } = useAuth();

  const { data: seasons = [] } = useQuery<Season[]>({
    queryKey: ["/api/study/seasons"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/study/seasons", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated,
  });

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

  const { data: revistaData, isLoading: revistaLoading } = useQuery<LeaderboardResponse>({
    queryKey: ["/api/study/leaderboard", { period: "seasonal", seasonId: selectedSeasonId }],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const url = selectedSeasonId 
        ? `/api/study/leaderboard?period=seasonal&seasonId=${selectedSeasonId}`
        : "/api/study/leaderboard?period=seasonal";
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Erro ao carregar ranking");
      return res.json();
    },
    enabled: isAuthenticated && period === "revista",
  });

  const isLoading = isAuthenticated && (
    period === "geral" ? geralLoading : 
    period === "anual" ? anualLoading : 
    revistaLoading
  );
  
  const currentData = period === "geral" ? geralData : 
                      period === "anual" ? anualData : 
                      revistaData;
  const entries = currentData?.entries || [];

  const currentUserEntry = entries.find((e) => e.userId === user?.id);
  const currentPosition = currentUserEntry ? entries.findIndex((e) => e.userId === user?.id) + 1 : 0;
  const currentUserXp = currentUserEntry?.totalXp || 0;

  if (isLoading) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background pb-24" data-testid="ranking-page">
        <HeaderSection userPosition={0} userXp={0} userPhoto={null} userName="Usuário" />
        <div className="bg-background -mt-4 rounded-t-3xl">
          <EmptyState />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="ranking-page">
      <HeaderSection userPosition={currentPosition} userXp={currentUserXp} userPhoto={user?.photoUrl} userName={user?.username} />
      
      <TopThreePodium users={entries} />

      <div className="px-4 mb-4 space-y-3">
        <Tabs value={period} onValueChange={setPeriod} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-10 bg-muted/30 p-1 rounded-lg">
            <TabsTrigger
              value="geral"
              className="font-medium text-sm rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
              data-testid="tab-geral"
            >
              Geral
            </TabsTrigger>
            <TabsTrigger
              value="anual"
              className="font-medium text-sm rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
              data-testid="tab-anual"
            >
              Anual
            </TabsTrigger>
            <TabsTrigger
              value="revista"
              className="font-medium text-sm rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              data-testid="tab-revista"
            >
              Revista
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {period === "revista" && seasons.length > 0 && (
          <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
            <SelectTrigger className="w-full" data-testid="select-revista">
              <SelectValue placeholder="Selecione uma revista" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id.toString()}>
                  {season.aiExtractedTitle || season.title}
                  {season.status === "published" ? " (Publicada)" : " (Em andamento)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {entries.length > 0 ? (
        <RankingList users={entries} currentUserId={user?.id} />
      ) : (
        <EmptyState />
      )}

      <ConquistasRecentes />

      <BottomNav />
    </div>
  );
}
