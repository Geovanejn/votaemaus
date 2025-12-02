import { Crown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface LevelBadgeProps {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  className?: string;
  showProgress?: boolean;
  size?: "sm" | "md" | "lg";
}

function calculateLevelProgress(currentXP: number, xpForNextLevel: number): number {
  if (xpForNextLevel <= 0) return 100;
  return Math.min(100, Math.floor((currentXP / xpForNextLevel) * 100));
}

export function LevelBadge({ 
  level, 
  currentXP,
  xpForNextLevel,
  className,
  showProgress = true,
  size = "md"
}: LevelBadgeProps) {
  const progress = calculateLevelProgress(currentXP, xpForNextLevel);
  
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg"
  };

  const iconClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const badgeSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };

  return (
    <div className={cn("flex items-center gap-2", className)} data-testid="level-badge">
      <div 
        className={cn(
          "flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold shadow-md",
          badgeSizes[size]
        )}
      >
        {level < 10 ? (
          <Star className={cn(iconClasses[size], "fill-white")} />
        ) : (
          <Crown className={cn(iconClasses[size], "fill-white")} />
        )}
      </div>
      <div className="flex flex-col">
        <span className={cn("font-bold text-foreground", sizeClasses[size])}>
          Nível {level}
        </span>
        {showProgress && (
          <div className="flex items-center gap-2">
            <Progress value={progress} className="h-1.5 w-16" />
            <span className="text-xs text-muted-foreground">
              {currentXP}/{xpForNextLevel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
