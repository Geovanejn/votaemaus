import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Check,
  QrCode,
  Bell,
  BellOff,
  ShoppingBag,
  AlertCircle,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface OrderProduct {
  id: number;
  name: string;
  price: number;
}

interface KitSelection {
  id: number;
  productName: string;
  selectedColor: string | null;
  selectedSize: string | null;
}

interface OrderItem {
  id: number;
  orderId: number;
  itemId: number;
  quantity: number;
  gender: string | null;
  size: string | null;
  color: string | null;
  unitPrice: number;
  product: OrderProduct | null;
  imageUrl: string | null;
  kitSelections: KitSelection[];
}

interface Installment {
  id: number;
  orderId: number;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: string;
  pixCode: string | null;
  pixQrCodeBase64: string | null;
  pixExpiresAt: string | null;
}

interface SharedOrder {
  id: number;
  orderCode: string;
  userId: number;
  totalAmount: number;
  subtotalAmount: number | null;
  promoDiscount: number | null;
  comboDiscount: number | null;
  comboNames: string | null;
  promoCode: string | null;
  paymentStatus: string;
  orderStatus: string;
  installmentCount: number | null;
  observation: string | null;
  shareToken: string | null;
  createdAt: string;
  items: OrderItem[];
  installments: Installment[];
  customerName: string | null;
}

