import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BookOpen, Heart, HelpCircle, Lock, Check, Dumbbell } from "lucide-react";

export type LessonStatus = "completed" | "current" | "locked";
export type StageStatus = "completed" | "current" | "locked";
export type StageType = "estude" | "medite" | "responda";

export interface StageItem {
  type: StageType;
  status: StageStatus;
  completedUnits: number;
  totalUnits: number;
}

export interface LessonItem {
  id: number;
  lessonNumber: number;
  title: string;
  subtitle: string;
  status: LessonStatus;
  progress: number;
  totalSections: number;
  stages?: StageItem[];
}

interface LearningPathProps {
  lessons: LessonItem[];
  onLessonClick?: (lessonId: number, stage?: StageType) => void;
  onPracticeClick?: () => void;
  showPractice?: boolean;
}

const stageConfig = {
  estude: {
    icon: BookOpen,
    label: "Estude",
    description: "Aprenda sobre o tema",
    colors: {
      bg: "#58CC02",
      shadow: "#46A302",
      inner: "#7BD937"
    }
  },
  medite: {
    icon: Heart,
    label: "Medite",
    description: "Reflexão e oração",
    colors: {
      bg: "#9B59B6",
      shadow: "#7D3C98",
      inner: "#AF7AC5"
    }
  },
  responda: {
    icon: HelpCircle,
    label: "Responda",
    description: "Teste seus conhecimentos",
    colors: {
      bg: "#1CB0F6",
      shadow: "#1899D6",
      inner: "#49C0F8"
    }
  }
};

const lockedColors = {
  bg: "#E5E5E5",
  shadow: "#CECECE",
  inner: "#F0F0F0"
};

function StageIcon({ type, status }: { type: StageType; status: StageStatus }) {
  const config = stageConfig[type];
  const Icon = config.icon;
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const isCurrent = status === "current";
  
  const colors = isLocked ? lockedColors : config.colors;

  return (
    <motion.div
      whileHover={!isLocked ? { scale: 1.05, y: -2 } : undefined}
      whileTap={!isLocked ? { scale: 0.95, y: 2 } : undefined}
      className={cn(
        "relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
        !isLocked && "cursor-pointer"
      )}
      style={{
        backgroundColor: colors.bg,
        boxShadow: `0 4px 0 0 ${colors.shadow}`
      }}
    >
      <div 
        className="absolute inset-[3px] rounded-lg flex items-center justify-center"
        style={{
          background: `linear-gradient(180deg, ${colors.inner} 0%, ${colors.bg} 100%)`
        }}
      >
        {isLocked ? (
          <Lock className="h-5 w-5 text-muted-foreground/50" />
        ) : isCompleted ? (
          <Check className="h-5 w-5 text-white stroke-[3]" />
        ) : (
          <Icon className="h-5 w-5 text-white" />
        )}
      </div>
      
      {isCurrent && (
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
          className="absolute inset-0 rounded-xl border-2 border-white/60"
        />
      )}
    </motion.div>
  );
}

function StageCard({ 
  type,
  status,
  completedUnits,
  totalUnits,
  onClick,
  isLast
}: { 
  type: StageType;
  status: StageStatus;
  completedUnits: number;
  totalUnits: number;
  onClick?: () => void;
  isLast: boolean;
}) {
  const config = stageConfig[type];
  const isLocked = status === "locked";
  const isCurrent = status === "current";
  const isCompleted = status === "completed";

  return (
    <div className="flex items-start gap-4">
      <div className="relative flex flex-col items-center">
        <StageIcon type={type} status={status} />
        
        {!isLast && (
          <div 
            className="w-0.5 h-6 mt-1"
            style={{ backgroundColor: isLocked ? '#E5E5E5' : config.colors.bg }}
          />
        )}
      </div>
      
      <motion.button
        whileHover={!isLocked ? { scale: 1.01 } : undefined}
        whileTap={!isLocked ? { scale: 0.99 } : undefined}
        onClick={!isLocked ? onClick : undefined}
        disabled={isLocked}
        className={cn(
          "flex-1 text-left p-3 rounded-xl transition-all min-w-0",
          "border-2",
          isCurrent && "bg-card border-[#58CC02] shadow-md",
          isCompleted && "bg-card border-border",
          isLocked && "bg-transparent border-transparent cursor-not-allowed"
        )}
        data-testid={`stage-card-${type}`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className={cn(
            "font-semibold text-sm",
            isLocked ? "text-muted-foreground/50" : "text-foreground"
          )}>
            {config.label}
          </h4>
          {isCurrent && (
            <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-[#FF9600] rounded-full uppercase">
              Atual
            </span>
          )}
          {isCompleted && (
            <Check className="h-4 w-4 text-[#58CC02]" />
          )}
        </div>
        <p className={cn(
          "text-xs mt-0.5",
          isLocked ? "text-muted-foreground/40" : "text-muted-foreground"
        )}>
          {config.description}
        </p>
        
        {totalUnits > 0 && (
          <div className="flex items-center gap-1 mt-2">
            {Array.from({ length: Math.min(totalUnits, 5) }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  isLocked
                    ? "bg-muted-foreground/20"
                    : index < completedUnits
                    ? "bg-[#58CC02]"
                    : "bg-muted-foreground/30"
                )}
              />
            ))}
            <span className={cn(
              "text-[10px] font-medium ml-1",
              isLocked ? "text-muted-foreground/40" : "text-muted-foreground"
            )}>
              {isLocked ? "0" : completedUnits}/{totalUnits}
            </span>
          </div>
        )}
      </motion.button>
    </div>
  );
}

