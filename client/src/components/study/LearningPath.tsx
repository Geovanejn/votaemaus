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
  stages: StageItem[];
}

interface LearningPathProps {
  lessons: LessonItem[];
  onLessonClick?: (lessonId: number, stage?: StageType) => void;
  onPracticeClick?: () => void;
  showPractice?: boolean;
}

const RAIL_WIDTH = 72;

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
    description: "Aplicação e oração",
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

function StageIcon({ type, status, onClick }: { type: StageType; status: StageStatus; onClick?: () => void }) {
  const config = stageConfig[type];
  const Icon = config.icon;
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const isCurrent = status === "current";
  
  const colors = isLocked ? lockedColors : config.colors;

  return (
    <motion.button
      whileHover={!isLocked ? { scale: 1.08, y: -2 } : undefined}
      whileTap={!isLocked ? { scale: 0.95, y: 2 } : undefined}
      onClick={!isLocked ? onClick : undefined}
      disabled={isLocked}
      className={cn(
        "relative z-10 flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center",
        !isLocked && "cursor-pointer"
      )}
      style={{
        backgroundColor: colors.bg,
        boxShadow: `0 5px 0 0 ${colors.shadow}`
      }}
      data-testid={`stage-icon-${type}`}
    >
      <div 
        className="absolute inset-[4px] rounded-xl flex items-center justify-center"
        style={{
          background: `linear-gradient(180deg, ${colors.inner} 0%, ${colors.bg} 100%)`
        }}
      >
        {isLocked ? (
          <Lock className="h-6 w-6 text-muted-foreground/50" />
        ) : isCompleted ? (
          <Check className="h-6 w-6 text-white stroke-[3]" />
        ) : (
          <Icon className="h-6 w-6 text-white" />
        )}
      </div>
      
      {isCurrent && (
        <motion.div
          animate={{ 
            scale: [1, 1.12, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-2xl border-[3px] border-white/70"
        />
      )}
    </motion.button>
  );
}

function StageCard({ 
  stage,
  onClick
}: { 
  stage: StageItem;
  onClick?: () => void;
}) {
  const config = stageConfig[stage.type];
  const isLocked = stage.status === "locked";
  const isCurrent = stage.status === "current";
  const isCompleted = stage.status === "completed";

  return (
    <motion.button
      whileHover={!isLocked ? { scale: 1.01 } : undefined}
      whileTap={!isLocked ? { scale: 0.99 } : undefined}
      onClick={!isLocked ? onClick : undefined}
      disabled={isLocked}
      className={cn(
        "flex-1 text-left p-4 rounded-xl transition-all min-w-0",
        "border-2",
        isCurrent && "bg-card border-[#58CC02] shadow-md",
        isCompleted && "bg-card/80 border-border/50 shadow-sm",
        isLocked && "bg-transparent border-transparent cursor-not-allowed"
      )}
      style={!isLocked ? { boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)" } : undefined}
      data-testid={`stage-card-${stage.type}`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <h4 className={cn(
          "font-bold text-sm",
          isLocked ? "text-muted-foreground/50" : "text-foreground"
        )}>
          {config.label}
        </h4>
        {isCurrent && (
          <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-[#FF9600] rounded-full uppercase tracking-wide">
            Atual
          </span>
        )}
        {isCompleted && (
          <Check className="h-4 w-4 text-[#58CC02]" />
        )}
      </div>
      <p className={cn(
        "text-xs mt-1",
        isLocked ? "text-muted-foreground/40" : "text-muted-foreground"
      )}>
        {config.description}
      </p>
      
      {stage.totalUnits > 0 && (
        <div className="flex items-center gap-1.5 mt-3">
          {Array.from({ length: Math.min(stage.totalUnits, 6) }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-colors",
                isLocked
                  ? "bg-muted-foreground/20"
                  : index < stage.completedUnits
                  ? "bg-[#58CC02]"
                  : "bg-muted-foreground/30"
              )}
            />
          ))}
          <span className={cn(
            "text-xs font-medium ml-1",
            isLocked ? "text-muted-foreground/40" : "text-muted-foreground"
          )}>
            {isLocked ? "0" : stage.completedUnits}/{stage.totalUnits}
          </span>
        </div>
      )}
    </motion.button>
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
        "px-4 py-3 rounded-xl",
        isLocked 
          ? "bg-muted/50" 
          : "bg-gradient-to-r from-[#FFC800] to-[#FFD633]"
      )}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn(
          "text-xs font-bold uppercase tracking-wide",
          isLocked ? "text-muted-foreground/50" : "text-white/80"
        )}>
          Lição {lessonNumber}
        </span>
        {isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />}
      </div>
      <h3 className={cn(
        "font-bold text-lg mt-0.5",
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
  isFirstLesson,
  isLastLesson
}: { 
  lesson: LessonItem; 
  onStageClick?: (lessonId: number, stage: StageType) => void;
  isFirstLesson: boolean;
  isLastLesson: boolean;
}) {
  const ICON_SIZE = 56;
  const ROW_HEIGHT = 88;
  const GAP_BETWEEN_ROWS = 32;
  
  const ICON_VERTICAL_OFFSET = (ROW_HEIGHT - ICON_SIZE) / 2;
  const FIRST_ICON_CENTER = ICON_VERTICAL_OFFSET + ICON_SIZE / 2;
  const LAST_ICON_CENTER = (lesson.stages.length - 1) * (ROW_HEIGHT + GAP_BETWEEN_ROWS) + ICON_VERTICAL_OFFSET + ICON_SIZE / 2;
  const LINE_TOP = FIRST_ICON_CENTER + ICON_SIZE / 2;
  const LINE_HEIGHT = LAST_ICON_CENTER - ICON_SIZE / 2 - LINE_TOP;
  
  return (
    <div className="relative">
      <div 
        className="mb-5"
        style={{ marginLeft: RAIL_WIDTH + 16 }}
      >
        <LessonHeader 
          lessonNumber={lesson.lessonNumber} 
          title={lesson.subtitle || lesson.title}
          status={lesson.status}
        />
      </div>
      
      <div className="relative">
        {lesson.stages.length > 1 && LINE_HEIGHT > 0 && (
          <div 
            className="absolute w-1 rounded-full bg-gray-300"
            style={{ 
              left: RAIL_WIDTH / 2 - 2,
              top: LINE_TOP,
              height: LINE_HEIGHT,
              zIndex: 0
            }}
          />
        )}
        
        <div className="relative z-10" style={{ display: 'flex', flexDirection: 'column', gap: `${GAP_BETWEEN_ROWS}px` }}>
          {lesson.stages.map((stage) => {
            return (
              <div 
                key={stage.type} 
                className="flex items-center gap-5"
                style={{ height: `${ROW_HEIGHT}px` }}
              >
                <div 
                  className="flex-shrink-0 flex justify-center items-center relative"
                  style={{ width: RAIL_WIDTH, height: ICON_SIZE }}
                >
                  <StageIcon 
                    type={stage.type} 
                    status={stage.status} 
                    onClick={() => onStageClick?.(lesson.id, stage.type)}
                  />
                </div>
                
                <StageCard
                  stage={stage}
                  onClick={() => onStageClick?.(lesson.id, stage.type)}
                />
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}

function PracticeRow({ onClick }: { onClick?: () => void }) {
  return (
    <div 
      className="flex items-center gap-4 mt-6"
    >
      <div 
        className="flex-shrink-0 flex justify-center"
        style={{ width: RAIL_WIDTH }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className="relative z-10 w-14 h-14 rounded-2xl bg-[#1CB0F6] flex items-center justify-center cursor-pointer"
          style={{ boxShadow: "0 5px 0 0 #1899D6" }}
          data-testid="practice-icon"
        >
          <Dumbbell className="h-6 w-6 text-white" />
        </motion.button>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className="flex-1 p-4 rounded-xl bg-[#1CB0F6] text-white text-left"
        style={{ boxShadow: "0 5px 0 0 #1899D6" }}
        data-testid="practice-card"
      >
        <h3 className="font-bold text-base">Prática</h3>
        <p className="text-sm text-white/80 mt-0.5">Revise suas lições anteriores</p>
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
        
        <div className="relative">
          <div className="space-y-10">
            {lessons.map((lesson, index) => (
              <LessonGroup
                key={lesson.id}
                lesson={lesson}
                onStageClick={handleStageClick}
                isFirstLesson={index === 0}
                isLastLesson={index === lessons.length - 1}
              />
            ))}
          </div>
        </div>
        
        {showPractice && hasCompletedLessons && (
          <PracticeRow onClick={onPracticeClick} />
        )}
      </div>
    </div>
  );
}
