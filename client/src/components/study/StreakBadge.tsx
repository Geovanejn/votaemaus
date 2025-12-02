import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  days: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function StreakBadge({ 
  days, 
  className,
  size = "md",
  showLabel = true
}: StreakBadgeProps) {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const iconClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  const isActive = days > 0;

  return (
    <div 
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-full",
        isActive ? "bg-orange-100 dark:bg-orange-900/30" : "bg-gray-100 dark:bg-gray-800",
        className
      )}
      data-testid="streak-badge"
    >
      <Flame 
        className={cn(
          iconClasses[size],
          "transition-colors",
          isActive 
            ? "fill-orange-500 text-orange-500 animate-pulse" 
            : "fill-gray-300 text-gray-400 dark:fill-gray-600"
        )} 
      />
      <span 
        className={cn(
          "font-bold",
          sizeClasses[size],
          isActive ? "text-orange-600 dark:text-orange-400" : "text-gray-500"
        )}
      >
        {days}
      </span>
      {showLabel && (
        <span className={cn("text-muted-foreground", sizeClasses[size])}>
          {days === 1 ? "dia" : "dias"}
        </span>
      )}
    </div>
  );
}
