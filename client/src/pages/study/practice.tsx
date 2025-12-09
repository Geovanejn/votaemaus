import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Dumbbell, CheckCircle2, Shuffle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MultipleChoiceExercise,
  TrueFalseExercise,
  FillBlankExercise,
} from "@/components/study/ExerciseCard";

interface ExerciseData {
  id: number;
  type: string;
  stage: string;
  content: any;
  lessonId: number;
  lessonTitle: string;
}

interface PracticeExercisesResponse {
  exercises: ExerciseData[];
}

export default function PracticePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const { data: practiceData, isLoading } = useQuery<PracticeExercisesResponse>({
    queryKey: ['/api/study/practice-exercises'],
    enabled: !!user,
  });

  const exerciseUnits = useMemo(() => {
    if (!practiceData?.exercises) return [];
    
    // Shuffle and take up to 10 exercises
    return [...practiceData.exercises]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);
  }, [practiceData]);

  const currentUnit = exerciseUnits[currentIndex];
  const progress = exerciseUnits.length > 0 
    ? ((currentIndex) / exerciseUnits.length) * 100 
    : 0;

  const handleAnswer = (isCorrect: boolean) => {
    setFeedbackCorrect(isCorrect);
    setShowFeedback(true);
    setTotalAnswered(prev => prev + 1);
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleContinue = () => {
    setShowFeedback(false);
    if (currentIndex < exerciseUnits.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setCorrectCount(0);
    setTotalAnswered(0);
    setIsFinished(false);
    setShowFeedback(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (exerciseUnits.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-50 flex items-center gap-3 p-4 border-b bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/study')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg">Prática</h1>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">Nenhum exercício disponível</h2>
          <p className="text-muted-foreground mb-6">
            Complete algumas lições primeiro para poder praticar.
          </p>
          <Button onClick={() => setLocation('/study')} data-testid="button-go-study">
            Ir para o estudo
          </Button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((correctCount / totalAnswered) * 100);
    
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-50 flex items-center gap-3 p-4 border-b bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/study')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg">Prática Concluída</h1>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Dumbbell className="h-12 w-12 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Bom trabalho!</h2>
          <p className="text-muted-foreground mb-6">
            Você acertou {correctCount} de {totalAnswered} questões
          </p>

          <div className="w-full max-w-xs mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Aproveitamento</span>
              <span className="font-bold">{percentage}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  percentage >= 70 ? "bg-green-500" : percentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button onClick={handleRestart} className="w-full" data-testid="button-restart">
              <Shuffle className="h-4 w-4 mr-2" />
              Praticar novamente
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/study')} 
              className="w-full"
              data-testid="button-back-study"
            >
              Voltar ao estudo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 p-4 border-b bg-background">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/study')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-lg">Prática</h1>
            <p className="text-xs text-muted-foreground">
              Questão {currentIndex + 1} de {exerciseUnits.length}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="font-medium">{correctCount}</span>
          </div>
        </div>
        
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        {currentUnit && (
          <>
            {currentUnit.type === "multiple_choice" && (
              <MultipleChoiceExercise
                question={currentUnit.content.question || ""}
                options={currentUnit.content.options || []}
                correctIndex={currentUnit.content.correctIndex || 0}
                onAnswer={(isCorrect) => handleAnswer(isCorrect)}
              />
            )}

            {currentUnit.type === "true_false" && (
              <TrueFalseExercise
                statement={currentUnit.content.statement || ""}
                isTrue={currentUnit.content.isTrue || false}
                onAnswer={(isCorrect) => handleAnswer(isCorrect)}
              />
            )}

            {currentUnit.type === "fill_blank" && (
              <FillBlankExercise
                question={currentUnit.content.question || ""}
                correctAnswer={currentUnit.content.correctAnswer || ""}
                onAnswer={(isCorrect) => handleAnswer(isCorrect)}
              />
            )}
          </>
        )}
      </div>

      {showFeedback && (
        <div className={cn(
          "fixed bottom-0 left-0 right-0 p-4 border-t",
          feedbackCorrect 
            ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800" 
            : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800"
        )}>
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              feedbackCorrect ? "bg-green-500" : "bg-red-500"
            )}>
              {feedbackCorrect ? (
                <CheckCircle2 className="h-6 w-6 text-white" />
              ) : (
                <span className="text-white font-bold text-lg">X</span>
              )}
            </div>
            <div>
              <p className={cn(
                "font-bold",
                feedbackCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
              )}>
                {feedbackCorrect ? "Correto!" : "Incorreto"}
              </p>
              {!feedbackCorrect && currentUnit?.content?.explanationIncorrect && (
                <p className="text-sm text-muted-foreground">
                  {currentUnit.content.explanationIncorrect}
                </p>
              )}
            </div>
          </div>
          
          <Button 
            onClick={handleContinue} 
            className={cn(
              "w-full",
              feedbackCorrect 
                ? "bg-green-500 hover:bg-green-600" 
                : "bg-red-500 hover:bg-red-600"
            )}
            data-testid="button-continue-practice"
          >
            CONTINUAR
          </Button>
        </div>
      )}
    </div>
  );
}
