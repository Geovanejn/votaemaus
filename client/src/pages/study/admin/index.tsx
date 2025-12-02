import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Upload,
  BookOpen,
  FileText,
  Plus,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Loader2,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Play,
  Settings,
  BarChart3,
  Users,
  Zap,
  Target,
  RefreshCw,
  Brain,
  ListChecks,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

interface StudyWeek {
  id: number;
  weekNumber: number;
  year: number;
  title: string;
  description: string | null;
  pdfUrl: string | null;
  status: string;
  publishedAt: string | null;
  createdBy: number | null;
  aiMetadata: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StudyLesson {
  id: number;
  studyWeekId: number;
  orderIndex: number;
  title: string;
  type: string;
  description: string | null;
  xpReward: number;
  estimatedMinutes: number;
  icon: string | null;
  isBonus: boolean;
  unitsCount?: number;
}

interface StudyUnit {
  id: number;
  lessonId: number;
  orderIndex: number;
  type: string;
  content: any;
  xpValue: number;
  createdAt: string;
}

interface StudyStats {
  totalUsers: number;
  activeUsers: number;
  totalLessons: number;
  completedLessons: number;
  totalXpEarned: number;
  averageStreak: number;
}

interface AIStatus {
  configured: boolean;
  message: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  archived: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  processing: "Processando",
  published: "Publicado",
  archived: "Arquivado",
};

const lessonTypeLabels: Record<string, string> = {
  intro: "Introducao",
  study: "Estudo",
  meditation: "Meditacao",
  challenge: "Desafio",
  review: "Revisao",
};

const unitTypeLabels: Record<string, string> = {
  text: "Texto",
  multiple_choice: "Multipla Escolha",
  true_false: "Verdadeiro/Falso",
  fill_blank: "Preencher Lacuna",
  meditation: "Meditacao",
  reflection: "Reflexao",
  verse: "Versiculo",
};

export default function StudyAdminPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isCreateWeekOpen, setIsCreateWeekOpen] = useState(false);
  const [isEditLessonOpen, setIsEditLessonOpen] = useState(false);
  const [isEditUnitOpen, setIsEditUnitOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number; name: string } | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<StudyWeek | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<StudyLesson | null>(null);
  const [editingLesson, setEditingLesson] = useState<StudyLesson | null>(null);
  const [editingUnit, setEditingUnit] = useState<StudyUnit | null>(null);
  const [viewingUnits, setViewingUnits] = useState(false);
  
  const [newWeek, setNewWeek] = useState({
    title: "",
    description: "",
    weekNumber: 1,
    year: new Date().getFullYear(),
  });

  const [generateInput, setGenerateInput] = useState({
    text: "",
    weekNumber: 1,
    year: new Date().getFullYear(),
  });

  const [lessonForm, setLessonForm] = useState({
    title: "",
    type: "study",
    description: "",
    xpReward: 10,
    estimatedMinutes: 5,
    isBonus: false,
  });

  const [unitForm, setUnitForm] = useState({
    type: "multiple_choice",
    xpValue: 5,
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
    text: "",
    title: "",
  });

  const { data: weeks = [], isLoading: loadingWeeks } = useQuery<StudyWeek[]>({
    queryKey: ["/api/study/admin/weeks"],
    staleTime: 30000,
    enabled: !!user?.isAdmin,
  });

  const { data: stats } = useQuery<StudyStats>({
    queryKey: ["/api/study/admin/stats"],
    staleTime: 60000,
    enabled: !!user?.isAdmin,
  });

  const { data: lessons = [], isLoading: loadingLessons } = useQuery<StudyLesson[]>({
    queryKey: ["/api/study/admin/lessons", selectedWeek?.id],
    enabled: !!selectedWeek && !!user?.isAdmin,
    staleTime: 30000,
  });

  const { data: units = [], isLoading: loadingUnits } = useQuery<StudyUnit[]>({
    queryKey: ["/api/study/admin/lessons", selectedLesson?.id, "units"],
    enabled: !!selectedLesson && viewingUnits && !!user?.isAdmin,
    staleTime: 30000,
  });

  const { data: aiStatus } = useQuery<AIStatus>({
    queryKey: ["/api/ai/status"],
    staleTime: 60000,
    enabled: !!user?.isAdmin,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    setLocation("/");
    return null;
  }

  const createWeekMutation = useMutation({
    mutationFn: async (data: typeof newWeek) => {
      return apiRequest("POST", "/api/study/admin/weeks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/weeks"] });
      setIsCreateWeekOpen(false);
      setNewWeek({ title: "", description: "", weekNumber: weeks.length + 1, year: new Date().getFullYear() });
      toast({ title: "Semana criada", description: "A nova semana de estudo foi criada com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar semana", description: error.message, variant: "destructive" });
    },
  });

  const publishWeekMutation = useMutation({
    mutationFn: async (weekId: number) => {
      return apiRequest("POST", `/api/study/admin/weeks/${weekId}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/weeks"] });
      toast({ title: "Semana publicada", description: "O conteudo esta disponivel para os usuarios." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao publicar", description: error.message, variant: "destructive" });
    },
  });

  const deleteWeekMutation = useMutation({
    mutationFn: async (weekId: number) => {
      return apiRequest("DELETE", `/api/study/admin/weeks/${weekId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/weeks"] });
      setSelectedWeek(null);
      toast({ title: "Semana excluida", description: "A semana foi excluida com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });

  const generateWithAIMutation = useMutation({
    mutationFn: async (data: typeof generateInput) => {
      return apiRequest("POST", "/api/ai/create-week-with-content", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/weeks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/stats"] });
      setIsGenerateDialogOpen(false);
      setGenerateInput({ text: "", weekNumber: weeks.length + 1, year: new Date().getFullYear() });
      toast({ title: "Conteudo gerado com IA", description: "A semana foi criada com licoes e exercicios automaticamente." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao gerar conteudo", description: error.message, variant: "destructive" });
    },
  });

  const seedDataMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/study/seed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/weeks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/stats"] });
      toast({ title: "Dados carregados", description: "Os dados de exemplo foram criados com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/study/admin/lessons", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/lessons", selectedWeek?.id] });
      setIsEditLessonOpen(false);
      setLessonForm({ title: "", type: "study", description: "", xpReward: 10, estimatedMinutes: 5, isBonus: false });
      toast({ title: "Licao criada", description: "A licao foi adicionada com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar licao", description: error.message, variant: "destructive" });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest("PUT", `/api/study/admin/lessons/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/lessons", selectedWeek?.id] });
      setIsEditLessonOpen(false);
      setEditingLesson(null);
      toast({ title: "Licao atualizada", description: "As alteracoes foram salvas." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      return apiRequest("DELETE", `/api/study/admin/lessons/${lessonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/lessons", selectedWeek?.id] });
      setSelectedLesson(null);
      setViewingUnits(false);
      toast({ title: "Licao excluida", description: "A licao foi removida com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/study/admin/units", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/lessons", selectedLesson?.id, "units"] });
      setIsEditUnitOpen(false);
      resetUnitForm();
      toast({ title: "Exercicio criado", description: "O exercicio foi adicionado com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar exercicio", description: error.message, variant: "destructive" });
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest("PUT", `/api/study/admin/units/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/lessons", selectedLesson?.id, "units"] });
      setIsEditUnitOpen(false);
      setEditingUnit(null);
      resetUnitForm();
      toast({ title: "Exercicio atualizado", description: "As alteracoes foram salvas." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: async (unitId: number) => {
      return apiRequest("DELETE", `/api/study/admin/units/${unitId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/lessons", selectedLesson?.id, "units"] });
      toast({ title: "Exercicio excluido", description: "O exercicio foi removido com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });

  const resetUnitForm = () => {
    setUnitForm({
      type: "multiple_choice",
      xpValue: 5,
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
      text: "",
      title: "",
    });
  };

  const openEditLesson = (lesson: StudyLesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      type: lesson.type,
      description: lesson.description || "",
      xpReward: lesson.xpReward,
      estimatedMinutes: lesson.estimatedMinutes,
      isBonus: lesson.isBonus,
    });
    setIsEditLessonOpen(true);
  };

  const openEditUnit = (unit: StudyUnit) => {
    setEditingUnit(unit);
    const content = unit.content;
    setUnitForm({
      type: unit.type,
      xpValue: unit.xpValue,
      question: content.question || "",
      options: content.options || ["", "", "", ""],
      correctAnswer: content.correctAnswer ?? 0,
      explanation: content.explanation || "",
      text: content.text || "",
      title: content.title || "",
    });
    setIsEditUnitOpen(true);
  };

  const handleSaveLesson = () => {
    if (editingLesson) {
      updateLessonMutation.mutate({ id: editingLesson.id, ...lessonForm });
    } else if (selectedWeek) {
      createLessonMutation.mutate({ studyWeekId: selectedWeek.id, ...lessonForm });
    }
  };

  const handleSaveUnit = () => {
    let content: any = {};
    
    if (unitForm.type === "text") {
      content = { title: unitForm.title, text: unitForm.text };
    } else if (unitForm.type === "multiple_choice") {
      content = {
        question: unitForm.question,
        options: unitForm.options.filter(o => o.trim()),
        correctAnswer: unitForm.correctAnswer,
        explanation: unitForm.explanation,
      };
    } else if (unitForm.type === "true_false") {
      content = {
        question: unitForm.question,
        correctAnswer: unitForm.correctAnswer === 1,
        explanation: unitForm.explanation,
      };
    } else if (unitForm.type === "fill_blank") {
      content = {
        question: unitForm.question,
        correctAnswer: unitForm.text,
        explanation: unitForm.explanation,
      };
    } else if (unitForm.type === "reflection") {
      content = { title: unitForm.title, reflectionPrompt: unitForm.question };
    } else if (unitForm.type === "verse") {
      content = { verseReference: unitForm.title, verseText: unitForm.text, reflectionPrompt: unitForm.question };
    } else if (unitForm.type === "meditation") {
      content = { title: unitForm.title, meditationDuration: 60, meditationGuide: unitForm.text };
    }

    if (editingUnit) {
      updateUnitMutation.mutate({ id: editingUnit.id, type: unitForm.type, content, xpValue: unitForm.xpValue });
    } else if (selectedLesson) {
      createUnitMutation.mutate({ lessonId: selectedLesson.id, type: unitForm.type, content, xpValue: unitForm.xpValue });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "week") {
      deleteWeekMutation.mutate(deleteTarget.id);
    } else if (deleteTarget.type === "lesson") {
      deleteLessonMutation.mutate(deleteTarget.id);
    } else if (deleteTarget.type === "unit") {
      deleteUnitMutation.mutate(deleteTarget.id);
    }
    setIsDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const confirmDelete = (type: string, id: number, name: string) => {
    setDeleteTarget({ type, id, name });
    setIsDeleteDialogOpen(true);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-l-4 border-l-[#58CC02]">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios Ativos</CardTitle>
              <Users className="h-4 w-4 text-[#58CC02]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
              <p className="text-xs text-muted-foreground">de {stats?.totalUsers || 0} registrados</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-l-4 border-l-[#FFC800]">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">XP Total</CardTitle>
              <Zap className="h-4 w-4 text-[#FFC800]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalXpEarned?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">pontos distribuidos</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-l-4 border-l-[#1CB0F6]">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Licoes Completas</CardTitle>
              <Target className="h-4 w-4 text-[#1CB0F6]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedLessons || 0}</div>
              <p className="text-xs text-muted-foreground">de {stats?.totalLessons || 0} disponiveis</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-l-4 border-l-[#FF9600]">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Media Ofensiva</CardTitle>
              <BarChart3 className="h-4 w-4 text-[#FF9600]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageStreak?.toFixed(1) || 0}</div>
              <p className="text-xs text-muted-foreground">dias consecutivos</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Acoes Rapidas
            </CardTitle>
            <CardDescription>Gerencie o conteudo do sistema de estudos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" onClick={() => setIsGenerateDialogOpen(true)} data-testid="button-generate-ai">
              <Sparkles className="w-4 h-4 mr-2 text-[#FFA500]" />
              Gerar Conteudo com IA
              {aiStatus?.configured && <Badge className="ml-auto bg-green-100 text-green-800">IA Pronta</Badge>}
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => setIsCreateWeekOpen(true)} data-testid="button-create-week">
              <Plus className="w-4 h-4 mr-2" />
              Criar Nova Semana Manualmente
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => seedDataMutation.mutate()} disabled={seedDataMutation.isPending} data-testid="button-seed-data">
              {seedDataMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Carregar Dados de Exemplo
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => setLocation("/study")} data-testid="button-view-study">
              <Eye className="w-4 h-4 mr-2" />
              Visualizar Sistema
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Semanas Recentes
            </CardTitle>
            <CardDescription>Ultimas semanas de estudo criadas</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingWeeks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : weeks.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Nenhuma semana criada ainda</p>
                <Button className="mt-4" size="sm" onClick={() => setIsCreateWeekOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Semana
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {weeks.slice(0, 3).map((week) => (
                  <div
                    key={week.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover-elevate cursor-pointer"
                    onClick={() => { setSelectedWeek(week); setActiveTab("weeks"); }}
                    data-testid={`week-item-${week.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{week.title}</p>
                        <p className="text-xs text-muted-foreground">Semana {week.weekNumber} - {week.year}</p>
                      </div>
                    </div>
                    <Badge className={statusColors[week.status]}>{statusLabels[week.status]}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderWeeks = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold">Semanas de Estudo</h2>
          <p className="text-sm text-muted-foreground">Gerencie o conteudo semanal</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setIsGenerateDialogOpen(true)} data-testid="button-generate-week">
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar com IA
          </Button>
          <Button onClick={() => setIsCreateWeekOpen(true)} data-testid="button-new-week">
            <Plus className="w-4 h-4 mr-2" />
            Nova Semana
          </Button>
        </div>
      </div>

      {loadingWeeks ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : weeks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Nenhuma semana criada</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              Comece gerando conteudo com IA ou crie uma semana manualmente.
            </p>
            <div className="flex gap-3 mt-6 flex-wrap">
              <Button onClick={() => setIsGenerateDialogOpen(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar com IA
              </Button>
              <Button variant="outline" onClick={() => setIsCreateWeekOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Manualmente
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {weeks.map((week, index) => (
              <motion.div key={week.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: index * 0.1 }}>
                <Card className="overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-[#FFA500] to-[#FFB733]" />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{week.title}</CardTitle>
                        <CardDescription>Semana {week.weekNumber} - {week.year}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`week-menu-${week.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedWeek(week); setViewingUnits(false); }}>
                            <Settings className="w-4 h-4 mr-2" />
                            Gerenciar Licoes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation(`/study`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          {week.status === "draft" && (
                            <DropdownMenuItem onClick={() => publishWeekMutation.mutate(week.id)} className="text-green-600">
                              <Play className="w-4 h-4 mr-2" />
                              Publicar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => confirmDelete("week", week.id, week.title)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{week.description || "Sem descricao"}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={statusColors[week.status]}>{statusLabels[week.status]}</Badge>
                      {week.aiMetadata && <Badge variant="outline"><Brain className="w-3 h-3 mr-1" />IA</Badge>}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/30 px-4 py-3">
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => { setSelectedWeek(week); setViewingUnits(false); }} data-testid={`manage-lessons-${week.id}`}>
                      <Settings className="w-4 h-4 mr-2" />
                      Gerenciar Licoes
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );

  const renderLessons = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => { setSelectedWeek(null); setViewingUnits(false); setSelectedLesson(null); }} data-testid="button-back-weeks">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold truncate">{selectedWeek?.title}</h2>
          <p className="text-sm text-muted-foreground">Semana {selectedWeek?.weekNumber} - {selectedWeek?.year}</p>
        </div>
        <Button onClick={() => { setEditingLesson(null); setLessonForm({ title: "", type: "study", description: "", xpReward: 10, estimatedMinutes: 5, isBonus: false }); setIsEditLessonOpen(true); }} data-testid="button-add-lesson">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Licao
        </Button>
      </div>

      {loadingLessons ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : lessons.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Nenhuma licao ainda</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">Adicione licoes manualmente ou use IA para gerar conteudo.</p>
            <Button className="mt-6" onClick={() => { setEditingLesson(null); setIsEditLessonOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Licao
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <motion.div key={lesson.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="hover-elevate">
                <CardContent className="flex items-center gap-4 p-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{
                      background: lesson.isBonus ? 'linear-gradient(135deg, #FF9600 0%, #FFB020 100%)' : 'linear-gradient(135deg, #58CC02 0%, #7BD937 100%)',
                      boxShadow: lesson.isBonus ? '0 4px 0 0 #CC7700' : '0 4px 0 0 #46A302',
                    }}
                  >
                    {lesson.orderIndex + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium truncate">{lesson.title}</h3>
                      {lesson.isBonus && <Badge className="bg-[#FF9600] text-white">Bonus</Badge>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lesson.estimatedMinutes} min</span>
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-[#FFC800]" />{lesson.xpReward} XP</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{lessonTypeLabels[lesson.type] || lesson.type}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedLesson(lesson); setViewingUnits(true); }} data-testid={`view-units-${lesson.id}`}>
                      <ListChecks className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditLesson(lesson)} data-testid={`edit-lesson-${lesson.id}`}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmDelete("lesson", lesson.id, lesson.title)} data-testid={`delete-lesson-${lesson.id}`}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderUnits = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => { setViewingUnits(false); setSelectedLesson(null); }} data-testid="button-back-lessons">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{selectedWeek?.title}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-semibold truncate">{selectedLesson?.title}</h2>
        </div>
        <Button onClick={() => { setEditingUnit(null); resetUnitForm(); setIsEditUnitOpen(true); }} data-testid="button-add-unit">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Exercicio
        </Button>
      </div>

      {loadingUnits ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : units.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ListChecks className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Nenhum exercicio ainda</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">Adicione exercicios para esta licao.</p>
            <Button className="mt-6" onClick={() => { setEditingUnit(null); resetUnitForm(); setIsEditUnitOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Exercicio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {units.map((unit, index) => (
            <motion.div key={unit.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="hover-elevate">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                    {unit.orderIndex + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{unitTypeLabels[unit.type] || unit.type}</Badge>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Zap className="w-3 h-3 text-[#FFC800]" />{unit.xpValue} XP
                      </span>
                    </div>
                    <p className="text-sm mt-1 truncate text-muted-foreground">
                      {unit.content.question || unit.content.title || unit.content.text?.substring(0, 50) || "Conteudo"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditUnit(unit)} data-testid={`edit-unit-${unit.id}`}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmDelete("unit", unit.id, `Exercicio ${unit.orderIndex + 1}`)} data-testid={`delete-unit-${unit.id}`}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderUnitFormFields = () => {
    switch (unitForm.type) {
      case "text":
        return (
          <>
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input value={unitForm.title} onChange={(e) => setUnitForm({ ...unitForm, title: e.target.value })} placeholder="Titulo do texto" data-testid="input-unit-title" />
            </div>
            <div className="space-y-2">
              <Label>Texto</Label>
              <Textarea value={unitForm.text} onChange={(e) => setUnitForm({ ...unitForm, text: e.target.value })} placeholder="Conteudo do texto..." rows={4} data-testid="input-unit-text" />
            </div>
          </>
        );
      case "multiple_choice":
        return (
          <>
            <div className="space-y-2">
              <Label>Pergunta</Label>
              <Textarea value={unitForm.question} onChange={(e) => setUnitForm({ ...unitForm, question: e.target.value })} placeholder="Digite a pergunta..." data-testid="input-unit-question" />
            </div>
            <div className="space-y-2">
              <Label>Opcoes</Label>
              {unitForm.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={opt} onChange={(e) => { const opts = [...unitForm.options]; opts[i] = e.target.value; setUnitForm({ ...unitForm, options: opts }); }} placeholder={`Opcao ${i + 1}`} data-testid={`input-unit-option-${i}`} />
                  <Button type="button" variant={unitForm.correctAnswer === i ? "default" : "outline"} size="sm" onClick={() => setUnitForm({ ...unitForm, correctAnswer: i })} data-testid={`button-correct-${i}`}>
                    {unitForm.correctAnswer === i ? <CheckCircle2 className="w-4 h-4" /> : "Correta"}
                  </Button>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Explicacao</Label>
              <Textarea value={unitForm.explanation} onChange={(e) => setUnitForm({ ...unitForm, explanation: e.target.value })} placeholder="Explicacao da resposta..." data-testid="input-unit-explanation" />
            </div>
          </>
        );
      case "true_false":
        return (
          <>
            <div className="space-y-2">
              <Label>Afirmacao</Label>
              <Textarea value={unitForm.question} onChange={(e) => setUnitForm({ ...unitForm, question: e.target.value })} placeholder="Digite a afirmacao..." data-testid="input-unit-statement" />
            </div>
            <div className="space-y-2">
              <Label>Resposta Correta</Label>
              <Select value={unitForm.correctAnswer.toString()} onValueChange={(v) => setUnitForm({ ...unitForm, correctAnswer: parseInt(v) })}>
                <SelectTrigger data-testid="select-unit-correct">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Verdadeiro</SelectItem>
                  <SelectItem value="0">Falso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Explicacao</Label>
              <Textarea value={unitForm.explanation} onChange={(e) => setUnitForm({ ...unitForm, explanation: e.target.value })} placeholder="Explicacao..." data-testid="input-unit-explanation" />
            </div>
          </>
        );
      case "fill_blank":
        return (
          <>
            <div className="space-y-2">
              <Label>Frase (use ___ para a lacuna)</Label>
              <Textarea value={unitForm.question} onChange={(e) => setUnitForm({ ...unitForm, question: e.target.value })} placeholder="Complete: A fe e a certeza daquilo que ___" data-testid="input-unit-sentence" />
            </div>
            <div className="space-y-2">
              <Label>Resposta Correta</Label>
              <Input value={unitForm.text} onChange={(e) => setUnitForm({ ...unitForm, text: e.target.value })} placeholder="esperamos" data-testid="input-unit-answer" />
            </div>
            <div className="space-y-2">
              <Label>Explicacao</Label>
              <Textarea value={unitForm.explanation} onChange={(e) => setUnitForm({ ...unitForm, explanation: e.target.value })} placeholder="Explicacao..." data-testid="input-unit-explanation" />
            </div>
          </>
        );
      case "reflection":
        return (
          <>
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input value={unitForm.title} onChange={(e) => setUnitForm({ ...unitForm, title: e.target.value })} placeholder="Titulo da reflexao" data-testid="input-unit-title" />
            </div>
            <div className="space-y-2">
              <Label>Pergunta de Reflexao</Label>
              <Textarea value={unitForm.question} onChange={(e) => setUnitForm({ ...unitForm, question: e.target.value })} placeholder="O que esse versiculo significa para voce?" data-testid="input-unit-prompt" />
            </div>
          </>
        );
      case "verse":
        return (
          <>
            <div className="space-y-2">
              <Label>Referencia</Label>
              <Input value={unitForm.title} onChange={(e) => setUnitForm({ ...unitForm, title: e.target.value })} placeholder="Joao 3:16" data-testid="input-unit-reference" />
            </div>
            <div className="space-y-2">
              <Label>Texto do Versiculo</Label>
              <Textarea value={unitForm.text} onChange={(e) => setUnitForm({ ...unitForm, text: e.target.value })} placeholder="Porque Deus amou o mundo..." data-testid="input-unit-verse-text" />
            </div>
            <div className="space-y-2">
              <Label>Pergunta de Reflexao (opcional)</Label>
              <Textarea value={unitForm.question} onChange={(e) => setUnitForm({ ...unitForm, question: e.target.value })} placeholder="Como aplicar isso na sua vida?" data-testid="input-unit-prompt" />
            </div>
          </>
        );
      case "meditation":
        return (
          <>
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input value={unitForm.title} onChange={(e) => setUnitForm({ ...unitForm, title: e.target.value })} placeholder="Momento de Reflexao" data-testid="input-unit-title" />
            </div>
            <div className="space-y-2">
              <Label>Instrucoes da Meditacao</Label>
              <Textarea value={unitForm.text} onChange={(e) => setUnitForm({ ...unitForm, text: e.target.value })} placeholder="Feche os olhos e respire profundamente..." rows={4} data-testid="input-unit-guide" />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="h-2 bg-gradient-to-r from-[#FFA500] to-[#FFB733]" />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")} data-testid="button-back-admin">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Sistema de Estudos</h1>
              <p className="text-sm text-muted-foreground">Painel Administrativo</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setLocation("/study")} data-testid="button-preview-study">
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
        </div>

        {viewingUnits && selectedLesson ? (
          renderUnits()
        ) : selectedWeek ? (
          renderLessons()
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="overview" data-testid="tab-overview">Visao Geral</TabsTrigger>
              <TabsTrigger value="weeks" data-testid="tab-weeks">Semanas</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">{renderOverview()}</TabsContent>
            <TabsContent value="weeks">{renderWeeks()}</TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={isCreateWeekOpen} onOpenChange={setIsCreateWeekOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Semana de Estudo</DialogTitle>
            <DialogDescription>Crie uma nova semana para adicionar licoes e exercicios.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="week-title">Titulo</Label>
              <Input id="week-title" placeholder="Ex: Nao Jogue Sua Vida Fora" value={newWeek.title} onChange={(e) => setNewWeek({ ...newWeek, title: e.target.value })} data-testid="input-week-title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="week-description">Descricao</Label>
              <Textarea id="week-description" placeholder="Descreva o tema desta semana..." value={newWeek.description} onChange={(e) => setNewWeek({ ...newWeek, description: e.target.value })} data-testid="input-week-description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="week-number">Numero da Semana</Label>
                <Input id="week-number" type="number" min={1} value={newWeek.weekNumber} onChange={(e) => setNewWeek({ ...newWeek, weekNumber: parseInt(e.target.value) })} data-testid="input-week-number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="week-year">Ano</Label>
                <Input id="week-year" type="number" value={newWeek.year} onChange={(e) => setNewWeek({ ...newWeek, year: parseInt(e.target.value) })} data-testid="input-week-year" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateWeekOpen(false)}>Cancelar</Button>
            <Button onClick={() => createWeekMutation.mutate(newWeek)} disabled={!newWeek.title || createWeekMutation.isPending} data-testid="button-confirm-create-week">
              {createWeekMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Criar Semana
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#FFA500]" />
              Gerar Conteudo com IA
            </DialogTitle>
            <DialogDescription>Cole o texto da revista ou devocional e nossa IA ira gerar licoes e exercicios automaticamente.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 py-4">
            <div className="space-y-4 pr-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {aiStatus?.configured ? (
                    <><CheckCircle2 className="w-4 h-4 text-green-500" /><span className="text-sm font-medium text-green-700">IA Configurada</span></>
                  ) : (
                    <><Loader2 className="w-4 h-4 text-orange-500" /><span className="text-sm font-medium text-orange-700">Configurando IA...</span></>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{aiStatus?.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Numero da Semana</Label>
                  <Input type="number" min={1} value={generateInput.weekNumber} onChange={(e) => setGenerateInput({ ...generateInput, weekNumber: parseInt(e.target.value) })} data-testid="input-generate-week" />
                </div>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Input type="number" value={generateInput.year} onChange={(e) => setGenerateInput({ ...generateInput, year: parseInt(e.target.value) })} data-testid="input-generate-year" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Texto Base</Label>
                <Textarea
                  placeholder="Cole aqui o texto da revista, devocional ou conteudo que deseja transformar em licoes..."
                  value={generateInput.text}
                  onChange={(e) => setGenerateInput({ ...generateInput, text: e.target.value })}
                  rows={12}
                  data-testid="input-generate-text"
                />
                <p className="text-xs text-muted-foreground">Minimo de 100 caracteres. Quanto mais conteudo, mais licoes serao geradas.</p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-sm mb-2">O que a IA ira fazer:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Extrair titulo e tema principal</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Criar 3-5 licoes estruturadas</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Gerar exercicios variados (multipla escolha, V/F, lacunas)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Adicionar versiculos e reflexoes</li>
                </ul>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => generateWithAIMutation.mutate(generateInput)}
              disabled={!aiStatus?.configured || generateInput.text.length < 100 || generateWithAIMutation.isPending}
              data-testid="button-generate-content"
            >
              {generateWithAIMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</> : <><Sparkles className="w-4 h-4 mr-2" />Gerar Conteudo</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditLessonOpen} onOpenChange={setIsEditLessonOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Editar Licao" : "Nova Licao"}</DialogTitle>
            <DialogDescription>{editingLesson ? "Atualize os dados da licao." : "Adicione uma nova licao a esta semana."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="Titulo da licao" data-testid="input-lesson-title" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={lessonForm.type} onValueChange={(v) => setLessonForm({ ...lessonForm, type: v })}>
                <SelectTrigger data-testid="select-lesson-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="intro">Introducao</SelectItem>
                  <SelectItem value="study">Estudo</SelectItem>
                  <SelectItem value="meditation">Meditacao</SelectItem>
                  <SelectItem value="challenge">Desafio</SelectItem>
                  <SelectItem value="review">Revisao</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} placeholder="Descricao breve..." data-testid="input-lesson-description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>XP</Label>
                <Input type="number" min={1} value={lessonForm.xpReward} onChange={(e) => setLessonForm({ ...lessonForm, xpReward: parseInt(e.target.value) })} data-testid="input-lesson-xp" />
              </div>
              <div className="space-y-2">
                <Label>Minutos</Label>
                <Input type="number" min={1} value={lessonForm.estimatedMinutes} onChange={(e) => setLessonForm({ ...lessonForm, estimatedMinutes: parseInt(e.target.value) })} data-testid="input-lesson-minutes" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={lessonForm.isBonus} onCheckedChange={(v) => setLessonForm({ ...lessonForm, isBonus: v })} data-testid="switch-lesson-bonus" />
              <Label>Licao Bonus</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditLessonOpen(false); setEditingLesson(null); }}>Cancelar</Button>
            <Button onClick={handleSaveLesson} disabled={!lessonForm.title || createLessonMutation.isPending || updateLessonMutation.isPending} data-testid="button-save-lesson">
              {(createLessonMutation.isPending || updateLessonMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingLesson ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditUnitOpen} onOpenChange={setIsEditUnitOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingUnit ? "Editar Exercicio" : "Novo Exercicio"}</DialogTitle>
            <DialogDescription>{editingUnit ? "Atualize os dados do exercicio." : "Adicione um novo exercicio a esta licao."}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 py-4">
            <div className="space-y-4 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={unitForm.type} onValueChange={(v) => setUnitForm({ ...unitForm, type: v })}>
                    <SelectTrigger data-testid="select-unit-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="multiple_choice">Multipla Escolha</SelectItem>
                      <SelectItem value="true_false">Verdadeiro/Falso</SelectItem>
                      <SelectItem value="fill_blank">Preencher Lacuna</SelectItem>
                      <SelectItem value="reflection">Reflexao</SelectItem>
                      <SelectItem value="verse">Versiculo</SelectItem>
                      <SelectItem value="meditation">Meditacao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>XP</Label>
                  <Input type="number" min={1} value={unitForm.xpValue} onChange={(e) => setUnitForm({ ...unitForm, xpValue: parseInt(e.target.value) })} data-testid="input-unit-xp" />
                </div>
              </div>
              {renderUnitFormFields()}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditUnitOpen(false); setEditingUnit(null); resetUnitForm(); }}>Cancelar</Button>
            <Button onClick={handleSaveUnit} disabled={createUnitMutation.isPending || updateUnitMutation.isPending} data-testid="button-save-unit">
              {(createUnitMutation.isPending || updateUnitMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingUnit ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.name}"? Esta acao nao pode ser desfeita.
              {deleteTarget?.type === "week" && " Todas as licoes e exercicios desta semana serao excluidos."}
              {deleteTarget?.type === "lesson" && " Todos os exercicios desta licao serao excluidos."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
