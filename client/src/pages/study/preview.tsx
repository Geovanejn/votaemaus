import { useState } from "react";
import { 
  HeartsDisplay, 
  BottomNav,
  MultipleChoiceExercise,
  TrueFalseExercise,
  TextContent,
  FeedbackOverlay,
  LessonComplete,
  VerseList,
  StudyHeader,
  UnitCard,
  PracticeCard,
  StreakCelebration
} from "@/components/study";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, ArrowLeft, Flame, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const mockUserProfile = {
  name: "Maria Silva",
  avatar: "",
  level: 5,
  totalXP: 450,
  streak: 7,
  hearts: 4,
  maxHearts: 5,
};

const mockUnits = [
  { 
    id: 1, 
    title: "Unidade 1", 
    subtitle: "Forme frases basicas", 
    status: "completed" as const, 
    progress: 3, 
    totalLessons: 5,
    icon: "star" as const
  },
  { 
    id: 2, 
    title: "Unidade 2", 
    subtitle: "Cumprimentos basicos", 
    status: "current" as const, 
    progress: 1, 
    totalLessons: 5,
    icon: "message" as const
  },
  { 
    id: 3, 
    title: "Unidade 3", 
    subtitle: "Apresentacoes", 
    status: "locked" as const, 
    progress: 0, 
    totalLessons: 5,
    icon: "presentation" as const
  },
  { 
    id: 4, 
    title: "Unidade 4", 
    subtitle: "Comida e bebida", 
    status: "locked" as const, 
    progress: 0, 
    totalLessons: 5,
    icon: "presentation" as const
  },
];

const mockDailyGoal = {
  current: 3,
  target: 5,
};

const mockVerses = [
  {
    id: 1,
    reference: "Joao 3:16",
    text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigenito, para que todo aquele que nele cre nao pereca, mas tenha a vida eterna.",
    reflection: "Este versiculo nos mostra a profundidade do amor de Deus."
  },
  {
    id: 2,
    reference: "Salmos 23:1",
    text: "O Senhor e o meu pastor; nada me faltara.",
    reflection: "Quando reconhecemos Deus como nosso pastor, podemos descansar."
  },
];

function UserProfileHeader({ user }: { user: typeof mockUserProfile }) {
  return (
    <div 
      className="px-4 pt-6 pb-8"
      style={{
        background: 'linear-gradient(180deg, #FFC800 0%, #FFD633 100%)',
      }}
    >
      <div className="max-w-lg mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border-3 border-white shadow-lg">
              <AvatarFallback 
                className="text-xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #87CEEB 0%, #4A90D9 100%)',
                  color: 'white'
                }}
              >
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-white/80 font-medium">Ola,</p>
              <h1 className="text-lg font-bold text-white" data-testid="text-user-name">
                {user.name}
              </h1>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full bg-white/20"
            data-testid="button-settings"
          >
            <Settings className="h-5 w-5 text-white" />
          </motion.button>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF9600] shadow-lg"
            style={{ boxShadow: '0 4px 0 0 #CC7700' }}
          >
            <Flame className="h-5 w-5 text-white" />
            <span className="font-bold text-white">{user.streak}</span>
            <span className="text-white/80 text-sm">dias</span>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#58CC02] shadow-lg"
            style={{ boxShadow: '0 4px 0 0 #46A302' }}
          >
            <Zap className="h-5 w-5 text-white" />
            <span className="font-bold text-white">{user.totalXP}</span>
            <span className="text-white/80 text-sm">XP</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function DailyGoalSection({ current, target }: { current: number; target: number }) {
  const percentage = Math.min((current / target) * 100, 100);
  const remaining = target - current;
  
  return (
    <div className="px-4 py-4 bg-background border-b border-border">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-foreground">Meta Diaria</h2>
          <span className="text-sm font-bold text-[#58CC02]">{current}/{target}</span>
        </div>
        
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 bg-[#58CC02] rounded-full"
          />
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          {remaining > 0 
            ? `Mais ${remaining} licoes para completar sua meta!`
            : "Parabens! Voce completou sua meta diaria!"
          }
        </p>
      </div>
    </div>
  );
}

function LearningPathSection({ 
  units, 
  onUnitClick 
}: { 
  units: typeof mockUnits; 
  onUnitClick: (unitId: number) => void;
}) {
  const currentUnitIndex = units.findIndex(u => u.status === "current");
  
  return (
    <div className="px-4 py-6">
      <div className="max-w-lg mx-auto">
        <h2 className="font-bold text-xl text-foreground mb-4">Seu Caminho</h2>
        
        <div className="relative">
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-3">
            {units.map((unit, index) => (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {index < units.length - 1 && unit.status !== "locked" && (
                  <div 
                    className={cn(
                      "absolute left-7 top-14 w-0.5 h-3 z-10",
                      unit.status === "completed" ? "bg-[#58CC02]" : "bg-border"
                    )}
                  />
                )}
                
                <UnitCard
                  id={unit.id}
                  title={unit.title}
                  subtitle={unit.subtitle}
                  status={unit.status}
                  progress={unit.progress}
                  totalLessons={unit.totalLessons}
                  icon={unit.icon}
                  onClick={() => onUnitClick(unit.id)}
                />
              </motion.div>
            ))}
            
            {currentUnitIndex !== -1 && currentUnitIndex < units.length - 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (currentUnitIndex + 1) * 0.1 }}
              >
                <PracticeCard onClick={() => alert("Pratica!")} />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MapPreview() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <UserProfileHeader user={mockUserProfile} />
      
      <DailyGoalSection 
        current={mockDailyGoal.current} 
        target={mockDailyGoal.target} 
      />
      
      <LearningPathSection 
        units={mockUnits} 
        onUnitClick={(id) => alert(`Unidade ${id} clicada!`)} 
      />

      <BottomNav />
    </div>
  );
}

