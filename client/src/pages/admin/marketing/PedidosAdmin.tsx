import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Package, 
  Search,
  Loader2,
  ShoppingBag,
  User,
  Calendar,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  RefreshCw,
  Eye,
  Filter,
  Plus,
  Trash2,
  Tag,
  Percent,
  Pencil,
  FileText,
  Share2,
  Copy,
  CreditCard
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Member {
  id: number;
  fullName: string;
  email: string;
}

interface ShopProductColor {
  id: number;
  itemId: number;
  name: string;
  hexCode: string;
  sortOrder: number;
  isAvailable: boolean;
}

interface ShopProductSize {
  id: number;
  itemId: number;
  gender: string;
  size: string;
  sortOrder: number;
}

interface ShopProduct {
  id: number;
  name: string;
  price: number;
  genderType: string;
  hasSize: boolean;
  isKit: boolean;
  allowInstallments?: boolean;
  maxInstallments?: number | null;
  sizes?: ShopProductSize[] | null;
  colors?: ShopProductColor[] | null;
  kitComponents?: KitComponentData[];
}

interface KitComponentData {
  id: number;
  kitItemId: number;
  componentItemId: number;
  quantity: number;
  sortOrder: number;
  componentItem: {
    id: number;
    name: string;
    price: number;
    hasSize: boolean;
    genderType: string;
  };
  sizes: Array<{ id: number; itemId: number; gender: string; size: string; sortOrder: number }>;
  colors: Array<{ id: number; itemId: number; name: string; hexCode: string; sortOrder: number; isAvailable: boolean }>;
}

interface OrderUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
}

interface OrderItemProduct {
  id: number;
  name: string;
  price: number;
  firstImage?: string | null;
}

interface KitSelectionData {
  id: number;
  componentId: number;
  componentName: string;
  quantity: number;
  size: string | null;
  color: string | null;
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
  product: OrderItemProduct | null;
  kitSelections?: KitSelectionData[];
}

interface ShopOrder {
  id: number;
  orderCode: string;
  userId: number;
  totalAmount: number;
  subtotalAmount?: number | null;
  promoDiscount?: number | null;
  promoCode?: string | null;
  comboDiscount?: number | null;
  comboNames?: string | null;
  observation: string | null;
  paymentStatus: string;
  orderStatus: string;
  installmentCount?: number | null;
  shareToken?: string | null;
  createdAt: string;
  paidAt: string | null;
  user: OrderUser | null;
  manualCustomerName: string | null;
  items: OrderItem[];
}

function getCustomerName(order: ShopOrder): string {
  if (order.manualCustomerName) {
    return `${order.manualCustomerName} (externo)`;
  }
  return order.user?.fullName || 'Cliente desconhecido';
}

function buildShareMessage(order: ShopOrder): string {
  const name = order.manualCustomerName || order.user?.fullName || 'Cliente';
  const firstName = name.split(' ')[0];
  const url = `${window.location.origin}/pedido/${order.shareToken}`;
  const totalFormatted = `R$ ${((order.totalAmount || 0) / 100).toFixed(2).replace('.', ',')}`;
  const isInstallment = (order.installmentCount || 1) > 1;

  let msg = `Olá, *${firstName}*! 👋\n\n`;
  msg += `Seu pedido *#${order.orderCode}* da *Emaústore* foi criado com sucesso!\n\n`;
  msg += `*Valor total:* ${totalFormatted}`;
  if (isInstallment) {
    msg += ` (${order.installmentCount}x de R$ ${((order.totalAmount || 0) / (order.installmentCount || 1) / 100).toFixed(2).replace('.', ',')})`;
  }
  msg += `\n\n`;
  msg += `Através do link abaixo você pode:\n`;
  msg += `✅ *Acompanhar o status* do seu pedido\n`;
  msg += `✅ *Realizar o pagamento* via PIX\n`;
  if (isInstallment) {
    msg += `✅ *Pagar suas parcelas* individualmente\n`;
  }
  msg += `✅ *Receber notificações* de atualização\n\n`;
  msg += `🔗 *Acesse aqui:*\n${url}\n\n`;
  msg += `⚠️ *Importante:* Ao abrir o link, *ative as notificações* para receber avisos quando o pagamento for confirmado e quando o pedido estiver pronto!`;

  return msg;
}

