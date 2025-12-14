import { useState } from "react";
import { DeoGloryAdminLayout } from "@/components/deoglory/DeoGloryAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: "Ativo" | "Inativo" | "Suspenso";
  registrationDate: string;
  lastAccess: string;
  readings: number;
}

const mockUsers: User[] = [
  {
    id: 1,
    name: "Maria Silva",
    email: "maria.silva@email.com",
    avatarUrl: null,
    status: "Ativo",
    registrationDate: "15/03/2024",
    lastAccess: "Ha 2 horas",
    readings: 127,
  },
  {
    id: 2,
    name: "Joao Santos",
    email: "joao.santos@email.com",
    avatarUrl: null,
    status: "Ativo",
    registrationDate: "12/03/2024",
    lastAccess: "Ha 5 horas",
    readings: 89,
  },
  {
    id: 3,
    name: "Ana Costa",
    email: "ana.costa@email.com",
    avatarUrl: null,
    status: "Inativo",
    registrationDate: "08/03/2024",
    lastAccess: "Ha 2 dias",
    readings: 45,
  },
  {
    id: 4,
    name: "Pedro Oliveira",
    email: "pedro.oliveira@email.com",
    avatarUrl: null,
    status: "Ativo",
    registrationDate: "05/03/2024",
    lastAccess: "Ha 1 dia",
    readings: 203,
  },
  {
    id: 5,
    name: "Carla Mendes",
    email: "carla.mendes@email.com",
    avatarUrl: null,
    status: "Suspenso",
    registrationDate: "02/03/2024",
    lastAccess: "Ha 3 dias",
    readings: 67,
  },
];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend: string;
  iconBgColor: string;
  iconColor: string;
}

function StatCard({ title, value, icon: Icon, trend, iconBgColor, iconColor }: StatCardProps) {
  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${iconBgColor}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <span className="text-sm font-medium text-green-500 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </span>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
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

export default function DeoGloryUsuarios() {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderBy, setOrderBy] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const recentActivities = [
    {
      icon: UserPlus,
      iconBg: "bg-violet-100 dark:bg-violet-900/30",
      iconColor: "text-violet-600 dark:text-violet-400",
      title: "Novo usuario cadastrado",
      description: "Marina Ferreira se cadastrou no sistema",
      time: "Ha 15 min",
    },
  ];

  return (
    <DeoGloryAdminLayout
      title="Usuarios"
      subtitle="Gerencie e visualize todos os usuarios do sistema"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Usuarios"
            value="2,847"
            icon={Users}
            trend="+12.5%"
            iconBgColor="bg-violet-100 dark:bg-violet-900/30"
            iconColor="text-violet-600 dark:text-violet-400"
          />
          <StatCard
            title="Usuarios Ativos"
            value="2,156"
            icon={UserCheck}
            trend="+8.2%"
            iconBgColor="bg-green-100 dark:bg-green-900/30"
            iconColor="text-green-600 dark:text-green-400"
          />
          <StatCard
            title="Novos Hoje"
            value="34"
            icon={UserPlus}
            trend="+24.1%"
            iconBgColor="bg-amber-100 dark:bg-amber-900/30"
            iconColor="text-amber-600 dark:text-amber-400"
          />
          <StatCard
            title="Online Agora"
            value="127"
            icon={Clock}
            trend="+5.7%"
            iconBgColor="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
          />
        </div>

        <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <CardTitle className="text-lg font-semibold">Gerenciar Usuarios</CardTitle>
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
                    <SelectItem value="recent">Mais recentes</SelectItem>
                    <SelectItem value="name">Nome</SelectItem>
                    <SelectItem value="readings">Leituras</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2" data-testid="button-export">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
                <Button className="bg-violet-600 hover:bg-violet-700 gap-2" data-testid="button-add-user">
                  <Plus className="h-4 w-4" />
                  Adicionar Usuario
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <Checkbox
                        checked={selectedUsers.length === mockUsers.length}
                        onCheckedChange={(checked) => {
                          setSelectedUsers(checked ? mockUsers.map((u) => u.id) : []);
                        }}
                        data-testid="checkbox-select-all"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Data de Cadastro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ultimo Acesso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Leituras
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {mockUsers.map((user) => (
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
                        {user.registrationDate}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {user.lastAccess}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {user.readings} leituras
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" data-testid={`button-view-user-${user.id}`}>
                            <Eye className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="icon" data-testid={`button-edit-user-${user.id}`}>
                            <Edit className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="icon" data-testid={`button-delete-user-${user.id}`}>
                            <Trash2 className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Mostrando</span>
                <Select value={perPage.toString()} onValueChange={(v) => setPerPage(Number(v))}>
                  <SelectTrigger className="w-[70px]" data-testid="select-per-page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span>de 2,847 usuarios</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" disabled={currentPage === 1} data-testid="button-prev-page">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant={currentPage === 1 ? "default" : "outline"}
                  className={currentPage === 1 ? "bg-violet-600" : ""}
                  onClick={() => setCurrentPage(1)}
                  data-testid="button-page-1"
                >
                  1
                </Button>
                <Button
                  variant={currentPage === 2 ? "default" : "outline"}
                  className={currentPage === 2 ? "bg-violet-600" : ""}
                  onClick={() => setCurrentPage(2)}
                  data-testid="button-page-2"
                >
                  2
                </Button>
                <Button
                  variant={currentPage === 3 ? "default" : "outline"}
                  className={currentPage === 3 ? "bg-violet-600" : ""}
                  onClick={() => setCurrentPage(3)}
                  data-testid="button-page-3"
                >
                  3
                </Button>
                <span className="px-2 text-gray-400">...</span>
                <Button variant="outline" onClick={() => setCurrentPage(285)} data-testid="button-page-last">
                  285
                </Button>
                <Button variant="outline" size="icon" data-testid="button-next-page">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
            <CardTitle className="text-lg font-semibold">Atividade Recente</CardTitle>
            <Button variant="link" className="text-violet-600" data-testid="button-view-all-activities">
              Ver todas
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${activity.iconBg}`}>
                    <activity.icon className={`h-5 w-5 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{activity.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
                  </div>
                  <span className="text-sm text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DeoGloryAdminLayout>
  );
}
