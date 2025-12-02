import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Star, 
  Trophy, 
  Lock, 
  Check,
  Sparkles,
  Heart as HeartIcon,
  Crown,
  Play
} from "lucide-react";

export type LessonStatus = "locked" | "available" | "in_progress" | "completed";
export type LessonType = "intro" | "study" | "meditation" | "challenge" | "review";

interface LessonNodeProps {
  id: number;
  title: string;
  type: LessonType;
  status: LessonStatus;
  xpReward: number;
  isBonus?: boolean;
  position: "left" | "center" | "right";
  onClick?: () => void;
  showConnector?: boolean;
  isLast?: boolean;
}

const typeIcons = {
  intro: BookOpen,
  study: Star,
  meditation: HeartIcon,
  challenge: Trophy,
  review: Crown
};

const nodeColors = {
  completed: {
    bg: "bg-[#58CC02]",
    ring: "ring-[#58CC02]",
    shadow: "shadow-[0_8px_0_0_#46a302]",
    shadowHover: "shadow-[0_4px_0_0_#46a302]",
    innerBg: "bg-[#7BD937]",
    text: "text-white",
    glow: "shadow-[0_0_20px_rgba(88,204,2,0.4)]"
  },
  available: {
    bg: "bg-[#58CC02]",
    ring: "ring-[#58CC02]",
    shadow: "shadow-[0_8px_0_0_#46a302]",
    shadowHover: "shadow-[0_4px_0_0_#46a302]",
    innerBg: "bg-[#7BD937]",
    text: "text-white",
    glow: "shadow-[0_0_25px_rgba(88,204,2,0.5)]"
  },
  in_progress: {
    bg: "bg-[#1CB0F6]",
    ring: "ring-[#1CB0F6]",
    shadow: "shadow-[0_8px_0_0_#1899d6]",
    shadowHover: "shadow-[0_4px_0_0_#1899d6]",
    innerBg: "bg-[#49C0F8]",
    text: "text-white",
    glow: "shadow-[0_0_20px_rgba(28,176,246,0.4)]"
  },
  locked: {
    bg: "bg-[#E5E5E5] dark:bg-[#3C3C3C]",
    ring: "ring-[#E5E5E5] dark:ring-[#3C3C3C]",
    shadow: "shadow-[0_8px_0_0_#CECECE] dark:shadow-[0_8px_0_0_#2A2A2A]",
    shadowHover: "shadow-[0_8px_0_0_#CECECE] dark:shadow-[0_8px_0_0_#2A2A2A]",
    innerBg: "bg-[#F0F0F0] dark:bg-[#4A4A4A]",
    text: "text-[#AFAFAF] dark:text-[#6B6B6B]",
    glow: ""
  }
};

const bonusColors = {
  bg: "bg-gradient-to-br from-[#FFD700] to-[#FFA500]",
  shadow: "shadow-[0_8px_0_0_#CC8400]",
  shadowHover: "shadow-[0_4px_0_0_#CC8400]",
  innerBg: "bg-[#FFE55C]",
  glow: "shadow-[0_0_30px_rgba(255,215,0,0.6)]"
};

export function LessonNode({
  id,
  title,
  type,
  status,
  xpReward,
  isBonus = false,
  position,
  onClick,
  showConnector = true,
  isLast = false
}: LessonNodeProps) {
  const Icon = typeIcons[type];
  const baseColors = nodeColors[status];
  const colors = isBonus && status !== "locked" 
    ? { ...baseColors, ...bonusColors } 
    : baseColors;
  
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const isAvailable = status === "available";
  const isInProgress = status === "in_progress";

  const positionClasses = {
    left: "-translate-x-12",
    center: "translate-x-0",
    right: "translate-x-12"
  };

  return (
    <div 
      className="relative flex flex-col items-center"
      data-testid={`lesson-node-${id}`}
    >
      <motion.button
        whileHover={!isLocked ? { scale: 1.08, y: -6 } : undefined}
        whileTap={!isLocked ? { scale: 0.92, y: 4 } : undefined}
        onClick={!isLocked ? onClick : undefined}
        disabled={isLocked}
        className={cn(
          "relative flex items-center justify-center",
          "w-[76px] h-[76px] rounded-full",
          "transition-all duration-200 ease-out",
          colors.bg,
          colors.shadow,
          !isLocked && colors.glow,
          !isLocked && "cursor-pointer",
          !isLocked && "hover:brightness-110",
          isLocked && "cursor-not-allowed opacity-80",
          positionClasses[position]
        )}
        style={{
          transform: `${positionClasses[position]}`,
        }}
        data-testid={`button-lesson-${id}`}
      >
        <div 
          className={cn(
            "absolute inset-[5px] rounded-full",
            colors.innerBg,
            "flex items-center justify-center",
            "transition-all duration-200"
          )}
        >
          {isLocked ? (
            <Lock className="h-8 w-8 text-[#AFAFAF] dark:text-[#6B6B6B]" />
          ) : isCompleted ? (
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex items-center justify-center w-11 h-11 rounded-full bg-white/40"
            >
              <Check className="h-7 w-7 text-white stroke-[3.5]" />
            </motion.div>
          ) : isAvailable || isInProgress ? (
            <div className="relative">
              <Icon className={cn("h-8 w-8", colors.text)} />
              {isAvailable && (
                <motion.div
                  className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Play className="h-3 w-3 text-[#58CC02] fill-[#58CC02]" />
                </motion.div>
              )}
            </div>
          ) : (
            <Icon className={cn("h-8 w-8", colors.text)} />
          )}
        </div>

        {isBonus && !isLocked && (
          <motion.div 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="absolute -top-2 -right-2 bg-gradient-to-br from-[#FFE55C] to-[#FFC800] rounded-full p-2 shadow-lg border-2 border-white"
          >
            <Sparkles className="h-4 w-4 text-[#8B6914]" />
          </motion.div>
        )}

        {(isAvailable || isInProgress) && !isCompleted && (
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={cn(
              "absolute inset-0 rounded-full border-4",
              isAvailable ? "border-white/60" : "border-white/40"
            )}
          />
        )}

        {isAvailable && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(88, 204, 2, 0.4)",
                "0 0 0 15px rgba(88, 204, 2, 0)",
                "0 0 0 0 rgba(88, 204, 2, 0)"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        )}
      </motion.button>

      {isCompleted && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          className={cn(
            "absolute -bottom-2 px-2.5 py-1 rounded-full",
            "bg-gradient-to-r from-[#FFD700] to-[#FFC800]",
            "text-[#7A5C00] text-xs font-bold",
            "shadow-[0_3px_0_0_#CC9F00]",
            "border border-[#FFE55C]",
            positionClasses[position]
          )}
        >
          +{xpReward} XP
        </motion.div>
      )}

      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "mt-4 text-sm font-bold text-center max-w-[110px] leading-tight",
          isLocked ? "text-muted-foreground/50" : "text-foreground",
          isAvailable && "text-[#58CC02] dark:text-[#7BD937]",
          isCompleted && "text-[#58CC02] dark:text-[#7BD937]",
          positionClasses[position]
        )}
        data-testid={`text-lesson-title-${id}`}
      >
        {title}
      </motion.span>
    </div>
  );
}