const orderStatusLabels: Record<string, { label: string; color: string; icon: typeof Package }> = {
  awaiting_payment: { label: "Aguardando Pagamento", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  installment_payment: { label: "Pagamento Parcelado", color: "bg-blue-100 text-blue-800", icon: CreditCard },
  paid: { label: "Pago", color: "bg-green-100 text-green-800", icon: CheckCircle },
  producing: { label: "Em Produção", color: "bg-purple-100 text-purple-800", icon: Package },
  ready: { label: "Pronto para Retirada", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
  delivered: { label: "Entregue", color: "bg-gray-100 text-gray-800", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function PedidoCompartilhado() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { toast } = useToast();
  const [pixData, setPixData] = useState<{
    type: string;
    amount: number;
    qrCode: string;
    qrCodeBase64: string;
    expiresAt: string;
    installmentId?: number;
    installmentNumber?: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [notificationState, setNotificationState] = useState<"idle" | "subscribing" | "subscribed" | "denied">("idle");
  const [showInstallments, setShowInstallments] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<{ order: SharedOrder }>({
    queryKey: ["/api/shop/orders/share", token],
    queryFn: async () => {
      const res = await fetch(`/api/shop/orders/share/${token}`);
      if (!res.ok) throw new Error("Pedido não encontrado");
      return res.json();
    },
    enabled: !!token,
    refetchInterval: pixData ? 5000 : false,
  });

  const order = data?.order;

  const generatePixMutation = useMutation({
    mutationFn: async (installmentId?: number) => {
      const res = await fetch(`/api/shop/orders/share/${token}/generate-pix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(installmentId ? { installmentId } : {}),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao gerar PIX");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setPixData(data);
    },
    onError: (err: Error) => {
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!pixData?.expiresAt) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(pixData.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) {
        setPixData(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [pixData?.expiresAt]);

  useEffect(() => {
    if (order && pixData && order.paymentStatus === "paid") {
      setPixData(null);
      toast({
        title: "Pagamento Confirmado!",
        description: "Seu pagamento foi aprovado com sucesso.",
      });
    }
  }, [order?.paymentStatus]);

  const copyPixCode = useCallback(async () => {
    if (!pixData?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      toast({ title: "Código PIX copiado!" });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  }, [pixData?.qrCode]);

  const subscribeToPush = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast({ title: "Notificações não suportadas neste navegador", variant: "destructive" });
      return;
    }

    setNotificationState("subscribing");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotificationState("denied");
        toast({ title: "Permissão de notificação negada", variant: "destructive" });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const vapidKey = envKey || "";
      if (!vapidKey) {
        toast({ title: "Chave de notificação não configurada", variant: "destructive" });
        setNotificationState("idle");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const subJson = subscription.toJSON();
      const res = await fetch(`/api/shop/orders/share/${token}/subscribe-push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        }),
      });

      if (res.ok) {
        setNotificationState("subscribed");
        toast({ title: "Notificações ativadas! Você será avisado sobre atualizações do pedido." });
      } else {
        throw new Error("Falha ao registrar");
      }
    } catch (err) {
      console.error("Push subscription error:", err);
      setNotificationState("idle");
      toast({ title: "Erro ao ativar notificações", variant: "destructive" });
    }
  }, [token]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "denied") {
      setNotificationState("denied");
    }
  }, []);

  const formatMoney = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString("pt-BR");
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4" data-testid="loading-skeleton">
        <div className="max-w-lg mx-auto space-y-4 pt-8">
          <Skeleton className="h-10 w-48 mx-auto" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-700" data-testid="text-error-title">Pedido não encontrado</h2>
            <p className="text-gray-500" data-testid="text-error-message">
              O link que você acessou é inválido ou o pedido não existe mais.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = orderStatusLabels[order.orderStatus] || orderStatusLabels.awaiting_payment;
  const StatusIcon = statusInfo.icon;
  const canPay = order.orderStatus === "awaiting_payment" || order.orderStatus === "installment_payment";
  const isInstallment = (order.installmentCount || 1) > 1;
  const pendingInstallments = order.installments?.filter((i) => i.status !== "paid") || [];
  const paidInstallments = order.installments?.filter((i) => i.status === "paid") || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-gray-800" data-testid="text-page-title">Emaustore</h1>
          </div>
          <p className="text-sm text-gray-500" data-testid="text-order-code">
            Pedido #{order.orderCode}
          </p>
          {order.customerName && (
            <p className="text-sm text-gray-600 font-medium" data-testid="text-customer-name">
              {order.customerName}
            </p>
          )}
        </div>

        <Card className="overflow-hidden" data-testid="card-order-status">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className={cn("w-5 h-5", statusInfo.color.includes("green") ? "text-green-600" : statusInfo.color.includes("yellow") ? "text-yellow-600" : statusInfo.color.includes("red") ? "text-red-600" : statusInfo.color.includes("purple") ? "text-purple-600" : statusInfo.color.includes("blue") ? "text-blue-600" : "text-gray-600")} />
                <span className="font-medium text-gray-700">Status</span>
              </div>
              <Badge className={cn(statusInfo.color, "text-xs")} data-testid="badge-order-status">
                {statusInfo.label}
              </Badge>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Criado em {formatDate(order.createdAt)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-order-items">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Itens do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 items-start" data-testid={`item-order-${item.id}`}>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.product?.name || "Produto"}
                    className="w-14 h-14 rounded-lg object-cover border"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center border">
                    <Package className="w-6 h-6 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 truncate">
                    {item.product?.name || "Produto"}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {item.size && (
                      <span className="text-xs text-gray-500">Tam: {item.size}</span>
                    )}
                    {item.color && (
                      <span className="text-xs text-gray-500">
                        {item.size ? " | " : ""}Cor: {item.color}
                      </span>
                    )}
                    {item.gender && (
                      <span className="text-xs text-gray-500">
                        {(item.size || item.color) ? " | " : ""}{item.gender}
                      </span>
                    )}
                  </div>
                  {item.kitSelections?.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {item.kitSelections.map((ks) => (
                        <p key={ks.id} className="text-xs text-gray-400">
                          {ks.productName}: {ks.selectedColor}{ks.selectedSize ? ` - ${ks.selectedSize}` : ""}
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">{item.quantity}x</span>
                    <span className="text-sm font-medium text-gray-700">
                      {formatMoney(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div className="border-t pt-3 space-y-1">
              {order.subtotalAmount && order.subtotalAmount !== order.totalAmount && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatMoney(order.subtotalAmount)}</span>
                </div>
              )}
              {order.promoDiscount && order.promoDiscount > 0 && (
                <div className="flex justify-between text-xs text-green-600">
                  <span>Desconto{order.promoCode ? ` (${order.promoCode})` : ""}</span>
                  <span>-{formatMoney(order.promoDiscount)}</span>
                </div>
              )}
              {order.comboDiscount && order.comboDiscount > 0 && (
                <div className="flex justify-between text-xs text-green-600">
                  <span>Combo{order.comboNames ? ` (${order.comboNames})` : ""}</span>
                  <span>-{formatMoney(order.comboDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-800" data-testid="text-total-amount">
                <span>Total</span>
                <span>{formatMoney(order.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {isInstallment && order.installments?.length > 0 && (
          <Card data-testid="card-installments">
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowInstallments(!showInstallments)}>
              <CardTitle className="text-sm font-semibold text-gray-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Parcelas ({paidInstallments.length}/{order.installments.length} pagas)
                </div>
                {showInstallments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
            {showInstallments && (
              <CardContent className="space-y-2">
                {order.installments.map((inst) => (
                  <div
                    key={inst.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg text-sm",
                      inst.status === "paid" ? "bg-green-50" : "bg-gray-50"
                    )}
                    data-testid={`installment-${inst.id}`}
                  >
                    <div>
                      <span className="font-medium">
                        Parcela {inst.installmentNumber}/{order.installments.length}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        Vence: {formatDate(inst.dueDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatMoney(inst.amount)}</span>
                      {inst.status === "paid" ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : canPay ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generatePixMutation.mutate(inst.id)}
                          disabled={generatePixMutation.isPending}
                          data-testid={`button-pay-installment-${inst.id}`}
                        >
                          {generatePixMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <QrCode className="w-3 h-3" />
                          )}
                          <span className="ml-1">PIX</span>
                        </Button>
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        )}

        {pixData && (
          <Card className="border-2 border-primary/20" data-testid="card-pix-payment">
            <CardContent className="pt-4 space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-gray-800">
                  {pixData.type === "installment"
                    ? `Pagar Parcela ${pixData.installmentNumber}`
                    : "Pagar Pedido"}
                </h3>
                <p className="text-2xl font-bold text-primary mt-1" data-testid="text-pix-amount">
                  R$ {pixData.amount.toFixed(2).replace(".", ",")}
                </p>
              </div>

              {pixData.qrCodeBase64 && (
                <div className="flex justify-center">
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 rounded-lg"
                    data-testid="img-pix-qr"
                  />
                </div>
              )}

              <Button
                onClick={copyPixCode}
                variant="outline"
                className="w-full"
                data-testid="button-copy-pix"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar código PIX
                  </>
                )}
              </Button>

              <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                Expira em {formatTime(timeLeft)}
              </div>
            </CardContent>
          </Card>
        )}

        {canPay && !isInstallment && !pixData && (
          <Button
            onClick={() => generatePixMutation.mutate()}
            disabled={generatePixMutation.isPending}
            className="w-full h-12 text-base"
            data-testid="button-generate-pix"
          >
            {generatePixMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Gerando PIX...
              </>
            ) : (
              <>
                <QrCode className="w-5 h-5 mr-2" />
                Pagar com PIX
              </>
            )}
          </Button>
        )}

        {notificationState !== "subscribed" && notificationState !== "denied" && (
          <Card className="bg-blue-50/50 border-blue-100" data-testid="card-notification-prompt">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    Receba atualizações do pedido
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Saiba quando o pagamento for confirmado e o pedido ficar pronto.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={subscribeToPush}
                    disabled={notificationState === "subscribing"}
                    data-testid="button-enable-notifications"
                  >
                    {notificationState === "subscribing" ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Bell className="w-3 h-3 mr-1" />
                    )}
                    Ativar notificações
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {notificationState === "subscribed" && (
          <div className="flex items-center justify-center gap-2 text-xs text-green-600" data-testid="text-notifications-active">
            <CheckCircle className="w-3 h-3" />
            Notificações ativadas
          </div>
        )}

        {notificationState === "denied" && (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400" data-testid="text-notifications-denied">
            <BellOff className="w-3 h-3" />
            Notificações bloqueadas no navegador
          </div>
        )}

        <div className="text-center text-xs text-gray-400 pt-4 pb-6">
          UMP Emaús - Emaustore
        </div>
      </div>
    </div>
  );
}