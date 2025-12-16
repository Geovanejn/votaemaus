import { useQuery } from "@tanstack/react-query";
import { DeoGloryAdminLayout } from "@/components/deoglory/DeoGloryAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  BookOpen,
  Zap,
  Target,
  Award,
} from "lucide-react";

interface StudyStats {
  totalUsers: number;
  activeUsers: number;
  totalLessons: number;
  completedLessons: number;
  totalXpEarned: number;
  averageStreak: number;
}

interface MemberProgress {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  currentXp: number;
  currentLevel: number;
  streak: number;
  lessonsCompleted: number;
}


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
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${iconBgColor}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PerformanceIndicatorProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}

function PerformanceIndicator({ title, value, subtitle, icon: Icon, color }: PerformanceIndicatorProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

export default function DeoGloryDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<StudyStats>({
    queryKey: ["/api/study/admin/stats"],
  });

  const { data: topMembers, isLoading: membersLoading } = useQuery<MemberProgress[]>({
    queryKey: ["/api/study/ranking"],
  });

  return (
    <DeoGloryAdminLayout title="Dashboard" subtitle="Visão geral do seu aplicativo de estudo bíblico">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-white dark:bg-gray-800 border-0 shadow-sm">
                  <CardContent className="p-6">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Usuarios Ativos"
                value={stats?.activeUsers?.toLocaleString() || "0"}
                icon={Users}
                iconBgColor="bg-violet-100 dark:bg-violet-900/30"
                iconColor="text-violet-600 dark:text-violet-400"
              />
              <StatCard
                title="Estudos Concluidos"
                value={stats?.completedLessons?.toLocaleString() || "0"}
                icon={CheckCircle}
                iconBgColor="bg-green-100 dark:bg-green-900/30"
                iconColor="text-green-600 dark:text-green-400"
              />
              <StatCard
                title="Sequencia Media"
                value={`${Math.round(stats?.averageStreak || 0)} dias`}
                icon={Clock}
                iconBgColor="bg-blue-100 dark:bg-blue-900/30"
                iconColor="text-blue-600 dark:text-blue-400"
              />
              <StatCard
                title="Licoes Ativas"
                value={stats?.totalLessons || "0"}
                icon={FileText}
                iconBgColor="bg-purple-100 dark:bg-purple-900/30"
                iconColor="text-purple-600 dark:text-purple-400"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Progresso de Estudos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Grafico de progresso mensal</p>
                  <p className="text-xs mt-1">Dados serao exibidos conforme os usuarios estudam</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Atividade Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Grafico de atividade semanal</p>
                  <p className="text-xs mt-1">Dados serao exibidos conforme os usuarios estudam</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Indicadores de Desempenho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <PerformanceIndicator
                title="Media Ofensiva"
                value={stats?.averageStreak?.toFixed(1) || "0"}
                subtitle="dias consecutivos"
                icon={Zap}
                color="bg-orange-500"
              />
              <PerformanceIndicator
                title="XP Total"
                value={stats?.totalXpEarned?.toLocaleString() || "0"}
                subtitle="pontos de experiencia"
                icon={Award}
                color="bg-violet-600"
              />
              <PerformanceIndicator
                title="Taxa de Conclusao"
                value={stats?.totalLessons ? `${Math.round((stats.completedLessons / stats.totalLessons) * 100)}%` : "0%"}
                subtitle="licoes completadas"
                icon={Target}
                color="bg-green-500"
              />
              <PerformanceIndicator
                title="Membros Ativos"
                value={stats?.activeUsers || 0}
                subtitle="usuarios engajados"
                icon={Users}
                color="bg-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Membros
              </CardTitle>
              <Badge variant="outline" className="text-violet-600 border-violet-200">
                Esta Semana
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {membersLoading ? (
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {topMembers?.slice(0, 5).map((member, index) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatarUrl || undefined} />
                            <AvatarFallback className="bg-violet-100 text-violet-600">
                              {member.fullName?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          {index < 3 && (
                            <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-amber-600"
                            }`}>
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {member.fullName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Nível {member.currentLevel} | {member.lessonsCompleted} lições
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-violet-600">{member.currentXp?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">XP</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Resumo do Sistema
              </CardTitle>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Tempo Real
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                    <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      Total de Licoes
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Licoes cadastradas no sistema
                    </p>
                  </div>
                  <Badge className="bg-violet-100 text-violet-700 border-0">
                    {stats?.totalLessons || 0}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      Estudos Concluidos
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Total de conclusoes pelos usuarios
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-0">
                    {stats?.completedLessons || 0}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      Total de Usuarios
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Usuarios registrados no DeoGlory
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-0">
                    {stats?.totalUsers || 0}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <Zap className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      XP Total Gerado
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Pontos de experiencia distribuidos
                    </p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700 border-0">
                    {stats?.totalXpEarned?.toLocaleString() || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DeoGloryAdminLayout>
  );
}
