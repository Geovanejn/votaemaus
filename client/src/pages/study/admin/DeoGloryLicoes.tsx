import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DeoGloryAdminLayout } from "@/components/deoglory/DeoGloryAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Sparkles,
  Edit3,
  Upload,
  ArrowRight,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Calendar,
  BookOpen,
  Brain,
  FileUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Lesson {
  id: number;
  title: string;
  description: string | null;
  category: string;
  type: string;
  status: string;
  views?: number;
  createdAt: string;
}

const categories = [
  { value: "antigo-testamento", label: "Antigo Testamento" },
  { value: "novo-testamento", label: "Novo Testamento" },
  { value: "doutrina", label: "Doutrina" },
  { value: "vida-crista", label: "Vida Crista" },
  { value: "oracao", label: "Oracao" },
];

const categoryColors: Record<string, string> = {
  "antigo-testamento": "bg-amber-100 text-amber-700 border-amber-200",
  "novo-testamento": "bg-blue-100 text-blue-700 border-blue-200",
  "doutrina": "bg-purple-100 text-purple-700 border-purple-200",
  "vida-crista": "bg-green-100 text-green-700 border-green-200",
  "oracao": "bg-pink-100 text-pink-700 border-pink-200",
};

interface CreateOptionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  buttonText: string;
  variant: "primary" | "secondary" | "tertiary";
  onClick: () => void;
}

