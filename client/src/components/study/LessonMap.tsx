import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LessonNode, LessonStatus, LessonType } from "./LessonNode";

interface Lesson {
  id: number;
  title: string;
  type: LessonType;
  status: LessonStatus;
  xpReward: number;
  isBonus?: boolean;
}

interface LessonMapProps {
  weekTitle: string;
  weekNumber: number;
  lessons: Lesson[];
  onLessonClick?: (lessonId: number) => void;
  className?: string;
}

function getPosition(index: number): "left" | "center" | "right" {
  const pattern: ("left" | "center" | "right")[] = ["center", "right", "center", "left"];
  return pattern[index % pattern.length];
}

function PathConnector({ 
  fromPos, 
  toPos, 
  isCompleted 
}: { 
  fromPos: "left" | "center" | "right";
  toPos: "left" | "center" | "right";
  isCompleted: boolean;
}) {
  const getX = (pos: string) => {
    switch (pos) {
      case "left": return 95;
      case "right": return 185;
      default: return 140;
    }
  };

  const fromX = getX(fromPos);
  const toX = getX(toPos);
  
  const controlPoint1X = fromX;
  const controlPoint2X = toX;

  const pathD = `M ${fromX} 0 C ${controlPoint1X} 35, ${controlPoint2X} 45, ${toX} 80`;

  return (
    <svg 
      className="absolute left-0 right-0 mx-auto w-[280px] h-20 -mt-2 -mb-2 z-0"
      viewBox="0 0 280 80"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`pathGradient-${isCompleted}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isCompleted ? "#58CC02" : "#E5E5E5"} />
          <stop offset="100%" stopColor={isCompleted ? "#46a302" : "#CECECE"} />
        </linearGradient>
      </defs>
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        d={pathD}
        fill="none"
        stroke={`url(#pathGradient-${isCompleted})`}
        strokeWidth="8"
        strokeLinecap="round"
        className="drop-shadow-sm"
      />
      {isCompleted && (
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          d={pathD}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function LessonMap({
  weekTitle,
  weekNumber,
  lessons,
  onLessonClick,
  className
}: LessonMapProps) {
  return (
    <div className={cn("flex flex-col items-center", className)} data-testid="lesson-map">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 bg-muted/50 dark:bg-muted/20 rounded-full px-4 py-1.5 mb-2">
          <span className="text-sm font-medium text-muted-foreground">Semana {weekNumber}</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground" data-testid="text-week-title">
          {weekTitle}
        </h2>
      </motion.div>

      <div className="relative flex flex-col items-center gap-4 w-full max-w-[280px]">
        {lessons.map((lesson, index) => {
          const currentPos = getPosition(index);
          const nextPos = index < lessons.length - 1 ? getPosition(index + 1) : currentPos;
          const isNextCompleted = index < lessons.length - 1 && lessons[index].status === "completed";
          
          return (
            <motion.div 
              key={lesson.id} 
              className="relative flex flex-col items-center w-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <LessonNode
                id={lesson.id}
                title={lesson.title}
                type={lesson.type}
                status={lesson.status}
                xpReward={lesson.xpReward}
                isBonus={lesson.isBonus}
                position={currentPos}
                onClick={() => onLessonClick?.(lesson.id)}
                isLast={index === lessons.length - 1}
              />
              
              {index < lessons.length - 1 && (
                <PathConnector 
                  fromPos={currentPos}
                  toPos={nextPos}
                  isCompleted={isNextCompleted}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
