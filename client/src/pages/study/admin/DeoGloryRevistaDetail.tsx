import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { DeoGloryAdminLayout } from "@/components/deoglory/DeoGloryAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Upload,
  BookOpen,
  Loader2,
  FileText,
  CheckCircle,
  X,
  Lock,
  Unlock,
  Trash2,
  Eye,
  Key,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Season, StudyLesson } from "@shared/schema";

const MAGAZINE_COVER_ASPECT_RATIO = 2 / 3;

export default function DeoGloryRevistaDetail() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const seasonId = parseInt(params.id || "0", 10);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [selectedLessonNumber, setSelectedLessonNumber] = useState<string>("");
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [geminiKey, setGeminiKey] = useState<string>("1");
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const { data: season, isLoading: loadingSeason } = useQuery<Season>({
    queryKey: ["/api/study/admin/seasons", seasonId],
    queryFn: async () => {
      const res = await fetch(`/api/study/admin/seasons/${seasonId}`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch season");
      return res.json();
    },
    enabled: seasonId > 0,
  });

  const { data: lessons = [], isLoading: loadingLessons } = useQuery<StudyLesson[]>({
    queryKey: ["/api/study/admin/seasons", seasonId, "lessons"],
    queryFn: async () => {
      const res = await fetch(`/api/study/admin/seasons/${seasonId}/lessons`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch lessons");
      return res.json();
    },
    enabled: seasonId > 0,
  });

  const toggleLessonLockMutation = useMutation({
    mutationFn: async ({ lessonId, isLocked }: { lessonId: number; isLocked: boolean }) => {
      return apiRequest("PATCH", `/api/study/admin/lessons/${lessonId}`, { isLocked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/seasons", seasonId, "lessons"] });
      toast({ title: "Lição atualizada!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar lição", description: error.message, variant: "destructive" });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      return apiRequest("DELETE", `/api/study/admin/lessons/${lessonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/seasons", seasonId, "lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/seasons"] });
      toast({ title: "Lição removida com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao remover lição", description: error.message, variant: "destructive" });
    },
  });

  const publishSeasonMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/study/admin/seasons/${seasonId}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/seasons", seasonId] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/seasons"] });
      toast({ title: "Revista publicada com sucesso!", description: "Agora os usuários podem acessar os estudos." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao publicar revista", description: error.message, variant: "destructive" });
    },
  });

  const resetUploadModal = () => {
    setShowUploadModal(false);
    setPdfFile(null);
    setSelectedLessonNumber("");
    setIsProcessingPdf(false);
    setGeminiKey("1");
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      toast({ title: "Selecione um arquivo PDF válido", variant: "destructive" });
    }
  };

  const handleUploadPdf = async () => {
    if (!pdfFile) {
      toast({ title: "Selecione um arquivo PDF", variant: "destructive" });
      return;
    }

    if (!selectedLessonNumber) {
      toast({ title: "Selecione o número da lição", variant: "destructive" });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Sessão expirada", description: "Por favor, faça login novamente", variant: "destructive" });
      return;
    }

    setIsProcessingPdf(true);
    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      formData.append("lessonNumber", selectedLessonNumber);
      formData.append("geminiKey", geminiKey);

      const response = await fetch(`/api/study/admin/seasons/${seasonId}/import-pdf-exact`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        credentials: "include",
      });

      if (response.status === 401) {
        toast({ title: "Sessão expirada", description: "Por favor, faça login novamente", variant: "destructive" });
        return;
      }

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "PDF processado com sucesso!",
          description: `Lição ${selectedLessonNumber} - "${data.lessonTitle}" criada com ${data.questionsCount} perguntas.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/study/admin/seasons", seasonId, "lessons"] });
        queryClient.invalidateQueries({ queryKey: ["/api/study/admin/seasons"] });
        resetUploadModal();
      } else {
        let errorTitle = "Erro ao processar PDF";
        let errorDescription = data.message || "Erro desconhecido";
        
        if (data.errorType === "rate_limit") {
          errorTitle = "Limite de requisições atingido";
          errorDescription = `${data.message} Tente usar a Chave ${parseInt(geminiKey) < 5 ? parseInt(geminiKey) + 1 : 1}.`;
        } else if (data.errorType === "auth") {
          errorTitle = "Erro de autenticação";
        } else if (data.errorType === "service_unavailable") {
          errorTitle = "Serviço indisponível";
        } else if (data.errorType === "timeout") {
          errorTitle = "Tempo limite excedido";
        }
        
        toast({ title: errorTitle, description: errorDescription, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro de conexão", description: "Verifique sua internet e tente novamente.", variant: "destructive" });
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const usedLessonNumbers = lessons.map(l => l.lessonNumber).filter(Boolean) as number[];
  const availableLessonNumbers = Array.from({ length: 20 }, (_, i) => i + 1).filter(
    n => !usedLessonNumbers.includes(n)
  );

  if (loadingSeason) {
    return (
      <DeoGloryAdminLayout title="Carregando..." subtitle="">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      </DeoGloryAdminLayout>
    );
  }

  if (!season) {
    return (
      <DeoGloryAdminLayout title="Revista não encontrada" subtitle="">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">A revista solicitada não foi encontrada.</p>
          <Button onClick={() => navigate("/admin/study/estudos")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Revistas
          </Button>
        </div>
      </DeoGloryAdminLayout>
    );
  }

  return (
    <DeoGloryAdminLayout 
      title={season.aiExtractedTitle || season.title} 
      subtitle="Gerencie as lições desta revista"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Button 
            variant="outline" 
            onClick={() => navigate("/admin/study/estudos")}
            data-testid="button-voltar"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            {season && season.status !== "published" && lessons.length > 0 && (
              <Button 
                onClick={() => publishSeasonMutation.mutate()}
                disabled={publishSeasonMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-publish-season"
              >
                {publishSeasonMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Publicar Revista
              </Button>
            )}
            <Button 
              onClick={() => setShowUploadModal(true)} 
              className="bg-violet-600 hover:bg-violet-700"
              data-testid="button-upload-pdf"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <div 
                className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-4" 
                style={{ aspectRatio: '2/3' }}
              >
                {season.coverImageUrl ? (
                  <img
                    src={season.coverImageUrl}
                    alt={season.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {season.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {season.totalLessons} {season.totalLessons === 1 ? "lição" : "lições"}
              </p>
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lições</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingLessons ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                  </div>
                ) : lessons.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      Nenhuma lição criada
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Faça upload de um PDF para criar a primeira lição.
                    </p>
                    <Button 
                      onClick={() => setShowUploadModal(true)} 
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload PDF
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessons
                      .sort((a, b) => (a.lessonNumber || 0) - (b.lessonNumber || 0))
                      .map((lesson) => (
                        <div 
                          key={lesson.id}
                          className="flex items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          data-testid={`lesson-row-${lesson.id}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30">
                              <span className="text-sm font-bold text-violet-600">
                                {lesson.lessonNumber || lesson.orderIndex + 1}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {lesson.title}
                              </h4>
                              {lesson.description && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {lesson.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={lesson.isLocked 
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-0" 
                                : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-0"
                              }
                            >
                              {lesson.isLocked ? "Bloqueada" : "Liberada"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/admin/study/licao/${lesson.id}`)}
                              data-testid={`button-edit-lesson-${lesson.id}`}
                            >
                              <Eye className="h-4 w-4 text-violet-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleLessonLockMutation.mutate({ 
                                lessonId: lesson.id, 
                                isLocked: !lesson.isLocked 
                              })}
                              disabled={toggleLessonLockMutation.isPending}
                              data-testid={`button-toggle-lock-${lesson.id}`}
                            >
                              {lesson.isLocked ? (
                                <Unlock className="h-4 w-4 text-green-600" />
                              ) : (
                                <Lock className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Tem certeza que deseja remover esta lição?")) {
                                  deleteLessonMutation.mutate(lesson.id);
                                }
                              }}
                              disabled={deleteLessonMutation.isPending}
                              data-testid={`button-delete-lesson-${lesson.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showUploadModal} onOpenChange={(open) => !isProcessingPdf && setShowUploadModal(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload de PDF</DialogTitle>
            <DialogDescription>
              Selecione o número da lição e faça upload do PDF. A IA irá extrair o conteúdo automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número da Lição</Label>
                <Select 
                  value={selectedLessonNumber} 
                  onValueChange={setSelectedLessonNumber}
                  disabled={isProcessingPdf}
                >
                  <SelectTrigger data-testid="select-lesson-number">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLessonNumbers.map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        Lição {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableLessonNumbers.length === 0 && (
                  <p className="text-sm text-amber-600">
                    Todas as 20 lições já foram criadas.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Chave Gemini
                </Label>
                <Select 
                  value={geminiKey} 
                  onValueChange={setGeminiKey}
                  disabled={isProcessingPdf}
                >
                  <SelectTrigger data-testid="select-gemini-key">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Chave 1</SelectItem>
                    <SelectItem value="2">Chave 2</SelectItem>
                    <SelectItem value="3">Chave 3</SelectItem>
                    <SelectItem value="4">Chave 4</SelectItem>
                    <SelectItem value="5">Chave 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handlePdfChange}
            />
            {pdfFile ? (
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                  <FileText className="h-6 w-6 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {pdfFile.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!isProcessingPdf && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPdfFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full h-32 border-dashed"
                onClick={() => pdfInputRef.current?.click()}
                disabled={availableLessonNumbers.length === 0}
                data-testid="button-selecionar-pdf"
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">Clique para selecionar PDF</span>
                  <span className="text-xs text-muted-foreground">Máximo 10MB</span>
                </div>
              </Button>
            )}

            {isProcessingPdf && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Processando com IA...
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Isso pode levar alguns segundos.
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetUploadModal} disabled={isProcessingPdf}>
              Cancelar
            </Button>
            <Button
              onClick={handleUploadPdf}
              disabled={isProcessingPdf || !pdfFile || !selectedLessonNumber}
              className="bg-violet-600 hover:bg-violet-700"
              data-testid="button-processar-pdf"
            >
              {isProcessingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Gerar Lição
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DeoGloryAdminLayout>
  );
}
