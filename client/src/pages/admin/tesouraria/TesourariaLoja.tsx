import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  ShoppingBag, 
  Search,
  Package,
  Loader2,
  CheckCircle2,
  Clock,
  Wrench,
  PackageCheck
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { ShopOrderWithItems } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  awaiting_payment: { label: "Aguardando Pagamento", icon: Clock, variant: "secondary", color: "text-yellow-600" },
  paid: { label: "Pago", icon: CheckCircle2, variant: "default", color: "text-green-600" },
  producing: { label: "Em Produção", icon: Wrench, variant: "outline", color: "text-blue-600" },
  ready: { label: "Pronto", icon: PackageCheck, variant: "outline", color: "text-purple-600" },
};

export default function TesourariaLoja() {
  const { hasTreasuryPanel } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: orders, isLoading } = useQuery<ShopOrderWithItems[]>({
    queryKey: ["/api/treasury/shop/orders"],
    enabled: hasTreasuryPanel,
  });

  if (!hasTreasuryPanel) {
    setLocation("/admin");
    return null;
  }

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch = !searchTerm || 
      order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  }) ?? [];

  const orderCounts = {
    all: orders?.length ?? 0,
    awaiting_payment: orders?.filter(o => o.orderStatus === "awaiting_payment").length ?? 0,
    paid: orders?.filter(o => o.orderStatus === "paid").length ?? 0,
    producing: orders?.filter(o => o.orderStatus === "producing").length ?? 0,
    ready: orders?.filter(o => o.orderStatus === "ready").length ?? 0,
  };

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
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-shop-title">
                  Loja Virtual - Pedidos
                </h1>
                <p className="text-white/80">
                  Acompanhe os pedidos e pagamentos
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-6 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {Object.entries(statusConfig).map(([key, config], index) => {
              const StatusIcon = config.icon;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card 
                    className={`cursor-pointer hover-elevate ${statusFilter === key ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setStatusFilter(key)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`p-2 rounded-full bg-muted ${config.color}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{orderCounts[key as keyof typeof orderCounts] ?? 0}</div>
                        <p className="text-xs text-muted-foreground">{config.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <CardTitle>Pedidos</CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por código ou nome..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search-orders"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {orders?.length === 0 
                        ? "Nenhum pedido registrado" 
                        : "Nenhum pedido encontrado"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((order) => {
                      const config = statusConfig[order.orderStatus] ?? statusConfig.awaiting_payment;
                      const StatusIcon = config.icon;
                      return (
                        <Card key={order.id} className="hover-elevate" data-testid={`order-card-${order.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={order.user?.photoUrl ?? undefined} />
                                <AvatarFallback>
                                  {order.user?.fullName?.slice(0, 2).toUpperCase() ?? "??"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-sm font-medium">
                                    #{order.orderCode}
                                  </span>
                                  <Badge variant={config.variant} className="gap-1">
                                    <StatusIcon className="h-3 w-3" />
                                    {config.label}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {order.user?.fullName} • {order.items?.length ?? 0} item(s)
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {order.createdAt && format(new Date(order.createdAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">
                                  {formatCurrency(order.totalAmount)}
                                </div>
                                {order.orderStatus !== "ready" && order.orderStatus !== "awaiting_payment" && (
                                  <Button size="sm" variant="outline" className="mt-2">
                                    Atualizar Status
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
