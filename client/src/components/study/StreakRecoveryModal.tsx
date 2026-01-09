import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flame, Snowflake, Diamond, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface StreakRecoveryStatus {
  needsRecovery: boolean;
  streakAtRisk: number;
  daysMissed: number;
  crystalCost: number;
  crystalsAvailable: number;
  canRecover: boolean;
  streakLost: boolean;
}

export function StreakRecoveryModal() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(0);
  const [showFreezeBreaking, setShowFreezeBreaking] = useState(false);
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery<StreakRecoveryStatus>({
    queryKey: ["/api/study/streak/status"],
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const recoverMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/study/streak/recover");
      return res.json();
    },
    onSuccess: () => {
      setShowFreezeBreaking(true);
      setTimeout(() => {
        setShowFreezeBreaking(false);
        setIsOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/study/streak/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/study/profile"] });
      }, 2000);
    },
  });

  const acknowledgeLossMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/study/streak/acknowledge-loss");
      return res.json();
    },
    onSuccess: () => {
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/study/streak/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/profile"] });
      setLocation("/study");
    },
  });

  useEffect(() => {
    if (!isLoading && status?.needsRecovery) {
      setIsOpen(true);
      if (status.streakLost) {
        setShowCountdown(true);
        setCountdownValue(status.streakAtRisk);
      }
    }
  }, [isLoading, status]);

  useEffect(() => {
    if (showCountdown && countdownValue > 0) {
      const timer = setTimeout(() => {
        setCountdownValue((prev) => prev - 1);
      }, 150);
      return () => clearTimeout(timer);
    } else if (showCountdown && countdownValue === 0) {
      setTimeout(() => setShowCountdown(false), 500);
    }
  }, [showCountdown, countdownValue]);

  if (isLoading || !status?.needsRecovery) {
    return null;
  }

  const handleRecover = () => {
    recoverMutation.mutate();
  };

  const handleGoToLessons = () => {
    acknowledgeLossMutation.mutate();
  };

  const handleClose = () => {
    if (!status.streakLost) {
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-sm mx-auto border-0 bg-gradient-to-b from-blue-900/95 to-slate-900/95 backdrop-blur-xl"
        data-testid="streak-recovery-modal"
      >
        <AnimatePresence mode="wait">
          {showFreezeBreaking ? (
            <motion.div
              key="freeze-breaking"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center py-8 gap-4"
            >
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1, 1.1, 1]
                }}
                transition={{ duration: 0.5 }}
              >
                <Snowflake className="w-20 h-20 text-cyan-400 opacity-50" />
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <Flame className="w-24 h-24 text-orange-500" />
              </motion.div>
              <p className="text-xl font-bold text-white">Ofensiva Recuperada!</p>
            </motion.div>
          ) : showCountdown ? (
            <motion.div
              key="countdown"
              className="flex flex-col items-center justify-center py-8 gap-4"
            >
              <div className="relative">
                <Flame className="w-20 h-20 text-gray-500" />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  key={countdownValue}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                >
                  <span className="text-4xl font-bold text-red-500">{countdownValue}</span>
                </motion.div>
              </div>
              <p className="text-lg text-gray-400">Perdendo ofensiva...</p>
            </motion.div>
          ) : status.streakLost ? (
            <motion.div
              key="lost"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6 py-4"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Flame className="w-20 h-20 text-gray-500" />
              </motion.div>
              
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">Ofensiva Perdida</h2>
                <p className="text-gray-400">
                  Infelizmente sua ofensiva de{" "}
                  <span className="text-orange-400 font-semibold">{status.streakAtRisk} dias</span>{" "}
                  foi perdida.
                </p>
                <p className="text-sm text-gray-500">
                  Passaram mais de 5 dias sem estudar.
                </p>
              </div>

              <Button
                onClick={handleGoToLessons}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6"
                disabled={acknowledgeLossMutation.isPending}
                data-testid="button-go-to-lessons"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Começar uma nova ofensiva
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="recovery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6 py-4"
            >
              <motion.div 
                className="relative"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <div className="absolute inset-0 bg-cyan-400/20 blur-2xl rounded-full" />
                <Snowflake className="w-20 h-20 text-cyan-400 relative z-10" />
                <Flame className="w-10 h-10 text-orange-500 absolute -bottom-1 -right-1 z-20" />
              </motion.div>
              
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">Ofensiva Congelada!</h2>
                <p className="text-gray-300">
                  Sua ofensiva de{" "}
                  <span className="text-orange-400 font-semibold">{status.streakAtRisk} dias</span>{" "}
                  está em risco!
                </p>
                <p className="text-sm text-gray-400">
                  {status.daysMissed === 1 
                    ? "Você perdeu 1 dia de estudo."
                    : `Você perdeu ${status.daysMissed} dias de estudo.`}
                </p>
              </div>

              <div className="w-full bg-slate-800/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Custo de recuperação:</span>
                  <div className="flex items-center gap-1">
                    <Diamond className="w-4 h-4 text-cyan-400" />
                    <span className="text-white font-bold">{status.crystalCost}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Seus cristais:</span>
                  <div className="flex items-center gap-1">
                    <Diamond className="w-4 h-4 text-cyan-400" />
                    <span className={`font-bold ${status.canRecover ? 'text-green-400' : 'text-red-400'}`}>
                      {status.crystalsAvailable}
                    </span>
                  </div>
                </div>
                {status.canRecover && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between pt-2 border-t border-slate-700"
                  >
                    <span className="text-gray-400">Após recuperação:</span>
                    <div className="flex items-center gap-1">
                      <Diamond className="w-4 h-4 text-cyan-400" />
                      <span className="text-yellow-400 font-bold">
                        {status.crystalsAvailable - status.crystalCost}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              {status.canRecover ? (
                <Button
                  onClick={handleRecover}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-6"
                  disabled={recoverMutation.isPending}
                  data-testid="button-recover-streak"
                >
                  <Diamond className="w-5 h-5 mr-2" />
                  {recoverMutation.isPending ? "Recuperando..." : `Usar ${status.crystalCost} cristais`}
                </Button>
              ) : (
                <div className="w-full space-y-3">
                  <p className="text-center text-red-400 text-sm">
                    Você não tem cristais suficientes para recuperar sua ofensiva.
                  </p>
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                    data-testid="button-close-modal"
                  >
                    Continuar sem recuperar
                  </Button>
                </div>
              )}

              <p className="text-xs text-gray-500 text-center">
                {status.daysMissed < 4 
                  ? `O custo aumenta com os dias: ${status.daysMissed + 1} dias = mais cristais`
                  : "Último dia para recuperar! Amanhã será tarde demais."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
