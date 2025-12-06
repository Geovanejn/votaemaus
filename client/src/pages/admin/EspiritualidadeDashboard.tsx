import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { BookOpen, Heart, Plus, FileText, Clock, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";

interface EspiritualidadeStats {
  devotionals: {
    total: number;
    published: number;
    drafts: number;
  };
  prayers: {
    pending: number;
    approved: number;
  };
}

export default function EspiritualidadeDashboard() {
  const { data: stats, isLoading } = useQuery<EspiritualidadeStats>({
    queryKey: ["/api/espiritualidade/stats"],
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Painel Espiritualidade</h1>
          <p className="text-muted-foreground">
            Gerencie devocionais e pedidos de oração
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/espiritualidade/devocionais/novo">
            <Button data-testid="button-new-devotional">
              <Plus className="h-4 w-4 mr-2" />
              Novo Devocional
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-devotionals">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Devocionais</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-devotionals">
                {stats?.devotionals.total || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-published-devotionals">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publicados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600" data-testid="text-published-devotionals">
                {stats?.devotionals.published || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-draft-devotionals">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-draft-devotionals">
                {stats?.devotionals.drafts || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-pending-prayers">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-prayers">
                {stats?.prayers.pending || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card data-testid="card-devotionals-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Devocionais
            </CardTitle>
            <CardDescription>
              Crie e gerencie os devocionais da UMP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Link href="/admin/espiritualidade/devocionais">
                <Button variant="outline" className="w-full justify-start" data-testid="button-manage-devotionals">
                  <FileText className="h-4 w-4 mr-2" />
                  Gerenciar Devocionais
                </Button>
              </Link>
              <Link href="/admin/espiritualidade/devocionais/novo">
                <Button variant="outline" className="w-full justify-start" data-testid="button-create-devotional">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Novo Devocional
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-prayers-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Pedidos de Oração
            </CardTitle>
            <CardDescription>
              Modere os pedidos de oração enviados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Pendentes de aprovação</span>
              </div>
              <span className="font-bold" data-testid="text-pending-count">
                {isLoading ? <Skeleton className="h-4 w-8" /> : stats?.prayers.pending || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Aprovados no Mural</span>
              </div>
              <span className="font-bold" data-testid="text-approved-count">
                {isLoading ? <Skeleton className="h-4 w-8" /> : stats?.prayers.approved || 0}
              </span>
            </div>
            <Link href="/admin/espiritualidade/oracoes">
              <Button variant="outline" className="w-full justify-start" data-testid="button-manage-prayers">
                <Heart className="h-4 w-4 mr-2" />
                Moderar Pedidos de Oração
              </Button>
            </Link>
            <Link href="/admin/espiritualidade/comentarios">
              <Button variant="outline" className="w-full justify-start" data-testid="button-manage-comments">
                <MessageSquare className="h-4 w-4 mr-2" />
                Moderar Comentarios
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
