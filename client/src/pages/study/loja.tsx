import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/study";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  ChevronLeft,
  ShoppingBag,
  ShoppingCart,
  Package,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2,
  Store
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ShopItemWithDetails {
  id: number;
  name: string;
  description: string | null;
  price: number;
  categoryId: number;
  genderType: string;
  hasSize: boolean;
  isAvailable: boolean;
  isPreOrder: boolean;
  images: { id: number; gender: string; imageData: string }[];
  sizes: { id: number; gender: string; size: string }[];
}

interface CartItem {
  item: ShopItemWithDetails;
  quantity: number;
  selectedGender?: string;
  selectedSize?: string;
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function LojaPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const { data: items, isLoading } = useQuery<ShopItemWithDetails[]>({
    queryKey: ["/api/shop/items"],
    enabled: isAuthenticated,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (cartItems: { itemId: number; quantity: number; gender?: string; size?: string }[]) => {
      return apiRequest("POST", "/api/shop/checkout", { items: cartItems });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/my-orders"] });
      setCart([]);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      toast({
        title: "Pedido realizado",
        description: "Seu pedido foi criado. Aguarde o QR Code PIX.",
      });
      setLocation("/study/meus-pedidos");
    },
    onError: () => {
      toast({
        title: "Erro ao finalizar",
        description: "Não foi possível criar o pedido.",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const addToCart = (item: ShopItemWithDetails) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id
            ? { ...c, quantity: Math.min(c.quantity + 1, 10) }
            : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
    toast({
      title: "Adicionado ao carrinho",
      description: `${item.name} foi adicionado.`,
    });
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id === itemId) {
            const newQty = c.quantity + delta;
            if (newQty <= 0) return null;
            return { ...c, quantity: Math.min(newQty, 10) };
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleCheckout = () => {
    const cartItems = cart.map((c) => ({
      itemId: c.item.id,
      quantity: c.quantity,
    }));
    checkoutMutation.mutate(cartItems);
  };

  const availableItems = items?.filter((item) => item.isAvailable) || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 text-white py-6">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href="/membro">
              <Button 
                variant="ghost" 
                className="mb-2 text-white/80 gap-2"
                data-testid="button-back-member"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" data-testid="text-loja-title">
                    Loja UMP
                  </h1>
                  <p className="text-white/80">
                    Camisetas, kits e mais
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                className="gap-2 relative"
                onClick={() => setIsCartOpen(true)}
                data-testid="button-open-cart"
              >
                <ShoppingCart className="h-4 w-4" />
                Carrinho
                {cartItemCount > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                    data-testid="badge-cart-count"
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-6">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : availableItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum produto disponível</h3>
                <p className="text-muted-foreground">
                  Aguarde novos produtos na loja.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full flex flex-col" data-testid={`card-item-${item.id}`}>
                    <div className="aspect-square bg-muted relative overflow-hidden rounded-t-md">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0].imageData}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      {item.isPreOrder && (
                        <Badge 
                          variant="secondary" 
                          className="absolute top-2 right-2 text-xs"
                        >
                          Pre-venda
                        </Badge>
                      )}
                    </div>
                    <CardContent className="flex-1 pt-4">
                      <h3 className="font-medium text-sm line-clamp-2" data-testid={`text-item-name-${item.id}`}>
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      )}
                      <p className="text-lg font-bold mt-2 text-primary">
                        {formatCurrency(item.price)}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button
                        className="w-full gap-2"
                        size="sm"
                        onClick={() => addToCart(item)}
                        disabled={cart.find((c) => c.item.id === item.id)?.quantity === 10}
                        data-testid={`button-add-cart-${item.id}`}
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Carrinho
            </DialogTitle>
            <DialogDescription>
              {cart.length === 0
                ? "Seu carrinho está vazio"
                : `${cartItemCount} ${cartItemCount === 1 ? "item" : "itens"} no carrinho`}
            </DialogDescription>
          </DialogHeader>

          {cart.length > 0 ? (
            <>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.map((cartItem) => (
                  <div
                    key={cartItem.item.id}
                    className="flex items-center gap-3 p-3 bg-muted rounded-md"
                    data-testid={`cart-item-${cartItem.item.id}`}
                  >
                    <div className="w-12 h-12 bg-background rounded overflow-hidden flex-shrink-0">
                      {cartItem.item.images && cartItem.item.images.length > 0 ? (
                        <img
                          src={cartItem.item.images[0].imageData}
                          alt={cartItem.item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{cartItem.item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(cartItem.item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => updateQuantity(cartItem.item.id, -1)}
                        data-testid={`button-decrease-${cartItem.item.id}`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {cartItem.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => updateQuantity(cartItem.item.id, 1)}
                        disabled={cartItem.quantity >= 10}
                        data-testid={`button-increase-${cartItem.item.id}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFromCart(cartItem.item.id)}
                        data-testid={`button-remove-${cartItem.item.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">Total:</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  data-testid="button-checkout"
                >
                  <CreditCard className="h-4 w-4" />
                  Finalizar Pedido
                </Button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Adicione produtos ao carrinho para continuar
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Confirmar Pedido
            </DialogTitle>
            <DialogDescription>
              Revise seu pedido antes de finalizar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {cart.map((cartItem) => (
              <div
                key={cartItem.item.id}
                className="flex justify-between items-center text-sm"
              >
                <span>
                  {cartItem.quantity}x {cartItem.item.name}
                </span>
                <span className="font-medium">
                  {formatCurrency(cartItem.item.price * cartItem.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Total:</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(cartTotal)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Após confirmar, você receberá um QR Code PIX para pagamento.
              O pagamento deve ser feito em até 15 minutos.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCheckoutOpen(false)}
              data-testid="button-cancel-checkout"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending}
              className="gap-2"
              data-testid="button-confirm-checkout"
            >
              {checkoutMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Confirmar Pedido
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
