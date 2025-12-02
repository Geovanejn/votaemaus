import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeartsDisplayProps {
  current: number;
  max: number;
  nextRefillMinutes?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function HeartsDisplay({ 
  current, 
  max, 
  nextRefillMinutes,
  className,
  size = "md" 
}: HeartsDisplayProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  const textClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <Heart
            key={i}
            className={cn(
              sizeClasses[size],
              "transition-all duration-300",
              i < current 
                ? "fill-red-500 text-red-500" 
                : "fill-gray-200 text-gray-300 dark:fill-gray-700 dark:text-gray-600"
            )}
            data-testid={`heart-${i}-${i < current ? 'full' : 'empty'}`}
          />
        ))}
      </div>
      {nextRefillMinutes !== undefined && current < max && (
        <span className={cn("text-muted-foreground ml-1", textClasses[size])} data-testid="text-refill-timer">
          +1 em {nextRefillMinutes}min
        </span>
      )}
    </div>
  );
}
