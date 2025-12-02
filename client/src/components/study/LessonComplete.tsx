import { motion } from "framer-motion";
import { Trophy, Zap, Flame, Star, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LessonCompleteProps {
  xpEarned: number;
  isPerfect: boolean;
  streakDays: number;
  mistakesCount: number;
  timeSpentSeconds: number;
  onContinue: () => void;
}

export function LessonComplete({
  xpEarned,
  isPerfect,
  streakDays,
  mistakesCount,
  timeSpentSeconds,
  onContinue
}: LessonCompleteProps) {
  const minutes = Math.floor(timeSpentSeconds / 60);
  const seconds = timeSpentSeconds % 60;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 to-background flex flex-col items-center justify-center p-4" data-testid="lesson-complete">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="mb-6"
      >
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
            <Trophy className="h-12 w-12 text-white" />
          </div>
          {isPerfect && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2"
            >
              <Star className="h-5 w-5 text-white fill-white" />
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold text-foreground mb-2 text-center"
      >
        {isPerfect ? "Perfeito!" : "Lição Completa!"}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground mb-8 text-center"
      >
        {isPerfect 
          ? "Você completou sem nenhum erro!" 
          : "Continue assim, você está progredindo!"
        }
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm space-y-3 mb-8"
      >
        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
            <span className="font-medium">XP Total</span>
          </div>
          <span className="text-xl font-bold text-amber-500">+{xpEarned}</span>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <span className="font-medium">Sequência</span>
          </div>
          <span className="text-xl font-bold text-orange-500">{streakDays} dias</span>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Target className="h-5 w-5 text-blue-500" />
            </div>
            <span className="font-medium">Precisão</span>
          </div>
          <span className={cn(
            "text-xl font-bold",
            mistakesCount === 0 ? "text-green-500" : "text-blue-500"
          )}>
            {mistakesCount === 0 ? "100%" : `${Math.max(0, 100 - mistakesCount * 10)}%`}
          </span>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Tempo: {minutes}:{seconds.toString().padStart(2, '0')}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="w-full max-w-sm"
      >
        <Button
          onClick={onContinue}
          className="w-full py-6 text-lg font-bold"
          data-testid="button-continue"
        >
          CONTINUAR
        </Button>
      </motion.div>
    </div>
  );
}
