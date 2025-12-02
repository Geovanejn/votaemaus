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
  StudyHeader
} from "@/components/study";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Bell, ArrowLeft } from "lucide-react";

const mockUserProfile = {
  name: "João Silva",
  avatar: "",
  level: 5,
  totalXP: 450,
  xpForNextLevel: 800,
  streak: 7,
  hearts: 4,
  maxHearts: 5,
};

const mockLessons = [
  { id: 1, title: "Introdução", type: "intro" as const, status: "completed" as const, xpReward: 10 },
  { id: 2, title: "O que é fé?", type: "study" as const, status: "completed" as const, xpReward: 15 },
  { id: 3, title: "Meditação", type: "meditation" as const, status: "available" as const, xpReward: 20 },
  { id: 4, title: "Exemplos de fé", type: "study" as const, status: "locked" as const, xpReward: 15 },
  { id: 5, title: "Desafio", type: "challenge" as const, status: "locked" as const, xpReward: 30, isBonus: true },
];

const mockVerses = [
  {
    id: 1,
    reference: "João 3:16",
    text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
    reflection: "Este versículo nos mostra a profundidade do amor de Deus."
  },
  {
    id: 2,
    reference: "Salmos 23:1",
    text: "O Senhor é o meu pastor; nada me faltará.",
    reflection: "Quando reconhecemos Deus como nosso pastor, podemos descansar."
  },
];

function MapPreview() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">J</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm text-foreground">{mockUserProfile.name}</p>
              <XPDisplay amount={mockUserProfile.totalXP} size="sm" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <StreakBadge days={mockUserProfile.streak} size="sm" showLabel={false} />
            <HeartsDisplay current={mockUserProfile.hearts} max={mockUserProfile.maxHearts} size="sm" />
            <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon"><Settings className="h-5 w-5" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <Card className="p-4 mb-6 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Meta diária</p>
              <p className="font-bold text-foreground">10 minutos</p>
            </div>
            <LevelBadge 
              level={mockUserProfile.level}
              currentXP={mockUserProfile.totalXP}
              xpForNextLevel={mockUserProfile.xpForNextLevel}
              size="md"
            />
          </div>
        </Card>

        <LessonMap
          weekTitle="A Fé que Transforma"
          weekNumber={48}
          lessons={mockLessons}
          onLessonClick={(id) => alert(`Lição ${id} clicada!`)}
        />
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
          Segundo Hebreus 11:1, a fé é a certeza daquilo que...
        </h2>

        <div className="flex flex-col gap-3 mb-6">
          {["Vemos", "Esperamos", "Duvidamos", "Sabemos"].map((opt, i) => (
            <Button
              key={i}
              variant="outline"
              className={`w-full py-6 text-left justify-start text-base font-medium border-2 ${i === 1 ? 'border-primary bg-primary/5' : ''}`}
            >
              <span className={`flex items-center justify-center h-6 w-6 rounded-full border-2 mr-3 text-sm font-bold ${i === 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <Button onClick={() => { setFeedbackCorrect(true); setShowFeedback(true); }} className="flex-1">
            Mostrar Feedback Correto
          </Button>
          <Button onClick={() => { setFeedbackCorrect(false); setShowFeedback(true); }} variant="destructive" className="flex-1">
            Mostrar Feedback Errado
          </Button>
        </div>
      </main>

      <FeedbackOverlay
        isVisible={showFeedback}
        isCorrect={feedbackCorrect}
        explanation={feedbackCorrect 
          ? "Exatamente! A fé é a certeza daquilo que ESPERAMOS, não do que já vemos." 
          : "A resposta correta é 'esperamos'. Hebreus 11:1 diz: 'A fé é a certeza daquilo que esperamos...'"
        }
        hint="Releia o versículo com atenção"
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
          <h1 className="font-bold text-lg">Versículos</h1>
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
      xpEarned={45}
      isPerfect={true}
      streakDays={7}
      mistakesCount={0}
      timeSpentSeconds={185}
      onContinue={() => {}}
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
              <TabsTrigger value="map">Mapa</TabsTrigger>
              <TabsTrigger value="exercise">Exercício</TabsTrigger>
              <TabsTrigger value="verses">Versículos</TabsTrigger>
              <TabsTrigger value="complete">Conclusão</TabsTrigger>
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
