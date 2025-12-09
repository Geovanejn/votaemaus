import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";

interface MultipleChoiceExerciseProps {
  question: string;
  options: string[];
  correctIndex: number;
  onAnswer: (isCorrect: boolean, selectedIndex: number) => void;
}

export function MultipleChoiceExercise({
  question,
  options,
  correctIndex,
  onAnswer
}: MultipleChoiceExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedIndex(index);
  };

  const handleVerify = () => {
    if (selectedIndex === null) return;
    setIsAnswered(true);
    onAnswer(selectedIndex === correctIndex, selectedIndex);
  };

  return (
    <div className="flex flex-col h-full" data-testid="exercise-multiple-choice">
      <div className="flex-1 flex flex-col justify-center px-4">
        <Card className="p-5 mb-6 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
          <h2 className="text-lg font-bold text-foreground text-center leading-relaxed">
            {question}
          </h2>
        </Card>

        <div className="flex flex-col gap-3 max-w-full">
          {options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const isCorrect = index === correctIndex;
            const showCorrect = isAnswered && isCorrect;
            const showWrong = isAnswered && isSelected && !isCorrect;
            
            return (
              <button
                key={index}
                className={cn(
                  "w-full min-h-[56px] py-4 px-4 rounded-xl text-left flex items-center gap-3 transition-all duration-200",
                  "border-2 shadow-sm",
                  !isAnswered && !isSelected && "bg-card border-border hover:border-primary/50 hover:shadow-md",
                  !isAnswered && isSelected && "bg-primary/10 border-primary shadow-md",
                  showCorrect && "bg-green-50 dark:bg-green-900/30 border-green-500 shadow-green-100 dark:shadow-green-900/20",
                  showWrong && "bg-red-50 dark:bg-red-900/30 border-red-500 shadow-red-100 dark:shadow-red-900/20"
                )}
                onClick={() => handleSelect(index)}
                disabled={isAnswered}
                data-testid={`button-option-${index}`}
              >
                <span className={cn(
                  "flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold transition-colors",
                  !isAnswered && !isSelected && "bg-muted text-muted-foreground",
                  !isAnswered && isSelected && "bg-primary text-primary-foreground",
                  showCorrect && "bg-green-500 text-white",
                  showWrong && "bg-red-500 text-white"
                )}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1 text-base font-medium break-words">{option}</span>
                {showCorrect && (
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t">
        <Button
          onClick={handleVerify}
          disabled={selectedIndex === null || isAnswered}
          className={cn(
            "w-full py-6 text-lg font-bold transition-all",
            selectedIndex !== null && !isAnswered && "shadow-lg"
          )}
          data-testid="button-verify"
        >
          VERIFICAR
        </Button>
      </div>
    </div>
  );
}

interface TrueFalseExerciseProps {
  statement: string;
  isTrue: boolean;
  onAnswer: (isCorrect: boolean, answeredTrue: boolean) => void;
}

export function TrueFalseExercise({
  statement,
  isTrue,
  onAnswer
}: TrueFalseExerciseProps) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleSelect = (value: boolean) => {
    if (isAnswered) return;
    setSelected(value);
  };

  const handleVerify = () => {
    if (selected === null) return;
    setIsAnswered(true);
    onAnswer(selected === isTrue, selected);
  };

  const showTrueCorrect = isAnswered && isTrue;
  const showTrueWrong = isAnswered && selected === true && !isTrue;
  const showFalseCorrect = isAnswered && !isTrue;
  const showFalseWrong = isAnswered && selected === false && isTrue;

  return (
    <div className="flex flex-col h-full" data-testid="exercise-true-false">
      <div className="flex-1 flex flex-col justify-center px-4">
        <Card className="p-6 mb-6 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
          <p className="text-lg text-foreground text-center leading-relaxed font-medium">
            "{statement}"
          </p>
        </Card>

        <div className="flex gap-4">
          <button
            className={cn(
              "flex-1 py-6 rounded-xl text-lg font-bold border-2 transition-all duration-200 shadow-sm",
              !isAnswered && selected !== true && "bg-card border-border hover:border-green-400 hover:shadow-md",
              !isAnswered && selected === true && "bg-green-50 dark:bg-green-900/20 border-green-500 shadow-md",
              showTrueCorrect && "bg-green-100 dark:bg-green-900/40 border-green-500 text-green-700 dark:text-green-300",
              showTrueWrong && "bg-red-100 dark:bg-red-900/40 border-red-500 text-red-700 dark:text-red-300"
            )}
            onClick={() => handleSelect(true)}
            disabled={isAnswered}
            data-testid="button-true"
          >
            <span className="flex items-center justify-center gap-2">
              {showTrueCorrect && <CheckCircle2 className="h-5 w-5" />}
              VERDADEIRO
            </span>
          </button>
          <button
            className={cn(
              "flex-1 py-6 rounded-xl text-lg font-bold border-2 transition-all duration-200 shadow-sm",
              !isAnswered && selected !== false && "bg-card border-border hover:border-red-400 hover:shadow-md",
              !isAnswered && selected === false && "bg-red-50 dark:bg-red-900/20 border-red-500 shadow-md",
              showFalseCorrect && "bg-green-100 dark:bg-green-900/40 border-green-500 text-green-700 dark:text-green-300",
              showFalseWrong && "bg-red-100 dark:bg-red-900/40 border-red-500 text-red-700 dark:text-red-300"
            )}
            onClick={() => handleSelect(false)}
            disabled={isAnswered}
            data-testid="button-false"
          >
            <span className="flex items-center justify-center gap-2">
              {showFalseCorrect && <CheckCircle2 className="h-5 w-5" />}
              FALSO
            </span>
          </button>
        </div>
      </div>

      <div className="p-4 border-t">
        <Button
          onClick={handleVerify}
          disabled={selected === null || isAnswered}
          className={cn(
            "w-full py-6 text-lg font-bold transition-all",
            selected !== null && !isAnswered && "shadow-lg"
          )}
          data-testid="button-verify"
        >
          VERIFICAR
        </Button>
      </div>
    </div>
  );
}

interface TextContentProps {
  title: string;
  body: string;
  highlight?: string;
  onContinue: () => void;
}

export function TextContent({
  title,
  body,
  highlight,
  onContinue
}: TextContentProps) {
  return (
    <div className="flex flex-col h-full" data-testid="exercise-text">
      <div className="flex-1 flex flex-col justify-center px-4">
        <h2 className="text-2xl font-bold text-foreground mb-4 text-center">
          {title}
        </h2>
        
        <Card className="p-6">
          <p className="text-foreground text-lg leading-relaxed">
            {body}
          </p>
          
          {highlight && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center italic">
                {highlight}
              </p>
            </div>
          )}
        </Card>
      </div>

      <div className="p-4 border-t">
        <Button
          onClick={onContinue}
          className="w-full py-6 text-lg font-bold"
          data-testid="button-continue"
        >
          CONTINUAR
        </Button>
      </div>
    </div>
  );
}

interface FillBlankExerciseProps {
  question: string;
  correctAnswer: string;
  options?: string[];
  onAnswer: (isCorrect: boolean, userAnswer: string) => void;
}

function generateOptions(correctAnswer: string): string[] {
  const distractors = [
    "amor", "fé", "esperança", "graça", "paz", "alegria", "salvação", "vida",
    "verdade", "luz", "caminho", "palavra", "oração", "louvor", "glória",
    "Cristo", "Deus", "Espírito", "céu", "terra", "santo", "justo", "eterno"
  ];
  
  const shuffled = distractors
    .filter(d => d.toLowerCase() !== correctAnswer.toLowerCase())
    .sort(() => Math.random() - 0.5);
  
  const options = [correctAnswer, ...shuffled.slice(0, 3)];
  return options.sort(() => Math.random() - 0.5);
}

export function FillBlankExercise({
  question,
  correctAnswer,
  options: providedOptions,
  onAnswer
}: FillBlankExerciseProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [generatedOptions] = useState(() => providedOptions || generateOptions(correctAnswer));

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
  };

  const handleVerify = () => {
    if (!selectedAnswer) return;
    setIsAnswered(true);
    const isCorrect = selectedAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    onAnswer(isCorrect, selectedAnswer);
  };

  const renderQuestionWithBlank = () => {
    const displayAnswer = selectedAnswer || "___";
    const isCorrectAnswer = selectedAnswer?.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    
    if (!question || question.trim() === "") {
      return (
        <>
          <span className="block mb-2 text-muted-foreground">Complete a lacuna:</span>
          <span className={cn(
            "inline-block min-w-[80px] mx-1 px-3 py-1 rounded-lg text-center font-bold transition-all",
            isAnswered 
              ? isCorrectAnswer
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-2 border-green-500"
                : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-2 border-red-500"
              : selectedAnswer 
                ? "bg-primary/10 text-primary border-2 border-primary"
                : "bg-muted text-muted-foreground border-2 border-dashed border-muted-foreground"
          )}>
            {displayAnswer}
          </span>
        </>
      );
    }

    const blankIndex = question.indexOf("___");
    
    if (blankIndex === -1) {
      return (
        <>
          <span>{question} </span>
          <span className={cn(
            "inline-block min-w-[80px] mx-1 px-3 py-1 rounded-lg text-center font-bold transition-all",
            isAnswered 
              ? isCorrectAnswer
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-2 border-green-500"
                : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-2 border-red-500"
              : selectedAnswer 
                ? "bg-primary/10 text-primary border-2 border-primary"
                : "bg-muted text-muted-foreground border-2 border-dashed border-muted-foreground"
          )}>
            {displayAnswer}
          </span>
        </>
      );
    }
    
    const beforeBlank = question.substring(0, blankIndex);
    const afterBlank = question.substring(blankIndex + 3);
    
    return (
      <>
        <span>{beforeBlank}</span>
        <span className={cn(
          "inline-block min-w-[80px] mx-1 px-3 py-1 rounded-lg text-center font-bold transition-all",
          isAnswered 
            ? isCorrectAnswer
              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-2 border-green-500"
              : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-2 border-red-500"
            : selectedAnswer 
              ? "bg-primary/10 text-primary border-2 border-primary"
              : "bg-muted text-muted-foreground border-2 border-dashed border-muted-foreground"
        )}>
          {displayAnswer}
        </span>
        <span>{afterBlank}</span>
      </>
    );
  };

  return (
    <div className="flex flex-col h-full" data-testid="exercise-fill-blank">
      <div className="flex-1 flex flex-col justify-center px-4">
        <h2 className="text-xl font-bold text-foreground mb-6 text-center">
          Complete a frase
        </h2>
        
        <Card className="p-6 mb-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <p className="text-lg text-foreground text-center leading-relaxed">
            {renderQuestionWithBlank()}
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {generatedOptions.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
            
            return (
              <Button
                key={index}
                variant="outline"
                className={cn(
                  "min-h-[56px] h-auto py-3 px-4 text-base font-semibold transition-all",
                  "border-2 whitespace-normal break-words",
                  !isAnswered && isSelected && "border-primary bg-primary/10 text-primary shadow-md",
                  !isAnswered && !isSelected && "hover:border-primary/50 hover:bg-primary/5",
                  isAnswered && isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300",
                  isAnswered && isSelected && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                )}
                onClick={() => handleSelect(option)}
                disabled={isAnswered}
                data-testid={`button-option-${index}`}
              >
                {option}
                {isAnswered && isCorrect && (
                  <CheckCircle2 className="h-5 w-5 ml-2 flex-shrink-0" />
                )}
              </Button>
            );
          })}
        </div>

        {isAnswered && selectedAnswer?.trim().toLowerCase() !== correctAnswer.trim().toLowerCase() && (
          <p className="mt-4 text-sm text-muted-foreground text-center">
            Resposta correta: <span className="font-bold text-green-600 dark:text-green-400">{correctAnswer}</span>
          </p>
        )}
      </div>

      <div className="p-4 border-t">
        <Button
          onClick={handleVerify}
          disabled={!selectedAnswer || isAnswered}
          className={cn(
            "w-full py-6 text-lg font-bold transition-all",
            selectedAnswer && !isAnswered && "bg-primary hover:bg-primary/90 shadow-lg"
          )}
          data-testid="button-verify-fill-blank"
        >
          VERIFICAR
        </Button>
      </div>
    </div>
  );
}
