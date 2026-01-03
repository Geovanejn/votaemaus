import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Minus, Plus, Star, ShoppingCart, Check, Menu, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { ShopItem, ShopItemImage, ShopItemSize } from "@shared/schema";

interface ShopItemWithDetails extends ShopItem {
  images: ShopItemImage[];
  sizes: ShopItemSize[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

export default function LojaProdutoPage() {
  const [, params] = useRoute("/loja/produto/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const productId = params?.id ? parseInt(params.id) : null;
  
  const [selectedGender, setSelectedGender] = useState<string>("unissex");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"details" | "reviews" | "faqs">("details");

  const { data: items, isLoading } = useQuery<ShopItemWithDetails[]>({
    queryKey: ["/api/shop/items"],
  });

  const product = items?.find(item => item.id === productId);

  const { data: cartItems } = useQuery<Array<{ id: number; itemId: number; quantity: number }>>({
    queryKey: ["/api/shop/cart"],
    enabled: !!user,
  });

  const cartCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const addToCartMutation = useMutation({
    mutationFn: async (data: { itemId: number; quantity: number; size?: string; gender?: string }) => {
      return apiRequest("POST", "/api/shop/cart", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/cart"] });
      toast({ title: "Adicionado ao carrinho", description: "O item foi adicionado com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível adicionar ao carrinho.", variant: "destructive" });
    },
  });

  const currentImages = product?.images?.filter((img: ShopItemImage) => {
    if (product.genderType === "unissex") return true;
    return img.gender === selectedGender || img.gender === "unissex";
  }) || [];

  const availableSizes = product?.sizes?.filter(s => {
    if (product.genderType === "unissex") return true;
    return s.gender === selectedGender;
  }) || [];

  useEffect(() => {
    setCarouselIndex(0);
  }, [selectedGender]);

  const addToCart = () => {
    if (!product || !user) {
      toast({ title: "Faça login", description: "Entre na sua conta para adicionar ao carrinho.", variant: "destructive" });
      return;
    }
    if (product.hasSize && !selectedSize) {
      toast({ title: "Selecione um tamanho", description: "Escolha o tamanho antes de adicionar.", variant: "destructive" });
      return;
    }
    addToCartMutation.mutate({
      itemId: product.id,
      quantity,
      size: selectedSize || undefined,
      gender: selectedGender,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="p-4">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="aspect-square w-full rounded-lg mb-4" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-2">Produto não encontrado</h2>
          <Link href="/loja">
            <Button variant="outline" data-testid="button-back-catalog">Voltar à loja</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - SHOP.CO Style */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-black" data-testid="button-menu">
              <Menu className="h-6 w-6" />
            </Button>
            <Link href="/loja">
              <span className="text-xl font-bold text-black tracking-tight" data-testid="link-logo">Emaús Shop</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-black" data-testid="button-search">
              <Search className="h-5 w-5" />
            </Button>
            <Link href="/loja/carrinho">
              <Button variant="ghost" size="icon" className="text-black relative" data-testid="button-cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="text-black" data-testid="button-user">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav className="px-4 py-2 text-xs text-gray-500">
        <Link href="/loja" className="hover:text-black">Home</Link>
        <span className="mx-1">&gt;</span>
        <Link href="/loja" className="hover:text-black">Shop</Link>
        <span className="mx-1">&gt;</span>
        <span className="text-black">{product.name}</span>
      </nav>

      {/* Product Image Gallery */}
      <div className="relative bg-gray-50">
        <div className="aspect-square relative">
          {currentImages.length > 0 ? (
            <>
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImages[carouselIndex]?.id}
                  src={currentImages[carouselIndex]?.imageData}
                  alt={product.name}
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
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <ShoppingCart className="h-16 w-16 text-gray-300" />
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {currentImages.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto">
            {currentImages.map((img, idx) => (
              <button
                key={img.id}
                className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === carouselIndex ? "border-black" : "border-transparent"
                }`}
                onClick={() => setCarouselIndex(idx)}
                data-testid={`button-thumbnail-${idx}`}
              >
                <img src={img.imageData} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-4">
        {/* Title */}
        <h1 className="text-xl font-bold text-black uppercase tracking-tight" data-testid="text-product-name">
          {product.name}
        </h1>

        {/* Rating */}
        <StarRating rating={4.5} />

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-black" data-testid="text-product-price">
            {formatCurrency(product.price)}
          </span>
          {product.isPreOrder && (
            <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              -40%
            </Badge>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 leading-relaxed" data-testid="text-product-description">
            {product.description}
          </p>
        )}

        <div className="border-t border-gray-100 pt-4 space-y-4">
          {/* Gender Selection - Select Colors style */}
          {product.genderType !== "unissex" && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Select Colors</p>
              <div className="flex gap-2">
                {["masculino", "feminino"].map((gender) => (
                  <button
                    key={gender}
                    onClick={() => {
                      setSelectedGender(gender);
                      setSelectedSize(null);
                    }}
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedGender === gender
                        ? "border-black"
                        : "border-gray-200"
                    } ${gender === "masculino" ? "bg-green-800" : "bg-blue-800"}`}
                    data-testid={`button-gender-${gender}`}
                  >
                    {selectedGender === gender && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection - Choose Size style */}
          {product.hasSize && availableSizes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Choose Size</p>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((sizeItem) => (
                  <button
                    key={sizeItem.id}
                    onClick={() => setSelectedSize(sizeItem.size)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedSize === sizeItem.size
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    data-testid={`button-size-${sizeItem.size}`}
                  >
                    {sizeItem.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center bg-gray-100 rounded-full">
              <button
                className="p-3 text-gray-600 hover:text-black disabled:opacity-50"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                data-testid="button-quantity-decrease"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-medium text-black" data-testid="text-quantity">
                {quantity}
              </span>
              <button
                className="p-3 text-gray-600 hover:text-black disabled:opacity-50"
                onClick={() => setQuantity(q => Math.min(10, q + 1))}
                disabled={quantity >= 10}
                data-testid="button-quantity-increase"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              className="flex-1 bg-black text-white hover:bg-gray-800 rounded-full h-12 text-sm font-medium"
              onClick={addToCart}
              disabled={addToCartMutation.isPending || (product.hasSize && !selectedSize)}
              data-testid="button-add-to-cart"
            >
              {addToCartMutation.isPending ? "Adicionando..." : "Add to Cart"}
            </Button>
          </div>
        </div>

        {/* Tabs - Product Details, Rating & Reviews, FAQs */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab("details")}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === "details"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500"
              }`}
              data-testid="tab-details"
            >
              Product Details
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === "reviews"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500"
              }`}
              data-testid="tab-reviews"
            >
              Rating & Reviews
            </button>
            <button
              onClick={() => setActiveTab("faqs")}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === "faqs"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500"
              }`}
              data-testid="tab-faqs"
            >
              FAQs
            </button>
          </div>

          {/* Tab Content */}
          <div className="py-4">
            {activeTab === "details" && (
              <div className="text-sm text-gray-600 space-y-2">
                {product.description ? (
                  <p>{product.description}</p>
                ) : (
                  <p>Produto de alta qualidade da UMP Emaús.</p>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-black">
                    All Reviews <span className="text-gray-400">(45)</span>
                  </h3>
                  <Button variant="outline" size="sm" className="rounded-full text-xs">
                    Write a Review
                  </Button>
                </div>

                {/* Sample Review */}
                <div className="border-t border-gray-100 pt-4">
                  <StarRating rating={5} />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-medium text-black">Samantha D.</span>
                    <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    "Adorei a camiseta! O design é único e o tecido é super confortável. 
                    Como alguém exigente, eu aprecio a atenção aos detalhes. 
                    Tornou-se minha peça favorita!"
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Postado em Janeiro 3, 2026</p>
                </div>
              </div>
            )}

            {activeTab === "faqs" && (
              <div className="space-y-3 text-sm">
                <div className="border-b border-gray-100 pb-3">
                  <p className="font-medium text-black">Como funciona a entrega?</p>
                  <p className="text-gray-600 mt-1">Os produtos são entregues nas reuniões da UMP.</p>
                </div>
                <div className="border-b border-gray-100 pb-3">
                  <p className="font-medium text-black">Posso trocar o tamanho?</p>
                  <p className="text-gray-600 mt-1">Sim, desde que o produto esteja em perfeitas condições.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Newsletter Footer */}
      <div className="bg-black text-white p-6 mt-8">
        <h3 className="text-lg font-bold uppercase mb-4">
          FIQUE POR DENTRO DAS NOSSAS OFERTAS
        </h3>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Digite seu email"
            className="flex-1 bg-white text-black rounded-full px-4 py-3 text-sm"
          />
        </div>
        <Button className="w-full mt-3 bg-white text-black hover:bg-gray-100 rounded-full">
          Inscrever-se
        </Button>
      </div>
    </div>
  );
}
