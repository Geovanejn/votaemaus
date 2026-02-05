import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  GripVertical, 
  Save,
  Send,
  Lock,
  Eye,
  Type,
  AlignLeft,
  CircleDot,
  CheckSquare,
  List,
} from "lucide-react";
import type { FormWithQuestions, FormQuestion, FormOption } from "@shared/schema";

const questionTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  text: { label: "Texto Curto", icon: <Type className="h-4 w-4" /> },
  textarea: { label: "Texto Longo", icon: <AlignLeft className="h-4 w-4" /> },
  radio: { label: "Escolha Unica", icon: <CircleDot className="h-4 w-4" /> },
  checkbox: { label: "Multipla Escolha", icon: <CheckSquare className="h-4 w-4" /> },
  select: { label: "Lista Suspensa", icon: <List className="h-4 w-4" /> },
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  published: { label: "Publicado", variant: "default" },
  closed: { label: "Encerrado", variant: "outline" },
  blocked: { label: "Bloqueado", variant: "destructive" },
};

export default function FormEditor() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const formId = parseInt(id || "0");

  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [editQuestionOpen, setEditQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<FormQuestion & { options: FormOption[] } | null>(null);
  
  const [newQuestion, setNewQuestion] = useState({
    questionText: "",
    questionType: "text",
    isRequired: true,
    description: "",
  });

  const [newOptions, setNewOptions] = useState<string[]>([""]);

  const { data: form, isLoading } = useQuery<FormWithQuestions>({
    queryKey: ["/api/admin/forms", formId],
    enabled: formId > 0,
  });

  const updateFormMutation = useMutation({
    mutationFn: async (data: { title?: string; description?: string }) => {
      return apiRequest("PATCH", `/api/admin/forms/${formId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forms", formId] });
      toast({ title: "Formulario atualizado" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar formulario", variant: "destructive" });
    },
  });

  const addQuestionMutation = useMutation({
    mutationFn: async (data: {
      questionText: string;
      questionType: string;
      isRequired: boolean;
      description?: string;
      options?: string[];
    }) => {
      const { options, ...questionData } = data;
      const result = await apiRequest("POST", `/api/admin/forms/${formId}/questions`, {
        ...questionData,
        sortOrder: (form?.questions?.length || 0) + 1,
      });
      const question = await result.json();
      
      if (options && options.length > 0 && ["radio", "checkbox", "select"].includes(data.questionType)) {
        for (let i = 0; i < options.length; i++) {
          if (options[i].trim()) {
            await apiRequest("POST", `/api/admin/forms/${formId}/questions/${question.id}/options`, {
              optionText: options[i].trim(),
              sortOrder: i + 1,
            });
          }
        }
      }
      return question;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forms", formId] });
      setAddQuestionOpen(false);
      setNewQuestion({ questionText: "", questionType: "text", isRequired: true, description: "" });
      setNewOptions([""]);
      toast({ title: "Pergunta adicionada" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar pergunta", variant: "destructive" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      return apiRequest("DELETE", `/api/admin/forms/${formId}/questions/${questionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forms", formId] });
      toast({ title: "Pergunta removida" });
    },
    onError: () => {
      toast({ title: "Erro ao remover pergunta", variant: "destructive" });
    },
  });

  const publishFormMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/admin/forms/${formId}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forms", formId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forms"] });
      toast({ title: "Formulario publicado", description: "Notificacoes enviadas para todos os membros" });
    },
    onError: () => {
      toast({ title: "Erro ao publicar formulario", variant: "destructive" });
    },
  });

  const closeFormMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/admin/forms/${formId}/close`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forms", formId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forms"] });
      toast({ title: "Formulario encerrado" });
    },
    onError: () => {
      toast({ title: "Erro ao encerrar formulario", variant: "destructive" });
    },
  });

  const handleAddOption = () => {
    setNewOptions([...newOptions, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (newOptions.length > 1) {
      setNewOptions(newOptions.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...newOptions];
    updated[index] = value;
    setNewOptions(updated);
  };

  const handleAddQuestion = () => {
    if (!newQuestion.questionText.trim()) {
      toast({ title: "Digite o texto da pergunta", variant: "destructive" });
      return;
    }

    const needsOptions = ["radio", "checkbox", "select"].includes(newQuestion.questionType);
    const validOptions = newOptions.filter(o => o.trim());

    if (needsOptions && validOptions.length < 2) {
      toast({ title: "Adicione pelo menos 2 opcoes", variant: "destructive" });
      return;
    }

    addQuestionMutation.mutate({
      ...newQuestion,
      options: needsOptions ? validOptions : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Formulario nao encontrado</p>
        <Button onClick={() => setLocation("/admin/estatistica")} data-testid="button-back-to-dashboard">
          Voltar
        </Button>
      </div>
    );
  }

  const isDraft = form.status === "draft";
  const isPublished = form.status === "published";
  const statusInfo = statusLabels[form.status] || statusLabels.draft;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/admin/estatistica")}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{form.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {form.responseCount} resposta{form.responseCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isDraft && form.questions.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="default" data-testid="button-publish-form">
                      <Send className="h-4 w-4 mr-2" />
                      Publicar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Publicar Formulario</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ao publicar, todos os membros receberao uma notificacao e poderao responder ao formulario. 
                        Apos publicar, voce nao podera editar as perguntas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="button-cancel-publish">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => publishFormMutation.mutate()}
                        data-testid="button-confirm-publish"
                      >
                        Publicar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {isPublished && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" data-testid="button-close-form">
                      <Lock className="h-4 w-4 mr-2" />
                      Encerrar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Encerrar Formulario</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ao encerrar, os membros nao poderao mais responder ao formulario.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="button-cancel-close">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => closeFormMutation.mutate()}
                        data-testid="button-confirm-close"
                      >
                        Encerrar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {(isPublished || form.status === "closed") && (
                <Button
                  variant="outline"
                  onClick={() => setLocation(`/admin/estatistica/forms/${formId}/respostas`)}
                  data-testid="button-view-responses"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Respostas
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Informacoes do Formulario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="form-title">Titulo</Label>
              <Input
                id="form-title"
                value={form.title}
                onChange={(e) => {
                  if (isDraft) {
                    updateFormMutation.mutate({ title: e.target.value });
                  }
                }}
                disabled={!isDraft}
                data-testid="input-form-title"
              />
            </div>
            <div>
              <Label htmlFor="form-description">Descricao (opcional)</Label>
              <Textarea
                id="form-description"
                value={form.description || ""}
                onChange={(e) => {
                  if (isDraft) {
                    updateFormMutation.mutate({ description: e.target.value });
                  }
                }}
                disabled={!isDraft}
                placeholder="Descreva o proposito do formulario..."
                data-testid="input-form-description"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Perguntas ({form.questions.length})</h2>
            {isDraft && (
              <Dialog open={addQuestionOpen} onOpenChange={setAddQuestionOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-question">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Pergunta
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Nova Pergunta</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="question-text">Texto da Pergunta</Label>
                      <Input
                        id="question-text"
                        value={newQuestion.questionText}
                        onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                        placeholder="Digite a pergunta..."
                        data-testid="input-question-text"
                      />
                    </div>
                    <div>
                      <Label htmlFor="question-type">Tipo de Resposta</Label>
                      <Select
                        value={newQuestion.questionType}
                        onValueChange={(value) => {
                          setNewQuestion({ ...newQuestion, questionType: value });
                          if (["radio", "checkbox", "select"].includes(value) && newOptions.length === 1 && newOptions[0] === "") {
                            setNewOptions(["", ""]);
                          }
                        }}
                      >
                        <SelectTrigger id="question-type" data-testid="select-question-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(questionTypeLabels).map(([type, { label, icon }]) => (
                            <SelectItem key={type} value={type} data-testid={`option-type-${type}`}>
                              <div className="flex items-center gap-2">
                                {icon}
                                {label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="question-description">Descricao (opcional)</Label>
                      <Input
                        id="question-description"
                        value={newQuestion.description}
                        onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
                        placeholder="Instrucoes adicionais..."
                        data-testid="input-question-description"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="question-required"
                        checked={newQuestion.isRequired}
                        onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, isRequired: checked })}
                        data-testid="switch-question-required"
                      />
                      <Label htmlFor="question-required">Obrigatoria</Label>
                    </div>

                    {["radio", "checkbox", "select"].includes(newQuestion.questionType) && (
                      <div className="space-y-2">
                        <Label>Opcoes</Label>
                        {newOptions.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              placeholder={`Opcao ${index + 1}`}
                              data-testid={`input-option-${index}`}
                            />
                            {newOptions.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveOption(index)}
                                data-testid={`button-remove-option-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddOption}
                          data-testid="button-add-option"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar Opcao
                        </Button>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setAddQuestionOpen(false)}
                      data-testid="button-cancel-question"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAddQuestion}
                      disabled={addQuestionMutation.isPending}
                      data-testid="button-save-question"
                    >
                      {addQuestionMutation.isPending ? "Salvando..." : "Adicionar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {form.questions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>Nenhuma pergunta adicionada ainda.</p>
                {isDraft && <p className="mt-2">Clique em "Adicionar Pergunta" para comecar.</p>}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {form.questions.map((question, index) => {
                const typeInfo = questionTypeLabels[question.questionType] || questionTypeLabels.text;
                return (
                  <Card key={question.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                          <span className="text-sm font-medium">{index + 1}.</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium">
                                {question.questionText}
                                {question.isRequired && <span className="text-destructive ml-1">*</span>}
                              </p>
                              {question.description && (
                                <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="flex items-center gap-1">
                                {typeInfo.icon}
                                {typeInfo.label}
                              </Badge>
                              {isDraft && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      data-testid={`button-delete-question-${question.id}`}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remover Pergunta</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja remover esta pergunta?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel data-testid="button-cancel-delete-question">
                                        Cancelar
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteQuestionMutation.mutate(question.id)}
                                        data-testid="button-confirm-delete-question"
                                      >
                                        Remover
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                          {question.options && question.options.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {question.options.map((option) => (
                                <div
                                  key={option.id}
                                  className="flex items-center gap-2 text-sm text-muted-foreground"
                                >
                                  {question.questionType === "checkbox" ? (
                                    <CheckSquare className="h-3 w-3" />
                                  ) : (
                                    <CircleDot className="h-3 w-3" />
                                  )}
                                  {option.optionText}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
