import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Landmark, 
  Plus,
  Calendar,
  Loader2,
  ChevronRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { TreasuryLoan, TreasuryLoanInstallment } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type LoanWithInstallments = TreasuryLoan & {
  installments: TreasuryLoanInstallment[];
  originMemberName?: string;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

const originLabels: Record<string, string> = {
  church: "Igreja",
  member: "Membro",
  federation: "Federação",
  other: "Outro",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Ativo", variant: "default" },
  paid: { label: "Quitado", variant: "outline" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  pending: { label: "Pendente", variant: "secondary" },
};

export default function TesourariaEmprestimos() {
  const { hasTreasuryPanel } = useAuth();
  const [, setLocation] = useLocation();

  const { data: loans, isLoading } = useQuery<LoanWithInstallments[]>({
    queryKey: ["/api/treasury/loans"],
    enabled: hasTreasuryPanel,
  });

  if (!hasTreasuryPanel) {
    setLocation("/admin");
    return null;
  }

  const activeLoans = loans?.filter(l => l.status === "active") ?? [];
  const totalActive = activeLoans.reduce((sum, l) => sum + l.totalAmount, 0);
  const pendingInstallments = activeLoans.flatMap(l => 
    l.installments.filter(i => i.status === "pending")
  );

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
                  <Landmark className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-loans-title">
                    Empréstimos
                  </h1>
                  <p className="text-white/80">
                    Controle de empréstimos e parcelas
                  </p>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-white/20" data-testid="button-new-loan">
                    <Plus className="h-4 w-4" />
                    Novo Empréstimo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Empréstimo</DialogTitle>
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
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Empréstimos Ativos</div>
                  <div className="text-2xl font-bold">{activeLoans.length}</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Total a Pagar</div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalActive)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Parcelas Pendentes</div>
                  <div className="text-2xl font-bold">{pendingInstallments.length}</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !loans || loans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Landmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum empréstimo registrado
                </p>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Empréstimos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="space-y-2">
                    {loans.map((loan) => (
                      <AccordionItem 
                        key={loan.id} 
                        value={`loan-${loan.id}`}
                        className="border rounded-lg px-4"
                        data-testid={`loan-item-${loan.id}`}
                      >
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-4 flex-1 text-left">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">
                                  {loan.originName || originLabels[loan.origin] || loan.origin}
                                </span>
                                <Badge variant={statusLabels[loan.status]?.variant ?? "secondary"}>
                                  {statusLabels[loan.status]?.label ?? loan.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {loan.description || `Origem: ${originLabels[loan.origin]}`}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-red-600">
                                {formatCurrency(loan.totalAmount)}
                              </div>
                              {loan.isInstallment && (
                                <div className="text-xs text-muted-foreground">
                                  {loan.installmentCount}x de {formatCurrency(loan.installmentAmount ?? 0)}
                                </div>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4">
                          {loan.installments && loan.installments.length > 0 ? (
                            <div className="space-y-2 mt-2">
                              <div className="text-sm font-medium text-muted-foreground mb-3">
                                Parcelas
                              </div>
                              {loan.installments.map((installment) => (
                                <div 
                                  key={installment.id}
                                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="text-sm font-medium">
                                      Parcela {installment.installmentNumber}
                                    </div>
                                    <Badge 
                                      variant={statusLabels[installment.status]?.variant ?? "secondary"}
                                      className="text-xs"
                                    >
                                      {statusLabels[installment.status]?.label ?? installment.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      {installment.dueDate && format(new Date(installment.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                                    </div>
                                    <div className="font-medium">
                                      {formatCurrency(installment.amount)}
                                    </div>
                                    {installment.status === "pending" && (
                                      <Button size="sm" variant="outline">
                                        Pagar
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Pagamento único - sem parcelas
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
