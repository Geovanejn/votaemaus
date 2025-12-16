import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DeoGloryAdminLayout } from "@/components/deoglory/DeoGloryAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Download,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StudyUser {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: "Ativo" | "Inativo" | "Suspenso";
  registrationDate: string | null;
  lastAccess: string | null;
  lessonsCompleted: number;
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  crystals: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  iconBgColor: string;
  iconColor: string;
  isLoading?: boolean;
}

function StatCard({ title, value, icon: Icon, trend, iconBgColor, iconColor, isLoading }: StatCardProps) {
  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${iconBgColor}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          {trend && (
            <span className="text-sm font-medium text-green-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          {isLoading ? (
            <Skeleton className="h-9 w-20 mt-1" />
          ) : (
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    Ativo: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Inativo: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Suspenso: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  return (
    <Badge className={`${colors[status as keyof typeof colors]} font-medium border-0`}>
      {status}
    </Badge>
  );
}

function formatLastAccess(date: string | null): string {
  if (!date) return "Nunca acessou";
  try {
    const accessDate = new Date(date);
    return formatDistanceToNow(accessDate, { addSuffix: true, locale: ptBR });
  } catch {
    return "Data inválida";
  }
}

function formatRegistrationDate(date: string | null): string {
  if (!date) return "-";
  try {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return "-";
  }
}

export default function DeoGloryUsuarios() {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderBy, setOrderBy] = useState("xp");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { data: users = [], isLoading, isError } = useQuery<StudyUser[]>({
    queryKey: ['/api/study/admin/users'],
  });

  const filteredUsers = users.filter(user => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return user.status === "Ativo";
    if (statusFilter === "inactive") return user.status === "Inativo";
    if (statusFilter === "suspended") return user.status === "Suspenso";
    return true;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (orderBy === "xp") return b.totalXp - a.totalXp;
    if (orderBy === "name") return a.name.localeCompare(b.name);
    if (orderBy === "lessons") return b.lessonsCompleted - a.lessonsCompleted;
    if (orderBy === "recent") {
      const dateA = a.registrationDate ? new Date(a.registrationDate).getTime() : 0;
      const dateB = b.registrationDate ? new Date(b.registrationDate).getTime() : 0;
      return dateB - dateA;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedUsers.length / perPage);
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * perPage, currentPage * perPage);

  const activeCount = users.filter(u => u.status === "Ativo").length;
  const inactiveCount = users.filter(u => u.status === "Inativo").length;
  const suspendedCount = users.filter(u => u.status === "Suspenso").length;

  return (
    <DeoGloryAdminLayout
      title="Usuários"
      subtitle="Gerencie e visualize todos os usuários do sistema"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Usuários"
            value={users.length}
            icon={Users}
            iconBgColor="bg-violet-100 dark:bg-violet-900/30"
            iconColor="text-violet-600 dark:text-violet-400"
            isLoading={isLoading}
          />
          <StatCard
            title="Usuários Ativos"
            value={activeCount}
            icon={UserCheck}
            iconBgColor="bg-green-100 dark:bg-green-900/30"
            iconColor="text-green-600 dark:text-green-400"
            isLoading={isLoading}
          />
          <StatCard
            title="Inativos"
            value={inactiveCount}
            icon={Clock}
            iconBgColor="bg-amber-100 dark:bg-amber-900/30"
            iconColor="text-amber-600 dark:text-amber-400"
            isLoading={isLoading}
          />
          <StatCard
            title="Suspensos"
            value={suspendedCount}
            icon={UserPlus}
            iconBgColor="bg-red-100 dark:bg-red-900/30"
            iconColor="text-red-600 dark:text-red-400"
            isLoading={isLoading}
          />
        </div>

        <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <CardTitle className="text-lg font-semibold">Gerenciar Usuários</CardTitle>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] bg-gray-50 dark:bg-gray-700" data-testid="select-status-filter">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={orderBy} onValueChange={setOrderBy}>
                  <SelectTrigger className="w-[140px] bg-gray-50 dark:bg-gray-700" data-testid="select-order-by">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xp">Maior XP</SelectItem>
                    <SelectItem value="recent">Mais recentes</SelectItem>
                    <SelectItem value="name">Nome</SelectItem>
                    <SelectItem value="lessons">Lições</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2" data-testid="button-export">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>Erro ao carregar usuários. Tente novamente.</p>
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <Checkbox
                          checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                          onCheckedChange={(checked) => {
                            setSelectedUsers(checked ? paginatedUsers.map((u) => u.id) : []);
                          }}
                          data-testid="checkbox-select-all"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Data de Cadastro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Último Acesso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Lições
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        XP
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => {
                              setSelectedUsers(
                                checked
                                  ? [...selectedUsers, user.id]
                                  : selectedUsers.filter((id) => id !== user.id)
                              );
                            }}
                            data-testid={`checkbox-user-${user.id}`}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatarUrl || undefined} />
                              <AvatarFallback className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={user.status} />
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {formatRegistrationDate(user.registrationDate)}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {formatLastAccess(user.lastAccess)}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {user.lessonsCompleted} lições
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-violet-600 dark:text-violet-400">
                            {user.totalXp.toLocaleString()} XP
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" data-testid={`button-view-user-${user.id}`}>
                              <Eye className="h-4 w-4 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="icon" data-testid={`button-edit-user-${user.id}`}>
                              <Edit className="h-4 w-4 text-gray-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isLoading && !isError && sortedUsers.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>Mostrando</span>
                  <Select value={perPage.toString()} onValueChange={(v) => { setPerPage(Number(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[70px]" data-testid="select-per-page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>de {sortedUsers.length} usuários</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        className={currentPage === pageNum ? "bg-violet-600" : ""}
                        onClick={() => setCurrentPage(pageNum)}
                        data-testid={`button-page-${pageNum}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2 text-gray-400">...</span>
                      <Button variant="outline" onClick={() => setCurrentPage(totalPages)} data-testid="button-page-last">
                        {totalPages}
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="outline" 
                    size="icon"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DeoGloryAdminLayout>
  );
}