function LessonHeader({ 
  lessonNumber, 
  title, 
  status 
}: { 
  lessonNumber: number; 
  title: string;
  status: LessonStatus;
}) {
  const isLocked = status === "locked";
  
  return (
    <div 
      className={cn(
        "px-4 py-3 rounded-xl mb-3",
        isLocked 
          ? "bg-muted/50" 
          : "bg-gradient-to-r from-[#FFC800] to-[#FFD633]"
      )}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn(
          "text-xs font-bold uppercase",
          isLocked ? "text-muted-foreground/50" : "text-white/80"
        )}>
          Lição {lessonNumber}
        </span>
        {isLocked && <Lock className="h-3 w-3 text-muted-foreground/50" />}
      </div>
      <h3 className={cn(
        "font-bold text-base mt-0.5",
        isLocked ? "text-muted-foreground/50" : "text-white"
      )}>
        {title}
      </h3>
    </div>
  );
}

function LessonGroup({ 
  lesson, 
  onStageClick,
  isLastLesson
}: { 
  lesson: LessonItem; 
  onStageClick?: (lessonId: number, stage: StageType) => void;
  isLastLesson: boolean;
}) {
  const defaultStages: StageItem[] = lesson.stages || [
    { 
      type: "estude", 
      status: lesson.status === "completed" ? "completed" : lesson.status === "current" ? "current" : "locked",
      completedUnits: lesson.status === "completed" ? 2 : lesson.status === "current" ? lesson.progress : 0,
      totalUnits: 2
    },
    { 
      type: "medite", 
      status: lesson.status === "completed" ? "completed" : "locked",
      completedUnits: lesson.status === "completed" ? 1 : 0,
      totalUnits: 1
    },
    { 
      type: "responda", 
      status: lesson.status === "completed" ? "completed" : "locked",
      completedUnits: lesson.status === "completed" ? 2 : 0,
      totalUnits: 2
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <LessonHeader 
        lessonNumber={lesson.lessonNumber} 
        title={lesson.subtitle || lesson.title}
        status={lesson.status}
      />
      
      <div className="pl-2 space-y-1">
        {defaultStages.map((stage, index) => (
          <StageCard
            key={stage.type}
            type={stage.type}
            status={stage.status}
            completedUnits={stage.completedUnits}
            totalUnits={stage.totalUnits}
            onClick={() => onStageClick?.(lesson.id, stage.type)}
            isLast={index === defaultStages.length - 1}
          />
        ))}
      </div>
      
      {!isLastLesson && (
        <div className="flex justify-center py-4">
          <div className="w-0.5 h-8 bg-border" />
        </div>
      )}
    </motion.div>
  );
}

function PracticeRow({ onClick }: { onClick?: () => void }) {
  return (
    <div className="flex items-center gap-4 mt-4">
      <div className="relative z-10 flex-shrink-0 flex justify-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-12 h-12 rounded-xl bg-[#1CB0F6] flex items-center justify-center cursor-pointer"
          style={{ boxShadow: "0 4px 0 0 #1899D6" }}
        >
          <Dumbbell className="h-5 w-5 text-white" />
        </motion.div>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className="flex-1 p-3 rounded-xl bg-[#1CB0F6] text-white text-left"
        style={{ boxShadow: "0 4px 0 0 #1899D6" }}
        data-testid="practice-card"
      >
        <h3 className="font-bold text-sm">Prática</h3>
        <p className="text-xs text-white/80">Revise suas lições</p>
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
  const hasCompletedLessons = lessons.some(l => l.status === "completed");

  const handleStageClick = (lessonId: number, stage: StageType) => {
    onLessonClick?.(lessonId, stage);
  };

  return (
    <div className="relative px-4 py-6">
      <div className="max-w-lg mx-auto">
        <h2 className="font-bold text-xl text-foreground mb-6">Seu Caminho</h2>
        
        <div className="space-y-0">
          {lessons.map((lesson, index) => (
            <LessonGroup
              key={lesson.id}
              lesson={lesson}
              onStageClick={handleStageClick}
              isLastLesson={index === lessons.length - 1}
            />
          ))}
        </div>
        
        {showPractice && hasCompletedLessons && (
          <PracticeRow onClick={onPracticeClick} />
        )}
      </div>
    </div>
  );
}
