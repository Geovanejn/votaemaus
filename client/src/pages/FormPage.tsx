import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Send, CheckCircle2 } from "lucide-react";
import type { FormWithQuestions, FormQuestion, FormOption } from "@shared/schema";

type Answer = {
  questionId: number;
  answerText?: string;
  selectedOptionIds?: number[];
};

export default function FormPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const formId = parseInt(id || "0");

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: form, isLoading: formLoading } = useQuery<FormWithQuestions>({
    queryKey: ["/api/forms", formId],
    enabled: formId > 0,
  });

  const { data: existingResponse, isLoading: responseLoading } = useQuery<{ hasResponded: boolean }>({
    queryKey: ["/api/forms", formId, "check"],
    enabled: formId > 0 && !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async (answersArray: Answer[]) => {
      return apiRequest("POST", `/api/forms/${formId}/respond`, { answers: answersArray });
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/forms/pending"] });
      toast({ title: "Resposta enviada com sucesso!" });
    },
    onError: (error: any) => {
      if (error.message?.includes("ja respondeu")) {
        setSubmitted(true);
      } else {
        toast({ title: "Erro ao enviar resposta", variant: "destructive" });
      }
    },
  });

  const isLoading = formLoading || responseLoading;

  useEffect(() => {
    if (existingResponse?.hasResponded) {
      setSubmitted(true);
    }
  }, [existingResponse]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Voce precisa estar logado para responder este formulario.
            </p>
            <Button onClick={() => setLocation("/membro")} data-testid="button-login">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Formulario nao encontrado.</p>
            <Button onClick={() => setLocation("/")} data-testid="button-go-home">
              Voltar ao Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (form.status !== "published") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {form.status === "draft" ? "Este formulario ainda nao foi publicado." : 
               form.status === "closed" ? "Este formulario foi encerrado." :
               "Este formulario nao esta disponivel."}
            </p>
            <Button onClick={() => setLocation("/")} data-testid="button-go-home">
              Voltar ao Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Obrigado!</h2>
            <p className="text-muted-foreground mb-6">
              Sua resposta foi registrada com sucesso.
            </p>
            <Button onClick={() => setLocation("/")} data-testid="button-go-home">
              Voltar ao Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = form.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = totalQuestions > 0 ? ((currentQuestionIndex) / totalQuestions) * 100 : 0;

  const getCurrentAnswer = (): Answer | undefined => {
    return answers[currentQuestion?.id];
  };

  const setCurrentAnswer = (answer: Partial<Answer>) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        ...answer,
        questionId: currentQuestion.id,
      },
    }));
  };

  const isCurrentAnswerValid = (): boolean => {
    if (!currentQuestion) return false;
    if (!currentQuestion.isRequired) return true;

    const answer = getCurrentAnswer();
    if (!answer) return false;

    switch (currentQuestion.questionType) {
      case "text":
      case "textarea":
        return !!answer.answerText?.trim();
      case "radio":
      case "select":
        return (answer.selectedOptionIds?.length || 0) === 1;
      case "checkbox":
        return (answer.selectedOptionIds?.length || 0) > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!isCurrentAnswerValid() && currentQuestion?.isRequired) {
      toast({ title: "Responda a pergunta para continuar", variant: "destructive" });
      return;
    }
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (!isCurrentAnswerValid() && currentQuestion?.isRequired) {
      toast({ title: "Responda a pergunta para enviar", variant: "destructive" });
      return;
    }

    const answersArray: Answer[] = Object.values(answers);
    submitMutation.mutate(answersArray);
  };

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;
    const answer = getCurrentAnswer();

    switch (currentQuestion.questionType) {
      case "text":
        return (
          <Input
            value={answer?.answerText || ""}
            onChange={(e) => setCurrentAnswer({ answerText: e.target.value })}
            placeholder="Digite sua resposta..."
            data-testid="input-text-answer"
          />
        );

      case "textarea":
        return (
          <Textarea
            value={answer?.answerText || ""}
            onChange={(e) => setCurrentAnswer({ answerText: e.target.value })}
            placeholder="Digite sua resposta..."
            rows={4}
            data-testid="input-textarea-answer"
          />
        );

      case "radio":
        return (
          <RadioGroup
            value={answer?.selectedOptionIds?.[0]?.toString() || ""}
            onValueChange={(value) => setCurrentAnswer({ selectedOptionIds: [parseInt(value)] })}
          >
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={option.id.toString()}
                    id={`option-${option.id}`}
                    data-testid={`radio-option-${option.id}`}
                  />
                  <Label htmlFor={`option-${option.id}`} className="cursor-pointer">
                    {option.optionText}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case "checkbox":
        const selectedIds = answer?.selectedOptionIds || [];
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`option-${option.id}`}
                  checked={selectedIds.includes(option.id)}
                  onCheckedChange={(checked) => {
                    const newIds = checked
                      ? [...selectedIds, option.id]
                      : selectedIds.filter(id => id !== option.id);
                    setCurrentAnswer({ selectedOptionIds: newIds });
                  }}
                  data-testid={`checkbox-option-${option.id}`}
                />
                <Label htmlFor={`option-${option.id}`} className="cursor-pointer">
                  {option.optionText}
                </Label>
              </div>
            ))}
          </div>
        );

      case "select":
        return (
          <Select
            value={answer?.selectedOptionIds?.[0]?.toString() || ""}
            onValueChange={(value) => setCurrentAnswer({ selectedOptionIds: [parseInt(value)] })}
          >
            <SelectTrigger data-testid="select-answer">
              <SelectValue placeholder="Selecione uma opcao" />
            </SelectTrigger>
            <SelectContent>
              {currentQuestion.options?.map((option) => (
                <SelectItem
                  key={option.id}
                  value={option.id.toString()}
                  data-testid={`select-option-${option.id}`}
                >
                  {option.optionText}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Sair
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentQuestionIndex + 1} de {totalQuestions}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {currentQuestionIndex === 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{form.title}</CardTitle>
              {form.description && (
                <CardDescription>{form.description}</CardDescription>
              )}
            </CardHeader>
          </Card>
        )}

        {currentQuestion && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {currentQuestion.questionText}
                {currentQuestion.isRequired && <span className="text-destructive ml-1">*</span>}
              </CardTitle>
              {currentQuestion.description && (
                <CardDescription>{currentQuestion.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {renderQuestionInput()}
            </CardContent>
            <CardFooter className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                data-testid="button-previous"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              {isLastQuestion ? (
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  data-testid="button-submit"
                >
                  {submitMutation.isPending ? "Enviando..." : "Enviar"}
                  <Send className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleNext} data-testid="button-next">
                  Proximo
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
