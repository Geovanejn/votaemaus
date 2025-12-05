import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/study";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Trophy, 
  Lock, 
  Check, 
  Star, 
  ChevronRight,
  Loader2,
  Calendar,
  Flame,
  Crown
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Season {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  coverImageUrl: string | null;
  status: string;
  totalLessons: number;
  publishedAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

interface UserSeasonProgress {
  lessonsCompleted: number;
  totalLessons: number;
  xpEarned: number;
  isMastered: boolean;
  completedAt: string | null;
}

interface SeasonWithProgress extends Season {
  userProgress?: UserSeasonProgress;
  isLocked: boolean;
  rankPosition?: number;
}

const seasonColors = [
  { bg: "#FF9600", shadow: "#CC7700", accent: "#FFB347" },
  { bg: "#58CC02", shadow: "#46A302", accent: "#7EE03D" },
  { bg: "#1CB0F6", shadow: "#1899D6", accent: "#5CC8F8" },
  { bg: "#A560E8", shadow: "#8A4DC7", accent: "#C090F0" },
  { bg: "#FF4B4B", shadow: "#CC3B3B", accent: "#FF7070" },
  { bg: "#FFC800", shadow: "#CC9F00", accent: "#FFD633" },
];

function getSeasonColor(index: number) {
  return seasonColors[index % seasonColors.length];
}

function SeasonCard({ 
  season, 
  index,
  onClick 
}: { 
  season: SeasonWithProgress; 
  index: number;
  onClick: () => void;
}) {
  const color = getSeasonColor(index);
  const progress = season.userProgress 
    ? (season.userProgress.lessonsCompleted / season.userProgress.totalLessons) * 100 
    : 0;
  const isCompleted = season.userProgress?.lessonsCompleted === season.totalLessons && season.totalLessons > 0;
  const isMastered = season.userProgress?.isMastered;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={!season.isLocked ? { scale: 1.02, y: -2 } : undefined}
      whileTap={!season.isLocked ? { scale: 0.98 } : undefined}
      onClick={!season.isLocked ? onClick : undefined}
      disabled={season.isLocked}
      className={cn(
        "w-full text-left rounded-2xl overflow-hidden transition-all",
        season.isLocked && "opacity-60 cursor-not-allowed"
      )}
      data-testid={`season-card-${season.id}`}
    >
      <Card className="overflow-hidden border-2">
        <div 
          className="p-4 relative"
          style={{
            background: season.isLocked 
              ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
              : isMastered
                ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                : `linear-gradient(135deg, ${color.bg} 0%, ${color.accent} 100%)`,
          }}
        >
          {isMastered && (
            <motion.div 
              className="absolute top-2 right-2"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="h-8 w-8 text-white drop-shadow-lg" />
            </motion.div>
          )}
          
          {season.isLocked && (
            <div className="absolute top-2 right-2">
              <Lock className="h-6 w-6 text-white/70" />
            </div>
          )}

          <div className="flex items-start gap-3">
            <div 
              className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center bg-white/20"
              style={{ boxShadow: `0 4px 0 0 ${season.isLocked ? '#4B5563' : color.shadow}` }}
            >
              {season.isLocked ? (
                <Lock className="h-7 w-7 text-white/70" />
              ) : isCompleted ? (
                <Trophy className="h-7 w-7 text-white" />
              ) : (
                <BookOpen className="h-7 w-7 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-white truncate">
                {season.title}
              </h3>
              {season.subtitle && (
                <p className="text-sm text-white/80 truncate">
                  {season.subtitle}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge 
                  variant="secondary" 
                  className="bg-white/20 text-white border-0 text-xs"
                >
                  {season.totalLessons} lições
                </Badge>
                {season.userProgress && season.userProgress.xpEarned > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="bg-white/20 text-white border-0 text-xs"
                  >
                    <Flame className="h-3 w-3 mr-1" />
                    {season.userProgress.xpEarned} XP
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-card">
          {season.userProgress ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Progresso
                </span>
                <span className="text-sm font-bold" style={{ color: season.isLocked ? '#6B7280' : color.bg }}>
                  {season.userProgress.lessonsCompleted}/{season.userProgress.totalLessons}
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, delay: index * 0.08 + 0.2 }}
                  className="h-full rounded-full"
                  style={{ 
                    backgroundColor: season.isLocked ? '#9CA3AF' : isMastered ? '#FFD700' : color.bg 
                  }}
                />
              </div>
              {isCompleted && !isMastered && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  Complete o desafio final para dominar!
                </p>
              )}
              {isMastered && (
                <p className="text-xs font-bold flex items-center gap-1" style={{ color: '#FFD700' }}>
                  <Crown className="h-3 w-3" />
                  Temporada dominada!
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {season.isLocked ? 'Complete a temporada anterior' : 'Comece agora!'}
              </span>
              {!season.isLocked && (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.button>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" data-testid="seasons-loading">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#FFA500]" />
        <p className="text-muted-foreground">Carregando temporadas...</p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="seasons-error">
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-bold text-foreground mb-2">Erro ao carregar</h1>
        <p className="text-muted-foreground mb-4">
          Não foi possível carregar as temporadas. Por favor, tente novamente.
        </p>
        <Button onClick={onRetry} data-testid="button-retry">
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" data-testid="seasons-empty">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4"
      >
        <BookOpen className="h-12 w-12 text-muted-foreground" />
      </motion.div>
      <h2 className="text-xl font-bold text-foreground mb-2">Nenhuma temporada disponível</h2>
      <p className="text-muted-foreground mb-4">
        As temporadas de estudo serão liberadas em breve. Enquanto isso, continue estudando as lições da semana!
      </p>
      <Button onClick={() => setLocation('/study')} data-testid="button-go-to-study">
        Ir para Estudos
      </Button>
    </div>
  );
}

function CurrentSeasonBanner({ season }: { season: SeasonWithProgress }) {
  const [, setLocation] = useLocation();
  const progress = season.userProgress 
    ? (season.userProgress.lessonsCompleted / season.userProgress.totalLessons) * 100 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4"
    >
      <Card 
        className="overflow-hidden border-2 border-[#FFA500]/30 cursor-pointer"
        onClick={() => setLocation(`/study/season/${season.id}`)}
        data-testid="card-current-season"
      >
        <div 
          className="p-5"
          style={{
            background: 'linear-gradient(135deg, #FFA500 0%, #FFD700 100%)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-white" />
            <span className="text-sm font-bold text-white/90" data-testid="text-season-label">Temporada Atual</span>
          </div>
          <h2 className="text-xl font-black text-white mb-1" data-testid="text-season-title">{season.title}</h2>
          {season.subtitle && (
            <p className="text-sm text-white/80" data-testid="text-season-subtitle">{season.subtitle}</p>
          )}
        </div>
        
        <div className="p-4 bg-card">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-sm font-medium text-muted-foreground">Seu progresso</span>
            <span className="text-sm font-bold text-[#FFA500]" data-testid="text-season-progress">
              {season.userProgress?.lessonsCompleted || 0}/{season.totalLessons} lições
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8 }}
              className="h-full rounded-full bg-[#FFA500]"
            />
          </div>
          <Button
            className="w-full font-bold bg-[#FFA500] hover:bg-[#E69500] text-white"
            style={{ boxShadow: '0 4px 0 0 #CC7700' }}
            data-testid="button-continue-season"
          >
            CONTINUAR
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

export default function SeasonsPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: seasons, isLoading, error, refetch } = useQuery<Season[]>({
    queryKey: ['/api/study/seasons'],
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState onRetry={refetch} />;
  }

  const seasonsWithProgress: SeasonWithProgress[] = (seasons || []).map((season, index) => ({
    ...season,
    isLocked: false,
    userProgress: undefined,
    rankPosition: undefined,
  }));

  const currentSeason = seasonsWithProgress.find(s => !s.isLocked && (!s.userProgress || s.userProgress.lessonsCompleted < s.totalLessons));
  const otherSeasons = seasonsWithProgress.filter(s => s.id !== currentSeason?.id);

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="seasons-page">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-center gap-2 p-4">
          <BookOpen className="h-6 w-6 text-[#FFA500]" />
          <h1 className="font-black text-xl">Temporadas</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto py-4">
        {seasonsWithProgress.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {currentSeason && <CurrentSeasonBanner season={currentSeason} />}
            
            <div className="px-4 space-y-4">
              {otherSeasons.length > 0 && (
                <div>
                  <h2 className="font-bold text-lg text-foreground mb-4">
                    {currentSeason ? 'Outras Temporadas' : 'Todas as Temporadas'}
                  </h2>
                  <div className="space-y-4">
                    {otherSeasons.map((season, index) => (
                      <SeasonCard
                        key={season.id}
                        season={season}
                        index={index}
                        onClick={() => setLocation(`/study/season/${season.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!currentSeason && seasonsWithProgress.length > 0 && (
                <div className="space-y-4">
                  {seasonsWithProgress.map((season, index) => (
                    <SeasonCard
                      key={season.id}
                      season={season}
                      index={index}
                      onClick={() => setLocation(`/study/season/${season.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
