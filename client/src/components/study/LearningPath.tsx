import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Star, MessageSquare, Presentation, Lock, Dumbbell, Check } from "lucide-react";

export type LessonStatus = "completed" | "current" | "locked";

export interface LessonItem {
  id: number;
  lessonNumber: number;
  title: string;
  subtitle: string;
  status: LessonStatus;
  progress: number;
  totalSections: number;
}

interface LearningPathProps {
  lessons: LessonItem[];
  onLessonClick?: (lessonId: number) => void;
  onPracticeClick?: () => void;
  showPractice?: boolean;
}

function ProgressDots({ current, total, isLocked }: { current: number; total: number; isLocked: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "w-2.5 h-2.5 rounded-full transition-colors",
            isLocked
              ? "bg-muted-foreground/20"
              : index < current
              ? "bg-[#58CC02]"
              : "bg-muted-foreground/30"
          )}
        />
      ))}
      <span className={cn(
        "text-xs font-bold ml-1.5",
        isLocked ? "text-muted-foreground/40" : "text-muted-foreground"
      )}>
        {isLocked ? "0" : current}/{total}
      </span>
    </div>
  );
}

function LessonIcon({ status, lessonNumber }: { status: LessonStatus; lessonNumber: number }) {
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const isCurrent = status === "current";

  const bgColor = isLocked 
    ? "bg-muted" 
    : isCompleted 
    ? "bg-[#58CC02]" 
    : "bg-[#FFC800]";
  
  const shadowColor = isLocked 
    ? "#CECECE" 
    : isCompleted 
    ? "#46A302" 
    : "#CC9F00";

  return (
    <motion.div
      whileHover={!isLocked ? { scale: 1.05 } : undefined}
      className={cn(
        "relative flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center",
        bgColor,
        !isLocked && "cursor-pointer"
      )}
      style={{
        boxShadow: `0 4px 0 0 ${shadowColor}`
      }}
    >
      {isLocked ? (
        <Lock className="h-6 w-6 text-muted-foreground/50" />
      ) : isCompleted ? (
        <Check className="h-6 w-6 text-white stroke-[3]" />
      ) : (
        <Star className="h-6 w-6 text-white" />
      )}
    </motion.div>
  );
}

function LessonCard({ 
  lesson, 
  onClick 
}: { 
  lesson: LessonItem; 
  onClick?: () => void;
}) {
  const isLocked = lesson.status === "locked";
  const isCurrent = lesson.status === "current";
  const isCompleted = lesson.status === "completed";

  return (
    <motion.button
      whileHover={!isLocked ? { scale: 1.01 } : undefined}
      whileTap={!isLocked ? { scale: 0.99 } : undefined}
      onClick={!isLocked ? onClick : undefined}
      disabled={isLocked}
      className={cn(
        "relative w-full text-left p-4 rounded-2xl transition-all",
        "bg-card border-2",
        isCurrent && "border-[#58CC02] shadow-md",
        isCompleted && "border-border",
        isLocked && "border-transparent bg-transparent cursor-not-allowed"
      )}
      data-testid={`lesson-card-${lesson.id}`}
    >
      <div className="flex items-center gap-2">
        <h3 className={cn(
          "font-bold text-base",
          isLocked ? "text-muted-foreground/50" : "text-foreground"
        )}>
          {lesson.title}
        </h3>
        {isCurrent && (
          <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-[#FF9600] rounded-full uppercase">
            Atual
          </span>
        )}
      </div>
      <p className={cn(
        "text-sm mt-0.5",
        isLocked ? "text-muted-foreground/40" : "text-muted-foreground"
      )}>
        {lesson.subtitle}
      </p>
      <div className="mt-2">
        <ProgressDots 
          current={lesson.progress} 
          total={lesson.totalSections} 
          isLocked={isLocked} 
        />
      </div>
    </motion.button>
  );
}

function PracticeRow({ onClick }: { onClick?: () => void }) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative z-10 flex-shrink-0 w-14 flex justify-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-14 h-14 rounded-2xl bg-[#1CB0F6] flex items-center justify-center cursor-pointer"
          style={{ boxShadow: "0 4px 0 0 #1899D6" }}
        >
          <Dumbbell className="h-6 w-6 text-white" />
        </motion.div>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className="flex-1 p-4 rounded-2xl bg-[#1CB0F6] text-white text-left"
        style={{ boxShadow: "0 4px 0 0 #1899D6" }}
        data-testid="practice-card"
      >
        <h3 className="font-bold text-base">Pratica</h3>
        <p className="text-sm text-white/80">Revise suas licoes</p>
      </motion.button>
    </div>
  );
}

export function LearningPath({ 
  lessons, 
  onLessonClick, 
  onPracticeClick,
  showPractice = true 
}: LearningPathProps) {
  const currentIndex = lessons.findIndex(l => l.status === "current");

  return (
    <div className="relative px-4 py-6">
      <div className="max-w-lg mx-auto">
        <h2 className="font-bold text-xl text-foreground mb-6">Seu Caminho</h2>
        
        <div className="relative">
          <div 
            className="absolute w-0.5 bg-border z-0"
            style={{
              left: "calc(1.75rem)",
              top: "1.75rem",
              bottom: "1.75rem",
            }}
          />
          
          <div className="space-y-3">
            {lessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4"
              >
                <div className="relative z-10 flex-shrink-0 w-14 flex justify-center">
                  <LessonIcon 
                    status={lesson.status} 
                    lessonNumber={lesson.lessonNumber}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <LessonCard 
                    lesson={lesson}
                    onClick={() => onLessonClick?.(lesson.id)}
                  />
                </div>
              </motion.div>
            ))}
            
            {showPractice && currentIndex !== -1 && currentIndex < lessons.length - 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (currentIndex + 1) * 0.05 }}
              >
                <PracticeRow onClick={onPracticeClick} />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
