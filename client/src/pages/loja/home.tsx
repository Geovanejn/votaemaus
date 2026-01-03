import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { 
  ChevronRight,
  ChevronLeft,
  Package,
  Truck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
}

interface ShopCategory {
  id: number;
  name: string;
  description: string | null;
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function LojaHomePage() {
  const { isAuthenticated } = useAuth();
  const [heroIndex, setHeroIndex] = useState(0);

  const { data: featuredItems, isLoading: loadingFeatured } = useQuery<ShopItemWithDetails[]>({
    queryKey: ["/api/shop/featured"],
    enabled: isAuthenticated,
  });

  const { data: categories } = useQuery<ShopCategory[]>({
    queryKey: ["/api/shop/categories"],
    enabled: isAuthenticated,
  });

  const { data: allItems, isLoading: loadingItems } = useQuery<ShopItemWithDetails[]>({
    queryKey: ["/api/shop/items"],
    enabled: isAuthenticated,
  });

  const hasFeatured = featuredItems && featuredItems.length > 0;
  const newArrivals = allItems?.filter(item => item.isAvailable).slice(0, 6) || [];

  useEffect(() => {
    if (hasFeatured && featuredItems.length > 1) {
      const interval = setInterval(() => {
        setHeroIndex((prev) => (prev + 1) % featuredItems.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [hasFeatured, featuredItems?.length]);

  return (
    <div className="min-h-screen bg-white">
      <ShopHeader />

      {/* Hero Banner */}
      {loadingFeatured ? (
        <Skeleton className="w-full aspect-[4/5] max-h-[500px] bg-gray-100" />
      ) : hasFeatured ? (
        <section className="relative bg-gray-100">
          <div className="relative aspect-[4/5] max-h-[500px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                {featuredItems[heroIndex]?.images?.[0]?.imageData ? (
                  <img
                    src={featuredItems[heroIndex].images[0].imageData}
                    alt={featuredItems[heroIndex].name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <Package className="h-20 w-20 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-sm font-medium mb-1 opacity-90">Novidade</p>
                  <h2 className="text-2xl font-bold mb-2" data-testid="text-hero-title">
                    {featuredItems[heroIndex].name}
                  </h2>
                  <p className="text-lg font-semibold mb-4">
                    {formatCurrency(featuredItems[heroIndex].price)}
                  </p>
                  <Link href={`/loja/produto/${featuredItems[heroIndex].id}`}>
                    <Button 
                      className="bg-yellow-400 text-black hover:bg-yellow-500 font-bold px-6"
                      data-testid="button-hero-shop"
                    >
                      Peca ja o seu!!!
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Dots indicator */}
            {featuredItems.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {featuredItems.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      idx === heroIndex ? "bg-white" : "bg-white/40"
                    }`}
                    onClick={() => setHeroIndex(idx)}
                    data-testid={`button-hero-dot-${idx}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-black py-12 px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Emaus Shop</h2>
            <p className="text-black/70 mb-6">Encontre produtos exclusivos da UMP</p>
            <Link href="/loja/catalogo">
              <Button className="bg-black text-white hover:bg-gray-900 px-8">
                Ver Produtos
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Free Shipping Banner */}
      <section className="bg-white border-y border-gray-100 py-4">
        <div className="flex items-center justify-center gap-3 px-4">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
            <Truck className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <p className="font-bold text-black text-sm">FRETE GRATIS</p>
            <p className="text-xs text-gray-500">Em compras acima de R$170</p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      {categories && categories.length > 0 && (
        <section className="px-4 py-6">
          <div className="grid grid-cols-2 gap-3">
            {categories.slice(0, 4).map((cat, index) => {
              const categoryItems = allItems?.filter(item => item.categoryId === cat.id && item.isAvailable) || [];
              const previewImage = categoryItems[0]?.images?.[0]?.imageData;
              
              return (
                <Link key={cat.id} href={`/loja/catalogo?categoria=${cat.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                    data-testid={`card-category-${cat.id}`}
                  >
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <Badge 
                      className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 ${
                        index % 2 === 0 ? "bg-black text-white" : "bg-yellow-400 text-black"
                      }`}
                    >
                      {cat.name.toUpperCase()}
                    </Badge>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="px-4 py-6">
        <h2 className="text-2xl font-bold text-black mb-4">Lancamentos!</h2>

        {loadingItems ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden border border-gray-100">
                <Skeleton className="aspect-square w-full bg-gray-100" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-gray-100" />
                  <Skeleton className="h-5 w-1/2 bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : newArrivals.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto disponivel</h3>
            <p className="text-gray-500">Aguarde novos produtos na loja.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {newArrivals.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/loja/produto/${item.id}`}>
                  <div 
                    className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                    data-testid={`card-item-${item.id}`}
                  >
                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
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
                      {!item.isAvailable && (
                        <Badge className="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-2 py-0.5">
                          Esgotado
                        </Badge>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm text-black line-clamp-2 mb-2" data-testid={`text-item-name-${item.id}`}>
                        {item.name}
                      </h3>
                      <p className="text-lg font-bold text-black" data-testid={`text-item-price-${item.id}`}>
                        {formatCurrency(item.price)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCurrency(item.price * 0.95)} a vista com desconto
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {newArrivals.length > 0 && (
          <div className="mt-6 text-center">
            <Link href="/loja/catalogo">
              <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                Ver Todos os Produtos
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 px-4 mt-8">
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500">UMP Emaus</p>
          <p className="text-xs text-gray-400">Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
}
