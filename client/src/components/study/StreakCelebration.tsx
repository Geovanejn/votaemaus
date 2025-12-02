import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Flame, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StreakCelebrationProps {
  streakDays: number;
  weekProgress: boolean[];
  message?: string;
  onContinue?: () => void;
  className?: string;
}

const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

export function StreakCelebration({
  streakDays,
  weekProgress,
  message = "Sua ofensiva comecou! Pratique todos os dias pra ela crescer.",
  onContinue,
  className
}: StreakCelebrationProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center min-h-screen p-6",
        "bg-background",
        className
      )}
      data-testid="streak-celebration"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-muted/50 rounded-2xl px-6 py-4 mb-8 max-w-xs text-center relative"
      >
        <p className="text-foreground font-medium">{message}</p>
        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-muted/50 rotate-45" />
      </motion.div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="relative mb-6"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatDelay: 1
          }}
          className="relative"
        >
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FF9600] via-[#FF6B00] to-[#FF4500] flex items-center justify-center shadow-[0_0_60px_rgba(255,150,0,0.4)]">
            <Flame className="h-16 w-16 text-white drop-shadow-lg" />
          </div>
          
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FF9600] to-[#FF4500] -z-10"
          />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.4 }}
        className="text-center mb-8"
      >
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-8xl font-black text-[#FF9600] block mb-2"
          style={{ 
            textShadow: '0 4px 0 #CC7700, 0 6px 10px rgba(255, 150, 0, 0.3)'
          }}
        >
          {streakDays}
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-2xl font-bold text-[#FF9600]"
        >
          {streakDays === 1 ? "dia de ofensiva" : "dias de ofensiva"}
        </motion.span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex items-center justify-center gap-3 mb-12"
      >
        {dayNames.map((day, index) => {
          const isCompleted = weekProgress[index];
          const isToday = index === new Date().getDay() - 1 || (new Date().getDay() === 0 && index === 6);
          
          return (
            <div key={day} className="flex flex-col items-center gap-2">
              <span className={cn(
                "text-sm font-bold",
                isToday ? "text-[#FF9600]" : "text-muted-foreground"
              )}>
                {day}
              </span>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8 + index * 0.05 }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isCompleted 
                    ? "bg-gradient-to-br from-[#FF9600] to-[#FF6B00]" 
                    : "bg-muted"
                )}
              >
                {isCompleted && (
                  <Check className="h-4 w-4 text-white stroke-[3]" />
                )}
              </motion.div>
            </div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="w-full max-w-sm"
      >
        <Button
          onClick={onContinue}
          className={cn(
            "w-full py-6 text-lg font-black uppercase tracking-wide",
            "bg-gradient-to-r from-[#1CB0F6] to-[#1899D6]",
            "shadow-[0_6px_0_0_#1480B8]",
            "hover:shadow-[0_4px_0_0_#1480B8] hover:translate-y-[2px]",
            "active:shadow-[0_2px_0_0_#1480B8] active:translate-y-[4px]",
            "transition-all duration-100"
          )}
          data-testid="button-continue"
        >
          Vou me dedicar
        </Button>
      </motion.div>
    </div>
  );
}
