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
  CheckCircle,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Menu,
  Search,
  User,
  Star
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

function StarRating({ rating = 4.5 }: { rating?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.floor(rating)
              ? "fill-yellow-400 text-yellow-400"
              : star - 0.5 <= rating
              ? "fill-yellow-400/50 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating}/5</span>
    </div>
  );
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
        description: "Nao foi possivel criar o pedido.",
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
        description: "E necessario escolher um tamanho para este produto.",
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
    <div className="min-h-screen bg-white">
      {/* Header - SHOP.CO Style */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link href="/membro">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-black"
                data-testid="button-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </Link>
            
            <h1 className="text-xl font-bold tracking-tight text-black" style={{ fontFamily: 'system-ui' }} data-testid="text-loja-title">
              Emaús Shop
            </h1>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-black"
                data-testid="button-search"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Link href="/loja/carrinho">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-black"
                  data-testid="button-open-cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 h-5 w-5 bg-black text-white text-xs font-bold rounded-full flex items-center justify-center"
                      data-testid="badge-cart-count"
                    >
                      {cartItemCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/meus-pedidos">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-black"
                  data-testid="button-my-orders"
                >
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50">
        <span>Home</span>
        <ChevronRight className="inline h-3 w-3 mx-1" />
        <span className="text-black">Loja</span>
      </div>

      {/* Category Title */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-black">Produtos</h2>
            <p className="text-xs text-gray-500 mt-1">
              Mostrando 1-{availableItems.length} de {availableItems.length} Produtos
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid - SHOP.CO Style */}
      <section className="px-4 pb-8">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-50 rounded-2xl overflow-hidden">
                <Skeleton className="aspect-square w-full bg-gray-100" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-gray-100" />
                  <Skeleton className="h-3 w-1/2 bg-gray-100" />
                  <Skeleton className="h-5 w-1/3 bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : availableItems.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto disponivel</h3>
            <p className="text-gray-500">
              Aguarde novos produtos na loja.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {availableItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Link href={`/loja/produto/${item.id}`}>
                <div 
                  className="bg-gray-50 rounded-2xl overflow-hidden cursor-pointer"
                  data-testid={`card-item-${item.id}`}
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0].imageData}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    {item.isPreOrder && (
                      <Badge 
                        className="absolute top-2 right-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full"
                      >
                        Pre-venda
                      </Badge>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm text-black line-clamp-2 mb-1" data-testid={`text-item-name-${item.id}`}>
                      {item.name}
                    </h3>
                    <StarRating rating={4.5} />
                    <div className="mt-2">
                      <span className="text-lg font-bold text-black">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  </div>
                </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Product Detail Modal - SHOP.CO Style */}
      <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
        <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto p-0 bg-white border-0 rounded-none sm:rounded-2xl">
          {viewingItem && (
            <>
              {/* Image Gallery */}
              <div className="relative bg-gray-100">
                <div className="aspect-square relative">
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
                          <button
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md"
                            onClick={() => setCarouselIndex(i => (i - 1 + currentImages.length) % currentImages.length)}
                            data-testid="button-carousel-prev"
                          >
                            <ChevronLeft className="h-5 w-5 text-black" />
                          </button>
                          <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md"
                            onClick={() => setCarouselIndex(i => (i + 1) % currentImages.length)}
                            data-testid="button-carousel-next"
                          >
                            <ChevronRight className="h-5 w-5 text-black" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-gray-300" />
                    </div>
                  )}
                </div>
                
                {/* Thumbnails */}
                {currentImages.length > 1 && (
                  <div className="flex gap-2 p-3 justify-center">
                    {currentImages.map((img, idx) => (
                      <button
                        key={img.id}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === carouselIndex ? 'border-black' : 'border-transparent'
                        }`}
                        onClick={() => setCarouselIndex(idx)}
                        data-testid={`button-thumbnail-${idx}`}
                      >
                        <img
                          src={img.imageData}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-5 space-y-4">
                {/* Product Name */}
                <h2 className="text-xl font-bold text-black uppercase tracking-tight" data-testid="text-item-detail-name">
                  {viewingItem.name}
                </h2>

                {/* Rating */}
                <StarRating rating={4.5} />

                {/* Price */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-black">
                    {formatCurrency(viewingItem.price)}
                  </span>
                </div>

                {/* Description */}
                {viewingItem.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {viewingItem.description}
                  </p>
                )}

                <div className="border-t border-gray-100 pt-4 space-y-4">
                  {/* Gender Selection */}
                  {getGendersForType(viewingItem.genderType).length > 1 && (
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Modelo</Label>
                      <div className="flex gap-2 flex-wrap">
                        {getGendersForType(viewingItem.genderType).map(g => (
                          <button
                            key={g}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              selectedGender === g 
                                ? "bg-black text-white" 
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                            onClick={() => {
                              setSelectedGender(g);
                              setSelectedSize("");
                            }}
                            data-testid={`button-gender-${g}`}
                          >
                            {getGenderLabel(g)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size Selection */}
                  {viewingItem.hasSize && (
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Tamanho</Label>
                      {currentSizes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {currentSizes.map(s => (
                            <button
                              key={s.id}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                selectedSize === s.size 
                                  ? "bg-black text-white" 
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                              onClick={() => setSelectedSize(s.size)}
                              data-testid={`button-size-${s.size}`}
                            >
                              {s.size}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-red-500 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Nenhum tamanho disponivel para este modelo
                        </p>
                      )}
                    </div>
                  )}

                  {/* Quantity + Add to Cart */}
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex items-center bg-gray-100 rounded-full">
                      <button
                        className="p-3 text-gray-600 hover:text-black disabled:opacity-50"
                        onClick={() => setAddQuantity(q => Math.max(1, q - 1))}
                        disabled={addQuantity <= 1}
                        data-testid="button-quantity-decrease"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-medium text-black" data-testid="text-quantity">{addQuantity}</span>
                      <button
                        className="p-3 text-gray-600 hover:text-black disabled:opacity-50"
                        onClick={() => setAddQuantity(q => Math.min(10, q + 1))}
                        disabled={addQuantity >= 10}
                        data-testid="button-quantity-increase"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <Button
                      className="flex-1 bg-black text-white hover:bg-gray-800 rounded-full h-12 text-sm font-medium"
                      onClick={addToCart}
                      disabled={viewingItem.hasSize && !selectedSize}
                      data-testid="button-add-to-cart"
                    >
                      Adicionar ao Carrinho
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Modal - SHOP.CO Style */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-md max-h-[95vh] overflow-y-auto p-0 bg-white border-0 rounded-none sm:rounded-2xl">
          {/* Breadcrumb */}
          <div className="px-4 py-3 border-b border-gray-100 text-xs text-gray-500">
            <span>Home</span>
            <ChevronRight className="inline h-3 w-3 mx-1" />
            <span className="text-black">Carrinho</span>
          </div>

          <div className="p-4">
            <h2 className="text-2xl font-bold text-black mb-4">SEU CARRINHO</h2>

            {cart.length > 0 ? (
              <>
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  {cart.map((cartItem) => (
                    <div
                      key={cartItem.cartId}
                      className="flex gap-3"
                      data-testid={`cart-item-${cartItem.cartId}`}
                    >
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {cartItem.item.images && cartItem.item.images.length > 0 ? (
                          <img
                            src={cartItem.item.images.find(i => i.gender === cartItem.selectedGender)?.imageData || cartItem.item.images[0].imageData}
                            alt={cartItem.item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm text-black">{cartItem.item.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Tamanho: {cartItem.selectedSize || "Unico"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Modelo: {getGenderLabel(cartItem.selectedGender)}
                            </p>
                          </div>
                          <button
                            className="text-red-500 hover:text-red-600 p-1"
                            onClick={() => removeFromCart(cartItem.cartId)}
                            data-testid={`button-remove-${cartItem.cartId}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-black">
                            {formatCurrency(cartItem.item.price)}
                          </span>
                          <div className="flex items-center bg-gray-100 rounded-full">
                            <button
                              className="p-2 text-gray-600 hover:text-black"
                              onClick={() => updateQuantity(cartItem.cartId, -1)}
                              data-testid={`button-decrease-${cartItem.cartId}`}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium text-black">
                              {cartItem.quantity}
                            </span>
                            <button
                              className="p-2 text-gray-600 hover:text-black disabled:opacity-50"
                              onClick={() => updateQuantity(cartItem.cartId, 1)}
                              disabled={cartItem.quantity >= 10}
                              data-testid={`button-increase-${cartItem.cartId}`}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="mt-6 border-t border-gray-100 pt-4 space-y-3">
                  <h3 className="font-bold text-lg text-black">Resumo do Pedido</h3>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="text-black">{formatCurrency(cartTotal)}</span>
                  </div>
                  
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="font-medium text-black">Total</span>
                    <span className="font-bold text-xl text-black">{formatCurrency(cartTotal)}</span>
                  </div>

                  <Button
                    className="w-full bg-black text-white hover:bg-gray-800 rounded-full h-12 text-sm font-medium gap-2 mt-4"
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    disabled={!canCheckout}
                    data-testid="button-checkout"
                  >
                    Finalizar Compra
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <ShoppingCart className="h-16 w-16 mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500">
                  Seu carrinho esta vazio
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white border-0 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">
              Confirmar Pedido
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Revise seu pedido antes de finalizar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 bg-gray-50 rounded-xl p-4">
            {cart.map((cartItem) => (
              <div
                key={cartItem.cartId}
                className="flex justify-between items-start text-sm"
              >
                <div>
                  <span className="font-medium text-black">
                    {cartItem.quantity}x {cartItem.item.name}
                  </span>
                  <p className="text-xs text-gray-500">
                    {getGenderLabel(cartItem.selectedGender)}
                    {cartItem.selectedSize && ` - ${cartItem.selectedSize}`}
                  </p>
                </div>
                <span className="font-medium text-black">
                  {formatCurrency(cartItem.item.price * cartItem.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observation" className="text-gray-600">Observacoes (opcional)</Label>
            <Textarea
              id="observation"
              placeholder="Alguma observacao sobre seu pedido?"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              maxLength={500}
              className="bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 rounded-xl"
              data-testid="input-observation"
            />
            <p className="text-xs text-gray-400 text-right">
              {observation.length}/500
            </p>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-600">Total:</span>
              <span className="text-2xl font-bold text-black">
                {formatCurrency(cartTotal)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Apos confirmar, voce recebera um QR Code PIX para pagamento.
              O pagamento deve ser feito em ate 15 minutos.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-full"
              onClick={() => setIsCheckoutOpen(false)}
              data-testid="button-cancel-checkout"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending}
              className="gap-2 bg-black text-white hover:bg-gray-800 rounded-full"
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
