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
  Crown
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
    text: "text-white"
  },
  available: {
    bg: "bg-[#58CC02]",
    ring: "ring-[#58CC02]",
    shadow: "shadow-[0_8px_0_0_#46a302]",
    shadowHover: "shadow-[0_4px_0_0_#46a302]",
    innerBg: "bg-[#7BD937]",
    text: "text-white"
  },
  in_progress: {
    bg: "bg-[#1CB0F6]",
    ring: "ring-[#1CB0F6]",
    shadow: "shadow-[0_8px_0_0_#1899d6]",
    shadowHover: "shadow-[0_4px_0_0_#1899d6]",
    innerBg: "bg-[#49C0F8]",
    text: "text-white"
  },
  locked: {
    bg: "bg-[#E5E5E5] dark:bg-[#3C3C3C]",
    ring: "ring-[#E5E5E5] dark:ring-[#3C3C3C]",
    shadow: "shadow-[0_8px_0_0_#CECECE] dark:shadow-[0_8px_0_0_#2A2A2A]",
    shadowHover: "shadow-[0_8px_0_0_#CECECE] dark:shadow-[0_8px_0_0_#2A2A2A]",
    innerBg: "bg-[#F0F0F0] dark:bg-[#4A4A4A]",
    text: "text-[#AFAFAF] dark:text-[#6B6B6B]"
  }
};

const bonusColors = {
  bg: "bg-[#FF9600]",
  shadow: "shadow-[0_8px_0_0_#E68600]",
  shadowHover: "shadow-[0_4px_0_0_#E68600]",
  innerBg: "bg-[#FFB020]",
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
  const colors = isBonus && status !== "locked" ? { ...nodeColors[status], ...bonusColors } : nodeColors[status];
  
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const isAvailable = status === "available" || status === "in_progress";

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
        whileHover={!isLocked ? { scale: 1.05, y: -4 } : undefined}
        whileTap={!isLocked ? { scale: 0.95, y: 4 } : undefined}
        onClick={!isLocked ? onClick : undefined}
        disabled={isLocked}
        className={cn(
          "relative flex items-center justify-center",
          "w-[72px] h-[72px] rounded-full",
          "transition-all duration-150 ease-out",
          colors.bg,
          colors.shadow,
          !isLocked && "cursor-pointer",
          !isLocked && `hover:${colors.shadowHover}`,
          !isLocked && "active:translate-y-1",
          isLocked && "cursor-not-allowed",
          positionClasses[position]
        )}
        style={{
          transform: `${positionClasses[position]}`,
        }}
        data-testid={`button-lesson-${id}`}
      >
        <div 
          className={cn(
            "absolute inset-[4px] rounded-full",
            colors.innerBg,
            "flex items-center justify-center"
          )}
        >
          {isLocked ? (
            <Lock className="h-7 w-7 text-[#AFAFAF] dark:text-[#6B6B6B]" />
          ) : isCompleted ? (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/30">
              <Check className="h-6 w-6 text-white stroke-[3]" />
            </div>
          ) : (
            <Icon className={cn("h-7 w-7", colors.text)} />
          )}
        </div>

        {isBonus && !isLocked && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-[#FFC800] rounded-full p-1.5 shadow-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#8B6914]" />
          </motion.div>
        )}

        {isAvailable && !isCompleted && (
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full border-4 border-white/50"
          />
        )}
      </motion.button>

      {isCompleted && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "absolute -bottom-1 px-2 py-0.5 rounded-full",
            "bg-[#FFC800] text-[#8B6914] text-xs font-bold",
            "shadow-[0_2px_0_0_#E6B400]",
            positionClasses[position]
          )}
        >
          +{xpReward}
        </motion.div>
      )}

      <span 
        className={cn(
          "mt-3 text-sm font-semibold text-center max-w-[100px] leading-tight",
          isLocked ? "text-muted-foreground/60" : "text-foreground",
          positionClasses[position]
        )}
        data-testid={`text-lesson-title-${id}`}
      >
        {title}
      </span>
    </div>
  );
}
