import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import umpLogoWhite from "@assets/2-1_1766464654126.png";
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
  AlertCircle,
  CreditCard,
  ChevronDown,
  ChevronUp,
  X,
  Truck,
  Timer,
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
  isKit?: boolean;
}

interface KitSelection {
  id: number;
  componentName: string;
  color: string | null;
  size: string | null;
  quantity: number;
}

interface OrderItem {
  id: number;
  orderId: number;
  itemId: number;
  quantity: number;
  gender: string | null;
  size: string | null;
  color: string | null;
  colorId: number | null;
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

interface ComboDetail {
  name: string;
  discount: number;
}

interface SharedOrder {
  id: number;
  orderCode: string;
  totalAmount: number;
  subtotalAmount: number | null;
  promoDiscount: number | null;
  comboDiscount: number | null;
  comboNames: string | null;
  comboDetails?: ComboDetail[];
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

const orderStatusLabels: Record<string, { label: string; color: string; bgColor: string; icon: typeof Package }> = {
  awaiting_payment: { label: "Aguardando Pagamento", color: "text-yellow-700", bgColor: "bg-yellow-50 border-yellow-200", icon: Clock },
  installment_payment: { label: "Pagamento Parcelado", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200", icon: CreditCard },
  paid: { label: "Pago", color: "text-green-700", bgColor: "bg-green-50 border-green-200", icon: CheckCircle },
  producing: { label: "Em Produção", color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200", icon: Package },
  ready: { label: "Pronto para Retirada", color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200", icon: Truck },
  delivered: { label: "Entregue", color: "text-gray-700", bgColor: "bg-gray-50 border-gray-200", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "text-red-700", bgColor: "bg-red-50 border-red-200", icon: XCircle },
};

let cachedVapidKey: string | null = null;

async function getVapidPublicKey(): Promise<string> {
  if (cachedVapidKey) return cachedVapidKey;
  const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (envKey) {
    cachedVapidKey = envKey;
    return envKey;
  }
  try {
    const response = await fetch('/api/push/vapid-key');
    if (response.ok) {
      const data = await response.json();
      if (data.publicKey) {
        cachedVapidKey = data.publicKey;
        return data.publicKey;
      }
    }
  } catch (e) {
    console.error('[Push] Failed to fetch VAPID key:', e);
  }
  return '';
}

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
  const [showPixModal, setShowPixModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [notificationState, setNotificationState] = useState<"idle" | "subscribing" | "subscribed" | "denied" | "syncing">("idle");
  const [showInstallments, setShowInstallments] = useState(false);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const notifPromptShown = useRef(false);

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

  useEffect(() => {
    if (!order || notifPromptShown.current) return;
    notifPromptShown.current = true;

    const initPushState = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return;
      }

      if (Notification.permission === "denied") {
        setNotificationState("denied");
        return;
      }

      if (Notification.permission === "granted") {
        setNotificationState("syncing");
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            const subJson = subscription.toJSON();
            if (subJson.keys?.p256dh && subJson.keys?.auth) {
              const res = await fetch(`/api/shop/orders/share/${token}/subscribe-push`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  endpoint: subJson.endpoint,
                  p256dh: subJson.keys.p256dh,
                  auth: subJson.keys.auth,
                }),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.anonymousId) {
                  localStorage.setItem('anonymous_push_subscription_id', data.anonymousId.toString());
                  localStorage.setItem('unified_notification_subscribed', 'true');
                }
                setNotificationState("subscribed");
                return;
              }
            }
          }
          setShowNotifPopup(true);
          setNotificationState("idle");
        } catch {
          setShowNotifPopup(true);
          setNotificationState("idle");
        }
      } else {
        const timer = setTimeout(() => {
          setShowNotifPopup(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    };

    initPushState();
  }, [order, token]);

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
      setShowPixModal(true);
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
        setShowPixModal(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [pixData?.expiresAt]);

  useEffect(() => {
    if (order && pixData && order.paymentStatus === "paid") {
      setPixData(null);
      setShowPixModal(false);
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
      const vapidKey = await getVapidPublicKey();
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
        const data = await res.json();
        if (data.anonymousId) {
          localStorage.setItem('anonymous_push_subscription_id', data.anonymousId.toString());
          localStorage.setItem('unified_notification_subscribed', 'true');
        }
        setNotificationState("subscribed");
        setShowNotifPopup(false);
        toast({ title: "Notifica\u00e7\u00f5es ativadas!", description: "Voc\u00ea ser\u00e1 avisado sobre atualiza\u00e7\u00f5es do pedido e conte\u00fados da UMP." });
      } else {
        throw new Error("Falha ao registrar");
      }
    } catch (err) {
      console.error("Push subscription error:", err);
      setNotificationState("idle");
      toast({ title: "Erro ao ativar notificações", variant: "destructive" });
    }
  }, [token]);

