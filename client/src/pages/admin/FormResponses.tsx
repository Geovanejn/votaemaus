import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  BarChart3, 
  Users, 
  FileText, 
  Download, 
  Sparkles,
  Loader2,
  Eye,
} from "lucide-react";
import type { FormWithQuestions, FormResponseWithAnswers, FormAnalysis } from "@shared/schema";

type AnalyticsData = {
  questionId: number;
  optionCounts: Record<number, number>;
  textAnswers: string[];
}[];

export default function FormResponses() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const formId = parseInt(id || "0");
  const [selectedResponse, setSelectedResponse] = useState<FormResponseWithAnswers | null>(null);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);

  const { data: form, isLoading: formLoading } = useQuery<FormWithQuestions>({
    queryKey: ["/api/admin/forms", formId],
    enabled: formId > 0,
  });

  const { data: responses, isLoading: responsesLoading } = useQuery<FormResponseWithAnswers[]>({
    queryKey: ["/api/admin/forms", formId, "responses"],
    enabled: formId > 0,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/forms", formId, "analytics"],
    enabled: formId > 0,
  });

  const { data: analyses } = useQuery<FormAnalysis[]>({
    queryKey: ["/api/admin/forms/analyses"],
    enabled: formId > 0,
  });

  const generateAnalysisMutation = useMutation({
    mutationFn: async () => {
      setGeneratingAnalysis(true);
      return apiRequest("POST", `/api/admin/forms/${formId}/generate-analysis`);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forms/analyses"] });
      toast({ title: "Analise gerada com sucesso!" });
      setGeneratingAnalysis(false);
    },
    onError: () => {
      toast({ title: "Erro ao gerar analise", variant: "destructive" });
      setGeneratingAnalysis(false);
    },
  });

  const isLoading = formLoading || responsesLoading || analyticsLoading;

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

  const totalResponses = responses?.length || 0;
  const questionMap = new Map(form.questions.map(q => [q.id, q]));
  const formAnalyses = analyses?.filter(a => a.formIds.includes(formId)) || [];

  const getOptionLabel = (questionId: number, optionId: number): string => {
    const question = questionMap.get(questionId);
    const option = question?.options?.find(o => o.id === optionId);
    return option?.optionText || `Opcao ${optionId}`;
  };

  const renderChart = (questionId: number, optionCounts: Record<number, number>) => {
    const question = questionMap.get(questionId);
    if (!question) return null;

    const entries = Object.entries(optionCounts);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    if (total === 0) return null;

    const colors = [
      "bg-primary",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-orange-500",
      "bg-teal-500",
    ];

    return (
      <div className="space-y-3">
        {entries.map(([optionIdStr, count], index) => {
          const optionId = parseInt(optionIdStr);
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const label = getOptionLabel(questionId, optionId);

          return (
            <div key={optionId} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="truncate max-w-[200px]">{label}</span>
                <span className="text-muted-foreground">
                  {count} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-6 bg-muted rounded-md overflow-hidden">
                <div
                  className={`h-full ${colors[index % colors.length]} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation(`/admin/estatistica/forms/${formId}`)}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Respostas: {form.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {totalResponses} resposta{totalResponses !== 1 ? "s" : ""} coletada{totalResponses !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => generateAnalysisMutation.mutate()}
                disabled={generatingAnalysis || totalResponses === 0}
                data-testid="button-generate-analysis"
              >
                {generatingAnalysis ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Gerar Analise com IA
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="charts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="charts" data-testid="tab-charts">
              <BarChart3 className="h-4 w-4 mr-2" />
              Graficos
            </TabsTrigger>
            <TabsTrigger value="responses" data-testid="tab-responses">
              <Users className="h-4 w-4 mr-2" />
              Respostas Individuais
            </TabsTrigger>
            <TabsTrigger value="analyses" data-testid="tab-analyses">
              <FileText className="h-4 w-4 mr-2" />
              Analises ({formAnalyses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-6">
            {form.questions.map((question) => {
              const questionAnalytics = analytics?.find(a => a.questionId === question.id);
              const isTextQuestion = question.questionType === "text" || question.questionType === "textarea";

              return (
                <Card key={question.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{question.questionText}</CardTitle>
                    <CardDescription>
                      {question.questionType === "text" && "Texto curto"}
                      {question.questionType === "textarea" && "Texto longo"}
                      {question.questionType === "radio" && "Escolha unica"}
                      {question.questionType === "checkbox" && "Multipla escolha"}
                      {question.questionType === "select" && "Lista suspensa"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isTextQuestion ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {questionAnalytics?.textAnswers && questionAnalytics.textAnswers.length > 0 ? (
                          questionAnalytics.textAnswers.map((answer, index) => (
                            <div
                              key={index}
                              className="p-3 bg-muted rounded-md text-sm"
                            >
                              {answer}
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-sm">Nenhuma resposta ainda.</p>
                        )}
                      </div>
                    ) : (
                      questionAnalytics?.optionCounts ? (
                        renderChart(question.id, questionAnalytics.optionCounts)
                      ) : (
                        <p className="text-muted-foreground text-sm">Nenhuma resposta ainda.</p>
                      )
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="responses">
            {responses && responses.length > 0 ? (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membro</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell className="font-medium">
                          {response.user.fullName}
                        </TableCell>
                        <TableCell>{response.user.email}</TableCell>
                        <TableCell>
                          {response.submittedAt
                            ? new Date(response.submittedAt).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedResponse(response)}
                            data-testid={`button-view-response-${response.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhuma resposta ainda.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analyses">
            {formAnalyses.length > 0 ? (
              <div className="space-y-4">
                {formAnalyses.map((analysis) => (
                  <Card key={analysis.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{analysis.title}</CardTitle>
                        <span className="text-sm text-muted-foreground">
                          {analysis.createdAt
                            ? new Date(analysis.createdAt).toLocaleDateString("pt-BR")
                            : ""}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <div className="whitespace-pre-wrap text-sm">
                          {analysis.analysisText}
                        </div>
                      </div>
                      {analysis.pdfUrl && (
                        <div className="mt-4">
                          <Button variant="outline" size="sm" asChild>
                            <a href={analysis.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Baixar PDF
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>Nenhuma analise gerada ainda.</p>
                  <p className="mt-2 text-sm">
                    Clique em "Gerar Analise com IA" para criar uma analise automatica das respostas.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Resposta de {selectedResponse?.user.fullName}
            </DialogTitle>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-4 py-4">
              {form.questions.map((question) => {
                const answer = selectedResponse.answers.find(a => a.questionId === question.id);
                
                let displayValue = "-";
                if (answer) {
                  if (answer.answerText) {
                    displayValue = answer.answerText;
                  } else if (answer.selectedOptionIds && answer.selectedOptionIds.length > 0) {
                    const optionLabels = answer.selectedOptionIds.map(optId => {
                      const opt = question.options?.find(o => o.id === optId);
                      return opt?.optionText || `Opcao ${optId}`;
                    });
                    displayValue = optionLabels.join(", ");
                  }
                }

                return (
                  <div key={question.id} className="border-b pb-4 last:border-0">
                    <p className="font-medium text-sm">{question.questionText}</p>
                    <p className="text-muted-foreground mt-1">{displayValue}</p>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
