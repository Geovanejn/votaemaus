import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  ChevronRight,
  ShoppingCart,
  Package,
  Menu,
  Search,
  User,
  Star,
  X
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

export default function LojaHomePage() {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
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

  const { data: serverCartItems } = useQuery<Array<{ id: number; quantity: number }>>({
    queryKey: ["/api/shop/cart"],
    enabled: isAuthenticated,
  });

  const cartItemCount = serverCartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const newArrivals = allItems?.filter(item => item.isAvailable).slice(0, 4) || [];
  const hasFeatured = featuredItems && featuredItems.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-black"
                  data-testid="button-menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-white p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="text-left">Emaús Shop</SheetTitle>
                </SheetHeader>
                <nav className="p-4 space-y-2">
                  <Link href="/loja" onClick={() => setMenuOpen(false)}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer" data-testid="link-menu-home">
                      <span className="font-medium text-black">Início</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </Link>
                  <Link href="/loja/catalogo" onClick={() => setMenuOpen(false)}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer" data-testid="link-menu-catalog">
                      <span className="font-medium text-black">Todos os Produtos</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </Link>
                  {categories && categories.length > 0 && (
                    <>
                      <div className="pt-4 pb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Categorias</span>
                      </div>
                      {categories.map((cat) => (
                        <Link 
                          key={cat.id} 
                          href={`/loja/catalogo?categoria=${cat.id}`}
                          onClick={() => setMenuOpen(false)}
                        >
                          <div 
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                            data-testid={`link-category-${cat.id}`}
                          >
                            <span className="text-black">{cat.name}</span>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </Link>
                      ))}
                    </>
                  )}
                  <div className="pt-4 border-t mt-4">
                    <Link href="/meus-pedidos" onClick={() => setMenuOpen(false)}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer" data-testid="link-menu-orders">
                        <span className="text-black">Meus Pedidos</span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
            
            <h1 className="text-xl font-bold tracking-tight text-black" style={{ fontFamily: 'system-ui' }} data-testid="text-loja-title">
              Emaús Shop
            </h1>
            
            <div className="flex items-center gap-1">
              <Link href="/loja/catalogo">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-black"
                  data-testid="button-search"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </Link>
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h2 className="text-2xl font-bold mb-2" data-testid="text-hero-title">
                    {featuredItems[heroIndex].name}
                  </h2>
                  <p className="text-lg font-semibold mb-4">
                    {formatCurrency(featuredItems[heroIndex].price)}
                  </p>
                  <Link href={`/loja/produto/${featuredItems[heroIndex].id}`}>
                    <Button 
                      className="bg-white text-black hover:bg-gray-100 rounded-full px-6"
                      data-testid="button-hero-shop"
                    >
                      Comprar Agora
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {featuredItems.length > 1 && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                {featuredItems.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === heroIndex ? "bg-white w-4" : "bg-white/50"
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
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-12 px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Emaús Shop</h2>
            <p className="text-gray-300 mb-6">Encontre produtos exclusivos da UMP</p>
            <Link href="/loja/catalogo">
              <Button className="bg-white text-black hover:bg-gray-100 rounded-full px-8">
                Ver Produtos
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Novidades */}
      <section className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-black">Novidades</h2>
          <Link href="/loja/catalogo">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              Ver Todos <ChevronRight className="h-4 w-4" />
            </span>
          </Link>
        </div>

        {loadingItems ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
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
        ) : newArrivals.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto disponível</h3>
            <p className="text-gray-500">
              Aguarde novos produtos na loja.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {newArrivals.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
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
                        <Badge className="absolute top-2 right-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                          Pré-venda
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

      {/* Categorias */}
      {categories && categories.length > 0 && (
        <section className="px-4 py-6 bg-gray-50">
          <h2 className="text-xl font-bold text-black mb-4">Categorias</h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/loja/catalogo?categoria=${cat.id}`}>
                <div 
                  className="bg-white rounded-2xl p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
                  data-testid={`card-category-${cat.id}`}
                >
                  <h3 className="font-medium text-black">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Ver Mais */}
      <section className="px-4 py-8 text-center">
        <Link href="/loja/catalogo">
          <Button 
            className="bg-black text-white hover:bg-gray-800 rounded-full px-8"
            data-testid="button-view-all"
          >
            Ver Todos os Produtos
          </Button>
        </Link>
      </section>
    </div>
  );
}