  const formatMoney = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString("pt-BR");
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="dark min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100 p-4" data-testid="loading-skeleton">
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
      <div className="dark min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center shadow-lg bg-white rounded-xl border">
          <div className="pt-8 pb-6 px-6 space-y-4">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-700" data-testid="text-error-title">Pedido não encontrado</h2>
            <p className="text-gray-500" data-testid="text-error-message">
              O link que você acessou é inválido ou o pedido não existe mais.
            </p>
          </div>
        </div>
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
    <div className="dark min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100">
      {showNotifPopup && notificationState !== "subscribed" && notificationState !== "denied" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowNotifPopup(false)}>
          <div 
            className="bg-gray-800 border border-gray-700 w-full sm:w-auto sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 sm:animate-in sm:fade-in sm:zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-900/40 flex items-center justify-center">
                <Bell className="w-6 h-6 text-amber-400" />
              </div>
              <button 
                onClick={() => setShowNotifPopup(false)} 
                className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                data-testid="button-close-notif-popup"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <h3 className="text-lg font-bold text-gray-100 mb-1">
              Ative as notificações
            </h3>
            <p className="text-sm text-gray-400 mb-5">
              Receba alertas quando seu pagamento for confirmado, quando o pedido entrar em produção e quando estiver pronto para retirada.
            </p>
            <Button
              onClick={subscribeToPush}
              disabled={notificationState === "subscribing"}
              className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl"
              data-testid="button-popup-enable-notifications"
            >
              {notificationState === "subscribing" ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Bell className="w-5 h-5 mr-2" />
              )}
              Ativar notificações
            </Button>
            <button 
              onClick={() => setShowNotifPopup(false)}
              className="w-full mt-3 text-sm text-gray-500 hover:text-gray-300 transition-colors py-2"
              data-testid="button-dismiss-notif-popup"
            >
              Agora não
            </button>
          </div>
        </div>
      )}

      {showPixModal && pixData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowPixModal(false)}>
          <div 
            className="bg-gray-800 border border-gray-700 w-full sm:w-auto sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 sm:animate-in sm:fade-in sm:zoom-in-95 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-100">
                  {pixData.type === "installment"
                    ? `Pagar Parcela ${pixData.installmentNumber}`
                    : "Pagar Pedido"}
                </h3>
                <button
                  onClick={() => setShowPixModal(false)}
                  className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                  data-testid="button-close-pix-modal"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="text-center py-2">
                <p className="text-3xl font-bold text-amber-600" data-testid="text-pix-amount">
                  R$ {pixData.amount.toFixed(2).replace(".", ",")}
                </p>
              </div>

              {pixData.qrCodeBase64 && (
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl border-2 border-gray-600">
                    <img
                      src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                      alt="QR Code PIX"
                      className="w-52 h-52 sm:w-56 sm:h-56"
                      data-testid="img-pix-qr"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={copyPixCode}
                variant="outline"
                className="w-full h-12 rounded-xl font-medium"
                data-testid="button-copy-pix"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 mr-2 text-green-500" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2" />
                    Copiar código PIX
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-400 pb-2">
                <Timer className="w-4 h-4" />
                Expira em {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="text-center space-y-2 pb-1">
          <img 
            src="/emaustore-logo-dark.png" 
            alt="Ema\u00fastore" 
            className="h-8 w-auto mx-auto"
            data-testid="img-emaustore-logo"
          />
          <p className="text-sm text-gray-400" data-testid="text-order-code">
            Pedido #{order.orderCode}
          </p>
          {order.customerName && (
            <p className="text-base text-gray-200 font-semibold" data-testid="text-customer-name">
              {order.customerName}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" data-testid="card-order-status">
          <div className="pt-4 pb-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className={cn("w-5 h-5", statusInfo.color)} />
                <span className="font-medium text-blue-600">Status</span>
              </div>
              <Badge className={cn("text-xs font-semibold px-3 py-1", statusInfo.bgColor, statusInfo.color, "border")} data-testid="badge-order-status">
                {statusInfo.label}
              </Badge>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Criado em {formatDate(order.createdAt)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" data-testid="card-order-items">
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Itens do Pedido
            </h3>
          </div>
          <div className="px-4 pb-4 space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 items-start" data-testid={`item-order-${item.id}`}>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.product?.name || "Produto"}
                    className="w-16 h-16 rounded-xl object-cover border flex-shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center border flex-shrink-0">
                    <Package className="w-7 h-7 text-amber-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800">
                    {item.product?.name || "Produto"}
                  </p>
                  
                  {!item.product?.isKit && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {item.size && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Tam: {item.size}</span>
                      )}
                      {item.color && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Cor: {item.color}</span>
                      )}
                      {item.gender && item.gender !== "unissex" && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {item.gender === "male" ? "Masculino" : item.gender === "female" ? "Feminino" : item.gender}
                        </span>
                      )}
                    </div>
                  )}

                  {item.kitSelections && item.kitSelections.length > 0 && (
                    <div className="mt-1.5 space-y-1 pl-2 border-l-2 border-amber-200">
                      {item.kitSelections.map((ks) => (
                        <div key={ks.id} className="text-xs text-gray-600">
                          <span className="font-medium text-gray-700">{ks.quantity}x {ks.componentName}</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {ks.size && (
                              <span className="text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">Tam: {ks.size}</span>
                            )}
                            {ks.color && (
                              <span className="text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">Cor: {ks.color}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-1.5">
                    {!item.kitSelections?.length && (
                      <span className="text-xs text-gray-400 font-medium">{item.quantity}x</span>
                    )}
                    {item.kitSelections?.length > 0 && <span />}
                    <span className="text-sm font-bold text-gray-700">
                      {formatMoney(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div className="border-t pt-3 space-y-1.5">
              {(order.subtotalAmount != null && order.subtotalAmount > 0 && order.subtotalAmount !== order.totalAmount) && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatMoney(order.subtotalAmount)}</span>
                </div>
              )}
              {(order.promoDiscount != null && order.promoDiscount > 0) && (
                <div className="flex justify-between text-xs text-green-600">
                  <span>Desconto{order.promoCode ? ` (${order.promoCode})` : ""}</span>
                  <span>-{formatMoney(order.promoDiscount)}</span>
                </div>
              )}
              {order.comboDetails && order.comboDetails.length > 0 ? (
                order.comboDetails.map((combo, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-green-600">
                    <span>Combo ({combo.name})</span>
                    <span>-{formatMoney(combo.discount)}</span>
                  </div>
                ))
              ) : (
                (order.comboDiscount != null && order.comboDiscount > 0) && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Combo{order.comboNames ? ` (${order.comboNames})` : ""}</span>
                    <span>-{formatMoney(order.comboDiscount)}</span>
                  </div>
                )
              )}
              <div className="flex justify-between font-bold text-gray-800 text-base pt-1" data-testid="text-total-amount">
                <span>Total</span>
                <span>{formatMoney(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {isInstallment && order.installments?.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden" data-testid="card-installments">
            <div className="px-4 pt-4 pb-2 cursor-pointer" onClick={() => setShowInstallments(!showInstallments)}>
              <h3 className="text-sm font-semibold text-gray-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Parcelas ({paidInstallments.length}/{order.installments.length} pagas)
                </div>
                {showInstallments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </h3>
            </div>
            {showInstallments && (
              <div className="px-4 pb-4 space-y-2">
                {order.installments.map((inst) => (
                  <div
                    key={inst.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl text-sm",
                      inst.status === "paid" ? "bg-green-50 border border-green-100" : "bg-gray-50 border border-gray-100"
                    )}
                    data-testid={`installment-${inst.id}`}
                  >
                    <div>
                      <span className="font-semibold block text-gray-800">
                        Parcela {inst.installmentNumber}/{order.installments.length}
                      </span>
                      <span className="text-xs text-gray-400">
                        Vence: {formatDate(inst.dueDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-700">{formatMoney(inst.amount)}</span>
                      {inst.status === "paid" ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : canPay ? (
                        <Button
                          size="sm"
                          className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3"
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
              </div>
            )}
          </div>
        )}

        {canPay && !isInstallment && (
          <Button
            onClick={() => generatePixMutation.mutate()}
            disabled={generatePixMutation.isPending}
            className="w-full h-14 text-base font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-900/50"
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

        {notificationState === "subscribed" && (
          <div className="flex items-center justify-center gap-2 text-xs text-green-600 py-2" data-testid="text-notifications-active">
            <CheckCircle className="w-4 h-4" />
            Notificações ativadas
          </div>
        )}

        {notificationState !== "subscribed" && notificationState !== "denied" && notificationState !== "syncing" && (
          <button
            onClick={() => setShowNotifPopup(true)}
            className="w-full flex items-center justify-center gap-2 text-sm text-amber-600 hover:text-amber-700 py-3 transition-colors"
            data-testid="button-show-notif-prompt"
          >
            <Bell className="w-4 h-4" />
            Ativar notificações do pedido
          </button>
        )}

        {notificationState === "denied" && (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 py-2" data-testid="text-notifications-denied">
            <BellOff className="w-3 h-3" />
            Notificações bloqueadas no navegador
          </div>
        )}

        <div className="text-center text-xs text-gray-400 pt-0 pb-4 -mt-2">
          <img 
            src={umpLogoWhite}
            alt="Logo UMP Ema\u00fas" 
            className="h-[147px] w-auto mx-auto opacity-60 object-contain"
          />
        </div>
      </div>
    </div>
  );
}