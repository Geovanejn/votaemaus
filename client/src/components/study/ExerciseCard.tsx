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
        <h2 className="text-xl font-bold text-foreground mb-6 text-center">
          {question}
        </h2>

        <div className="flex flex-col gap-3">
          {options.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              className={cn(
                "w-full py-6 text-left justify-start text-base font-medium transition-all",
                "border-2",
                selectedIndex === index && !isAnswered && "border-primary bg-primary/5",
                isAnswered && index === correctIndex && "border-green-500 bg-green-50 dark:bg-green-900/20",
                isAnswered && selectedIndex === index && index !== correctIndex && "border-red-500 bg-red-50 dark:bg-red-900/20"
              )}
              onClick={() => handleSelect(index)}
              disabled={isAnswered}
              data-testid={`button-option-${index}`}
            >
              <span className={cn(
                "flex items-center justify-center h-6 w-6 rounded-full border-2 mr-3 text-sm font-bold",
                selectedIndex === index ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
              )}>
                {String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1">{option}</span>
              {isAnswered && index === correctIndex && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </Button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t">
        <Button
          onClick={handleVerify}
          disabled={selectedIndex === null || isAnswered}
          className="w-full py-6 text-lg font-bold"
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

  return (
    <div className="flex flex-col h-full" data-testid="exercise-true-false">
      <div className="flex-1 flex flex-col justify-center px-4">
        <Card className="p-6 mb-6">
          <p className="text-lg text-foreground text-center italic">
            "{statement}"
          </p>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="outline"
            className={cn(
              "flex-1 py-8 text-lg font-bold border-2",
              selected === true && !isAnswered && "border-primary bg-primary/5",
              isAnswered && isTrue && "border-green-500 bg-green-50 dark:bg-green-900/20",
              isAnswered && selected === true && !isTrue && "border-red-500 bg-red-50 dark:bg-red-900/20"
            )}
            onClick={() => handleSelect(true)}
            disabled={isAnswered}
            data-testid="button-true"
          >
            VERDADEIRO
          </Button>
          <Button
            variant="outline"
            className={cn(
              "flex-1 py-8 text-lg font-bold border-2",
              selected === false && !isAnswered && "border-primary bg-primary/5",
              isAnswered && !isTrue && "border-green-500 bg-green-50 dark:bg-green-900/20",
              isAnswered && selected === false && isTrue && "border-red-500 bg-red-50 dark:bg-red-900/20"
            )}
            onClick={() => handleSelect(false)}
            disabled={isAnswered}
            data-testid="button-false"
          >
            FALSO
          </Button>
        </div>
      </div>

      <div className="p-4 border-t">
        <Button
          onClick={handleVerify}
          disabled={selected === null || isAnswered}
          className="w-full py-6 text-lg font-bold"
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
  onAnswer: (isCorrect: boolean, userAnswer: string) => void;
}

export function FillBlankExercise({
  question,
  correctAnswer,
  onAnswer
}: FillBlankExerciseProps) {
  const [userAnswer, setUserAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);

  const handleVerify = () => {
    if (!userAnswer.trim()) return;
    setIsAnswered(true);
    const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    onAnswer(isCorrect, userAnswer);
  };

  const renderQuestionWithBlank = () => {
    if (!question || question.trim() === "") {
      return (
        <>
          <span className="block mb-2 text-muted-foreground">Complete a lacuna:</span>
          <span className={cn(
            "inline-block min-w-[80px] mx-1 px-2 py-1 border-b-2 text-center font-bold",
            isAnswered 
              ? userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
                ? "border-green-500 text-green-600 dark:text-green-400"
                : "border-red-500 text-red-600 dark:text-red-400"
              : "border-primary"
          )}>
            {userAnswer || "___"}
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
            "inline-block min-w-[80px] mx-1 px-2 py-1 border-b-2 text-center font-bold",
            isAnswered 
              ? userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
                ? "border-green-500 text-green-600 dark:text-green-400"
                : "border-red-500 text-red-600 dark:text-red-400"
              : "border-primary"
          )}>
            {userAnswer || "___"}
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
          "inline-block min-w-[80px] mx-1 px-2 py-1 border-b-2 text-center font-bold",
          isAnswered 
            ? userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
              ? "border-green-500 text-green-600 dark:text-green-400"
              : "border-red-500 text-red-600 dark:text-red-400"
            : "border-primary"
        )}>
          {userAnswer || "___"}
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
        
        <Card className="p-6 mb-6">
          <p className="text-lg text-foreground text-center leading-relaxed">
            {renderQuestionWithBlank()}
          </p>
        </Card>

        <Input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Digite sua resposta..."
          disabled={isAnswered}
          className="py-4 text-lg"
          data-testid="input-fill-blank-answer"
        />

        {isAnswered && userAnswer.trim().toLowerCase() !== correctAnswer.trim().toLowerCase() && (
          <p className="mt-2 text-sm text-muted-foreground text-center">
            Resposta correta: <span className="font-bold text-green-600 dark:text-green-400">{correctAnswer}</span>
          </p>
        )}
      </div>

      <div className="p-4 border-t">
        <Button
          onClick={handleVerify}
          disabled={!userAnswer.trim() || isAnswered}
          className="w-full py-6 text-lg font-bold"
          data-testid="button-verify-fill-blank"
        >
          VERIFICAR
        </Button>
      </div>
    </div>
  );
}
