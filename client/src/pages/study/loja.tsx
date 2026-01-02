import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/study";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  ShoppingCart,
  Package,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  CheckCircle,
  Loader2,
  Store,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  images: { id: number; gender: string; imageData: string; sortOrder: number }[];
  sizes: { id: number; gender: string; size: string; sortOrder: number }[];
}

interface CartItem {
  item: ShopItemWithDetails;
  quantity: number;
  selectedGender: string;
  selectedSize: string | null;
  cartId: string;
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getGenderLabel(gender: string): string {
  const labels: Record<string, string> = {
    unissex: "Unissex",
    masculino: "Masculino",
    feminino: "Feminino",
    masculino_feminino: "Masc. e Fem.",
  };
  return labels[gender] || gender;
}

function getGendersForType(genderType: string): string[] {
  if (genderType === "masculino_feminino") return ["masculino", "feminino"];
  return [genderType];
}

export default function LojaPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [observation, setObservation] = useState("");
  const [viewingItem, setViewingItem] = useState<ShopItemWithDetails | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [addQuantity, setAddQuantity] = useState(1);

  const { data: items, isLoading } = useQuery<ShopItemWithDetails[]>({
    queryKey: ["/api/shop/items"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (viewingItem) {
      const genders = getGendersForType(viewingItem.genderType);
      setSelectedGender(genders[0]);
      setSelectedSize("");
      setCarouselIndex(0);
      setAddQuantity(1);
    }
  }, [viewingItem]);

  useEffect(() => {
    if (viewingItem && selectedGender) {
      setCarouselIndex(0);
    }
  }, [selectedGender, viewingItem]);

  const checkoutMutation = useMutation({
    mutationFn: async (data: { 
      items: { itemId: number; quantity: number; gender: string; size: string | null }[]; 
      observation: string 
    }) => {
      return apiRequest("POST", "/api/shop/checkout", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/my-orders"] });
      setCart([]);
      setObservation("");
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

  const addToCart = () => {
    if (!viewingItem) return;
    
    if (viewingItem.hasSize && !selectedSize) {
      toast({
        title: "Selecione um tamanho",
        description: "É necessário escolher um tamanho para este produto.",
        variant: "destructive",
      });
      return;
    }

    const cartId = `${viewingItem.id}-${selectedGender}-${selectedSize || 'nosize'}`;
    
    setCart((prev) => {
      const existing = prev.find((c) => c.cartId === cartId);
      if (existing) {
        return prev.map((c) =>
          c.cartId === cartId
            ? { ...c, quantity: Math.min(c.quantity + addQuantity, 10) }
            : c
        );
      }
      return [...prev, { 
        item: viewingItem, 
        quantity: addQuantity, 
        selectedGender,
        selectedSize: viewingItem.hasSize ? selectedSize : null,
        cartId
      }];
    });

    toast({
      title: "Adicionado ao carrinho",
      description: `${viewingItem.name} foi adicionado.`,
    });
    
    setViewingItem(null);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.cartId === cartId) {
            const newQty = c.quantity + delta;
            if (newQty <= 0) return null;
            return { ...c, quantity: Math.min(newQty, 10) };
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((c) => c.cartId !== cartId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleCheckout = () => {
    const cartItems = cart.map((c) => ({
      itemId: c.item.id,
      quantity: c.quantity,
      gender: c.selectedGender,
      size: c.selectedSize,
    }));
    checkoutMutation.mutate({ items: cartItems, observation });
  };

  const availableItems = items?.filter((item) => item.isAvailable) || [];

  const getImagesForGender = (item: ShopItemWithDetails, gender: string) => {
    return item.images
      .filter(img => img.gender === gender)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const getSizesForGender = (item: ShopItemWithDetails, gender: string) => {
    return item.sizes
      .filter(s => s.gender === gender)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const currentImages = viewingItem ? getImagesForGender(viewingItem, selectedGender) : [];
  const currentSizes = viewingItem ? getSizesForGender(viewingItem, selectedGender) : [];

  const canCheckout = cart.every(c => 
    !c.item.hasSize || c.selectedSize
  );

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
            <div className="flex items-center justify-between gap-4">
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
                <span className="hidden sm:inline">Carrinho</span>
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
                  <Card 
                    className="h-full flex flex-col cursor-pointer hover-elevate" 
                    onClick={() => setViewingItem(item)}
                    data-testid={`card-item-${item.id}`}
                  >
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
                          Pré-venda
                        </Badge>
                      )}
                    </div>
                    <CardContent className="flex-1 pt-4">
                      <h3 className="font-medium text-sm line-clamp-2" data-testid={`text-item-name-${item.id}`}>
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getGenderLabel(item.genderType)}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold mt-2 text-primary">
                        {formatCurrency(item.price)}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button
                        className="w-full gap-2"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingItem(item);
                        }}
                        data-testid={`button-view-item-${item.id}`}
                      >
                        Ver Detalhes
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
          {viewingItem && (
            <>
              <div className="relative aspect-square bg-muted">
                {currentImages.length > 0 ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentImages[carouselIndex]?.id}
                        src={currentImages[carouselIndex]?.imageData}
                        alt={viewingItem.name}
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    </AnimatePresence>
                    {currentImages.length > 1 && (
                      <>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute left-2 top-1/2 -translate-y-1/2"
                          onClick={() => setCarouselIndex(i => (i - 1 + currentImages.length) % currentImages.length)}
                          data-testid="button-carousel-prev"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setCarouselIndex(i => (i + 1) % currentImages.length)}
                          data-testid="button-carousel-next"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {currentImages.map((_, idx) => (
                            <button
                              key={idx}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                idx === carouselIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                              onClick={() => setCarouselIndex(idx)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                {viewingItem.isPreOrder && (
                  <Badge className="absolute top-4 right-4">Pré-venda</Badge>
                )}
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-bold" data-testid="text-item-detail-name">
                    {viewingItem.name}
                  </h2>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {formatCurrency(viewingItem.price)}
                  </p>
                </div>

                {viewingItem.description && (
                  <p className="text-muted-foreground text-sm">
                    {viewingItem.description}
                  </p>
                )}

                {getGendersForType(viewingItem.genderType).length > 1 && (
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <div className="flex gap-2">
                      {getGendersForType(viewingItem.genderType).map(g => (
                        <Button
                          key={g}
                          variant={selectedGender === g ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setSelectedGender(g);
                            setSelectedSize("");
                          }}
                          data-testid={`button-gender-${g}`}
                        >
                          {getGenderLabel(g)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {viewingItem.hasSize && (
                  <div className="space-y-2">
                    <Label>Tamanho</Label>
                    {currentSizes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {currentSizes.map(s => (
                          <Button
                            key={s.id}
                            variant={selectedSize === s.size ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedSize(s.size)}
                            data-testid={`button-size-${s.size}`}
                          >
                            {s.size}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Nenhum tamanho disponível para este modelo
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Label>Quantidade</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setAddQuantity(q => Math.max(1, q - 1))}
                      disabled={addQuantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{addQuantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setAddQuantity(q => Math.min(10, q + 1))}
                      disabled={addQuantity >= 10}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={addToCart}
                  disabled={viewingItem.hasSize && !selectedSize}
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Adicionar ao Carrinho - {formatCurrency(viewingItem.price * addQuantity)}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                    key={cartItem.cartId}
                    className="flex items-center gap-3 p-3 bg-muted rounded-md"
                    data-testid={`cart-item-${cartItem.cartId}`}
                  >
                    <div className="w-12 h-12 bg-background rounded overflow-hidden flex-shrink-0">
                      {cartItem.item.images && cartItem.item.images.length > 0 ? (
                        <img
                          src={cartItem.item.images.find(i => i.gender === cartItem.selectedGender)?.imageData || cartItem.item.images[0].imageData}
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
                      <p className="text-xs text-muted-foreground">
                        {getGenderLabel(cartItem.selectedGender)}
                        {cartItem.selectedSize && ` - ${cartItem.selectedSize}`}
                      </p>
                      <p className="text-sm font-medium">
                        {formatCurrency(cartItem.item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => updateQuantity(cartItem.cartId, -1)}
                        data-testid={`button-decrease-${cartItem.cartId}`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center font-medium text-sm">
                        {cartItem.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => updateQuantity(cartItem.cartId, 1)}
                        disabled={cartItem.quantity >= 10}
                        data-testid={`button-increase-${cartItem.cartId}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFromCart(cartItem.cartId)}
                        data-testid={`button-remove-${cartItem.cartId}`}
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
                  disabled={!canCheckout}
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                key={cartItem.cartId}
                className="flex justify-between items-start text-sm"
              >
                <div>
                  <span className="font-medium">
                    {cartItem.quantity}x {cartItem.item.name}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {getGenderLabel(cartItem.selectedGender)}
                    {cartItem.selectedSize && ` - ${cartItem.selectedSize}`}
                  </p>
                </div>
                <span className="font-medium">
                  {formatCurrency(cartItem.item.price * cartItem.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observation">Observações (opcional)</Label>
            <Textarea
              id="observation"
              placeholder="Alguma observação sobre seu pedido?"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              maxLength={500}
              data-testid="input-observation"
            />
            <p className="text-xs text-muted-foreground text-right">
              {observation.length}/500
            </p>
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
