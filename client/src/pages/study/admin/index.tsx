import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  ArrowLeft,
  Upload,
  BookOpen,
  FileText,
  Plus,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Play,
  Pause,
  Settings,
  BarChart3,
  Users,
  Zap,
  Target,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

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

interface StudyStats {
  totalUsers: number;
  activeUsers: number;
  totalLessons: number;
  completedLessons: number;
  totalXpEarned: number;
  averageStreak: number;
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

export default function StudyAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateWeekOpen, setIsCreateWeekOpen] = useState(false);
  const [isEditLessonOpen, setIsEditLessonOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<StudyWeek | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<StudyLesson | null>(null);
  const [newWeek, setNewWeek] = useState({
    title: "",
    description: "",
    weekNumber: 1,
    year: new Date().getFullYear(),
  });

  const { data: weeks = [], isLoading: loadingWeeks } = useQuery<StudyWeek[]>({
    queryKey: ["/api/study/admin/weeks"],
    staleTime: 30000,
  });

  const { data: stats } = useQuery<StudyStats>({
    queryKey: ["/api/study/admin/stats"],
    staleTime: 60000,
  });

  const { data: lessons = [], isLoading: loadingLessons } = useQuery<StudyLesson[]>({
    queryKey: ["/api/study/admin/lessons", selectedWeek?.id],
    enabled: !!selectedWeek,
    staleTime: 30000,
  });

  const createWeekMutation = useMutation({
    mutationFn: async (data: typeof newWeek) => {
      return apiRequest("POST", "/api/study/admin/weeks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/weeks"] });
      setIsCreateWeekOpen(false);
      setNewWeek({
        title: "",
        description: "",
        weekNumber: weeks.length + 1,
        year: new Date().getFullYear(),
      });
      toast({
        title: "Semana criada",
        description: "A nova semana de estudo foi criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar semana",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const publishWeekMutation = useMutation({
    mutationFn: async (weekId: number) => {
      return apiRequest("POST", `/api/study/admin/weeks/${weekId}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/weeks"] });
      toast({
        title: "Semana publicada",
        description: "O conteudo esta disponivel para os usuarios.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao publicar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const seedDataMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/study/seed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/weeks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/admin/stats"] });
      toast({
        title: "Dados carregados",
        description: "Os dados de exemplo foram criados com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-[#58CC02]">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Usuarios Ativos
              </CardTitle>
              <Users className="h-4 w-4 text-[#58CC02]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                de {stats?.totalUsers || 0} registrados
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-l-4 border-l-[#FFC800]">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                XP Total
              </CardTitle>
              <Zap className="h-4 w-4 text-[#FFC800]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalXpEarned?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                pontos distribuidos
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-l-4 border-l-[#1CB0F6]">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Licoes Completas
              </CardTitle>
              <Target className="h-4 w-4 text-[#1CB0F6]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedLessons || 0}</div>
              <p className="text-xs text-muted-foreground">
                de {stats?.totalLessons || 0} disponiveis
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-l-4 border-l-[#FF9600]">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Media Ofensiva
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-[#FF9600]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageStreak?.toFixed(1) || 0}</div>
              <p className="text-xs text-muted-foreground">
                dias consecutivos
              </p>
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
            <CardDescription>
              Gerencie o conteudo do sistema de estudos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => setIsCreateWeekOpen(true)}
              data-testid="button-create-week"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Nova Semana
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => setIsUploadDialogOpen(true)}
              data-testid="button-upload-pdf"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload de PDF (IA)
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => seedDataMutation.mutate()}
              disabled={seedDataMutation.isPending}
              data-testid="button-seed-data"
            >
              {seedDataMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Carregar Dados de Exemplo
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => setLocation("/study")}
              data-testid="button-view-study"
            >
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
            <CardDescription>
              Ultimas semanas de estudo criadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingWeeks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : weeks.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Nenhuma semana criada ainda
                </p>
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => setIsCreateWeekOpen(true)}
                >
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
                    onClick={() => {
                      setSelectedWeek(week);
                      setActiveTab("weeks");
                    }}
                    data-testid={`week-item-${week.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{week.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Semana {week.weekNumber} - {week.year}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusColors[week.status]}>
                      {statusLabels[week.status]}
                    </Badge>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Semanas de Estudo</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie o conteudo semanal
          </p>
        </div>
        <Button onClick={() => setIsCreateWeekOpen(true)} data-testid="button-new-week">
          <Plus className="w-4 h-4 mr-2" />
          Nova Semana
        </Button>
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
              Comece criando sua primeira semana de estudo ou faca upload de um PDF para gerar conteudo automaticamente.
            </p>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setIsCreateWeekOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Manualmente
              </Button>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {weeks.map((week, index) => (
              <motion.div
                key={week.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover-elevate overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-[#FFA500] to-[#FFB733]" />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">{week.title}</CardTitle>
                        <CardDescription>
                          Semana {week.weekNumber} - {week.year}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`week-menu-${week.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedWeek(week)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation(`/study-preview`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          {week.status === "draft" && (
                            <DropdownMenuItem 
                              onClick={() => publishWeekMutation.mutate(week.id)}
                              className="text-green-600"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Publicar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {week.description || "Sem descricao"}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={statusColors[week.status]}>
                        {statusLabels[week.status]}
                      </Badge>
                      {week.pdfUrl && (
                        <Badge variant="outline">
                          <FileText className="w-3 h-3 mr-1" />
                          PDF
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/30 px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedWeek(week)}
                      data-testid={`manage-lessons-${week.id}`}
                    >
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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedWeek(null)}
          data-testid="button-back-weeks"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{selectedWeek?.title}</h2>
          <p className="text-sm text-muted-foreground">
            Semana {selectedWeek?.weekNumber} - {selectedWeek?.year}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {lessons.length} licoes nesta semana
          </p>
        </div>
        <Button onClick={() => setIsEditLessonOpen(true)} data-testid="button-add-lesson">
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
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              Adicione licoes manualmente ou use IA para extrair de um PDF.
            </p>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setIsEditLessonOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Licao
              </Button>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar com IA
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover-elevate">
                <CardContent className="flex items-center gap-4 p-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{
                      background: lesson.isBonus 
                        ? 'linear-gradient(135deg, #FF9600 0%, #FFB020 100%)'
                        : 'linear-gradient(135deg, #58CC02 0%, #7BD937 100%)',
                      boxShadow: lesson.isBonus 
                        ? '0 4px 0 0 #CC7700'
                        : '0 4px 0 0 #46A302',
                    }}
                  >
                    {lesson.orderIndex}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{lesson.title}</h3>
                      {lesson.isBonus && (
                        <Badge className="bg-[#FF9600] text-white">Bonus</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lesson.estimatedMinutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-[#FFC800]" />
                        {lesson.xpReward} XP
                      </span>
                      {lesson.unitsCount !== undefined && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {lesson.unitsCount} exercicios
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {lesson.type === 'study' ? 'Estudo' : 
                       lesson.type === 'intro' ? 'Introducao' :
                       lesson.type === 'meditation' ? 'Meditacao' :
                       lesson.type === 'challenge' ? 'Desafio' :
                       lesson.type === 'review' ? 'Revisao' : lesson.type}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setSelectedLesson(lesson)}
                      data-testid={`edit-lesson-${lesson.id}`}
                    >
                      <Edit className="w-4 h-4" />
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

  return (
    <div className="min-h-screen bg-background">
      <div className="h-2 bg-gradient-to-r from-[#FFA500] to-[#FFB733]" />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/admin")}
              data-testid="button-back-admin"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Sistema de Estudos</h1>
              <p className="text-sm text-muted-foreground">
                Painel Administrativo
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/study")}
            data-testid="button-preview-study"
          >
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
        </div>

        {selectedWeek ? (
          renderLessons()
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="overview" data-testid="tab-overview">
                Visao Geral
              </TabsTrigger>
              <TabsTrigger value="weeks" data-testid="tab-weeks">
                Semanas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {renderOverview()}
            </TabsContent>

            <TabsContent value="weeks">
              {renderWeeks()}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={isCreateWeekOpen} onOpenChange={setIsCreateWeekOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Semana de Estudo</DialogTitle>
            <DialogDescription>
              Crie uma nova semana para adicionar licoes e exercicios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="week-title">Titulo</Label>
              <Input
                id="week-title"
                placeholder="Ex: Nao Jogue Sua Vida Fora"
                value={newWeek.title}
                onChange={(e) => setNewWeek({ ...newWeek, title: e.target.value })}
                data-testid="input-week-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="week-description">Descricao</Label>
              <Textarea
                id="week-description"
                placeholder="Descreva o tema desta semana..."
                value={newWeek.description}
                onChange={(e) => setNewWeek({ ...newWeek, description: e.target.value })}
                data-testid="input-week-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="week-number">Numero da Semana</Label>
                <Input
                  id="week-number"
                  type="number"
                  min={1}
                  value={newWeek.weekNumber}
                  onChange={(e) => setNewWeek({ ...newWeek, weekNumber: parseInt(e.target.value) })}
                  data-testid="input-week-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="week-year">Ano</Label>
                <Input
                  id="week-year"
                  type="number"
                  value={newWeek.year}
                  onChange={(e) => setNewWeek({ ...newWeek, year: parseInt(e.target.value) })}
                  data-testid="input-week-year"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateWeekOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createWeekMutation.mutate(newWeek)}
              disabled={!newWeek.title || createWeekMutation.isPending}
              data-testid="button-confirm-create-week"
            >
              {createWeekMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Criar Semana
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#FFA500]" />
              Upload de PDF com IA
            </DialogTitle>
            <DialogDescription>
              Faca upload de uma revista em PDF e nossa IA ira extrair automaticamente as licoes e gerar exercicios.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-sm font-medium">
                Arraste um arquivo PDF aqui
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                ou clique para selecionar
              </p>
              <Input
                type="file"
                accept=".pdf"
                className="hidden"
                id="pdf-upload"
                data-testid="input-pdf-upload"
              />
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => document.getElementById('pdf-upload')?.click()}
              >
                Selecionar Arquivo
              </Button>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium text-sm mb-2">O que a IA ira fazer:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Extrair titulo e subtitulo da revista
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Identificar cada licao automaticamente
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Gerar exercicios de multipla escolha
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Extrair versiculos citados
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancelar
            </Button>
            <Button disabled data-testid="button-process-pdf">
              <Sparkles className="w-4 h-4 mr-2" />
              Processar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
