import { useState } from "react";
import { 
  LessonMap, 
  HeartsDisplay, 
  XPDisplay, 
  StreakBadge, 
  LevelBadge,
  BottomNav,
  MultipleChoiceExercise,
  TrueFalseExercise,
  TextContent,
  FeedbackOverlay,
  LessonComplete,
  VerseList,
  StudyHeader,
  DailyMissions,
  StreakCelebration
} from "@/components/study";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Bell, ArrowLeft, Flame, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const mockUserProfile = {
  name: "Joao Silva",
  avatar: "",
  level: 5,
  totalXP: 450,
  xpForNextLevel: 800,
  streak: 7,
  hearts: 4,
  maxHearts: 5,
};

const mockLessons = [
  { id: 1, title: "Introducao", type: "intro" as const, status: "completed" as const, xpReward: 10 },
  { id: 2, title: "O que e fe?", type: "study" as const, status: "completed" as const, xpReward: 15 },
  { id: 3, title: "Meditacao", type: "meditation" as const, status: "available" as const, xpReward: 20 },
  { id: 4, title: "Exemplos de fe", type: "study" as const, status: "locked" as const, xpReward: 15 },
  { id: 5, title: "Desafio", type: "challenge" as const, status: "locked" as const, xpReward: 30, isBonus: true },
];

const mockMissions = [
  { id: "1", title: "Comece uma ofensiva", current: 1, target: 1, icon: "streak" as const, isCompleted: true },
  { id: "2", title: "Leia a proxima historia na sua trilha", current: 0, target: 1, icon: "lesson" as const, isCompleted: false },
  { id: "3", title: "Faca 2 licoes perfeitas", current: 0, target: 2, icon: "perfect" as const, isCompleted: false },
];

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

function StatBadge({ 
  icon: Icon, 
  value, 
  color 
}: { 
  icon: typeof Flame; 
  value: number | string; 
  color: string;
}) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl",
      "bg-muted/50 border border-border/50"
    )}>
      <Icon className="h-5 w-5" style={{ color }} />
      <span className="font-bold text-sm" style={{ color }}>{value}</span>
    </div>
  );
}

function MapPreview() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between p-3 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-[#FFA500]/30">
              <AvatarFallback className="bg-gradient-to-br from-[#FFA500] to-[#D68A00] text-white font-bold text-sm">
                J
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex items-center gap-2">
            <StatBadge icon={Flame} value={mockUserProfile.streak} color="#FF9600" />
            <StatBadge icon={Zap} value={mockUserProfile.totalXP} color="#FFC800" />
            <HeartsDisplay current={mockUserProfile.hearts} max={mockUserProfile.maxHearts} size="sm" />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6">
        <LessonMap
          weekTitle="Converse sobre habitos"
          weekNumber={48}
          sectionNumber={1}
          unitNumber={9}
          lessons={mockLessons}
          onLessonClick={(id) => alert(`Licao ${id} clicada!`)}
        />

        <div className="mt-8">
          <DailyMissions 
            missions={mockMissions}
            hoursRemaining={13}
          />
        </div>
      </main>

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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="map" className="text-xs">Mapa</TabsTrigger>
              <TabsTrigger value="exercise" className="text-xs">Exercicio</TabsTrigger>
              <TabsTrigger value="verses" className="text-xs">Versiculos</TabsTrigger>
              <TabsTrigger value="complete" className="text-xs">Conclusao</TabsTrigger>
              <TabsTrigger value="streak" className="text-xs">Ofensiva</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="pt-2">
        {activeTab === "map" && <MapPreview />}
        {activeTab === "exercise" && <ExercisePreview />}
        {activeTab === "verses" && <VersesPreview />}
        {activeTab === "complete" && <CompletePreview />}
        {activeTab === "streak" && <StreakPreview />}
      </div>
    </div>
  );
}