function ExercisePreview() {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(true);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StudyHeader
        currentStep={2}
        totalSteps={5}
        hearts={4}
        maxHearts={5}
        onClose={() => {}}
      />

      <main className="flex-1 flex flex-col p-4">
        <h2 className="text-xl font-bold text-foreground mb-6 text-center">
          Segundo Hebreus 11:1, a fe e a certeza daquilo que...
        </h2>

        <div className="flex flex-col gap-3 mb-6">
          {["Vemos", "Esperamos", "Duvidamos", "Sabemos"].map((opt, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full py-5 px-4 text-left rounded-2xl border-2 font-medium text-base",
                "transition-all duration-150",
                i === 1 
                  ? "border-[#58CC02] bg-[#58CC02]/10" 
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              <span className={cn(
                "inline-flex items-center justify-center h-7 w-7 rounded-full border-2 mr-3 text-sm font-bold",
                i === 1 
                  ? "border-[#58CC02] bg-[#58CC02] text-white" 
                  : "border-muted-foreground/50 text-muted-foreground"
              )}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </motion.button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <Button 
            onClick={() => { setFeedbackCorrect(true); setShowFeedback(true); }} 
            className="flex-1 bg-[#58CC02] hover:bg-[#46A302]"
          >
            Mostrar Feedback Correto
          </Button>
          <Button 
            onClick={() => { setFeedbackCorrect(false); setShowFeedback(true); }} 
            variant="destructive" 
            className="flex-1"
          >
            Mostrar Feedback Errado
          </Button>
        </div>
      </main>

      <FeedbackOverlay
        isVisible={showFeedback}
        isCorrect={feedbackCorrect}
        explanation={feedbackCorrect 
          ? "Exatamente! A fe e a certeza daquilo que ESPERAMOS, nao do que ja vemos." 
          : "A resposta correta e 'esperamos'. Hebreus 11:1 diz: 'A fe e a certeza daquilo que esperamos...'"
        }
        hint="Releia o versiculo com atencao"
        xpEarned={feedbackCorrect ? 5 : 0}
        heartsLost={feedbackCorrect ? 0 : 1}
        onContinue={() => setShowFeedback(false)}
      />
    </div>
  );
}

function VersesPreview() {
  const [hearts, setHearts] = useState(3);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center gap-3 p-3">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="font-bold text-lg">Versiculos</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <VerseList
          verses={mockVerses}
          currentHearts={hearts}
          maxHearts={5}
          onVerseComplete={() => setHearts(h => Math.min(5, h + 1))}
        />
      </main>
    </div>
  );
}

function CompletePreview() {
  return (
    <LessonComplete
      xpEarned={14}
      isPerfect={true}
      streakDays={7}
      mistakesCount={1}
      timeSpentSeconds={70}
      onContinue={() => {}}
    />
  );
}

function StreakPreview() {
  return (
    <StreakCelebration
      streakDays={1}
      weekProgress={[true, false, false, false, false, false, false]}
      message="Sua ofensiva comecou! Pratique todos os dias pra ela crescer."
      onContinue={() => alert("Continuar!")}
    />
  );
}

export default function StudyPreviewPage() {
  const [activeTab, setActiveTab] = useState("map");

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-[60] bg-background border-b p-2">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-center mb-2 text-primary">
            Preview do Sistema de Estudos
          </h1>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="map" className="text-xs">Mapa</TabsTrigger>
              <TabsTrigger value="exercise" className="text-xs">Exercicio</TabsTrigger>
              <TabsTrigger value="verses" className="text-xs">Versiculos</TabsTrigger>
              <TabsTrigger value="complete" className="text-xs">Conclusao</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="pt-2">
        {activeTab === "map" && <MapPreview />}
        {activeTab === "exercise" && <ExercisePreview />}
        {activeTab === "verses" && <VersesPreview />}
        {activeTab === "complete" && <CompletePreview />}
      </div>
    </div>
  );
}
