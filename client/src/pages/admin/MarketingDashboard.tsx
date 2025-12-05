import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Calendar, Users, Plus, Download, CalendarDays, UserPlus, ArrowUpRight } from "lucide-react";

interface MarketingStats {
  events: {
    total: number;
    upcoming: number;
    past: number;
  };
  boardMembers: {
    total: number;
    active: number;
  };
}

export default function MarketingDashboard() {
  const { data: stats, isLoading } = useQuery<MarketingStats>({
    queryKey: ["/api/marketing/stats"],
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Painel Marketing</h1>
          <p className="text-muted-foreground">
            Gerencie eventos e a diretoria da UMP
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/marketing/eventos/novo">
            <Button data-testid="button-new-event">
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-events">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-events">
                {stats?.events.total || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-upcoming-events">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proximos Eventos</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-blue-600" data-testid="text-upcoming-events">
                {stats?.events.upcoming || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-total-members">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros da Diretoria</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-members">
                {stats?.boardMembers.total || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-active-members">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros Ativos</CardTitle>
            <UserPlus className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600" data-testid="text-active-members">
                {stats?.boardMembers.active || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card data-testid="card-events-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Eventos
            </CardTitle>
            <CardDescription>
              Gerencie os eventos e a agenda da UMP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Link href="/admin/marketing/eventos">
                <Button variant="outline" className="w-full justify-start" data-testid="button-manage-events">
                  <Calendar className="h-4 w-4 mr-2" />
                  Gerenciar Eventos
                  <ArrowUpRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              <Link href="/admin/marketing/eventos/novo">
                <Button variant="outline" className="w-full justify-start" data-testid="button-create-event">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Novo Evento
                </Button>
              </Link>
              <a href="/api/site/events/calendar.ics" download>
                <Button variant="outline" className="w-full justify-start" data-testid="button-export-calendar">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Calendario (ICS)
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-board-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Diretoria
            </CardTitle>
            <CardDescription>
              Gerencie os membros da diretoria da UMP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Link href="/admin/marketing/diretoria">
                <Button variant="outline" className="w-full justify-start" data-testid="button-manage-board">
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Diretoria
                  <ArrowUpRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              <Link href="/admin/marketing/diretoria/novo">
                <Button variant="outline" className="w-full justify-start" data-testid="button-add-member">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Membro
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
