import { cn } from "@/lib/utils";
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
  const pattern = ["center", "right", "center", "left"];
  return pattern[index % pattern.length] as "left" | "center" | "right";
}

export function LessonMap({
  weekTitle,
  weekNumber,
  lessons,
  onLessonClick,
  className
}: LessonMapProps) {
  return (
    <div className={cn("flex flex-col", className)} data-testid="lesson-map">
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground">Semana {weekNumber}</p>
        <h2 className="text-xl font-bold text-foreground" data-testid="text-week-title">
          {weekTitle}
        </h2>
      </div>

      <div className="relative flex flex-col gap-6 px-4">
        {lessons.map((lesson, index) => (
          <div key={lesson.id} className="relative">
            {index > 0 && (
              <div 
                className={cn(
                  "absolute left-1/2 -top-6 w-0.5 h-6 -translate-x-1/2",
                  lessons[index - 1].status === "completed" 
                    ? "bg-green-400" 
                    : "bg-gray-300 dark:bg-gray-700"
                )}
              />
            )}
            
            <LessonNode
              id={lesson.id}
              title={lesson.title}
              type={lesson.type}
              status={lesson.status}
              xpReward={lesson.xpReward}
              isBonus={lesson.isBonus}
              position={getPosition(index)}
              onClick={() => onLessonClick?.(lesson.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
