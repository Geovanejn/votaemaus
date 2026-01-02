import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Wallet, 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  Receipt,
  FileText,
  Settings,
  Bell,
  CreditCard,
  Landmark,
  AlertTriangle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { TreasuryDashboardSummary } from "@shared/schema";

const menuItems = [
  {
    id: "entradas-saidas",
    title: "Entradas e Saídas",
    description: "Registrar e visualizar movimentações financeiras",
    icon: Receipt,
    href: "/admin/tesouraria/movimentacoes",
    color: "text-green-600 dark:text-green-400",
  },
  {
    id: "taxas",
    title: "Taxas dos Membros",
    description: "Gerenciar Percapta e Taxa UMP",
    icon: CreditCard,
    href: "/admin/tesouraria/taxas",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "emprestimos",
    title: "Empréstimos",
    description: "Controlar empréstimos e parcelas",
    icon: Landmark,
    href: "/admin/tesouraria/emprestimos",
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    id: "relatorios",
    title: "Relatórios",
    description: "Gerar relatórios financeiros",
    icon: FileText,
    href: "/admin/tesouraria/relatorios",
    color: "text-cyan-600 dark:text-cyan-400",
  },
  {
    id: "configuracoes",
    title: "Configurações",
    description: "Valores anuais e chave PIX",
    icon: Settings,
    href: "/admin/tesouraria/configuracoes",
    color: "text-gray-600 dark:text-gray-400",
  },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

export default function TesourariaDashboard() {
  const { user, hasTreasuryPanel } = useAuth();
  const [, setLocation] = useLocation();

  const { data: summary, isLoading } = useQuery<TreasuryDashboardSummary>({
    queryKey: ["/api/treasury/dashboard/summary"],
    enabled: hasTreasuryPanel,
  });

  if (!hasTreasuryPanel) {
    setLocation("/admin");
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-amber-600 via-orange-600 to-orange-700 text-white py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href="/admin">
              <Button 
                variant="ghost" 
                className="mb-4 text-white/80 gap-2"
                data-testid="button-back-admin"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Admin
              </Button>
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                <Wallet className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-treasury-title">
                  Tesouraria
                </h1>
                <p className="text-white/80">
                  Gestão Financeira - {currentYear}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Entradas
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600" data-testid="text-total-income">
                    {isLoading ? "..." : formatCurrency(summary?.totalIncome ?? 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total do ano
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Saídas
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600" data-testid="text-total-expense">
                    {isLoading ? "..." : formatCurrency(summary?.totalExpense ?? 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total do ano
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Saldo
                  </CardTitle>
                  <Wallet className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div 
                    className={`text-2xl font-bold ${
                      (summary?.balance ?? 0) >= 0 ? "text-primary" : "text-red-600"
                    }`}
                    data-testid="text-balance"
                  >
                    {isLoading ? "..." : formatCurrency(summary?.balance ?? 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Atual
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Membros
                  </CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-600" data-testid="text-members-uptodate">
                      {isLoading ? "..." : summary?.membersUpToDate ?? 0}
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-lg text-red-600" data-testid="text-members-overdue">
                      {isLoading ? "..." : summary?.membersOverdue ?? 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Em dia / Pendentes
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {(summary?.pendingLoans ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
                <CardContent className="flex items-center gap-4 p-4">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      {summary?.pendingLoans} empréstimo(s) ativo(s)
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      {summary?.pendingInstallments} parcela(s) pendente(s) de pagamento
                    </p>
                  </div>
                  <Link href="/admin/tesouraria/emprestimos">
                    <Button variant="outline" size="sm" data-testid="button-view-loans">
                      Ver Detalhes
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 4) }}
              >
                <Link href={item.href}>
                  <Card className="hover-elevate cursor-pointer h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg bg-muted ${item.color}`}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1" data-testid={`menu-title-${item.id}`}>
                            {item.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
