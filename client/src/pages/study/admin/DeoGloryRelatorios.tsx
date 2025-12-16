import { useQuery } from "@tanstack/react-query";
import { DeoGloryAdminLayout } from "@/components/deoglory/DeoGloryAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  BookOpen,
  TrendingUp,
  Download,
  Zap,
  Trophy,
  Flame,
  Target,
  GraduationCap,
  Loader2,
} from "lucide-react";
import {
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

interface StudyStats {
  totalWeeks: number;
  totalLessons: number;
  totalUnits: number;
  totalStudents: number;
}

interface StudyUser {
  id: number;
  name: string;
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  lessonsCompleted: number;
  status: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBgColor: string;
  iconColor: string;
  isLoading?: boolean;
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconBgColor,
  iconColor,
  isLoading = false,
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
        {isLoading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    </div>
  );
}

export default function DeoGloryRelatorios() {
  const { data: stats, isLoading: statsLoading } = useQuery<StudyStats>({
    queryKey: ["/api/study/admin/stats"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<StudyUser[]>({
    queryKey: ["/api/study/admin/users"],
  });

  const isLoading = statsLoading || usersLoading;

  const activeUsers = users.filter(u => u.status === "Ativo").length;
  const totalXpEarned = users.reduce((sum, u) => sum + (u.totalXp || 0), 0);
  const totalLessonsCompleted = users.reduce((sum, u) => sum + (u.lessonsCompleted || 0), 0);
  const averageStreak = users.length > 0 
    ? Math.round(users.reduce((sum, u) => sum + (u.currentStreak || 0), 0) / users.length) 
    : 0;
  const averageLevel = users.length > 0 
    ? Math.round(users.reduce((sum, u) => sum + (u.currentLevel || 1), 0) / users.length) 
    : 1;

  const levelDistribution = [
    { name: "Nivel 1-5", value: users.filter(u => (u.currentLevel || 1) <= 5).length, color: "#8B5CF6" },
    { name: "Nivel 6-10", value: users.filter(u => (u.currentLevel || 1) > 5 && (u.currentLevel || 1) <= 10).length, color: "#3B82F6" },
    { name: "Nivel 11-20", value: users.filter(u => (u.currentLevel || 1) > 10 && (u.currentLevel || 1) <= 20).length, color: "#10B981" },
    { name: "Nivel 21+", value: users.filter(u => (u.currentLevel || 1) > 20).length, color: "#F59E0B" },
  ].filter(d => d.value > 0);

  const topUsers = [...users]
    .sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0))
    .slice(0, 10)
    .map(u => ({
      name: u.name?.split(' ')[0] || 'Usuario',
      xp: u.totalXp || 0,
    }));

  const streakDistribution = [
    { range: "0 dias", count: users.filter(u => (u.currentStreak || 0) === 0).length },
    { range: "1-7 dias", count: users.filter(u => (u.currentStreak || 0) >= 1 && (u.currentStreak || 0) <= 7).length },
    { range: "8-30 dias", count: users.filter(u => (u.currentStreak || 0) >= 8 && (u.currentStreak || 0) <= 30).length },
    { range: "31+ dias", count: users.filter(u => (u.currentStreak || 0) > 30).length },
  ];

  if (isLoading) {
    return (
      <DeoGloryAdminLayout
        title="Relatorios"
        subtitle="Estatisticas do sistema de estudos"
      >
        <LoadingState />
      </DeoGloryAdminLayout>
    );
  }

  return (
    <DeoGloryAdminLayout
      title="Relatorios"
      subtitle="Estatisticas do sistema de estudos"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <Button className="bg-violet-600 hover:bg-violet-700 gap-2" data-testid="button-export-data">
            <Download className="h-4 w-4" />
            Exportar Dados
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Usuarios"
            value={users.length}
            icon={Users}
            iconBgColor="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
            isLoading={usersLoading}
          />
          <StatCard
            title="Usuarios Ativos"
            value={activeUsers}
            icon={TrendingUp}
            iconBgColor="bg-green-100 dark:bg-green-900/30"
            iconColor="text-green-600 dark:text-green-400"
            isLoading={usersLoading}
          />
          <StatCard
            title="Total de Licoes"
            value={stats?.totalLessons || 0}
            icon={BookOpen}
            iconBgColor="bg-violet-100 dark:bg-violet-900/30"
            iconColor="text-violet-600 dark:text-violet-400"
            isLoading={statsLoading}
          />
          <StatCard
            title="XP Total Ganho"
            value={totalXpEarned.toLocaleString('pt-BR')}
            icon={Zap}
            iconBgColor="bg-amber-100 dark:bg-amber-900/30"
            iconColor="text-amber-600 dark:text-amber-400"
            isLoading={usersLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Licoes Concluidas"
            value={totalLessonsCompleted}
            icon={Target}
            iconBgColor="bg-indigo-100 dark:bg-indigo-900/30"
            iconColor="text-indigo-600 dark:text-indigo-400"
            isLoading={usersLoading}
          />
          <StatCard
            title="Sequencia Media"
            value={`${averageStreak} dias`}
            icon={Flame}
            iconBgColor="bg-orange-100 dark:bg-orange-900/30"
            iconColor="text-orange-600 dark:text-orange-400"
            isLoading={usersLoading}
          />
          <StatCard
            title="Nivel Medio"
            value={averageLevel}
            icon={GraduationCap}
            iconBgColor="bg-purple-100 dark:bg-purple-900/30"
            iconColor="text-purple-600 dark:text-purple-400"
            isLoading={usersLoading}
          />
          <StatCard
            title="Total de Revistas"
            value={stats?.totalWeeks || 0}
            icon={Trophy}
            iconBgColor="bg-rose-100 dark:bg-rose-900/30"
            iconColor="text-rose-600 dark:text-rose-400"
            isLoading={statsLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Top 10 Usuarios por XP</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ranking de pontuacao</p>
            </CardHeader>
            <CardContent className="pt-4">
              {topUsers.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topUsers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" stroke="#9CA3AF" />
                    <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={80} />
                    <Tooltip />
                    <Bar dataKey="xp" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum usuario encontrado
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Distribuicao por Nivel</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">Usuarios por faixa de nivel</p>
            </CardHeader>
            <CardContent className="pt-4">
              {levelDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={levelDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {levelDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum dado disponivel
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Distribuicao de Sequencias</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">Usuarios por dias de sequencia</p>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={streakDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="range" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip />
                <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
            <CardTitle className="text-lg font-semibold">Resumo do Sistema</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">Metricas principais do DeoGlory</p>
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
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-blue-500" />
                        <span className="font-medium text-gray-900 dark:text-white">Total de Usuarios Cadastrados</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{users.length}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <span className="font-medium text-gray-900 dark:text-white">Usuarios Ativos (ultimos 7 dias)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{activeUsers}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-violet-500" />
                        <span className="font-medium text-gray-900 dark:text-white">Total de Revistas</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{stats?.totalWeeks || 0}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5 text-indigo-500" />
                        <span className="font-medium text-gray-900 dark:text-white">Total de Licoes</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{stats?.totalLessons || 0}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-amber-500" />
                        <span className="font-medium text-gray-900 dark:text-white">XP Total Distribuido</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{totalXpEarned.toLocaleString('pt-BR')}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <span className="font-medium text-gray-900 dark:text-white">Sequencia Media</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{averageStreak} dias</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DeoGloryAdminLayout>
  );
}
