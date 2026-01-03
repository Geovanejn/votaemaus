import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PixPaymentModal } from "@/components/PixPaymentModal";
import { 
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Package,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  CheckCircle,
  Loader2,
  AlertTriangle,
  ArrowRight,
  X,
  Home
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
  isFeatured: boolean;
  featuredOrder: number | null;
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
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [addQuantity, setAddQuantity] = useState(1);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixPaymentData, setPixPaymentData] = useState<{
    entryId: number;
    amount: number;
    description: string;
  } | null>(null);

  const { data: items, isLoading } = useQuery<ShopItemWithDetails[]>({
    queryKey: ["/api/shop/items"],
    enabled: isAuthenticated,
  });

  const { data: pixStatus } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/pix/status"],
    enabled: isAuthenticated,
  });

  const featuredItems = items?.filter(item => item.isFeatured && item.isAvailable)
    .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0)) || [];

  useEffect(() => {
    if (featuredItems.length > 1) {
      const interval = setInterval(() => {
        setHeroIndex(i => (i + 1) % featuredItems.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [featuredItems.length]);

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
      const res = await apiRequest("POST", "/api/shop/checkout", data);
      return res.json();
    },
    onSuccess: async (orderData: { orderId: number; orderCode: string; totalAmount: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/my-orders"] });
      setCart([]);
      setObservation("");
      setIsCheckoutOpen(false);
      setIsCartOpen(false);

      if (pixStatus?.configured === false) {
        toast({
          title: "Pedido realizado",
          description: "Seu pedido foi criado. Acesse Meus Pedidos para pagar.",
        });
        setLocation("/meus-pedidos");
      } else {
        try {
          const pixRes = await apiRequest("POST", `/api/pix/shop-order/${orderData.orderId}`);
          const pixData = await pixRes.json();
          setPixPaymentData({
            entryId: pixData.entryId,
            amount: pixData.amount,
            description: `Pedido #${orderData.orderCode}`,
          });
          setPixModalOpen(true);
        } catch {
          toast({
            title: "Pedido criado",
            description: "Seu pedido foi criado. Acesse Meus Pedidos para pagar.",
          });
          setLocation("/meus-pedidos");
        }
      }
    },
    onError: () => {
      toast({
        title: "Erro ao finalizar",
        description: "Não foi possível criar o pedido.",
        variant: "destructive",
      });
    },
  });

  const handlePixPaymentComplete = () => {
    setPixModalOpen(false);
    setPixPaymentData(null);
    toast({
      title: "Pagamento confirmado!",
      description: "Seu pedido foi pago com sucesso.",
    });
    setLocation("/meus-pedidos");
  };

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

  const currentFeaturedItem = featuredItems[heroIndex];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/membro">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-zinc-400 hover:text-white gap-1"
                data-testid="button-back-member"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Inicio</span>
              </Button>
            </Link>
            
            <h1 className="text-lg font-bold tracking-wide text-yellow-400" data-testid="text-loja-title">
              LOJA UMP
            </h1>
            
            <div className="flex items-center gap-2">
              <Link href="/meus-pedidos">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-zinc-400 hover:text-white"
                  data-testid="button-my-orders"
                >
                  Pedidos
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-zinc-400 hover:text-white"
                onClick={() => setIsCartOpen(true)}
                data-testid="button-open-cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 h-5 w-5 bg-yellow-400 text-zinc-950 text-xs font-bold rounded-full flex items-center justify-center"
                    data-testid="badge-cart-count"
                  >
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      {featuredItems.length > 0 && currentFeaturedItem && (
        <section className="relative bg-zinc-900 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-6 py-8 md:py-12">
              <div className="flex-1 space-y-4 text-center md:text-left">
                <motion.div
                  key={currentFeaturedItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Badge className="bg-yellow-400 text-zinc-950 hover:bg-yellow-500 mb-2">
                    Destaque
                  </Badge>
                  <h2 className="text-2xl md:text-4xl font-bold">
                    {currentFeaturedItem.name}
                  </h2>
                  <p className="text-zinc-400 mt-2 line-clamp-2">
                    {currentFeaturedItem.description || "Produto exclusivo da UMP Emaus"}
                  </p>
                  <div className="flex items-center gap-4 mt-4 justify-center md:justify-start">
                    <span className="text-2xl md:text-3xl font-bold text-yellow-400">
                      {formatCurrency(currentFeaturedItem.price)}
                    </span>
                  </div>
                  <Button
                    className="mt-4 bg-yellow-400 text-zinc-950 hover:bg-yellow-500 gap-2"
                    onClick={() => setViewingItem(currentFeaturedItem)}
                    data-testid={`button-hero-buy-${currentFeaturedItem.id}`}
                  >
                    Comprar Agora
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
              
              <div className="flex-shrink-0 w-full md:w-1/2 max-w-md">
                <motion.div
                  key={currentFeaturedItem.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="aspect-square bg-zinc-800 rounded-2xl overflow-hidden"
                >
                  {currentFeaturedItem.images && currentFeaturedItem.images.length > 0 ? (
                    <img
                      src={currentFeaturedItem.images[0].imageData}
                      alt={currentFeaturedItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-20 w-20 text-zinc-600" />
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
            
            {featuredItems.length > 1 && (
              <div className="flex justify-center gap-2 pb-6">
                {featuredItems.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === heroIndex ? 'bg-yellow-400' : 'bg-zinc-600'
                    }`}
                    onClick={() => setHeroIndex(idx)}
                    data-testid={`button-hero-dot-${idx}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Products Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Todos os Produtos</h2>
            <span className="text-zinc-500 text-sm">
              {availableItems.length} {availableItems.length === 1 ? 'produto' : 'produtos'}
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-zinc-900 rounded-xl overflow-hidden">
                  <Skeleton className="aspect-square w-full bg-zinc-800" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                    <Skeleton className="h-5 w-1/2 bg-zinc-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : availableItems.length === 0 ? (
            <div className="bg-zinc-900 rounded-xl p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-zinc-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum produto disponivel</h3>
              <p className="text-zinc-500">
                Aguarde novos produtos na loja.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div 
                    className="bg-zinc-900 rounded-xl overflow-hidden cursor-pointer group"
                    onClick={() => setViewingItem(item)}
                    data-testid={`card-item-${item.id}`}
                  >
                    <div className="aspect-square bg-zinc-800 relative overflow-hidden">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0].imageData}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-zinc-600" />
                        </div>
                      )}
                      {item.isPreOrder && (
                        <Badge 
                          className="absolute top-2 right-2 bg-zinc-950/80 text-yellow-400 text-xs"
                        >
                          Pre-venda
                        </Badge>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 group-hover:text-yellow-400 transition-colors" data-testid={`text-item-name-${item.id}`}>
                        {item.name}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-yellow-400">
                          {formatCurrency(item.price)}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {getGenderLabel(item.genderType)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Product Detail Modal */}
      <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 bg-zinc-900 border-zinc-800 text-white">
          {viewingItem && (
            <>
              <div className="relative aspect-square bg-zinc-800">
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
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-zinc-950/70 hover:bg-zinc-950 border-0"
                          onClick={() => setCarouselIndex(i => (i - 1 + currentImages.length) % currentImages.length)}
                          data-testid="button-carousel-prev"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-950/70 hover:bg-zinc-950 border-0"
                          onClick={() => setCarouselIndex(i => (i + 1) % currentImages.length)}
                          data-testid="button-carousel-next"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {currentImages.map((_, idx) => (
                            <button
                              key={idx}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                idx === carouselIndex ? 'bg-yellow-400' : 'bg-white/50'
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
                    <Package className="h-16 w-16 text-zinc-600" />
                  </div>
                )}
                {viewingItem.isPreOrder && (
                  <Badge className="absolute top-4 right-4 bg-yellow-400 text-zinc-950">Pre-venda</Badge>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 text-white hover:bg-zinc-950/50"
                  onClick={() => setViewingItem(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold" data-testid="text-item-detail-name">
                    {viewingItem.name}
                  </h2>
                  <p className="text-2xl font-bold text-yellow-400 mt-1">
                    {formatCurrency(viewingItem.price)}
                  </p>
                </div>

                {viewingItem.description && (
                  <p className="text-zinc-400 text-sm">
                    {viewingItem.description}
                  </p>
                )}

                {getGendersForType(viewingItem.genderType).length > 1 && (
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Modelo</Label>
                    <div className="flex gap-2">
                      {getGendersForType(viewingItem.genderType).map(g => (
                        <Button
                          key={g}
                          variant={selectedGender === g ? "default" : "outline"}
                          size="sm"
                          className={selectedGender === g 
                            ? "bg-yellow-400 text-zinc-950 hover:bg-yellow-500" 
                            : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                          }
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
                    <Label className="text-zinc-300">Tamanho</Label>
                    {currentSizes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {currentSizes.map(s => (
                          <Button
                            key={s.id}
                            variant={selectedSize === s.size ? "default" : "outline"}
                            size="sm"
                            className={selectedSize === s.size 
                              ? "bg-yellow-400 text-zinc-950 hover:bg-yellow-500" 
                              : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            }
                            onClick={() => setSelectedSize(s.size)}
                            data-testid={`button-size-${s.size}`}
                          >
                            {s.size}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        Nenhum tamanho disponivel para este modelo
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Label className="text-zinc-300">Quantidade</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="border-zinc-700 hover:bg-zinc-800"
                      onClick={() => setAddQuantity(q => Math.max(1, q - 1))}
                      disabled={addQuantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{addQuantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="border-zinc-700 hover:bg-zinc-800"
                      onClick={() => setAddQuantity(q => Math.min(10, q + 1))}
                      disabled={addQuantity >= 10}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full gap-2 bg-yellow-400 text-zinc-950 hover:bg-yellow-500 font-semibold"
                  size="lg"
                  onClick={addToCart}
                  disabled={viewingItem.hasSize && !selectedSize}
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Adicionar - {formatCurrency(viewingItem.price * addQuantity)}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Modal */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <ShoppingCart className="h-5 w-5 text-yellow-400" />
              Carrinho
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {cart.length === 0
                ? "Seu carrinho esta vazio"
                : `${cartItemCount} ${cartItemCount === 1 ? "item" : "itens"} no carrinho`}
            </DialogDescription>
          </DialogHeader>

          {cart.length > 0 ? (
            <>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.map((cartItem) => (
                  <div
                    key={cartItem.cartId}
                    className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg"
                    data-testid={`cart-item-${cartItem.cartId}`}
                  >
                    <div className="w-14 h-14 bg-zinc-700 rounded-lg overflow-hidden flex-shrink-0">
                      {cartItem.item.images && cartItem.item.images.length > 0 ? (
                        <img
                          src={cartItem.item.images.find(i => i.gender === cartItem.selectedGender)?.imageData || cartItem.item.images[0].imageData}
                          alt={cartItem.item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-zinc-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{cartItem.item.name}</p>
                      <p className="text-xs text-zinc-500">
                        {getGenderLabel(cartItem.selectedGender)}
                        {cartItem.selectedSize && ` - ${cartItem.selectedSize}`}
                      </p>
                      <p className="text-sm font-medium text-yellow-400">
                        {formatCurrency(cartItem.item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700"
                        onClick={() => updateQuantity(cartItem.cartId, -1)}
                        data-testid={`button-decrease-${cartItem.cartId}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-medium text-sm">
                        {cartItem.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700"
                        onClick={() => updateQuantity(cartItem.cartId, 1)}
                        disabled={cartItem.quantity >= 10}
                        data-testid={`button-increase-${cartItem.cartId}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-zinc-700"
                        onClick={() => removeFromCart(cartItem.cartId)}
                        data-testid={`button-remove-${cartItem.cartId}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-700 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium text-zinc-300">Total:</span>
                  <span className="text-2xl font-bold text-yellow-400">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                <Button
                  className="w-full gap-2 bg-yellow-400 text-zinc-950 hover:bg-yellow-500 font-semibold"
                  size="lg"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  disabled={!canCheckout}
                  data-testid="button-checkout"
                >
                  <CreditCard className="h-5 w-5" />
                  Finalizar Pedido
                </Button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <ShoppingCart className="h-16 w-16 mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-500">
                Adicione produtos ao carrinho para continuar
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5 text-yellow-400" />
              Confirmar Pedido
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Revise seu pedido antes de finalizar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 bg-zinc-800 rounded-lg p-4">
            {cart.map((cartItem) => (
              <div
                key={cartItem.cartId}
                className="flex justify-between items-start text-sm"
              >
                <div>
                  <span className="font-medium">
                    {cartItem.quantity}x {cartItem.item.name}
                  </span>
                  <p className="text-xs text-zinc-500">
                    {getGenderLabel(cartItem.selectedGender)}
                    {cartItem.selectedSize && ` - ${cartItem.selectedSize}`}
                  </p>
                </div>
                <span className="font-medium text-yellow-400">
                  {formatCurrency(cartItem.item.price * cartItem.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observation" className="text-zinc-300">Observacoes (opcional)</Label>
            <Textarea
              id="observation"
              placeholder="Alguma observacao sobre seu pedido?"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              maxLength={500}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              data-testid="input-observation"
            />
            <p className="text-xs text-zinc-500 text-right">
              {observation.length}/500
            </p>
          </div>

          <div className="border-t border-zinc-700 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-zinc-300">Total:</span>
              <span className="text-2xl font-bold text-yellow-400">
                {formatCurrency(cartTotal)}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Apos confirmar, voce recebera um QR Code PIX para pagamento.
              O pagamento deve ser feito em ate 15 minutos.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={() => setIsCheckoutOpen(false)}
              data-testid="button-cancel-checkout"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending}
              className="gap-2 bg-yellow-400 text-zinc-950 hover:bg-yellow-500 font-semibold"
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

      {pixPaymentData && (
        <PixPaymentModal
          open={pixModalOpen}
          onOpenChange={setPixModalOpen}
          entryId={pixPaymentData.entryId}
          amount={pixPaymentData.amount}
          description={pixPaymentData.description}
          onPaymentComplete={handlePixPaymentComplete}
        />
      )}
    </div>
  );
}
