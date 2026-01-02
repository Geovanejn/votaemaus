import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/study";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PixPaymentModal } from "@/components/PixPaymentModal";
import { 
  ChevronLeft,
  Wallet,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Calendar,
  TrendingUp,
  Loader2,
  QrCode
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MemberFinancialStatus {
  memberId: number;
  memberName: string;
  year: number;
  percaptaStatus: {
    amount: number;
    paidAmount: number;
    isPaid: boolean;
    dueDate: string | null;
  };
  umpStatus: {
    monthlyAmount: number;
    paidMonths: number[];
    unpaidMonths: number[];
    totalOwed: number;
    totalPaid: number;
  };
  totalOwed: number;
  transactions: {
    id: number;
    type: string;
    amount: number;
    description: string;
    status: string;
    createdAt: string;
  }[];
}

interface MemberEvent {
  id: number;
  eventId: number;
  eventName: string;
  eventDate: string | null;
  eventImageUrl: string | null;
  isVisitor: boolean;
  visitorCount: number;
  confirmedAt: string | null;
  totalAmount: number;
  hasFee: boolean;
  isPaid: boolean;
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export default function FinanceiroPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixPaymentData, setPixPaymentData] = useState<{
    entryId: number;
    amount: number;
    description: string;
  } | null>(null);

  const { data: financial, isLoading, error, refetch } = useQuery<MemberFinancialStatus>({
    queryKey: ["/api/treasury/member/status", currentYear],
    enabled: isAuthenticated,
  });

  const { data: memberEvents, isLoading: isLoadingEvents, refetch: refetchEvents } = useQuery<MemberEvent[]>({
    queryKey: [`/api/treasury/member/events?year=${currentYear}`],
    enabled: isAuthenticated,
  });

  const { data: pixStatus } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/pix/status"],
    enabled: isAuthenticated,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (params: { type: "percapta" | "ump"; months?: number[] }) => {
      const res = await apiRequest("POST", "/api/pix/member-fee", {
        type: params.type,
        year: currentYear,
        months: params.months,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setPixPaymentData({
        entryId: data.entryId,
        amount: data.amount,
        description: data.type === "percapta" ? `Taxa Percapta ${currentYear}` : `Taxa UMP ${currentYear}`,
      });
      setPixModalOpen(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao gerar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePayPercapta = () => {
    if (!pixStatus?.configured) {
      toast({
        title: "PIX não configurado",
        description: "Sistema de pagamento PIX ainda não está disponível.",
        variant: "destructive",
      });
      return;
    }
    createPaymentMutation.mutate({ type: "percapta" });
  };

  const handlePayUmp = () => {
    if (!pixStatus?.configured) {
      toast({
        title: "PIX não configurado",
        description: "Sistema de pagamento PIX ainda não está disponível.",
        variant: "destructive",
      });
      return;
    }
    if (!financial) return;
    createPaymentMutation.mutate({ type: "ump", months: financial.umpStatus.unpaidMonths });
  };

  const handlePaymentComplete = () => {
    refetch();
    refetchEvents();
    setPixModalOpen(false);
    setPixPaymentData(null);
  };

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const paidPercentage = financial 
    ? ((financial.umpStatus.paidMonths.length / 12) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white py-6">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href="/study/profile">
              <Button 
                variant="ghost" 
                className="mb-2 text-white/80 gap-2"
                data-testid="button-back-profile"
              >
                <ChevronLeft className="h-4 w-4" />
                Perfil
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-financeiro-title">
                  Meu Financeiro
                </h1>
                <p className="text-white/80">
                  Taxas e contribuições - {currentYear}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-6">
        <div className="container mx-auto px-4 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Não foi possível carregar suas informações financeiras.
                </p>
              </CardContent>
            </Card>
          ) : financial ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={cn(
                  financial.totalOwed === 0 
                    ? "bg-green-50 dark:bg-green-900/20" 
                    : "bg-amber-50 dark:bg-amber-900/20"
                )}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Situação Atual</p>
                        <p className="text-2xl font-bold">
                          {financial.totalOwed === 0 ? (
                            <span className="text-green-600 dark:text-green-400">Em dia</span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400">
                              {formatCurrency(financial.totalOwed)} pendente
                            </span>
                          )}
                        </p>
                      </div>
                      {financial.totalOwed === 0 ? (
                        <CheckCircle className="h-10 w-10 text-green-500" />
                      ) : (
                        <Clock className="h-10 w-10 text-amber-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">Taxa Percapta</CardTitle>
                      <Badge 
                        variant={financial.percaptaStatus.isPaid ? "default" : "secondary"}
                        data-testid="badge-percapta-status"
                      >
                        {financial.percaptaStatus.isPaid ? "Pago" : "Pendente"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Taxa anual obrigatória
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Valor anual:</span>
                      <span className="font-medium">
                        {formatCurrency(financial.percaptaStatus.amount)}
                      </span>
                    </div>
                    {!financial.percaptaStatus.isPaid && (
                      <Button 
                        className="w-full gap-2"
                        onClick={handlePayPercapta}
                        disabled={createPaymentMutation.isPending}
                        data-testid="button-pay-percapta"
                      >
                        {createPaymentMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <QrCode className="h-4 w-4" />
                        )}
                        Pagar via PIX
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">Taxa UMP Emaús</CardTitle>
                      <Badge 
                        variant={financial.umpStatus.unpaidMonths.length === 0 ? "default" : "secondary"}
                        data-testid="badge-ump-status"
                      >
                        {financial.umpStatus.paidMonths.length}/12 meses
                      </Badge>
                    </div>
                    <CardDescription>
                      Contribuição mensal - {formatCurrency(financial.umpStatus.monthlyAmount)}/mês
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progresso anual</span>
                        <span className="font-medium">{Math.round(paidPercentage)}%</span>
                      </div>
                      <Progress value={paidPercentage} className="h-2" />
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                      {monthNames.map((month, index) => {
                        const monthNum = index + 1;
                        const isPaid = financial.umpStatus.paidMonths.includes(monthNum);
                        const currentMonth = new Date().getMonth() + 1;
                        const isFuture = monthNum > currentMonth;

                        return (
                          <div
                            key={month}
                            className={cn(
                              "p-2 rounded-md text-center text-xs font-medium",
                              isPaid && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                              !isPaid && !isFuture && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                              isFuture && !isPaid && "bg-muted text-muted-foreground"
                            )}
                            data-testid={`month-status-${monthNum}`}
                          >
                            {month}
                            <div className="mt-1">
                              {isPaid ? (
                                <CheckCircle className="h-3 w-3 mx-auto" />
                              ) : isFuture ? (
                                <Clock className="h-3 w-3 mx-auto opacity-50" />
                              ) : (
                                <AlertCircle className="h-3 w-3 mx-auto" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {financial.umpStatus.totalOwed > 0 && (
                      <div className="pt-2 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total pendente:</span>
                          <span className="font-medium text-amber-600 dark:text-amber-400">
                            {formatCurrency(financial.umpStatus.totalOwed)}
                          </span>
                        </div>
                        <Button 
                          className="w-full gap-2"
                          onClick={handlePayUmp}
                          disabled={createPaymentMutation.isPending}
                          data-testid="button-pay-ump"
                        >
                          {createPaymentMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <QrCode className="h-4 w-4" />
                          )}
                          Pagar meses pendentes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Histórico de Pagamentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {financial.transactions.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum pagamento registrado</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {financial.transactions.map((tx) => (
                          <div 
                            key={tx.id}
                            className="flex items-center justify-between py-2 border-b last:border-0"
                            data-testid={`transaction-${tx.id}`}
                          >
                            <div>
                              <p className="font-medium text-sm">{tx.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(tx.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-green-600 dark:text-green-400">
                                {formatCurrency(tx.amount)}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {tx.status === "completed" ? "Confirmado" : tx.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Eventos com Taxa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingEvents ? (
                      <div className="space-y-2">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : !memberEvents || memberEvents.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma inscricao em eventos</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {memberEvents.map((event) => (
                          <div 
                            key={event.id}
                            className="flex items-center justify-between py-2 border-b last:border-0"
                            data-testid={`member-event-${event.id}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{event.eventName}</p>
                              <p className="text-xs text-muted-foreground">
                                {event.eventDate ? formatDate(event.eventDate) : "Sem data"}
                                {event.visitorCount > 0 && (
                                  <span className="ml-2">+ {event.visitorCount} visitante(s)</span>
                                )}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              {event.hasFee && event.totalAmount > 0 ? (
                                <>
                                  <p className="font-medium text-sm">
                                    {formatCurrency(event.totalAmount)}
                                  </p>
                                  <Badge 
                                    variant={event.isPaid ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {event.isPaid ? "Pago" : "Pendente"}
                                  </Badge>
                                </>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Sem taxa
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Suas informações financeiras ainda não foram configuradas.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <BottomNav />

      {pixPaymentData && (
        <PixPaymentModal
          open={pixModalOpen}
          onOpenChange={setPixModalOpen}
          entryId={pixPaymentData.entryId}
          amount={pixPaymentData.amount}
          description={pixPaymentData.description}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
