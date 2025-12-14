import { useState } from "react";
import { DeoGloryAdminLayout } from "@/components/deoglory/DeoGloryAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  CheckCircle,
  FileEdit,
  Download,
  Plus,
  Eye,
  Edit,
  MoreVertical,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
} from "lucide-react";

interface Magazine {
  id: number;
  title: string;
  description: string;
  status: "Publicado" | "Rascunho";
  coverUrl: string;
  views: string;
  downloads: string;
  date: string;
  progress?: number;
}

const mockMagazines: Magazine[] = [
  {
    id: 1,
    title: "Estudos em Genesis",
    description: "Explorando os primeiros capitulos da criacao",
    status: "Publicado",
    coverUrl: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=300&h=400&fit=crop",
    views: "1.2K visualizacoes",
    downloads: "850",
    date: "Jan 2024",
  },
  {
    id: 2,
    title: "Evangelho de Joao",
    description: "Descobrindo o amor de Cristo atraves do evangelho",
    status: "Publicado",
    coverUrl: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=300&h=400&fit=crop",
    views: "2.1K visualizacoes",
    downloads: "1.5K",
    date: "Dez 2023",
  },
  {
    id: 3,
    title: "Devocionais Diarios",
    description: "30 dias de reflexoes biblicas para crescimento espiritual",
    status: "Rascunho",
    coverUrl: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=300&h=400&fit=crop",
    views: "",
    downloads: "",
    date: "Jan 2024",
    progress: 75,
  },
  {
    id: 4,
    title: "Salmos de Adoracao",
    description: "Uma jornada atraves dos canticos de Davi",
    status: "Publicado",
    coverUrl: "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=300&h=400&fit=crop",
    views: "1.8K visualizacoes",
    downloads: "1.2K",
    date: "Nov 2023",
  },
  {
    id: 5,
    title: "Sabedoria de Proverbios",
    description: "Principios praticos para a vida crista",
    status: "Publicado",
    coverUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=300&h=400&fit=crop",
    views: "1.6K visualizacoes",
    downloads: "980",
    date: "Out 2023",
  },
  {
    id: 6,
    title: "Atos dos Apostolos",
    description: "O nascimento e crescimento da igreja primitiva",
    status: "Rascunho",
    coverUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=300&h=400&fit=crop",
    views: "",
    downloads: "",
    date: "Jan 2024",
    progress: 45,
  },
];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBgColor: string;
  iconColor: string;
}

function StatCard({ title, value, icon: Icon, iconBgColor, iconColor }: StatCardProps) {
  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${iconBgColor}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MagazineCard({ magazine }: { magazine: Magazine }) {
  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm overflow-hidden">
      <div className="relative h-40 bg-gray-100 dark:bg-gray-700">
        <img
          src={magazine.coverUrl}
          alt={magazine.title}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge
            className={`border-0 font-medium ${
              magazine.status === "Publicado"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {magazine.status}
          </Badge>
          <span className="text-sm text-gray-500 dark:text-gray-400">{magazine.date}</span>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{magazine.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
          {magazine.description}
        </p>
        {magazine.status === "Publicado" ? (
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {magazine.views}
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              {magazine.downloads}
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Loader2 className="h-4 w-4" />
              Em desenvolvimento
              <span className="ml-auto">{magazine.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-violet-600 h-1.5 rounded-full"
                style={{ width: `${magazine.progress}%` }}
              />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
            data-testid={`button-edit-magazine-${magazine.id}`}
          >
            <Edit className="h-4 w-4" />
            {magazine.status === "Publicado" ? "Editar" : "Continuar"}
          </Button>
          <Button variant="ghost" size="icon" data-testid={`button-more-magazine-${magazine.id}`}>
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateMagazineCard() {
  return (
    <Card className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col items-center justify-center min-h-[380px]">
      <CardContent className="p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
          <Plus className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Criar Nova Revista</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Comece um novo estudo biblico
        </p>
        <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-create-magazine">
          Comecar Agora
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DeoGloryRevistas() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <DeoGloryAdminLayout
      title="Gestao de Revistas"
      subtitle="Gerencie as revistas publicadas e crie novas edicoes"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar revistas..."
              className="pl-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              data-testid="input-search-magazines"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800" data-testid="select-category">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="estudos">Estudos</SelectItem>
                <SelectItem value="devocionais">Devocionais</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-white dark:bg-gray-800" data-testid="select-status">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" data-testid="button-filters">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Revistas"
            value="24"
            icon={BookOpen}
            iconBgColor="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Publicadas"
            value="20"
            icon={CheckCircle}
            iconBgColor="bg-green-100 dark:bg-green-900/30"
            iconColor="text-green-600 dark:text-green-400"
          />
          <StatCard
            title="Rascunhos"
            value="3"
            icon={FileEdit}
            iconBgColor="bg-violet-100 dark:bg-violet-900/30"
            iconColor="text-violet-600 dark:text-violet-400"
          />
          <StatCard
            title="Downloads"
            value="15.2K"
            icon={Download}
            iconBgColor="bg-red-100 dark:bg-red-900/30"
            iconColor="text-red-600 dark:text-red-400"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockMagazines.map((magazine) => (
            <MagazineCard key={magazine.id} magazine={magazine} />
          ))}
          <CreateMagazineCard />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando 1-7 de 24 revistas
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" disabled data-testid="button-prev-page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              className="bg-violet-600"
              data-testid="button-page-1"
            >
              1
            </Button>
            <Button variant="outline" data-testid="button-page-2">
              2
            </Button>
            <Button variant="outline" data-testid="button-page-3">
              3
            </Button>
            <span className="px-2 text-gray-400">...</span>
            <Button variant="outline" size="icon" data-testid="button-next-page">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </DeoGloryAdminLayout>
  );
}
