import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  Star, 
  Trophy, 
  Lock, 
  CheckCircle2,
  Sparkles,
  Heart as HeartIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

const typeIcons = {
  intro: BookOpen,
  study: BookOpen,
  meditation: HeartIcon,
  challenge: Trophy,
  review: Star
};

const typeColors = {
  intro: "from-blue-400 to-blue-600",
  study: "from-green-400 to-green-600",
  meditation: "from-purple-400 to-purple-600",
  challenge: "from-amber-400 to-amber-600",
  review: "from-cyan-400 to-cyan-600"
};

export function LessonNode({
  id,
  title,
  type,
  status,
  xpReward,
  isBonus = false,
  position,
  onClick
}: LessonNodeProps) {
  const Icon = typeIcons[type];
  const colorGradient = typeColors[type];
  
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const isInProgress = status === "in_progress";
  const isAvailable = status === "available";

  const positionClasses = {
    left: "mr-auto ml-4",
    center: "mx-auto",
    right: "ml-auto mr-4"
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center gap-2",
        positionClasses[position]
      )}
      data-testid={`lesson-node-${id}`}
    >
      <Button
        variant="ghost"
        className={cn(
          "relative h-16 w-16 rounded-full p-0 transition-all duration-300",
          "hover:scale-105 active:scale-95",
          isLocked && "opacity-50 cursor-not-allowed",
          isCompleted && "ring-4 ring-green-400 ring-offset-2 dark:ring-offset-background",
          isInProgress && "ring-4 ring-primary ring-offset-2 animate-pulse dark:ring-offset-background",
          (isAvailable || isInProgress) && !isLocked && "shadow-lg hover:shadow-xl"
        )}
        onClick={onClick}
        disabled={isLocked}
        data-testid={`button-lesson-${id}`}
      >
        <div 
          className={cn(
            "absolute inset-0 rounded-full",
            isLocked 
              ? "bg-gray-300 dark:bg-gray-700" 
              : `bg-gradient-to-br ${colorGradient}`
          )}
        />
        
        <div className="relative z-10 flex items-center justify-center">
          {isLocked ? (
            <Lock className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          ) : isCompleted ? (
            <CheckCircle2 className="h-7 w-7 text-white" />
          ) : (
            <Icon className="h-6 w-6 text-white" />
          )}
        </div>

        {isBonus && !isLocked && (
          <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
            <Sparkles className="h-3 w-3 text-yellow-900" />
          </div>
        )}

        {isCompleted && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
            +{xpReward}
          </div>
        )}
      </Button>

      <span 
        className={cn(
          "text-xs font-medium text-center max-w-[80px] leading-tight",
          isLocked ? "text-muted-foreground" : "text-foreground"
        )}
        data-testid={`text-lesson-title-${id}`}
      >
        {title}
      </span>
    </div>
  );
}