function CreateOptionCard({ title, description, icon: Icon, buttonText, variant, onClick }: CreateOptionCardProps) {
  const bgClasses = {
    primary: "bg-gradient-to-br from-violet-500 to-violet-700 text-white",
    secondary: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
    tertiary: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
  };

  const iconBgClasses = {
    primary: "bg-white/20",
    secondary: "bg-teal-500",
    tertiary: "bg-teal-500",
  };

  const buttonClasses = {
    primary: "bg-white text-violet-700 hover:bg-white/90",
    secondary: "bg-teal-500 hover:bg-teal-600 text-white",
    tertiary: "bg-teal-500 hover:bg-teal-600 text-white",
  };

  return (
    <Card className={`${bgClasses[variant]} border-0 shadow-sm overflow-hidden`}>
      <CardContent className="p-6">
        <div className={`w-12 h-12 rounded-xl ${iconBgClasses[variant]} flex items-center justify-center mb-4`}>
          <Icon className={`h-6 w-6 ${variant === "primary" ? "text-white" : "text-white"}`} />
        </div>
        <h3 className={`text-lg font-bold mb-2 ${variant === "primary" ? "text-white" : "text-gray-900 dark:text-white"}`}>
          {title}
        </h3>
        <p className={`text-sm mb-6 ${variant === "primary" ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
          {description}
        </p>
        <Button
          className={`w-full ${buttonClasses[variant]}`}
          onClick={onClick}
          data-testid={`button-${title.toLowerCase().replace(/\s/g, "-")}`}
        >
          {buttonText}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DeoGloryLicoes() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"ia" | "manual" | "pdf">("manual");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("recent");

  const [formData, setFormData] = useState({
    revista: "",
    titulo: "",
    categoria: "",
    dataPublicacao: "",
    textoBase: "",
    descricao: "",
    nivelProfundidade: "basico",
    publicoAlvo: "adultos",
    duracaoEstimada: "30",
    incluirPerguntas: false,
    adicionarAplicacoes: false,
  });

  const { data: seasons, isLoading: seasonsLoading } = useQuery<any[]>({
    queryKey: ["/api/study/seasons"],
  });

  const handleCreateOption = (mode: "ia" | "manual" | "pdf") => {
    setFormMode(mode);
    setShowForm(true);
  };

  const sampleLessons: Lesson[] = [
    { id: 1, title: "O Amor de Deus", description: "Licoes Biblicas - 1o Trimestre", category: "antigo-testamento", type: "ia", status: "published", views: 432, createdAt: "2024-01-15" },
    { id: 2, title: "Fe e Obras", description: "Licoes Biblicas - 1o Trimestre", category: "novo-testamento", type: "manual", status: "published", views: 387, createdAt: "2024-01-22" },
    { id: 3, title: "A Graca Divina", description: "Licoes Biblicas - 1o Trimestre", category: "doutrina", type: "pdf", status: "draft", views: 341, createdAt: "2024-01-29" },
  ];

  return (
    <DeoGloryAdminLayout title="Gerenciar Licoes" subtitle="Crie e gerencie licoes de estudo biblico">
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Criar Nova Licao
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CreateOptionCard
              title="Criar com IA"
              description="Use inteligencia artificial para gerar licoes personalizadas baseadas em temas biblicos"
              icon={Sparkles}
              buttonText="Comecar"
              variant="primary"
              onClick={() => handleCreateOption("ia")}
            />
            <CreateOptionCard
              title="Escrever Manualmente"
              description="Crie sua propria licao do zero com total controle sobre o conteudo e estrutura"
              icon={Edit3}
              buttonText="Comecar"
              variant="secondary"
              onClick={() => handleCreateOption("manual")}
            />
            <CreateOptionCard
              title="Upload de PDF"
              description="Envie um arquivo PDF e deixe a IA extrair e organizar o conteudo automaticamente"
              icon={Upload}
              buttonText="Comecar"
              variant="tertiary"
              onClick={() => handleCreateOption("pdf")}
            />
          </div>
        </div>

        {showForm && formMode !== "pdf" && (
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Informacoes da Licao
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Modo:</span>
                  <Badge className="bg-violet-100 text-violet-700 border-0">
                    {formMode === "ia" ? "IA Assistida" : "Manual"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="revista">Nome da Revista</Label>
                  <Input
                    id="revista"
                    placeholder="Ex: Licoes Biblicas - 1o Trimestre 2024"
                    value={formData.revista}
                    onChange={(e) => setFormData({ ...formData, revista: e.target.value })}
                    data-testid="input-revista"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="titulo">Titulo da Licao</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: O Amor de Deus"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    data-testid="input-titulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger data-testid="select-categoria">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataPublicacao">Data de Publicacao</Label>
                  <Input
                    id="dataPublicacao"
                    type="date"
                    value={formData.dataPublicacao}
                    onChange={(e) => setFormData({ ...formData, dataPublicacao: e.target.value })}
                    data-testid="input-data-publicacao"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="textoBase">Texto Base</Label>
                  <Textarea
                    id="textoBase"
                    placeholder="Digite os versiculos ou referencias biblicas..."
                    className="min-h-24"
                    value={formData.textoBase}
                    onChange={(e) => setFormData({ ...formData, textoBase: e.target.value })}
                    data-testid="textarea-texto-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descricao / Objetivo da Licao</Label>
                  <Textarea
                    id="descricao"
                    placeholder="Descreva o objetivo e conteudo principal da licao..."
                    className="min-h-24"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    data-testid="textarea-descricao"
                  />
                </div>
              </div>

              {formMode === "ia" && (
                <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                      <Brain className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Assistente de IA</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Configure os parametros para gerar conteudo automaticamente usando inteligencia artificial
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="space-y-2">
                      <Label>Nivel de Profundidade</Label>
                      <Select
                        value={formData.nivelProfundidade}
                        onValueChange={(value) => setFormData({ ...formData, nivelProfundidade: value })}
                      >
                        <SelectTrigger data-testid="select-nivel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basico">Basico</SelectItem>
                          <SelectItem value="intermediario">Intermediario</SelectItem>
                          <SelectItem value="avancado">Avancado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Publico Alvo</Label>
                      <Select
                        value={formData.publicoAlvo}
                        onValueChange={(value) => setFormData({ ...formData, publicoAlvo: value })}
                      >
                        <SelectTrigger data-testid="select-publico">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="jovens">Jovens</SelectItem>
                          <SelectItem value="adultos">Adultos</SelectItem>
                          <SelectItem value="todas-idades">Todas as Idades</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duracao Estimada</Label>
                      <Select
                        value={formData.duracaoEstimada}
                        onValueChange={(value) => setFormData({ ...formData, duracaoEstimada: value })}
                      >
                        <SelectTrigger data-testid="select-duracao">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutos</SelectItem>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="45">45 minutos</SelectItem>
                          <SelectItem value="60">60 minutos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="perguntas"
                        checked={formData.incluirPerguntas}
                        onCheckedChange={(checked) => setFormData({ ...formData, incluirPerguntas: !!checked })}
                      />
                      <Label htmlFor="perguntas" className="text-sm cursor-pointer">
                        Incluir perguntas reflexivas
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="aplicacoes"
                        checked={formData.adicionarAplicacoes}
                        onCheckedChange={(checked) => setFormData({ ...formData, adicionarAplicacoes: !!checked })}
                      />
                      <Label htmlFor="aplicacoes" className="text-sm cursor-pointer">
                        Adicionar aplicacoes praticas
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button className="bg-violet-600 hover:bg-violet-700 text-white" data-testid="button-gerar-conteudo">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {formMode === "ia" ? "Gerar Conteudo" : "Salvar Licao"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showForm && formMode === "pdf" && (
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-teal-500 flex items-center justify-center mb-4">
                  <FileUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Upload de PDF
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
                  Arraste e solte seu arquivo PDF aqui ou clique para selecionar
                </p>
                <Button className="bg-teal-500 hover:bg-teal-600 text-white" data-testid="button-selecionar-arquivo">
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </Button>
                <p className="text-xs text-gray-400 mt-4">
                  Formatos aceitos: PDF (max. 10MB)
                </p>
              </div>
              <div className="flex justify-end mt-6">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Licoes Existentes
            </h2>
            <div className="flex items-center gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48" data-testid="select-filter-categoria">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-40" data-testid="select-sort">
                  <SelectValue placeholder="Mais recentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigos</SelectItem>
                  <SelectItem value="popular">Mais populares</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleLessons.map((lesson) => (
              <Card
                key={lesson.id}
                className="bg-white dark:bg-gray-800 border-0 shadow-sm overflow-hidden"
              >
                <div className={`h-1 ${lesson.status === "published" ? "bg-green-500" : "bg-gray-300"}`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={`${categoryColors[lesson.category] || "bg-gray-100 text-gray-700"} border-0`}>
                      {categories.find((c) => c.value === lesson.category)?.label || lesson.category}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {lesson.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {lesson.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {lesson.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(lesson.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {lesson.type === "ia" ? "IA" : lesson.type === "manual" ? "Manual" : "PDF"}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white" size="sm">
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DeoGloryAdminLayout>
  );
}
