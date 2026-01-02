import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Receipt, 
  Plus,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Calendar,
  Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { TreasuryEntry } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

const categoryLabels: Record<string, string> = {
  percapta: "Percapta",
  ump: "Taxa UMP",
  loan: "Empréstimo",
  misc: "Diversos",
  event: "Evento",
  events: "Eventos",
  marketing: "Marketing",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "secondary" },
  paid: { label: "Pago", variant: "default" },
  expired: { label: "Expirado", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "outline" },
};

export default function TesourariaMovimentacoes() {
  const { hasTreasuryPanel } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const currentYear = new Date().getFullYear();

  const { data: entries, isLoading } = useQuery<TreasuryEntry[]>({
    queryKey: ["/api/treasury/entries", currentYear],
    enabled: hasTreasuryPanel,
  });

  if (!hasTreasuryPanel) {
    setLocation("/admin");
    return null;
  }

  const filteredEntries = entries?.filter((entry) => {
    const matchesSearch = !searchTerm || 
      entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.externalPayerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || entry.type === typeFilter;
    const matchesStatus = statusFilter === "all" || entry.paymentStatus === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-amber-600 via-orange-600 to-orange-700 text-white py-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href="/admin/tesouraria">
              <Button 
                variant="ghost" 
                className="mb-4 text-white/80 gap-2"
                data-testid="button-back-treasury"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-entries-title">
                    Movimentações
                  </h1>
                  <p className="text-white/80">
                    Entradas e saídas - {currentYear}
                  </p>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-white/20" data-testid="button-new-entry">
                    <Plus className="h-4 w-4" />
                    Nova Movimentação
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Movimentação</DialogTitle>
                  </DialogHeader>
                  <p className="text-muted-foreground text-sm">
                    Formulário de cadastro em desenvolvimento...
                  </p>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-6 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por descrição ou pagador..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search-entries"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | "income" | "expense")}>
                      <SelectTrigger className="w-[140px]" data-testid="select-type-filter">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="income">Entradas</SelectItem>
                        <SelectItem value="expense">Saídas</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="expired">Expirado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {entries?.length === 0 
                    ? "Nenhuma movimentação registrada" 
                    : "Nenhuma movimentação encontrada com os filtros aplicados"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card className="hover-elevate cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          entry.type === "income" 
                            ? "bg-green-100 dark:bg-green-900/30" 
                            : "bg-red-100 dark:bg-red-900/30"
                        }`}>
                          {entry.type === "income" ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">
                              {entry.description || categoryLabels[entry.category] || entry.category}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {categoryLabels[entry.category] || entry.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {entry.createdAt && format(new Date(entry.createdAt), "dd MMM yyyy", { locale: ptBR })}
                            {entry.externalPayerName && (
                              <span>• {entry.externalPayerName}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${
                            entry.type === "income" ? "text-green-600" : "text-red-600"
                          }`}>
                            {entry.type === "income" ? "+" : "-"}{formatCurrency(entry.amount)}
                          </div>
                          <Badge 
                            variant={statusLabels[entry.paymentStatus]?.variant ?? "secondary"}
                            className="text-xs"
                          >
                            {statusLabels[entry.paymentStatus]?.label ?? entry.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
