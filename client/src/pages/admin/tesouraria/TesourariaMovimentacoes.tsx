import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Receipt, 
  Plus,
  TrendingUp,
  TrendingDown,
  Search,
  Calendar,
  Loader2
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { TreasuryEntry, User } from "@shared/schema";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

const categoryLabels: Record<string, string> = {
  taxa_percapta: "Taxa Percapta",
  taxa_ump: "Taxa UMP",
  percapta: "Percapta",
  ump: "Taxa UMP",
  loan: "Emprestimo",
  misc: "Diversos",
  event: "Evento",
  events: "Eventos",
  marketing: "Marketing",
  shop: "Loja",
  donation: "Doacao",
  other: "Outros",
};

const incomeCategories = [
  { value: "taxa_percapta", label: "Taxa Percapta" },
  { value: "taxa_ump", label: "Taxa UMP" },
  { value: "events", label: "Eventos" },
  { value: "shop", label: "Loja" },
  { value: "donation", label: "Doacao" },
  { value: "loan", label: "Pagamento Emprestimo" },
  { value: "other", label: "Outros" },
];

const expenseCategories = [
  { value: "events", label: "Eventos" },
  { value: "marketing", label: "Marketing" },
  { value: "loan", label: "Emprestimo" },
  { value: "misc", label: "Diversos" },
  { value: "other", label: "Outros" },
];

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "secondary" },
  paid: { label: "Pago", variant: "default" },
  completed: { label: "Pago", variant: "default" },
  expired: { label: "Expirado", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "outline" },
};

export default function TesourariaMovimentacoes() {
  const { hasTreasuryPanel } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const currentYear = new Date().getFullYear();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formType, setFormType] = useState<"income" | "expense">("income");
  const [formCategory, setFormCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMemberId, setFormMemberId] = useState<number | undefined>(undefined);
  const [formReferenceMonth, setFormReferenceMonth] = useState<string>("");

  const { data: entries, isLoading } = useQuery<TreasuryEntry[]>({
    queryKey: [`/api/treasury/entries?year=${currentYear}`],
    enabled: hasTreasuryPanel,
  });

  const needsMemberSelection = formType === "income" && 
    (formCategory === "taxa_percapta" || formCategory === "taxa_ump" || formCategory === "events");

  const { data: members } = useQuery<User[]>({
    queryKey: ["/api/admin/members"],
    enabled: hasTreasuryPanel && needsMemberSelection,
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: { type: string; category: string; description: string; amount: number; paymentStatus: string; paymentMethod: string; userId?: number; referenceMonth?: number; referenceYear?: number }) => {
      return apiRequest("POST", "/api/treasury/entries", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/treasury/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/treasury/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/treasury/dashboard/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/treasury/dashboard/summary"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Movimentacao registrada com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao registrar movimentacao", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormType("income");
    setFormCategory("");
    setFormDescription("");
    setFormAmount("");
    setFormMemberId(undefined);
    setFormReferenceMonth("");
  };

  const handleSubmit = () => {
    if (!formCategory || !formAmount) {
      toast({ title: "Preencha todos os campos obrigatorios", variant: "destructive" });
      return;
    }

    const amountCents = Math.round(parseFloat(formAmount.replace(",", ".")) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      toast({ title: "Valor invalido", variant: "destructive" });
      return;
    }

    createEntryMutation.mutate({
      type: formType,
      category: formCategory,
      description: formDescription,
      amount: amountCents,
      paymentStatus: "paid",
      paymentMethod: "manual",
      userId: formMemberId,
      referenceMonth: formReferenceMonth ? parseInt(formReferenceMonth) : undefined,
      referenceYear: currentYear,
    });
  };

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

  const categories = formType === "income" ? incomeCategories : expenseCategories;

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
                    Movimentacoes
                  </h1>
                  <p className="text-white/80">
                    Entradas e saidas - {currentYear}
                  </p>
                </div>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-white/20" data-testid="button-new-entry">
                    <Plus className="h-4 w-4" />
                    Nova Movimentacao
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nova Movimentacao</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={formType === "income" ? "default" : "outline"}
                          className="flex-1 gap-2"
                          onClick={() => {
                            setFormType("income");
                            setFormCategory("");
                          }}
                          data-testid="button-type-income"
                        >
                          <TrendingUp className="h-4 w-4" />
                          Entrada
                        </Button>
                        <Button
                          type="button"
                          variant={formType === "expense" ? "default" : "outline"}
                          className="flex-1 gap-2"
                          onClick={() => {
                            setFormType("expense");
                            setFormCategory("");
                          }}
                          data-testid="button-type-expense"
                        >
                          <TrendingDown className="h-4 w-4" />
                          Saida
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Categoria *</Label>
                      <Select value={formCategory} onValueChange={(v) => { setFormCategory(v); setFormMemberId(undefined); setFormReferenceMonth(""); }}>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {needsMemberSelection && members && (
                      <div className="space-y-2">
                        <Label>Membro *</Label>
                        <Select
                          value={formMemberId?.toString() || ""}
                          onValueChange={(v) => setFormMemberId(parseInt(v))}
                        >
                          <SelectTrigger data-testid="select-member">
                            <SelectValue placeholder="Selecione o membro" />
                          </SelectTrigger>
                          <SelectContent>
                            {members.filter(m => formCategory === "events" || m.activeMember).map((m) => (
                              <SelectItem key={m.id} value={m.id.toString()}>
                                {m.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {formCategory === "taxa_ump" && (
                      <div className="space-y-2">
                        <Label>Mes de Referencia</Label>
                        <Select
                          value={formReferenceMonth}
                          onValueChange={setFormReferenceMonth}
                        >
                          <SelectTrigger data-testid="select-reference-month">
                            <SelectValue placeholder="Selecione o mes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Janeiro</SelectItem>
                            <SelectItem value="2">Fevereiro</SelectItem>
                            <SelectItem value="3">Marco</SelectItem>
                            <SelectItem value="4">Abril</SelectItem>
                            <SelectItem value="5">Maio</SelectItem>
                            <SelectItem value="6">Junho</SelectItem>
                            <SelectItem value="7">Julho</SelectItem>
                            <SelectItem value="8">Agosto</SelectItem>
                            <SelectItem value="9">Setembro</SelectItem>
                            <SelectItem value="10">Outubro</SelectItem>
                            <SelectItem value="11">Novembro</SelectItem>
                            <SelectItem value="12">Dezembro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Valor (R$) *</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        data-testid="input-amount"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Descricao</Label>
                      <Textarea
                        placeholder="Descricao da movimentacao..."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className="resize-none"
                        rows={3}
                        data-testid="input-description"
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={createEntryMutation.isPending}
                      data-testid="button-submit-entry"
                    >
                      {createEntryMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Registrar
                    </Button>
                  </DialogFooter>
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
                      placeholder="Buscar por descricao ou pagador..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search-entries"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | "income" | "expense")}>
                      <SelectTrigger className="w-[140px]" data-testid="select-type-filter">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="income">Entradas</SelectItem>
                        <SelectItem value="expense">Saidas</SelectItem>
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
                    ? "Nenhuma movimentacao registrada" 
                    : "Nenhuma movimentacao encontrada com os filtros aplicados"}
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
                  transition={{ delay: 0.05 * Math.min(index, 10) }}
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
                              <span>- {entry.externalPayerName}</span>
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
