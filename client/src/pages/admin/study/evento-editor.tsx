import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  ArrowLeft,
  Loader2,
  Sparkles,
  Save,
  Calendar,
  ImageIcon,
  Eye,
  BookOpen,
  Edit,
  Unlock,
  Lock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload, IMAGE_UPLOAD_CONFIGS } from "@/components/ui/image-upload";

interface StudyEvent {
  id: number;
  title: string;
  description: string | null;
  theme: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  status: string;
  cardId: number | null;
  lessonsCount: number | null;
  xpMultiplier: number | null;
  createdAt: string;
}

interface EventLesson {
  id: number;
  eventId: number;
  dayNumber: number;
  title: string;
  status: string | null;
}

interface EditingLesson {
  id: number;
  dayNumber: number;
  title: string;
  content: string;
}

export default function EventoEditorPage() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    theme: "",
    imageUrl: "",
  });

  const [editingLesson, setEditingLesson] = useState<EditingLesson | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: event, isLoading } = useQuery<StudyEvent>({
    queryKey: ["/api/admin/study-events", id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/study-events/${id}`, {
        credentials: "include",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Evento não encontrado");
      return response.json();
    },
    enabled: !!id,
  });

  const { data: lessons } = useQuery<EventLesson[]>({
    queryKey: ["/api/admin/study-events", id, "lessons"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/study-events/${id}/lessons`, {
        credentials: "include",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        theme: event.theme || "",
        imageUrl: event.imageUrl || "",
      });
    }
  }, [event]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("PATCH", `/api/admin/study-events/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/study-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/study-events", id] });
      toast({
        title: "Evento atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "O título do evento é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(formData);
  };

  const releaseLessonMutation = useMutation({
    mutationFn: async (dayNumber: number) => {
      return apiRequest("POST", `/api/admin/study/events/${id}/lessons/${dayNumber}/release`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/study-events", id, "lessons"] });
      toast({
        title: "Lição liberada",
        description: "A lição foi liberada manualmente com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao liberar lição.",
        variant: "destructive",
      });
    },
  });

  const editLessonMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/admin/study/events/${id}/lessons/${editingLesson?.dayNumber}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/study-events", id, "lessons"] });
      toast({
        title: "Lição atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
      setDialogOpen(false);
      setEditingLesson(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar lição.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background border-b">
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="h-9 w-9" />
            <div className="flex-1">
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
        </header>
        <main className="p-4 space-y-6">
          <Skeleton className="h-[400px] w-full" />
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-1">Evento não encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              O evento solicitado não existe ou foi removido.
            </p>
            <Button onClick={() => setLocation("/admin/study/eventos")} data-testid="button-back-list">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/admin/study/eventos")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Editar Evento</h1>
            <p className="text-sm text-muted-foreground">Atualizar detalhes do evento especial</p>
          </div>
          <Button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
            data-testid="button-save"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>
                  {format(startDate, "dd 'de' MMMM", { locale: ptBR })} - {format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </CardDescription>
              </div>
              <Badge className={event.status === "published" ? "bg-green-500" : ""} variant={event.status === "draft" ? "outline" : "default"}>
                {event.status === "published" ? "Publicado" : "Rascunho"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4" />
              Imagem do Evento
            </CardTitle>
            <CardDescription>
              Esta imagem será exibida no card do evento e nos cards colecionáveis dos membros.
              Use uma imagem em formato 16:9 (paisagem) para melhor visualização.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              aspectRatio={IMAGE_UPLOAD_CONFIGS.event.aspectRatio}
              placeholder={IMAGE_UPLOAD_CONFIGS.event.placeholder}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações do Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título do evento"
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Tema</Label>
              <Input
                id="theme"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                placeholder="Tema do evento"
                data-testid="input-theme"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do evento..."
                className="min-h-[100px]"
                data-testid="input-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Data de Início</span>
                </div>
                <p className="font-medium">{format(startDate, "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Data de Término</span>
                </div>
                <p className="font-medium">{format(endDate, "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {lessons && lessons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" />
                Lições do Evento
              </CardTitle>
              <CardDescription>
                {lessons.length} lições criadas para este evento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lessons.sort((a, b) => a.dayNumber - b.dayNumber).map((lesson) => (
                  <div 
                    key={lesson.id} 
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    data-testid={`lesson-${lesson.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          {lesson.dayNumber}
                        </span>
                      </div>
                      <span className="font-medium">{lesson.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={lesson.status === "published" ? "default" : "outline"}>
                        {lesson.status === "published" ? "Publicada" : "Rascunho"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingLesson({
                            id: lesson.id,
                            dayNumber: lesson.dayNumber,
                            title: lesson.title,
                            content: "",
                          });
                          setDialogOpen(true);
                        }}
                        data-testid={`button-edit-lesson-${lesson.dayNumber}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {lesson.status !== "published" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => releaseLessonMutation.mutate(lesson.dayNumber)}
                          disabled={releaseLessonMutation.isPending}
                          data-testid={`button-release-lesson-${lesson.dayNumber}`}
                        >
                          <Unlock className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Lição</DialogTitle>
            <DialogDescription>
              Dia {editingLesson?.dayNumber}: {editingLesson?.title}
            </DialogDescription>
          </DialogHeader>
          {editingLesson && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-title">Título da Lição</Label>
                <Input
                  id="lesson-title"
                  value={editingLesson.title}
                  onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                  placeholder="Título da lição"
                  data-testid="input-lesson-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-content">Conteúdo</Label>
                <Textarea
                  id="lesson-content"
                  value={editingLesson.content}
                  onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
                  placeholder="Conteúdo da lição..."
                  className="min-h-[200px]"
                  data-testid="input-lesson-content"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button
                  onClick={() => editLessonMutation.mutate({ title: editingLesson.title, content: editingLesson.content })}
                  disabled={editLessonMutation.isPending}
                  data-testid="button-save-lesson"
                >
                  {editLessonMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
