import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DeoGloryAdminLayout } from "@/components/deoglory/DeoGloryAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Upload,
  Edit3,
  ArrowRight,
  Save,
  RotateCcw,
  Eye,
  Edit,
  Trash2,
  Filter,
  BookOpen,
} from "lucide-react";

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
    tertiary: "bg-violet-500",
  };

  const buttonClasses = {
    primary: "bg-white text-violet-700 hover:bg-white/90",
    secondary: "border-teal-500 text-teal-600 hover:bg-teal-50",
    tertiary: "bg-violet-500 hover:bg-violet-600 text-white",
  };

  return (
    <Card className={`${bgClasses[variant]} border-0 shadow-sm overflow-hidden`}>
      <CardContent className="p-6">
        <div className={`w-12 h-12 rounded-xl ${iconBgClasses[variant]} flex items-center justify-center mb-4`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className={`text-lg font-bold mb-2 ${variant === "primary" ? "text-white" : "text-gray-900 dark:text-white"}`}>
          {title}
        </h3>
        <p className={`text-sm mb-6 ${variant === "primary" ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
          {description}
        </p>
        <Button
          variant={variant === "secondary" ? "outline" : "default"}
          className={`w-full ${buttonClasses[variant]}`}
          onClick={onClick}
          data-testid={`button-${title.toLowerCase().replace(/\s/g, "-")}`}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}

interface Study {
  id: number;
  title: string;
  revista: string;
  type: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  published: { bg: "bg-green-100", text: "text-green-700" },
  draft: { bg: "bg-yellow-100", text: "text-yellow-700" },
  archived: { bg: "bg-gray-100", text: "text-gray-700" },
};

const statusLabels: Record<string, string> = {
  published: "Publicado",
  draft: "Rascunho",
  archived: "Arquivado",
};

export default function DeoGloryEstudos() {
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"ia" | "pdf" | "manual">("ia");
  const [filterStatus, setFilterStatus] = useState("all");

  const [formData, setFormData] = useState({
    tema: "",
    revista: "",
    categoria: "",
    nivelDificuldade: "",
    duracaoEstimada: "",
    versiculosBase: "",
    descricaoObjetivos: "",
    incluirPerguntasReflexao: false,
    incluirAtividadesPraticas: false,
    adicionarIlustracoes: false,
    gerarMaterialComplementar: false,
  });

  const sampleStudies: Study[] = [
    { id: 1, title: "O Amor de Deus", revista: "Revista Trimestral - 1o Trim 2024", type: "ia", status: "published", createdAt: "2024-01-15T10:00:00" },
    { id: 2, title: "Fe e Obras", revista: "Revista Especial", type: "pdf", status: "draft", createdAt: "2024-01-16T14:30:00" },
    { id: 3, title: "A Graca Divina", revista: "Revista Trimestral - 4o Trim 2023", type: "manual", status: "published", createdAt: "2024-01-17T09:15:00" },
    { id: 4, title: "Oracao e Jejum", revista: "Revista Especial", type: "ia", status: "archived", createdAt: "2024-01-18T16:45:00" },
    { id: 5, title: "Salvacao em Cristo", revista: "Revista Trimestral - 3o Trim 2023", type: "manual", status: "published", createdAt: "2024-01-19T11:20:00" },
  ];

  const handleCreateOption = (mode: "ia" | "pdf" | "manual") => {
    setFormMode(mode);
    setShowForm(true);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 24) return `Ha ${diffHours} horas`;
    const diffDays = Math.floor(diffHours / 24);
    return `Ha ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
  };

  return (
    <DeoGloryAdminLayout title="Gerar Estudos" subtitle="Crie estudos biblicos usando inteligencia artificial">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div />
          <Badge variant="outline" className="text-violet-600 border-violet-200">
            Creditos disponiveis: <span className="font-bold ml-1">247</span>
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CreateOptionCard
            title="Gerar com IA"
            description="Crie estudos automaticamente usando inteligencia artificial"
            icon={Sparkles}
            buttonText="Comecar Agora"
            variant="primary"
            onClick={() => handleCreateOption("ia")}
          />
          <CreateOptionCard
            title="Enviar PDF"
            description="Faca upload de um PDF e gere estudos automaticamente"
            icon={Upload}
            buttonText="Enviar Arquivo"
            variant="secondary"
            onClick={() => handleCreateOption("pdf")}
          />
          <CreateOptionCard
            title="Escrever Manual"
            description="Crie seu estudo manualmente com editor completo"
            icon={Edit3}
            buttonText="Criar Estudo"
            variant="tertiary"
            onClick={() => handleCreateOption("manual")}
          />
        </div>

        {showForm && formMode === "ia" && (
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Gerador de Estudos com IA
              </CardTitle>
              <p className="text-sm text-gray-500">
                Preencha os campos para gerar seu estudo personalizado
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Tema do Estudo</Label>
                  <Input
                    placeholder="Ex: O Amor de Deus"
                    value={formData.tema}
                    onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                    data-testid="input-tema"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome da Revista</Label>
                  <Input
                    placeholder="Ex: Revista Trimestral - 1o Trim 2024"
                    value={formData.revista}
                    onChange={(e) => setFormData({ ...formData, revista: e.target.value })}
                    data-testid="input-revista"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger data-testid="select-categoria">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="antigo-testamento">Antigo Testamento</SelectItem>
                      <SelectItem value="novo-testamento">Novo Testamento</SelectItem>
                      <SelectItem value="doutrina">Doutrina</SelectItem>
                      <SelectItem value="vida-crista">Vida Crista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nivel de Dificuldade</Label>
                  <Select
                    value={formData.nivelDificuldade}
                    onValueChange={(value) => setFormData({ ...formData, nivelDificuldade: value })}
                  >
                    <SelectTrigger data-testid="select-dificuldade">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Basico</SelectItem>
                      <SelectItem value="intermediario">Intermediario</SelectItem>
                      <SelectItem value="avancado">Avancado</SelectItem>
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
                      <SelectValue placeholder="Selecione..." />
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

              <div className="space-y-2">
                <Label>Versiculos Base (opcional)</Label>
                <Input
                  placeholder="Ex: Joao 3:16, Romanos 8:28"
                  value={formData.versiculosBase}
                  onChange={(e) => setFormData({ ...formData, versiculosBase: e.target.value })}
                  data-testid="input-versiculos"
                />
              </div>

              <div className="space-y-2">
                <Label>Descricao e Objetivos</Label>
                <Textarea
                  placeholder="Descreva os objetivos do estudo e pontos principais que deseja abordar..."
                  className="min-h-32"
                  value={formData.descricaoObjetivos}
                  onChange={(e) => setFormData({ ...formData, descricaoObjetivos: e.target.value })}
                  data-testid="textarea-descricao"
                />
              </div>

              <div className="space-y-4">
                <Label>Opcoes Adicionais</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="perguntas"
                      checked={formData.incluirPerguntasReflexao}
                      onCheckedChange={(checked) => setFormData({ ...formData, incluirPerguntasReflexao: !!checked })}
                    />
                    <Label htmlFor="perguntas" className="cursor-pointer">
                      Incluir perguntas de reflexao
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="atividades"
                      checked={formData.incluirAtividadesPraticas}
                      onCheckedChange={(checked) => setFormData({ ...formData, incluirAtividadesPraticas: !!checked })}
                    />
                    <Label htmlFor="atividades" className="cursor-pointer">
                      Incluir atividades praticas
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="ilustracoes"
                      checked={formData.adicionarIlustracoes}
                      onCheckedChange={(checked) => setFormData({ ...formData, adicionarIlustracoes: !!checked })}
                    />
                    <Label htmlFor="ilustracoes" className="cursor-pointer">
                      Adicionar ilustracoes
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="material"
                      checked={formData.gerarMaterialComplementar}
                      onCheckedChange={(checked) => setFormData({ ...formData, gerarMaterialComplementar: !!checked })}
                    />
                    <Label htmlFor="material" className="cursor-pointer">
                      Gerar material complementar
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" data-testid="button-salvar-rascunho">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Rascunho
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-limpar">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Limpar Campos
                  </Button>
                </div>
                <Button className="bg-violet-600 hover:bg-violet-700 text-white" data-testid="button-gerar">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Estudo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Estudos Gerados Recentemente
              </CardTitle>
              <p className="text-sm text-gray-500">Seus ultimos estudos criados</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32" data-testid="select-filter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="published">Publicados</SelectItem>
                  <SelectItem value="draft">Rascunhos</SelectItem>
                  <SelectItem value="archived">Arquivados</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" data-testid="button-filtrar">
                <Filter className="h-4 w-4 mr-1" />
                Filtrar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sampleStudies.map((study) => (
                <div
                  key={study.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className={`p-3 rounded-xl ${
                    study.type === "ia" ? "bg-violet-100" : study.type === "pdf" ? "bg-teal-100" : "bg-blue-100"
                  }`}>
                    {study.type === "ia" ? (
                      <Sparkles className={`h-5 w-5 ${study.type === "ia" ? "text-violet-600" : "text-teal-600"}`} />
                    ) : study.type === "pdf" ? (
                      <Upload className="h-5 w-5 text-teal-600" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {study.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {study.revista} | {study.type === "ia" ? "Gerado com IA" : study.type === "pdf" ? "Gerado de PDF" : "Manual"} | {getTimeAgo(study.createdAt)}
                    </p>
                  </div>
                  <Badge className={`${statusColors[study.status]?.bg || "bg-gray-100"} ${statusColors[study.status]?.text || "text-gray-700"} border-0`}>
                    {statusLabels[study.status] || study.status}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-view-${study.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-edit-${study.id}`}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" data-testid={`button-delete-${study.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DeoGloryAdminLayout>
  );
}