const ORDER_STATUSES = [
  { value: "awaiting_payment", label: "Aguardando Pagamento", icon: Clock, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "installment_payment", label: "Pagamento Parcelado", icon: Clock, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  { value: "paid", label: "Pago", icon: CheckCircle, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "producing", label: "Em Produção", icon: Package, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "ready", label: "Pronto", icon: ShoppingBag, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { value: "delivered", label: "Entregue", icon: Truck, color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
  { value: "cancelled", label: "Cancelado", icon: XCircle, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
];

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
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusInfo(status: string) {
  return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
}

async function generateProductionPDF(selectedOrdersList: ShopOrder[]) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF("portrait", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DE PRODUÇÃO", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`UMP Emaús - Gerado em ${today}`, pageWidth / 2, 27, { align: "center" });
  doc.text(`${selectedOrdersList.length} pedido(s) selecionado(s)`, pageWidth / 2, 32, { align: "center" });

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, 35, pageWidth - margin, 35);

  let yPos = 42;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("SEÇÃO 1 - DETALHAMENTO POR PEDIDO", margin, yPos);
  yPos += 8;

  for (const order of selectedOrdersList) {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }

    const statusInfo = getStatusInfo(order.orderStatus);
    const paymentLabel = order.paymentStatus === "paid" ? "Pago" : order.paymentStatus === "partial" ? "Parcial" : "Pendente";
    const customerName = getCustomerName(order);

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 5, contentWidth, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Pedido #${order.orderCode}`, margin + 2, yPos);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${customerName} | ${statusInfo.label} | Pgto: ${paymentLabel}`, margin + 2, yPos + 5);
    yPos += 12;

    const tableData: string[][] = [];
    for (const item of order.items) {
      const productName = item.product?.name || "Produto";
      const gender = item.gender === "male" ? "Masc" : item.gender === "female" ? "Fem" : item.gender === "unissex" ? "Uni" : "-";
      const size = item.size || "-";
      const color = item.color || "-";

      if (item.kitSelections && item.kitSelections.length > 0) {
        tableData.push([productName + " (Kit)", gender, "-", "-", String(item.quantity)]);
        for (const sel of item.kitSelections) {
          tableData.push([`  → ${sel.componentName}`, "-", sel.size || "-", sel.color || "-", String((sel.quantity || 1) * item.quantity)]);
        }
      } else {
        tableData.push([productName, gender, size, color, String(item.quantity)]);
      }
    }

    if (tableData.length === 0) {
      tableData.push(["Sem itens", "-", "-", "-", "0"]);
    }

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [["Produto", "Modelo", "Tamanho", "Cor", "Qtd"]],
      body: tableData,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.4 },
        1: { cellWidth: contentWidth * 0.12, halign: "center" },
        2: { cellWidth: contentWidth * 0.16, halign: "center" },
        3: { cellWidth: contentWidth * 0.18, halign: "center" },
        4: { cellWidth: contentWidth * 0.14, halign: "center" },
      },
      theme: "grid",
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
  }

  doc.addPage();
  yPos = 20;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("SEÇÃO 2 - RESUMO PARA PRODUÇÃO", margin, yPos);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  yPos += 6;
  doc.text("Itens agrupados por produto, cor e tamanho com quantidades totais", margin, yPos);
  yPos += 8;

  const aggregated = new Map<string, {
    productName: string;
    color: string;
    size: string;
    gender: string;
    quantity: number;
    orderCodes: string[];
  }>();

  for (const order of selectedOrdersList) {
    for (const item of order.items) {
      if (item.kitSelections && item.kitSelections.length > 0) {
        for (const sel of item.kitSelections) {
          const key = `${sel.componentName}||${sel.color || "-"}||${sel.size || "-"}||-`;
          const existing = aggregated.get(key);
          if (existing) {
            existing.quantity += (sel.quantity || 1) * item.quantity;
            if (!existing.orderCodes.includes(order.orderCode)) {
              existing.orderCodes.push(order.orderCode);
            }
          } else {
            aggregated.set(key, {
              productName: sel.componentName,
              color: sel.color || "-",
              size: sel.size || "-",
              gender: "-",
              quantity: (sel.quantity || 1) * item.quantity,
              orderCodes: [order.orderCode],
            });
          }
        }
      } else {
        const productName = item.product?.name || "Produto";
        const color = item.color || "-";
        const size = item.size || "-";
        const gender = item.gender === "male" ? "Masc" : item.gender === "female" ? "Fem" : item.gender === "unissex" ? "Uni" : "-";
        const key = `${productName}||${color}||${size}||${gender}`;
        const existing = aggregated.get(key);
        if (existing) {
          existing.quantity += item.quantity;
          if (!existing.orderCodes.includes(order.orderCode)) {
            existing.orderCodes.push(order.orderCode);
          }
        } else {
          aggregated.set(key, { productName, color, size, gender, quantity: item.quantity, orderCodes: [order.orderCode] });
        }
      }
    }
  }

  const sortedItems = Array.from(aggregated.values()).sort((a, b) => {
    if (a.productName !== b.productName) return a.productName.localeCompare(b.productName);
    if (a.color !== b.color) return a.color.localeCompare(b.color);
    return a.size.localeCompare(b.size);
  });

  let currentProduct = "";
  const summaryTableData: string[][] = [];
  let productTotalQty = 0;

  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i];
    const nextItem = sortedItems[i + 1];

    if (item.productName !== currentProduct) {
      currentProduct = item.productName;
      productTotalQty = 0;
    }

    productTotalQty += item.quantity;
    summaryTableData.push([
      item.productName,
      item.gender,
      item.size,
      item.color,
      String(item.quantity),
      item.orderCodes.join(", "),
    ]);

    if (!nextItem || nextItem.productName !== currentProduct) {
      summaryTableData.push([`SUBTOTAL: ${currentProduct}`, "", "", "", String(productTotalQty), ""]);
    }
  }

  const grandTotal = sortedItems.reduce((sum, item) => sum + item.quantity, 0);
  summaryTableData.push(["TOTAL GERAL", "", "", "", String(grandTotal), ""]);

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [["Produto", "Modelo", "Tamanho", "Cor", "Qtd", "Pedidos"]],
    body: summaryTableData,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.28 },
      1: { cellWidth: contentWidth * 0.1, halign: "center" },
      2: { cellWidth: contentWidth * 0.12, halign: "center" },
      3: { cellWidth: contentWidth * 0.15, halign: "center" },
      4: { cellWidth: contentWidth * 0.1, halign: "center" },
      5: { cellWidth: contentWidth * 0.25 },
    },
    theme: "grid",
    didParseCell: function (data: any) {
      const rowText = data.row.raw?.[0] || "";
      if (typeof rowText === "string" && (rowText.startsWith("SUBTOTAL:") || rowText === "TOTAL GERAL")) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = rowText === "TOTAL GERAL" ? [40, 40, 40] : [220, 220, 220];
        if (rowText === "TOTAL GERAL") {
          data.cell.styles.textColor = [255, 255, 255];
        }
      }
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
  }

  doc.save(`producao_${new Date().toISOString().split("T")[0]}.pdf`);
}

