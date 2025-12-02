import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LessonNode, LessonStatus, LessonType } from "./LessonNode";
import { BookOpen, Calendar } from "lucide-react";

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
  isCompleted,
  isNext
}: { 
  fromPos: "left" | "center" | "right";
  toPos: "left" | "center" | "right";
  isCompleted: boolean;
  isNext?: boolean;
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

  const completedGradientId = `pathGradient-completed-${fromPos}-${toPos}`;
  const pendingGradientId = `pathGradient-pending-${fromPos}-${toPos}`;
  const nextGradientId = `pathGradient-next-${fromPos}-${toPos}`;

  return (
    <svg 
      className="absolute left-0 right-0 mx-auto w-[280px] h-20 -mt-2 -mb-2 z-0"
      viewBox="0 0 280 80"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={completedGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#58CC02" />
          <stop offset="100%" stopColor="#46a302" />
        </linearGradient>
        <linearGradient id={pendingGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E5E5E5" />
          <stop offset="100%" stopColor="#CECECE" />
        </linearGradient>
        <linearGradient id={nextGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#58CC02" />
          <stop offset="100%" stopColor="#46a302" />
        </linearGradient>
        <filter id="pathShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="1" floodOpacity="0.2"/>
        </filter>
      </defs>
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        d={pathD}
        fill="none"
        stroke={`url(#${isCompleted ? completedGradientId : (isNext ? nextGradientId : pendingGradientId)})`}
        strokeWidth="10"
        strokeLinecap="round"
        filter="url(#pathShadow)"
      />
      {(isCompleted || isNext) && (
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          d={pathD}
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function WeekHeader({ weekNumber, weekTitle }: { weekNumber: number; weekTitle: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-10"
    >
      <motion.div 
        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FFA500]/10 to-[#FFD700]/10 dark:from-[#FFA500]/20 dark:to-[#FFD700]/20 border border-[#FFA500]/20 rounded-full px-5 py-2 mb-3"
        whileHover={{ scale: 1.02 }}
      >
        <Calendar className="h-4 w-4 text-[#FFA500]" />
        <span className="text-sm font-bold text-[#FFA500]">SEMANA {weekNumber}</span>
      </motion.div>
      <h2 
        className="text-2xl md:text-3xl font-black text-foreground tracking-tight" 
        data-testid="text-week-title"
      >
        {weekTitle}
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        Complete todas as licoes para desbloquear a proxima semana
      </p>
    </motion.div>
  );
}

function UnitDivider({ unitNumber, unitTitle }: { unitNumber: number; unitTitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      className="flex items-center gap-3 w-full max-w-[320px] my-6"
    >
      <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent to-border" />
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Unidade {unitNumber}
        </span>
      </div>
      <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent to-border" />
    </motion.div>
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
      <WeekHeader weekNumber={weekNumber} weekTitle={weekTitle} />

      <div className="relative flex flex-col items-center gap-6 w-full max-w-[280px]">
        {lessons.map((lesson, index) => {
          const currentPos = getPosition(index);
          const nextPos = index < lessons.length - 1 ? getPosition(index + 1) : currentPos;
          const isCompleted = lesson.status === "completed";
          const isNextLesson = index < lessons.length - 1 && 
            lessons[index].status === "completed" && 
            lessons[index + 1].status !== "completed";
          
          return (
            <motion.div 
              key={lesson.id} 
              className="relative flex flex-col items-center w-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
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
                  isCompleted={isCompleted}
                  isNext={isNextLesson}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
