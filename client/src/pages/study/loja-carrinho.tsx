import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingCart, Menu, Search, User, ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { ShopItem, ShopCartItem } from "@shared/schema";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

interface CartItemWithDetails extends ShopCartItem {
  item: ShopItem & { images?: Array<{ id: number; imageData: string; gender: string }> };
}

export default function LojaCarrinhoPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [promoCode, setPromoCode] = useState("");
  const [observation, setObservation] = useState("");

  const { data: cartItems, isLoading } = useQuery<CartItemWithDetails[]>({
    queryKey: ["/api/shop/cart"],
    enabled: !!user,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      return apiRequest("PATCH", `/api/shop/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/cart"] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/shop/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/cart"] });
      toast({ title: "Item removido", description: "O item foi removido do carrinho." });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: { items: Array<{ cartItemId: number; gender: string; size?: string }>; observation?: string }) => {
      return apiRequest("POST", "/api/shop/checkout", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/orders"] });
      toast({ title: "Pedido realizado!", description: "Seu pedido foi enviado com sucesso." });
      setLocation("/meus-pedidos");
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message || "Não foi possível finalizar o pedido.", variant: "destructive" });
    },
  });

  const subtotal = cartItems?.reduce((sum, item) => sum + (item.item.price * item.quantity), 0) || 0;
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;
  const cartCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleCheckout = () => {
    if (!cartItems || cartItems.length === 0) return;
    
    const items = cartItems.map(c => ({
      cartItemId: c.id,
      gender: c.gender || "unissex",
      size: c.size || undefined,
    }));
    
    checkoutMutation.mutate({ items, observation: observation || undefined });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">Faça login para ver seu carrinho</h2>
          <Link href="/login">
            <Button className="bg-black text-white hover:bg-gray-800 rounded-full">
              Entrar
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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
            <Button variant="ghost" size="icon" className="text-black relative" data-testid="button-cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
            <Link href="/meus-pedidos">
              <Button variant="ghost" size="icon" className="text-black" data-testid="button-user">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav className="px-4 py-2 text-xs text-gray-500">
        <Link href="/loja" className="hover:text-black">Home</Link>
        <span className="mx-1">&gt;</span>
        <span className="text-black">Cart</span>
      </nav>

      {/* Title */}
      <div className="px-4 py-4">
        <h1 className="text-2xl font-bold text-black uppercase tracking-tight" data-testid="text-cart-title">
          YOUR CART
        </h1>
      </div>

      {isLoading ? (
        <div className="px-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 p-4 border border-gray-100 rounded-xl">
              <Skeleton className="w-20 h-20 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : !cartItems || cartItems.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Seu carrinho está vazio</h2>
          <p className="text-gray-500 mb-4">Adicione produtos para continuar</p>
          <Link href="/loja">
            <Button className="bg-black text-white hover:bg-gray-800 rounded-full">
              Continuar comprando
            </Button>
          </Link>
        </div>
      ) : (
        <div className="px-4 space-y-4 pb-6">
          {/* Cart Items */}
          {cartItems.map((cartItem) => {
            const image = cartItem.item.images?.find(img => img.gender === cartItem.gender || img.gender === "unissex");
            
            return (
              <motion.div
                key={cartItem.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 p-4 border border-gray-100 rounded-xl"
                data-testid={`cart-item-${cartItem.id}`}
              >
                {/* Product Image */}
                <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                  {image ? (
                    <img src={image.imageData} alt={cartItem.item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-sm text-black line-clamp-1" data-testid={`text-item-name-${cartItem.id}`}>
                        {cartItem.item.name}
                      </h3>
                      <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                        {cartItem.size && <p>Size: <span className="text-black">{cartItem.size}</span></p>}
                        {cartItem.gender && <p>Color: <span className="text-black">{cartItem.gender === "masculino" ? "Green" : cartItem.gender === "feminino" ? "Blue" : "Default"}</span></p>}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItemMutation.mutate(cartItem.id)}
                      className="text-red-500 p-1"
                      data-testid={`button-remove-${cartItem.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-black" data-testid={`text-item-price-${cartItem.id}`}>
                      {formatCurrency(cartItem.item.price)}
                    </span>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
                      <button
                        onClick={() => updateQuantityMutation.mutate({ id: cartItem.id, quantity: Math.max(1, cartItem.quantity - 1) })}
                        disabled={cartItem.quantity <= 1}
                        className="text-gray-600 disabled:opacity-50"
                        data-testid={`button-decrease-${cartItem.id}`}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium text-black">{cartItem.quantity}</span>
                      <button
                        onClick={() => updateQuantityMutation.mutate({ id: cartItem.id, quantity: Math.min(10, cartItem.quantity + 1) })}
                        disabled={cartItem.quantity >= 10}
                        className="text-gray-600 disabled:opacity-50"
                        data-testid={`button-increase-${cartItem.id}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Order Summary */}
          <div className="border border-gray-100 rounded-xl p-4 mt-6">
            <h2 className="text-lg font-bold text-black mb-4">Order Summary</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-black" data-testid="text-subtotal">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium text-black">Grátis</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-medium text-black">Total</span>
                <span className="font-bold text-lg text-black" data-testid="text-total">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Promo Code */}
            <div className="flex gap-2 mt-4">
              <div className="flex-1 relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Add promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="pl-10 rounded-full border-gray-200 bg-gray-50"
                  data-testid="input-promo-code"
                />
              </div>
              <Button variant="outline" className="rounded-full px-6 border-black text-black" data-testid="button-apply-promo">
                Apply
              </Button>
            </div>

            {/* Checkout Button */}
            <Button
              className="w-full mt-4 bg-black text-white hover:bg-gray-800 rounded-full h-12 text-sm font-medium flex items-center justify-center gap-2"
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending}
              data-testid="button-checkout"
            >
              {checkoutMutation.isPending ? "Processando..." : "Go to Checkout"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Newsletter Footer */}
      <div className="bg-black text-white p-6 mt-8">
        <h3 className="text-lg font-bold uppercase mb-4">
          STAY UPTO DATE ABOUT OUR LATEST OFFERS
        </h3>
        <div className="relative">
          <Input
            type="email"
            placeholder="Enter your email address"
            className="bg-white text-black rounded-full px-4 py-3 text-sm pr-4"
          />
        </div>
        <Button className="w-full mt-3 bg-white text-black hover:bg-gray-100 rounded-full">
          Subscribe to Newsletter
        </Button>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-6">
        <h4 className="text-xl font-bold text-black mb-2">SHOP.CO</h4>
        <p className="text-sm text-gray-600">
          We have clothes that suits your style and which you're proud to wear. From women to men.
        </p>
      </div>
    </div>
  );
}
