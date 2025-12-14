import { useState } from "react";
import { DeoGloryAdminLayout } from "@/components/deoglory/DeoGloryAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Clock,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  MoreVertical,
  Search,
  ArrowUp,
  ArrowDown,
  UserPlus,
  Activity,
  Bookmark,
  MessageSquare,
  Target,
  Share2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const engagementData = [
  { day: "Seg", users: 2400 },
  { day: "Ter", users: 1398 },
  { day: "Qua", users: 9800 },
  { day: "Qui", users: 3908 },
  { day: "Sex", users: 4800 },
  { day: "Sab", users: 3800 },
  { day: "Dom", users: 4300 },
];

const contentData = [
  { name: "Estudos", value: 45, color: "#8B5CF6" },
  { name: "Devocionais", value: 30, color: "#3B82F6" },
  { name: "Artigos", value: 15, color: "#10B981" },
  { name: "Videos", value: 10, color: "#F59E0B" },
];

const weeklyReadingData = [
  { week: "Sem 1", minutes: 120 },
  { week: "Sem 2", minutes: 145 },
  { week: "Sem 3", minutes: 160 },
  { week: "Sem 4", minutes: 155 },
];

const platformData = [
  { name: "Mobile", value: 65 },
  { name: "Desktop", value: 25 },
  { name: "Tablet", value: 10 },
];

interface MetricRow {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  currentValue: string;
  previousValue: string;
  variation: string;
  variationColor: string;
  trend: "up" | "down";
}

const metricsData: MetricRow[] = [
  {
    icon: UserPlus,
    iconColor: "text-blue-500",
    label: "Novos Usuarios",
    currentValue: "3,842",
    previousValue: "3,156",
    variation: "+21.7%",
    variationColor: "text-green-500",
    trend: "up",
  },
  {
    icon: Activity,
    iconColor: "text-violet-500",
    label: "Sessoes Diarias",
    currentValue: "48,392",
    previousValue: "44,287",
    variation: "+9.3%",
    variationColor: "text-green-500",
    trend: "up",
  },
  {
    icon: Bookmark,
    iconColor: "text-red-500",
    label: "Versiculos Salvos",
    currentValue: "12,847",
    previousValue: "11,293",
    variation: "+13.8%",
    variationColor: "text-green-500",
    trend: "up",
  },
  {
    icon: MessageSquare,
    iconColor: "text-blue-400",
    label: "Interacoes Sociais",
    currentValue: "8,564",
    previousValue: "9,127",
    variation: "-6.2%",
    variationColor: "text-red-500",
    trend: "down",
  },
  {
    icon: Target,
    iconColor: "text-violet-400",
    label: "Planos Concluidos",
    currentValue: "2,183",
    previousValue: "1,847",
    variation: "+18.2%",
    variationColor: "text-green-500",
    trend: "up",
  },
  {
    icon: Share2,
    iconColor: "text-blue-500",
    label: "Compartilhamentos",
    currentValue: "5,921",
    previousValue: "5,438",
    variation: "+8.9%",
    variationColor: "text-green-500",
    trend: "up",
  },
];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend: string;
  trendLabel: string;
  iconBgColor: string;
  iconColor: string;
  isPositive?: boolean;
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  iconBgColor,
  iconColor,
  isPositive = true,
}: StatCardProps) {
  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <div className={`p-2 rounded-lg ${iconBgColor}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
        <div className="flex items-center gap-1 text-sm">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className={isPositive ? "text-green-500" : "text-red-500"}>{trend}</span>
          <span className="text-gray-500 dark:text-gray-400">{trendLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DeoGloryRelatorios() {
  const [periodFilter, setPeriodFilter] = useState("7days");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  return (
    <DeoGloryAdminLayout
      title="Relatorios de Engajamento"
      subtitle="Analise detalhada de metricas e estatisticas"
    >
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Periodo:</span>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-[150px] bg-white dark:bg-gray-800" data-testid="select-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Ultimos 7 dias</SelectItem>
                  <SelectItem value="30days">Ultimos 30 dias</SelectItem>
                  <SelectItem value="90days">Ultimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Categoria:</span>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[120px] bg-white dark:bg-gray-800" data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="estudos">Estudos</SelectItem>
                  <SelectItem value="devocionais">Devocionais</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Plataforma:</span>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-[120px] bg-white dark:bg-gray-800" data-testid="select-platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" data-testid="button-advanced-filters">
              <Filter className="h-4 w-4" />
              Filtros Avancados
            </Button>
            <Button className="bg-violet-600 hover:bg-violet-700 gap-2" data-testid="button-export-data">
              <Download className="h-4 w-4" />
              Exportar Dados
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Usuarios Ativos"
            value="24,583"
            icon={Users}
            trend="+12.5%"
            trendLabel="vs. mes anterior"
            iconBgColor="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Tempo Medio Diario"
            value="18m 42s"
            icon={Clock}
            trend="+8.3%"
            trendLabel="vs. mes anterior"
            iconBgColor="bg-violet-100 dark:bg-violet-900/30"
            iconColor="text-violet-600 dark:text-violet-400"
          />
          <StatCard
            title="Capitulos Lidos"
            value="156,892"
            icon={BookOpen}
            trend="+15.7%"
            trendLabel="vs. mes anterior"
            iconBgColor="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Taxa de Retencao"
            value="87.4%"
            icon={TrendingUp}
            trend="+3.2%"
            trendLabel="vs. mes anterior"
            iconBgColor="bg-green-100 dark:bg-green-900/30"
            iconColor="text-green-600 dark:text-green-400"
          />
          <div className="hidden lg:block" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-lg font-semibold">Engajamento Diario</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">Usuarios ativos por dia</p>
              </div>
              <Button variant="ghost" size="icon" data-testid="button-engagement-options">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={engagementData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#8B5CF6"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-lg font-semibold">Conteudo Mais Acessado</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">Distribuicao por categoria</p>
              </div>
              <Button variant="ghost" size="icon" data-testid="button-content-options">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={contentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {contentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-lg font-semibold">Tempo de Leitura Semanal</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">Media de minutos por usuario</p>
              </div>
              <Button variant="ghost" size="icon" data-testid="button-reading-options">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyReadingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="week" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip />
                  <Bar dataKey="minutes" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-lg font-semibold">Usuarios por Plataforma</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">Distribuicao de dispositivos</p>
              </div>
              <Button variant="ghost" size="icon" data-testid="button-platform-options">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {platformData.map((platform) => (
                  <div key={platform.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">{platform.name}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {platform.value}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-violet-600 h-2 rounded-full"
                        style={{ width: `${platform.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold">Estatisticas Detalhadas dos Usuarios</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">Analise completa de comportamento</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  className="pl-9 w-48 bg-gray-50 dark:bg-gray-700"
                  data-testid="input-search-stats"
                />
              </div>
              <Button variant="outline" className="gap-2" data-testid="button-filter-stats">
                <Filter className="h-4 w-4" />
                Filtrar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Metrica
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Valor Atual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Mes Anterior
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Variacao
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tendencia
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {metricsData.map((metric, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <metric.icon className={`h-5 w-5 ${metric.iconColor}`} />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {metric.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                        {metric.currentValue}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {metric.previousValue}
                      </td>
                      <td className={`px-6 py-4 font-medium ${metric.variationColor}`}>
                        {metric.variation}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {metric.trend === "up" ? (
                            <>
                              <ArrowUp className="h-4 w-4 text-green-500" />
                              <ArrowUp className="h-4 w-4 text-green-500" />
                            </>
                          ) : (
                            <ArrowDown className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DeoGloryAdminLayout>
  );
}
