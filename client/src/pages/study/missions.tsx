import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { 
  BookOpen, 
  BookMarked, 
  Timer, 
  Zap, 
  User, 
  Target, 
  Brain, 
  Heart, 
  Lightbulb, 
  Flame,
  ChevronLeft,
  Check,
  Gift,
  Star,
  AlertCircle,
  Loader2,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  BookMarked,
  Timer,
  Zap,
  User,
  Target,
  Brain,
  Heart,
  Lightbulb,
  Flame,
};

interface Mission {
  id: number;
  missionId: number;
  completed: boolean;
  completedAt: string | null;
  xpAwarded: number;
  mission: {
    id: number;
    type: string;
    title: string;
    description: string;
    icon: string;
    xpReward: number;
  };
}

interface DailyMissionsData {
  missions: Mission[];
  completedCount: number;
  totalCount: number;
  allCompleted: boolean;
  bonusXpAvailable: number;
  date: string;
}

function MissionCard({ 
  mission, 
  onClick
}: { 
  mission: Mission; 
  onClick: () => void;
}) {
  const IconComponent = iconMap[mission.mission.icon] || Star;
  const isCompleted = mission.completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid={`mission-item-${mission.id}`}
    >
      <Card 
        className={`p-4 transition-all cursor-pointer ${
          isCompleted 
            ? "bg-[#58CC02]/10 border-[#58CC02]/30" 
            : "hover-elevate"
        }`}
        onClick={onClick}
        data-testid={`mission-card-${mission.id}`}
      >
        <div className="flex items-center gap-4">
          <div 
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isCompleted 
                ? "bg-[#58CC02]" 
                : "bg-gradient-to-br from-[#FFC800] to-[#FF9600]"
            }`}
            style={{ boxShadow: isCompleted ? "0 3px 0 0 #46A302" : "0 3px 0 0 #E68A00" }}
            data-testid={`mission-icon-${mission.id}`}
          >
            {isCompleted ? (
              <Check className="w-6 h-6 text-white" />
            ) : (
              <IconComponent className="w-6 h-6 text-white" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 
                className={`font-bold text-sm ${isCompleted ? "text-[#58CC02]" : "text-foreground"}`}
                data-testid={`mission-title-${mission.id}`}
              >
                {mission.mission.title}
              </h3>
              {isCompleted && (
                <Badge variant="secondary" className="bg-[#58CC02]/20 text-[#58CC02] text-xs">
                  Concluido
                </Badge>
              )}
            </div>
            <p 
              className="text-xs text-muted-foreground mt-0.5"
              data-testid={`mission-description-${mission.id}`}
            >
              {mission.mission.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${isCompleted ? "border-[#58CC02] text-[#58CC02]" : "border-[#FFC800] text-[#FFC800]"}`}
              data-testid={`mission-xp-${mission.id}`}
            >
              +{mission.mission.xpReward} XP
            </Badge>
            
            {!isCompleted && (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function RewardModal({ 
  isOpen, 
  onClose, 
  bonusXp 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  bonusXp: number;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={onClose}
          data-testid="reward-modal-overlay"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-card rounded-2xl p-8 mx-4 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
            data-testid="reward-modal"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#FFC800] to-[#FF9600] flex items-center justify-center"
              style={{ boxShadow: "0 6px 0 0 #E68A00" }}
            >
              <Gift className="w-10 h-10 text-white" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="reward-modal-title">
              Parabens!
            </h2>
            <p className="text-muted-foreground mb-4" data-testid="reward-modal-message">
              Voce completou todas as missoes de hoje!
            </p>
            
            <div className="bg-[#58CC02]/10 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2">
                <Star className="w-6 h-6 text-[#FFC800]" />
                <span className="text-2xl font-bold text-[#58CC02]" data-testid="reward-modal-xp">+{bonusXp} XP</span>
                <Star className="w-6 h-6 text-[#FFC800]" />
              </div>
              <p className="text-sm text-[#58CC02] mt-1">Bonus de conclusao!</p>
            </div>
            
            <Button 
              onClick={onClose}
              className="w-full bg-[#58CC02] text-white"
              data-testid="button-close-reward-modal"
            >
              Continuar
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function MissionsPage() {
  const [, setLocation] = useLocation();

  const { data, isLoading, isError, refetch } = useQuery<DailyMissionsData>({
    queryKey: ["/api/missions/daily"],
  });

  const handleMissionClick = (mission: Mission) => {
    if (mission.completed) return;
    setLocation(`/study/missions/${mission.missionId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-state">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFC800]" />
          <span className="text-muted-foreground">Carregando missoes...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4" data-testid="error-state">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h3 className="font-bold text-lg text-foreground mb-2">
          Erro ao carregar missoes
        </h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Nao foi possivel carregar as missoes. Tente novamente.
        </p>
        <Button onClick={() => refetch()} data-testid="button-retry">
          Tentar novamente
        </Button>
      </div>
    );
  }

  const missions = data?.missions || [];
  const completedCount = data?.completedCount || 0;
  const totalCount = data?.totalCount || 0;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-background" data-testid="missions-page">
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/study")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-lg" data-testid="page-title">Missoes Diarias</h1>
            <p className="text-xs text-muted-foreground">
              Clique em uma missao para comecar!
            </p>
          </div>
          <div className="flex items-center gap-2" data-testid="missions-counter">
            <Flame className="w-5 h-5 text-[#FF9600]" />
            <span className="font-bold text-sm">{completedCount}/{totalCount}</span>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        <Card 
          className="p-4 mb-6 bg-gradient-to-r from-[#FFC800] to-[#FFD633]"
          data-testid="progress-card"
        >
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h2 className="font-bold text-white" data-testid="progress-title">Progresso de Hoje</h2>
              <p className="text-white/80 text-sm" data-testid="progress-count">
                {completedCount} de {totalCount} missoes concluidas
              </p>
            </div>
            {data?.allCompleted ? (
              <div 
                className="w-12 h-12 rounded-full bg-[#58CC02] flex items-center justify-center"
                data-testid="progress-completed-icon"
              >
                <Check className="w-6 h-6 text-white" />
              </div>
            ) : (
              <div 
                className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"
                data-testid="progress-pending-icon"
              >
                <Gift className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          <Progress 
            value={progressPercent} 
            className="h-3 bg-white/30" 
            data-testid="progress-bar"
          />
          
          {!data?.allCompleted && (
            <div className="mt-3 flex items-center gap-2 text-white/90 text-sm" data-testid="bonus-hint">
              <Star className="w-4 h-4" />
              <span>Complete todas para ganhar +50 XP bonus!</span>
            </div>
          )}
        </Card>

        <div className="space-y-3" data-testid="missions-list">
          {missions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onClick={() => handleMissionClick(mission)}
            />
          ))}
        </div>

        {missions.length === 0 && (
          <div className="text-center py-12" data-testid="empty-state">
            <Flame className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-bold text-lg text-muted-foreground mb-2">
              Sem missoes disponiveis
            </h3>
            <p className="text-sm text-muted-foreground">
              As missoes serao atualizadas em breve!
            </p>
          </div>
        )}

        {data?.allCompleted && (
          <div className="mt-6 text-center" data-testid="all-completed-message">
            <Card className="p-6 bg-[#58CC02]/10 border-[#58CC02]/30">
              <Check className="w-12 h-12 mx-auto text-[#58CC02] mb-3" />
              <h3 className="font-bold text-lg text-[#58CC02] mb-2">
                Todas as missoes concluidas!
              </h3>
              <p className="text-sm text-muted-foreground">
                Parabens! Voce completou todas as missoes de hoje e ganhou +50 XP bonus!
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
