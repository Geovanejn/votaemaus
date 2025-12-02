import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { HeartCrack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  StudyHeader,
  MultipleChoiceExercise,
  TrueFalseExercise,
  TextContent,
  FeedbackOverlay,
  LessonComplete
} from "@/components/study";

interface Exercise {
  id: number;
  type: "text" | "multiple_choice" | "true_false";
  content: any;
}

const mockExercises: Exercise[] = [
  {
    id: 1,
    type: "text",
    content: {
      title: "O que é Fé?",
      body: "A fé é a certeza daquilo que esperamos e a prova das coisas que não vemos. É através da fé que os antigos receberam bom testemunho.",
      highlight: "Hebreus 11:1"
    }
  },
  {
    id: 2,
    type: "multiple_choice",
    content: {
      question: "Segundo Hebreus 11:1, a fé é a certeza daquilo que...",
      options: ["Vemos", "Esperamos", "Duvidamos", "Sabemos"],
      correctIndex: 1,
      explanationCorrect: "Exatamente! A fé é a certeza daquilo que ESPERAMOS, não do que já vemos ou sabemos.",
      explanationIncorrect: "A resposta correta é 'esperamos'. Hebreus 11:1 diz: 'A fé é a certeza daquilo que esperamos...'",
      hint: "Releia o versículo com atenção"
    }
  },
  {
    id: 3,
    type: "true_false",
    content: {
      statement: "A fé é baseada em coisas que podemos ver e tocar.",
      isTrue: false,
      explanation: "Pelo contrário! A fé é a prova das coisas que NÃO vemos. Se pudéssemos ver, não seria fé."
    }
  },
  {
    id: 4,
    type: "text",
    content: {
      title: "Fé em Ação",
      body: "Abraão é um exemplo clássico de fé. Quando Deus o chamou para ir a uma terra desconhecida, ele obedeceu sem saber para onde ia. Sua fé não era cega, era confiança no caráter de Deus.",
      highlight: "Hebreus 11:8"
    }
  },
  {
    id: 5,
    type: "multiple_choice",
    content: {
      question: "Por que Abraão é considerado um exemplo de fé?",
      options: [
        "Porque ele era rico",
        "Porque obedeceu sem saber para onde ia",
        "Porque nunca teve dúvidas",
        "Porque fazia muitos milagres"
      ],
      correctIndex: 1,
      explanationCorrect: "Correto! Abraão demonstrou fé ao obedecer o chamado de Deus sem conhecer o destino.",
      explanationIncorrect: "A resposta é que ele obedeceu sem saber para onde ia. Isso demonstra confiança total em Deus.",
      hint: "Pense na história de Abraão saindo de Ur"
    }
  }
];

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  
  const [currentExercise, setCurrentExercise] = useState(0);
  const [hearts, setHearts] = useState(4);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{
    isCorrect: boolean;
    explanation: string;
    hint?: string;
    xpEarned: number;
    heartsLost: number;
  } | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);

  const exercise = mockExercises[currentExercise];
  const totalExercises = mockExercises.length;

  const handleAnswer = (isCorrect: boolean, exerciseContent: any) => {
    let xp = 0;
    let lostHearts = 0;

    if (isCorrect) {
      xp = 5;
      setXpEarned(prev => prev + xp);
    } else {
      lostHearts = 1;
      setHearts(prev => Math.max(0, prev - 1));
      setMistakes(prev => prev + 1);
    }

    setFeedbackData({
      isCorrect,
      explanation: isCorrect 
        ? exerciseContent.explanationCorrect || exerciseContent.explanation || "Correto!"
        : exerciseContent.explanationIncorrect || exerciseContent.explanation || "Incorreto",
      hint: exerciseContent.hint,
      xpEarned: xp,
      heartsLost: lostHearts
    });
    setShowFeedback(true);
  };

  const handleContinue = () => {
    setShowFeedback(false);
    setFeedbackData(null);

    if (currentExercise < totalExercises - 1) {
      setCurrentExercise(prev => prev + 1);
    } else {
      const bonusXP = mistakes === 0 ? 10 : 0;
      setXpEarned(prev => prev + 15 + bonusXP);
      setIsCompleted(true);
    }
  };

  const handleTextContinue = () => {
    setXpEarned(prev => prev + 2);
    if (currentExercise < totalExercises - 1) {
      setCurrentExercise(prev => prev + 1);
    } else {
      const bonusXP = mistakes === 0 ? 10 : 0;
      setXpEarned(prev => prev + 15 + bonusXP);
      setIsCompleted(true);
    }
  };

  const handleClose = () => {
    if (window.confirm("Tem certeza que deseja sair? Seu progresso será perdido.")) {
      setLocation("/study");
    }
  };

  const handleLessonComplete = () => {
    setLocation("/study");
  };

  if (hearts === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4" data-testid="no-hearts">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <HeartCrack className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Suas vidas acabaram!
          </h1>
          <p className="text-muted-foreground mb-6">
            Leia versículos bíblicos para recuperar vidas, ou aguarde 6 horas para recuperar automaticamente.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setLocation("/study/verses")}
              className="w-full py-6 font-bold"
              data-testid="button-read-verses"
            >
              LER VERSÍCULOS
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/study")}
              className="w-full py-6"
              data-testid="button-go-home"
            >
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    return (
      <LessonComplete
        xpEarned={xpEarned}
        isPerfect={mistakes === 0}
        streakDays={7}
        mistakesCount={mistakes}
        timeSpentSeconds={timeSpent}
        onContinue={handleLessonComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="lesson-page">
      <StudyHeader
        currentStep={currentExercise + 1}
        totalSteps={totalExercises}
        hearts={hearts}
        maxHearts={5}
        onClose={handleClose}
      />

      <main className="flex-1 flex flex-col">
        {exercise.type === "text" && (
          <TextContent
            title={exercise.content.title}
            body={exercise.content.body}
            highlight={exercise.content.highlight}
            onContinue={handleTextContinue}
          />
        )}

        {exercise.type === "multiple_choice" && (
          <MultipleChoiceExercise
            question={exercise.content.question}
            options={exercise.content.options}
            correctIndex={exercise.content.correctIndex}
            onAnswer={(isCorrect) => handleAnswer(isCorrect, exercise.content)}
          />
        )}

        {exercise.type === "true_false" && (
          <TrueFalseExercise
            statement={exercise.content.statement}
            isTrue={exercise.content.isTrue}
            onAnswer={(isCorrect) => handleAnswer(isCorrect, exercise.content)}
          />
        )}
      </main>

      {feedbackData && (
        <FeedbackOverlay
          isVisible={showFeedback}
          isCorrect={feedbackData.isCorrect}
          explanation={feedbackData.explanation}
          hint={feedbackData.hint}
          xpEarned={feedbackData.xpEarned}
          heartsLost={feedbackData.heartsLost}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