export default function PedidosAdminPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [detailsOrder, setDetailsOrder] = useState<ShopOrder | null>(null);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [newBulkStatus, setNewBulkStatus] = useState("");
  const [convertInstallmentOrder, setConvertInstallmentOrder] = useState<ShopOrder | null>(null);
  const [convertInstallmentCount, setConvertInstallmentCount] = useState("2");
  const [manualOrderDialogOpen, setManualOrderDialogOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [manualOrderMemberId, setManualOrderMemberId] = useState<string>("");
  const [manualOrderName, setManualOrderName] = useState("");
  const [manualOrderItems, setManualOrderItems] = useState<Array<{
    itemId: number;
    quantity: number;
    size: string;
    gender: string;
    color: string;
    colorId: number;
    kitSelections: Array<{ componentId: number; componentName: string; size: string; color: string; colorId: number }>;
  }>>([]);
  const [kitComponentsCache, setKitComponentsCache] = useState<Record<number, KitComponentData[]>>({});
  const [manualOrderInstallments, setManualOrderInstallments] = useState("1");
  const [manualOrderPromoCode, setManualOrderPromoCode] = useState("");
  const [promoCodeValidation, setPromoCodeValidation] = useState<{
    valid: boolean;
    discountAmount: number;
    discountType: string;
    discountValue: number;
    code: string;
    categoryName?: string;
  } | null>(null);
  const [promoCodeLoading, setPromoCodeLoading] = useState(false);
  const [promoCodeError, setPromoCodeError] = useState("");

  const isMarketing = user?.secretaria === "marketing";
  
  const { data: orders, isLoading } = useQuery<ShopOrder[]>({
    queryKey: ["/api/admin/shop/orders"],
    enabled: isAuthenticated && (user?.isAdmin || isMarketing),
  });

  const { data: members } = useQuery<Member[]>({
    queryKey: ["/api/admin/shop/members"],
    enabled: isAuthenticated && (user?.isAdmin || isMarketing) && (manualOrderDialogOpen),
  });

  const { data: products } = useQuery<ShopProduct[]>({
    queryKey: ["/api/admin/shop/items"],
    enabled: isAuthenticated && (user?.isAdmin || isMarketing) && (manualOrderDialogOpen || !!convertInstallmentOrder),
  });

  const { data: globalInstallmentRules } = useQuery<Array<{ id: number; minTotalAmount: number; maxInstallments: number; isActive: boolean }>>({
    queryKey: ["/api/shop/installment-rules"],
    enabled: isAuthenticated && (user?.isAdmin || isMarketing) && (manualOrderDialogOpen || !!convertInstallmentOrder),
  });

  const manualItemIds = manualOrderItems.filter(i => i.itemId > 0).map(i => i.itemId);
  const { data: comboDiscounts } = useQuery<{
    discount: number;
    appliedCombos: Array<{ name: string; discountValue: number; items: number[] }>;
  }>({
    queryKey: ["/api/shop/calculate-combo-discounts", manualItemIds],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/shop/calculate-combo-discounts", { itemIds: manualItemIds });
      return await response.json();
    },
    enabled: isAuthenticated && manualOrderDialogOpen && manualItemIds.length >= 2,
  });

  const validatePromoCode = async () => {
    if (!manualOrderPromoCode.trim()) return;
    setPromoCodeLoading(true);
    setPromoCodeError("");
    setPromoCodeValidation(null);
    try {
      const cartItems = manualOrderItems.filter(i => i.itemId > 0).map(i => ({
        itemId: i.itemId,
        quantity: i.quantity,
      }));
      const response = await apiRequest("POST", "/api/shop/validate-promo", {
        code: manualOrderPromoCode.trim(),
        items: cartItems,
      });
      const data = await response.json();
      if (data.valid) {
        setPromoCodeValidation(data);
      } else {
        setPromoCodeError(data.message || "Cupom inválido");
      }
    } catch {
      setPromoCodeError("Cupom inválido ou expirado");
    } finally {
      setPromoCodeLoading(false);
    }
  };

  const createManualOrderMutation = useMutation({
    mutationFn: async (data: {
      memberId?: number;
      manualName?: string;
      items: Array<{ itemId: number; quantity: number; size?: string; gender?: string; color?: string; colorId?: number }>;
      installmentCount: number;
      promoCode?: string;
    }) => {
      const response = await apiRequest("POST", "/api/admin/shop/orders/manual", data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/orders"] });
      setManualOrderDialogOpen(false);
      setManualOrderMemberId("");
      setManualOrderName("");
      setManualOrderItems([]);
      setManualOrderInstallments("1");
      setManualOrderPromoCode("");
      setPromoCodeValidation(null);
      setPromoCodeError("");
      toast({ title: data.message || "Pedido criado com sucesso!" });
      if (data.shareUrl) {
        const fullUrl = `${window.location.origin}${data.shareUrl}`;
        navigator.clipboard.writeText(fullUrl).then(() => {
          toast({ title: "Link compartilhável copiado para a área de transferência!" });
        }).catch(() => {});
      }
    },
    onError: () => {
      toast({ title: "Erro ao criar pedido", variant: "destructive" });
    },
  });

  const editManualOrderMutation = useMutation({
    mutationFn: async (data: {
      orderId: number;
      items: Array<{ itemId: number; quantity: number; size?: string; gender?: string; color?: string; colorId?: number }>;
      installmentCount: number;
      promoCode?: string;
    }) => {
      const { orderId, ...body } = data;
      const response = await apiRequest("PUT", `/api/admin/shop/orders/${orderId}/edit`, body);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/orders"] });
      setManualOrderDialogOpen(false);
      setEditingOrderId(null);
      setManualOrderItems([]);
      setManualOrderInstallments("1");
      setManualOrderPromoCode("");
      setPromoCodeValidation(null);
      setPromoCodeError("");
      toast({ title: data.message || "Pedido atualizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: error?.message || "Erro ao atualizar pedido", variant: "destructive" });
    },
  });

  const isOrderEditable = (order: ShopOrder): boolean => {
    const isManual = order.observation?.includes('Pedido manual') || order.observation?.includes('Pedido criado manualmente');
    if (!isManual) return false;
    if (order.orderStatus !== "awaiting_payment" && order.orderStatus !== "installment_payment") return false;
    if (order.paymentStatus === "paid") return false;
    return true;
  };

  const canConvertToInstallments = (order: ShopOrder): boolean => {
    if (order.paymentStatus === "paid") return false;
    if (order.orderStatus === "cancelled") return false;
    const finishedStatuses = ["producing", "ready", "delivered"];
    if (finishedStatuses.includes(order.orderStatus)) return false;
    return true;
  };

  const generateKitSelectionsFromComponents = (components: KitComponentData[], existingSelections: any[] = []) => {
    if (existingSelections.length > 0) return existingSelections;
    const sels: any[] = [];
    for (const c of components) {
      for (let u = 0; u < (c.quantity || 1); u++) {
        sels.push({ componentId: c.id, componentName: c.componentItem.name, size: "", color: "", colorId: 0 });
      }
    }
    return sels;
  };

  const openEditOrderDialog = async (order: ShopOrder) => {
    setEditingOrderId(order.id);
    setManualOrderMemberId(order.manualCustomerName ? "" : order.userId.toString());
    setManualOrderName(order.manualCustomerName || "");
    const itemsWithKit = order.items.map(item => ({
      itemId: item.itemId,
      quantity: item.quantity,
      size: item.size || "",
      gender: item.gender || "",
      color: item.color || "",
      colorId: item.colorId || 0,
      kitSelections: ((item as any).kitSelections || []).map((sel: any) => ({
        componentId: sel.componentId,
        componentName: sel.componentName || "",
        size: sel.size || "",
        color: sel.color || "",
        colorId: sel.colorId || 0,
      })),
    }));

    const cacheUpdates: Record<number, KitComponentData[]> = {};

    for (let i = 0; i < itemsWithKit.length; i++) {
      const item = itemsWithKit[i];
      const prod = products?.find(p => p.id === item.itemId);
      if (!prod?.isKit) continue;

      let components: KitComponentData[] | null = null;

      if (kitComponentsCache[item.itemId]) {
        components = kitComponentsCache[item.itemId];
      } else if (prod.kitComponents && prod.kitComponents.length > 0) {
        components = prod.kitComponents;
        cacheUpdates[item.itemId] = components;
      } else {
        try {
          const res = await apiRequest("GET", `/api/admin/shop/items/${item.itemId}/kit-components`);
          components = await res.json();
          if (components) cacheUpdates[item.itemId] = components;
        } catch {}
      }

      if (components && components.length > 0) {
        itemsWithKit[i] = {
          ...item,
          kitSelections: generateKitSelectionsFromComponents(components, item.kitSelections),
        };
      }
    }

    if (Object.keys(cacheUpdates).length > 0) {
      setKitComponentsCache(prev => ({ ...prev, ...cacheUpdates }));
    }

    setManualOrderItems(itemsWithKit);
    setManualOrderInstallments((order.installmentCount || 1).toString());
    setManualOrderPromoCode(order.promoCode || "");
    setPromoCodeValidation(null);
    setPromoCodeError("");
    setManualOrderDialogOpen(true);
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, orderStatus }: { orderId: number; orderStatus: string }) => {
      return apiRequest("PATCH", `/api/admin/shop/orders/${orderId}/status`, { orderStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/orders"] });
      toast({ title: "Status atualizado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    },
  });

  const convertInstallmentMutation = useMutation({
    mutationFn: async ({ orderId, installmentCount }: { orderId: number; installmentCount: number }) => {
      const response = await apiRequest("POST", `/api/admin/shop/orders/${orderId}/convert-installments`, { installmentCount });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/orders"] });
      setConvertInstallmentOrder(null);
      setConvertInstallmentCount("2");
      toast({ title: data.message || "Pedido parcelado com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: error?.message || "Erro ao parcelar pedido", variant: "destructive" });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ orderIds, orderStatus }: { orderIds: number[]; orderStatus: string }) => {
      const response = await apiRequest("PATCH", "/api/admin/shop/orders/bulk-status", { orderIds, orderStatus });
      return await response.json() as { updated: number; orders: ShopOrder[] };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/orders"] });
      setSelectedOrders([]);
      setBulkStatusDialogOpen(false);
      toast({ title: `${data?.updated ?? selectedOrders.length} pedidos atualizados` });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar pedidos", variant: "destructive" });
    },
  });

  if (!isAuthenticated || (!user?.isAdmin && !isMarketing)) {
    setLocation("/");
    return null;
  }

  const filteredOrders = orders?.filter(order => {
    const matchesStatus = statusFilter === "all" || order.orderStatus === statusFilter;
    const customerName = getCustomerName(order).toLowerCase();
    const matchesSearch = searchQuery === "" || 
      order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const handleSelectOrder = (orderId: number) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const handleBulkStatusUpdate = () => {
    if (selectedOrders.length === 0 || !newBulkStatus) return;
    bulkUpdateMutation.mutate({ orderIds: selectedOrders, orderStatus: newBulkStatus });
  };

  const statusCounts = orders?.reduce((acc, order) => {
    acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="bg-gradient-to-br from-pink-600 via-rose-600 to-red-600 text-white py-6">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href="/admin/loja">
              <Button 
                variant="ghost" 
                className="mb-2 text-white/80 gap-2"
                data-testid="button-back-loja"
              >
                <ArrowLeft className="h-4 w-4" />
                Gestao da Loja
              </Button>
            </Link>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" data-testid="text-pedidos-title">
                    Gestão de Pedidos
                  </h1>
                  <p className="text-white/80">
                    {orders?.length || 0} pedidos no total
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setManualOrderDialogOpen(true)}
                className="bg-white text-rose-600 gap-2"
                data-testid="button-create-manual-order"
              >
                <Plus className="h-4 w-4" />
                Criar Pedido
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-6">
        <div className="container mx-auto px-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-orders"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos ({orders?.length || 0})</SelectItem>
                {ORDER_STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label} ({statusCounts[status.value] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOrders.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="py-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    {selectedOrders.length} pedido(s) selecionado(s)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Select value={newBulkStatus} onValueChange={setNewBulkStatus}>
                      <SelectTrigger className="w-40" data-testid="select-bulk-status">
                        <SelectValue placeholder="Novo status" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => setBulkStatusDialogOpen(true)}
                      disabled={!newBulkStatus || bulkUpdateMutation.isPending}
                      data-testid="button-apply-bulk-status"
                    >
                      {bulkUpdateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Aplicar
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (!orders) return;
                        const selected = orders.filter(o => selectedOrders.includes(o.id));
                        if (selected.length === 0) return;
                        generateProductionPDF(selected);
                        toast({ title: "PDF de produção gerado!", description: `${selected.length} pedido(s) incluído(s)` });
                      }}
                      data-testid="button-production-pdf"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Produção
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedOrders([])}
                      data-testid="button-clear-selection"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {statusFilter !== "all" 
                    ? "Nenhum pedido encontrado com esse status"
                    : "Nenhum pedido realizado ainda"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <Checkbox
                  checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                  onCheckedChange={handleSelectAll}
                  data-testid="checkbox-select-all"
                />
                <span className="text-sm text-muted-foreground">Selecionar todos</span>
              </div>

              {filteredOrders.map((order) => {
                const statusInfo = getStatusInfo(order.orderStatus);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="hover-elevate">
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedOrders.includes(order.id)}
                            onCheckedChange={() => handleSelectOrder(order.id)}
                            data-testid={`checkbox-order-${order.id}`}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="font-mono font-bold text-sm" data-testid={`text-order-code-${order.id}`}>
                                #{order.orderCode}
                              </span>
                              <Badge className={cn("text-xs", statusInfo.color)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </div>
                            
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>{getCustomerName(order)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(order.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Package className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {order.items.length} {order.items.length === 1 ? "item" : "itens"}
                                </span>
                                <span className="font-medium">
                                  {formatCurrency(order.totalAmount)}
                                </span>
                              </div>
                            </div>

                            {order.observation && (
                              <p className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded-md">
                                Obs: {order.observation}
                              </p>
                            )}

                            {order.shareToken && (
                              <div className="mt-2 flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(buildShareMessage(order));
                                    toast({ title: "Mensagem copiada!", description: "Cole no WhatsApp para enviar ao cliente" });
                                  }}
                                  data-testid={`button-copy-share-${order.id}`}
                                >
                                  <Share2 className="h-3 w-3 mr-1" />
                                  Copiar Link
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDetailsOrder(order)}
                              data-testid={`button-view-order-${order.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {isOrderEditable(order) && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditOrderDialog(order)}
                                data-testid={`button-edit-order-${order.id}`}
                                title="Editar pedido"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canConvertToInstallments(order) && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setConvertInstallmentOrder(order);
                                  setConvertInstallmentCount((order.installmentCount && order.installmentCount > 1) ? order.installmentCount.toString() : "2");
                                }}
                                data-testid={`button-convert-installment-${order.id}`}
                                title="Parcelar pedido"
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                            <Select
                              value={order.orderStatus}
                              onValueChange={(value) => updateStatusMutation.mutate({ orderId: order.id, orderStatus: value })}
                            >
                              <SelectTrigger className="w-32" data-testid={`select-order-status-${order.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ORDER_STATUSES.map(status => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!detailsOrder} onOpenChange={() => setDetailsOrder(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Pedido #{detailsOrder?.orderCode}
              {detailsOrder && (
                <Badge className={cn("text-xs", getStatusInfo(detailsOrder.orderStatus).color)}>
                  {getStatusInfo(detailsOrder.orderStatus).label}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Detalhes completos para logistica
            </DialogDescription>
          </DialogHeader>
          
          {detailsOrder && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dados do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome:</span>
                    <span className="font-medium">{getCustomerName(detailsOrder)}</span>
                  </div>
                  {!detailsOrder.manualCustomerName && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{detailsOrder.user?.email || "N/A"}</span>
                      </div>
                      {detailsOrder.user?.phone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Telefone:</span>
                          <span className="font-medium">{detailsOrder.user.phone}</span>
                        </div>
                      )}
                    </>
                  )}
                  {detailsOrder.manualCustomerName && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                      Cliente externo - sem cadastro no sistema
                    </div>
                  )}
                  {detailsOrder.shareToken && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Link de pagamento:</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(buildShareMessage(detailsOrder));
                            toast({ title: "Mensagem copiada!", description: "Cole no WhatsApp para enviar ao cliente" });
                          }}
                          data-testid="button-copy-share-details"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Informacoes do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data do pedido:</span>
                    <span>{formatDate(detailsOrder.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pagamento:</span>
                    <Badge variant={detailsOrder.paymentStatus === "paid" ? "default" : "secondary"}>
                      {detailsOrder.paymentStatus === "paid" ? "Pago" : 
                       detailsOrder.paymentStatus === "pending" ? "Pendente" : 
                       detailsOrder.paymentStatus === "partial" ? "Parcial" : detailsOrder.paymentStatus}
                    </Badge>
                  </div>
                  {detailsOrder.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pago em:</span>
                      <span>{formatDate(detailsOrder.paidAt)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Itens do Pedido ({detailsOrder.items.reduce((acc, i) => acc + i.quantity, 0)} unidades)
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 space-y-2">
                  {detailsOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-3 items-start p-3 bg-muted/50 rounded-md border">
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        {item.product?.firstImage ? (
                          <img
                            src={item.product.firstImage}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{item.product?.name || "Produto nao encontrado"}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {item.gender && (
                            <Badge variant="outline" className="text-xs">
                              {item.gender === "male" ? "Masculino" : item.gender === "female" ? "Feminino" : "Unissex"}
                            </Badge>
                          )}
                          {item.size && (
                            <Badge variant="outline" className="text-xs font-bold">
                              Tam: {item.size}
                            </Badge>
                          )}
                          {item.color && (
                            <Badge variant="outline" className="text-xs">
                              Cor: {item.color}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            Qtd: {item.quantity}
                          </Badge>
                        </div>
                        {item.kitSelections && item.kitSelections.length > 0 && (
                          <div className="mt-1 pt-1 border-t border-border/50 space-y-0.5">
                            <p className="text-xs font-medium text-muted-foreground">Itens do Kit:</p>
                            {(item.kitSelections || []).map((sel: any, idx: number) => {
                              const allSels = item.kitSelections || [];
                              const sameCompEntries = allSels.filter((s: any) => s.componentId === sel.componentId || s.componentName === sel.componentName);
                              const sameCompIdx = allSels.filter((s: any, i: number) => (s.componentId === sel.componentId || s.componentName === sel.componentName) && i < idx).length;
                              const unitLabel = sameCompEntries.length > 1 ? ` ${sameCompIdx + 1}` : "";
                              return (
                                <p key={sel.id || idx} className="text-xs text-muted-foreground">
                                  {sel.componentName || "Componente"}{unitLabel}
                                  {sel.size && <span className="font-medium"> - {sel.size}</span>}
                                  {sel.color && <span className="font-medium"> / {sel.color}</span>}
                                </p>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium whitespace-nowrap">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {detailsOrder.observation && (
                <Card className="border-amber-200 dark:border-amber-800">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm text-amber-700 dark:text-amber-400">Observacao do Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-sm">{detailsOrder.observation}</p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2 pt-2 border-t">
                {detailsOrder.subtotalAmount && detailsOrder.subtotalAmount !== detailsOrder.totalAmount && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(detailsOrder.subtotalAmount)}</span>
                  </div>
                )}
                {detailsOrder.promoDiscount && detailsOrder.promoDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Cupom {detailsOrder.promoCode && `(${detailsOrder.promoCode})`}:</span>
                    <span>-{formatCurrency(detailsOrder.promoDiscount)}</span>
                  </div>
                )}
                {detailsOrder.comboDiscount && detailsOrder.comboDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Combo {detailsOrder.comboNames && `(${detailsOrder.comboNames})`}:</span>
                    <span>-{formatCurrency(detailsOrder.comboDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total do Pedido</span>
                  <span className="font-bold text-xl">{formatCurrency(detailsOrder.totalAmount)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <h4 className="font-medium text-sm">Atualizar Status</h4>
                <Select
                  value={detailsOrder.orderStatus}
                  onValueChange={(value) => {
                    updateStatusMutation.mutate({ orderId: detailsOrder.id, orderStatus: value });
                    setDetailsOrder({ ...detailsOrder, orderStatus: value });
                  }}
                >
                  <SelectTrigger data-testid="select-detail-order-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2 flex-wrap">
            {detailsOrder && canConvertToInstallments(detailsOrder) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setConvertInstallmentOrder(detailsOrder);
                  setConvertInstallmentCount((detailsOrder.installmentCount && detailsOrder.installmentCount > 1) ? detailsOrder.installmentCount.toString() : "2");
                  setDetailsOrder(null);
                }}
                data-testid="button-convert-installment-from-details"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Parcelar
              </Button>
            )}
            {detailsOrder && isOrderEditable(detailsOrder) && (
              <Button
                variant="secondary"
                onClick={() => {
                  openEditOrderDialog(detailsOrder);
                  setDetailsOrder(null);
                }}
                data-testid="button-edit-from-details"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar Pedido
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailsOrder(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkStatusDialogOpen} onOpenChange={setBulkStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Atualização em Lote</DialogTitle>
            <DialogDescription>
              Você está prestes a alterar o status de {selectedOrders.length} pedido(s) para "{ORDER_STATUSES.find(s => s.value === newBulkStatus)?.label}".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkStatusDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBulkStatusUpdate}
              disabled={bulkUpdateMutation.isPending}
              data-testid="button-confirm-bulk-update"
            >
              {bulkUpdateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!convertInstallmentOrder} onOpenChange={(open) => { if (!open) setConvertInstallmentOrder(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parcelar Pedido</DialogTitle>
            <DialogDescription>
              Converter o pedido #{convertInstallmentOrder?.orderCode} ({formatCurrency(convertInstallmentOrder?.totalAmount || 0)}) para pagamento parcelado.
              {convertInstallmentOrder?.installmentCount && convertInstallmentOrder.installmentCount > 1 && (
                <span className="block mt-1 text-amber-600">
                  Este pedido já possui {convertInstallmentOrder.installmentCount} parcelas. Ao alterar, as parcelas pendentes serão recriadas.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {(() => {
            let maxInstallments = 1;
            let hasItemLevelInstallments = false;
            if (convertInstallmentOrder && products) {
              for (const orderItem of convertInstallmentOrder.items) {
                const prod = products.find(p => p.id === orderItem.itemId);
                if (prod?.allowInstallments && prod.maxInstallments && prod.maxInstallments > maxInstallments) {
                  maxInstallments = prod.maxInstallments;
                  hasItemLevelInstallments = true;
                }
              }
            }
            if (!hasItemLevelInstallments && globalInstallmentRules && globalInstallmentRules.length > 0 && convertInstallmentOrder) {
              const orderTotal = convertInstallmentOrder.totalAmount;
              const activeRules = globalInstallmentRules
                .filter(r => r.isActive && orderTotal >= r.minTotalAmount)
                .sort((a, b) => b.minTotalAmount - a.minTotalAmount);
              if (activeRules.length > 0) {
                maxInstallments = activeRules[0].maxInstallments;
              }
            }
            if (maxInstallments <= 1) {
              return (
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma regra de parcelamento ativa se aplica a este pedido. Cadastre regras de parcelamento na aba "Loja" ou configure o parcelamento nos itens.
                  </p>
                </div>
              );
            }
            const currentCount = parseInt(convertInstallmentCount);
            if (currentCount > maxInstallments) {
              setTimeout(() => setConvertInstallmentCount(maxInstallments.toString()), 0);
            }
            if (currentCount < 2) {
              setTimeout(() => setConvertInstallmentCount("2"), 0);
            }
            return (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Número de Parcelas</Label>
                  <Select value={convertInstallmentCount} onValueChange={setConvertInstallmentCount}>
                    <SelectTrigger data-testid="select-convert-installments">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: maxInstallments - 1 }, (_, i) => i + 2).map(n => (
                        <SelectItem key={n} value={n.toString()}>
                          {n}x de {formatCurrency(Math.floor((convertInstallmentOrder?.totalAmount || 0) / n))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 bg-muted rounded-md space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total do pedido</span>
                    <span className="font-medium">{formatCurrency(convertInstallmentOrder?.totalAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Parcelas</span>
                    <span className="font-medium">
                      {convertInstallmentCount}x de {formatCurrency(Math.floor((convertInstallmentOrder?.totalAmount || 0) / parseInt(convertInstallmentCount)))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Vencimento no dia 10 de cada mês. A 1a parcela recebe o valor restante.
                  </p>
                  {hasItemLevelInstallments && (
                    <p className="text-xs text-muted-foreground">
                      Parcelamento configurado pelo item do pedido.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConvertInstallmentOrder(null)} data-testid="button-cancel-convert-installment">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (convertInstallmentOrder) {
                  convertInstallmentMutation.mutate({
                    orderId: convertInstallmentOrder.id,
                    installmentCount: parseInt(convertInstallmentCount),
                  });
                }
              }}
              disabled={convertInstallmentMutation.isPending || parseInt(convertInstallmentCount) < 2}
              data-testid="button-confirm-convert-installment"
            >
              {convertInstallmentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Parcelar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manualOrderDialogOpen} onOpenChange={(open) => {
        setManualOrderDialogOpen(open);
        if (!open) setEditingOrderId(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrderId ? "Editar Pedido Manual" : "Criar Pedido Manual"}</DialogTitle>
            <DialogDescription>
              {editingOrderId ? "Altere os itens do pedido manual" : "Crie um pedido para um membro ou cliente externo"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {editingOrderId ? (
              <div className="p-3 bg-muted rounded-md">
                <Label className="text-xs text-muted-foreground">Cliente</Label>
                <p className="font-medium text-sm mt-1">
                  {manualOrderName ? `${manualOrderName} (externo)` : members?.find(m => m.id.toString() === manualOrderMemberId)?.fullName || "Cliente"}
                </p>
              </div>
            ) : (
            <div className="space-y-2">
              <Label>Cliente</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Select 
                    value={manualOrderMemberId} 
                    onValueChange={(value) => {
                      setManualOrderMemberId(value);
                      if (value) setManualOrderName("");
                    }}
                  >
                    <SelectTrigger data-testid="select-manual-member">
                      <SelectValue placeholder="Selecionar membro" />
                    </SelectTrigger>
                    <SelectContent>
                      {members?.map(member => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Ou digite o nome do cliente"
                    value={manualOrderName}
                    onChange={(e) => {
                      setManualOrderName(e.target.value);
                      if (e.target.value) setManualOrderMemberId("");
                    }}
                    disabled={!!manualOrderMemberId}
                    data-testid="input-manual-name"
                  />
                </div>
              </div>
            </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Itens do Pedido</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setManualOrderItems([...manualOrderItems, { itemId: 0, quantity: 1, size: "", gender: "", color: "", colorId: 0, kitSelections: [] }]);
                    setPromoCodeValidation(null);
                  }}
                  className="gap-1"
                  data-testid="button-add-item"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar
                </Button>
              </div>
              
              {manualOrderItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum item adicionado. Clique em "Adicionar" para incluir produtos.
                </p>
              )}

              <div className="space-y-3">
                {manualOrderItems.map((item, index) => {
                  const selectedProduct = products?.find(p => p.id === item.itemId);
                  const hasGender = selectedProduct?.genderType === "both";
                  const selectedGender = item.gender || (selectedProduct?.genderType === "masculino" ? "masculino" : selectedProduct?.genderType === "feminino" ? "feminino" : "");
                  const availableSizes = selectedProduct?.sizes
                    ? [...new Set(selectedProduct.sizes
                        .filter(s => !selectedGender || s.gender === selectedGender || selectedProduct.genderType !== "both")
                        .map(s => s.size))]
                    : [];
                  const availableColors = selectedProduct?.colors || [];
                  
                  return (
                    <div key={index} className="flex flex-wrap gap-2 items-end p-3 border rounded-md bg-muted/30">
                      <div className="flex-1 min-w-[200px] space-y-1">
                        <Label className="text-xs">Produto</Label>
                        <Select
                          value={item.itemId ? item.itemId.toString() : ""}
                          onValueChange={async (value) => {
                            const newItemId = parseInt(value);
                            const selectedProd = products?.find(p => p.id === newItemId);
                            const newItems = [...manualOrderItems];
                            newItems[index] = { ...item, itemId: newItemId, size: "", gender: "", color: "", colorId: 0, kitSelections: [] };
                            setPromoCodeValidation(null);

                            if (selectedProd?.isKit) {
                              let components: KitComponentData[] | null = null;

                              if (selectedProd.kitComponents && selectedProd.kitComponents.length > 0) {
                                components = selectedProd.kitComponents;
                                setKitComponentsCache(prev => ({ ...prev, [newItemId]: components! }));
                              } else if (kitComponentsCache[newItemId]) {
                                components = kitComponentsCache[newItemId];
                              } else {
                                try {
                                  const res = await apiRequest("GET", `/api/admin/shop/items/${newItemId}/kit-components`);
                                  components = await res.json();
                                  setKitComponentsCache(prev => ({ ...prev, [newItemId]: components! }));
                                } catch {}
                              }

                              if (components && components.length > 0) {
                                const sels: any[] = [];
                                for (const c of components) {
                                  for (let u = 0; u < (c.quantity || 1); u++) {
                                    sels.push({ componentId: c.id, componentName: c.componentItem.name, size: "", color: "", colorId: 0 });
                                  }
                                }
                                newItems[index] = { ...newItems[index], kitSelections: sels };
                              }
                            }

                            setManualOrderItems(newItems);
                          }}
                        >
                          <SelectTrigger data-testid={`select-item-${index}`}>
                            <SelectValue placeholder="Selecionar produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {products?.map(product => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} - {formatCurrency(product.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-20 space-y-1">
                        <Label className="text-xs">Qtd</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...manualOrderItems];
                            newItems[index] = { ...item, quantity: parseInt(e.target.value) || 1 };
                            setManualOrderItems(newItems);
                            setPromoCodeValidation(null);
                          }}
                          data-testid={`input-quantity-${index}`}
                        />
                      </div>

                      {!selectedProduct?.isKit && hasGender && (
                        <div className="w-28 space-y-1">
                          <Label className="text-xs">Modelo</Label>
                          <Select
                            value={item.gender}
                            onValueChange={(value) => {
                              const newItems = [...manualOrderItems];
                              newItems[index] = { ...item, gender: value, size: "" };
                              setManualOrderItems(newItems);
                            }}
                          >
                            <SelectTrigger data-testid={`select-gender-${index}`}>
                              <SelectValue placeholder="Modelo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="masculino">Masculino</SelectItem>
                              <SelectItem value="feminino">Feminino</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {!selectedProduct?.isKit && availableSizes.length > 0 && (
                        <div className="w-24 space-y-1">
                          <Label className="text-xs">Tamanho</Label>
                          <Select
                            value={item.size}
                            onValueChange={(value) => {
                              const newItems = [...manualOrderItems];
                              newItems[index] = { ...item, size: value };
                              setManualOrderItems(newItems);
                            }}
                          >
                            <SelectTrigger data-testid={`select-size-${index}`}>
                              <SelectValue placeholder="Tam" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSizes.map(size => (
                                <SelectItem key={size} value={size}>{size}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {!selectedProduct?.isKit && availableColors.length > 0 && (
                        <div className="w-32 space-y-1">
                          <Label className="text-xs">Cor</Label>
                          <Select
                            value={item.colorId ? item.colorId.toString() : ""}
                            onValueChange={(value) => {
                              const newItems = [...manualOrderItems];
                              const selectedColor = availableColors.find(c => c.id === parseInt(value));
                              newItems[index] = { 
                                ...item, 
                                colorId: parseInt(value), 
                                color: selectedColor?.name || "" 
                              };
                              setManualOrderItems(newItems);
                            }}
                          >
                            <SelectTrigger data-testid={`select-color-${index}`}>
                              <SelectValue placeholder="Cor" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableColors.map(color => (
                                <SelectItem key={color.id} value={color.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full border border-border" 
                                      style={{ backgroundColor: color.hexCode }}
                                    />
                                    {color.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newItems = manualOrderItems.filter((_, i) => i !== index);
                          setManualOrderItems(newItems);
                          setPromoCodeValidation(null);
                        }}
                        className="text-destructive"
                        data-testid={`button-remove-item-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      {selectedProduct?.isKit && (kitComponentsCache[item.itemId] || selectedProduct.kitComponents) && (
                        <div className="w-full mt-2 p-3 border border-dashed border-border rounded-md bg-muted/50 space-y-3" data-testid={`kit-components-section-${index}`}>
                          <p className="text-xs font-semibold text-muted-foreground">Componentes do Kit</p>
                          {(kitComponentsCache[item.itemId] || selectedProduct.kitComponents || []).map((comp) => {
                            const compColors = comp.colors.filter((c: any) => c.isAvailable);
                            const compHasSizes = comp.componentItem.hasSize && comp.sizes.length > 0;
                            const compHasColors = compColors.length > 0;
                            const unitEntries = item.kitSelections
                              .map((ks, selIdx) => ({ ks, selIdx }))
                              .filter(({ ks }) => ks.componentId === comp.id);
                            if (!compHasSizes && !compHasColors) {
                              return (
                                <div key={comp.id} className="flex items-center gap-2" data-testid={`kit-comp-${index}-${comp.id}`}>
                                  <Badge variant="secondary" className="text-xs">{comp.quantity}x</Badge>
                                  <span className="text-sm">{comp.componentItem.name}</span>
                                </div>
                              );
                            }
                            return (
                              <div key={comp.id} className="space-y-2" data-testid={`kit-comp-${index}-${comp.id}`}>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">{comp.quantity}x</Badge>
                                  <span className="text-sm font-medium">{comp.componentItem.name}</span>
                                </div>
                                {unitEntries.map(({ ks: kitSel, selIdx }, unitIdx) => (
                                  <div key={unitIdx} className={`flex flex-wrap gap-2 pl-6 ${comp.quantity > 1 ? "pb-2 border-b border-border/50 last:border-b-0 last:pb-0" : ""}`}>
                                    {comp.quantity > 1 && (
                                      <span className="text-xs text-muted-foreground w-full">{comp.componentItem.name} {unitIdx + 1}</span>
                                    )}
                                    {compHasSizes && (
                                      <div className="w-24 space-y-1">
                                        <Label className="text-xs">Tamanho</Label>
                                        <Select
                                          value={kitSel?.size || ""}
                                          onValueChange={(value) => {
                                            const newItems = [...manualOrderItems];
                                            const newSelections = [...newItems[index].kitSelections];
                                            newSelections[selIdx] = { ...newSelections[selIdx], size: value };
                                            newItems[index] = { ...newItems[index], kitSelections: newSelections };
                                            setManualOrderItems(newItems);
                                          }}
                                        >
                                          <SelectTrigger data-testid={`select-kit-size-${index}-${comp.id}-${unitIdx}`}>
                                            <SelectValue placeholder="Tam" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {[...new Set(comp.sizes.map((s: any) => s.size))].map((size: any) => (
                                              <SelectItem key={size} value={size}>{size}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                    {compHasColors && (
                                      <div className="w-32 space-y-1">
                                        <Label className="text-xs">Cor</Label>
                                        <Select
                                          value={kitSel?.colorId ? kitSel.colorId.toString() : ""}
                                          onValueChange={(value) => {
                                            const newItems = [...manualOrderItems];
                                            const newSelections = [...newItems[index].kitSelections];
                                            const selColor = compColors.find((c: any) => c.id === parseInt(value));
                                            newSelections[selIdx] = { ...newSelections[selIdx], colorId: parseInt(value), color: selColor?.name || "" };
                                            newItems[index] = { ...newItems[index], kitSelections: newSelections };
                                            setManualOrderItems(newItems);
                                          }}
                                        >
                                          <SelectTrigger data-testid={`select-kit-color-${index}-${comp.id}-${unitIdx}`}>
                                            <SelectValue placeholder="Cor" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {compColors.map((color: any) => (
                                              <SelectItem key={color.id} value={color.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                  <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: color.hexCode }} />
                                                  {color.name}
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cupom Promocional</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o código do cupom"
                  value={manualOrderPromoCode}
                  onChange={(e) => {
                    setManualOrderPromoCode(e.target.value.toUpperCase());
                    setPromoCodeValidation(null);
                    setPromoCodeError("");
                  }}
                  data-testid="input-promo-code"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={validatePromoCode}
                  disabled={!manualOrderPromoCode.trim() || promoCodeLoading || manualOrderItems.length === 0}
                  data-testid="button-validate-promo"
                >
                  {promoCodeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                </Button>
              </div>
              {promoCodeValidation && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  <span>
                    Cupom "{promoCodeValidation.code}" aplicado: 
                    {promoCodeValidation.discountType === "percentage" 
                      ? ` ${promoCodeValidation.discountValue}% de desconto`
                      : ` ${formatCurrency(promoCodeValidation.discountValue)} de desconto`}
                    {promoCodeValidation.categoryName && ` (${promoCodeValidation.categoryName})`}
                  </span>
                </div>
              )}
              {promoCodeError && (
                <p className="text-sm text-destructive">{promoCodeError}</p>
              )}
            </div>

            {(() => {
              let maxInstallments = 1;
              let hasItemLevelInstallments = false;
              for (const orderItem of manualOrderItems) {
                if (orderItem.itemId) {
                  const prod = products?.find(p => p.id === orderItem.itemId);
                  if (prod?.allowInstallments && prod.maxInstallments && prod.maxInstallments > maxInstallments) {
                    maxInstallments = prod.maxInstallments;
                    hasItemLevelInstallments = true;
                  }
                }
              }
              if (!hasItemLevelInstallments && globalInstallmentRules && globalInstallmentRules.length > 0) {
                const subtotal = manualOrderItems.reduce((sum, item) => {
                  const product = products?.find(p => p.id === item.itemId);
                  return sum + (product?.price || 0) * item.quantity;
                }, 0);
                const comboDisc = comboDiscounts?.discount || 0;
                const promoDisc = promoCodeValidation?.discountAmount || 0;
                const finalAmount = Math.max(0, subtotal - comboDisc - promoDisc);
                const activeRules = globalInstallmentRules
                  .filter(r => r.isActive && finalAmount >= r.minTotalAmount)
                  .sort((a, b) => b.minTotalAmount - a.minTotalAmount);
                if (activeRules.length > 0) {
                  maxInstallments = activeRules[0].maxInstallments;
                }
              }
              if (parseInt(manualOrderInstallments) > maxInstallments) {
                setTimeout(() => setManualOrderInstallments(maxInstallments.toString()), 0);
              }
              return (
                <div className="space-y-2">
                  <Label>Parcelamento</Label>
                  <Select value={manualOrderInstallments} onValueChange={setManualOrderInstallments}>
                    <SelectTrigger data-testid="select-installments">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: maxInstallments }, (_, i) => i + 1).map(n => (
                        <SelectItem key={n} value={n.toString()}>
                          {n === 1 ? "A vista" : `${n}x`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })()}

            {manualOrderItems.length > 0 && (() => {
              const subtotal = manualOrderItems.reduce((sum, item) => {
                const product = products?.find(p => p.id === item.itemId);
                return sum + (product?.price || 0) * item.quantity;
              }, 0);
              const comboDisc = comboDiscounts?.discount || 0;
              const promoDisc = promoCodeValidation?.discountAmount || 0;
              const totalDiscount = comboDisc + promoDisc;
              const finalTotal = Math.max(0, subtotal - totalDiscount);
              const installments = parseInt(manualOrderInstallments);
              
              return (
                <div className="p-3 bg-muted rounded-md space-y-2">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {comboDiscounts && comboDiscounts.appliedCombos.length > 0 && (
                    <div className="space-y-1">
                      {comboDiscounts.appliedCombos.map((combo, i) => (
                        <div key={i} className="flex justify-between items-center text-sm text-green-600 dark:text-green-400">
                          <span className="flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            Combo: {combo.name}
                          </span>
                          <span>-{formatCurrency(combo.discountValue)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {promoCodeValidation && promoDisc > 0 && (
                    <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Cupom: {promoCodeValidation.code}
                      </span>
                      <span>-{formatCurrency(promoDisc)}</span>
                    </div>
                  )}
                  
                  {totalDiscount > 0 && (
                    <div className="border-t pt-2" />
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <div className="text-right">
                      {totalDiscount > 0 && (
                        <span className="text-sm text-muted-foreground line-through mr-2">
                          {formatCurrency(subtotal)}
                        </span>
                      )}
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(finalTotal)}
                      </span>
                    </div>
                  </div>
                  
                  {installments > 1 && (
                    <p className="text-sm text-muted-foreground">
                      {installments}x de {formatCurrency(Math.floor(finalTotal / installments))}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setManualOrderDialogOpen(false);
                setEditingOrderId(null);
                setManualOrderMemberId("");
                setManualOrderName("");
                setManualOrderItems([]);
                setManualOrderInstallments("1");
                setManualOrderPromoCode("");
                setPromoCodeValidation(null);
                setPromoCodeError("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (manualOrderItems.length === 0) {
                  toast({ title: "Adicione pelo menos um item", variant: "destructive" });
                  return;
                }
                const validItems = manualOrderItems.filter(i => i.itemId > 0).map(i => ({
                  itemId: i.itemId,
                  quantity: i.quantity,
                  size: i.size || undefined,
                  gender: i.gender || undefined,
                  color: i.color || undefined,
                  colorId: i.colorId || undefined,
                  kitSelections: i.kitSelections?.length > 0 ? i.kitSelections.map(ks => ({
                    componentId: ks.componentId,
                    size: ks.size || undefined,
                    color: ks.color || undefined,
                    colorId: ks.colorId || undefined,
                  })) : undefined,
                }));
                const promoCode = promoCodeValidation ? manualOrderPromoCode.trim() : (editingOrderId && manualOrderPromoCode.trim() ? manualOrderPromoCode.trim() : undefined);
                const installmentCount = parseInt(manualOrderInstallments);

                if (editingOrderId) {
                  editManualOrderMutation.mutate({
                    orderId: editingOrderId,
                    items: validItems,
                    installmentCount,
                    promoCode,
                  });
                } else {
                  if (!manualOrderMemberId && !manualOrderName) {
                    toast({ title: "Selecione um membro ou informe um nome", variant: "destructive" });
                    return;
                  }
                  createManualOrderMutation.mutate({
                    memberId: manualOrderMemberId ? parseInt(manualOrderMemberId) : undefined,
                    manualName: manualOrderName || undefined,
                    promoCode,
                    items: validItems,
                    installmentCount,
                  });
                }
              }}
              disabled={(editingOrderId ? editManualOrderMutation.isPending : createManualOrderMutation.isPending) || manualOrderItems.length === 0}
              data-testid="button-submit-manual-order"
            >
              {(editingOrderId ? editManualOrderMutation.isPending : createManualOrderMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingOrderId ? "Salvar Alterações" : "Criar Pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
