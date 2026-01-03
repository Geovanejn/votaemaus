import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronRight,
  ShoppingCart,
  Package,
  Menu,
  Search,
  User,
  Star
} from "lucide-react";
import { motion } from "framer-motion";

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

export default function LojaPage() {
  const { isAuthenticated } = useAuth();

  const { data: items, isLoading } = useQuery<ShopItemWithDetails[]>({
    queryKey: ["/api/shop/items"],
    enabled: isAuthenticated,
  });

  const { data: serverCartItems } = useQuery<Array<{ id: number; quantity: number }>>({
    queryKey: ["/api/shop/cart"],
    enabled: isAuthenticated,
  });

  const cartItemCount = serverCartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const availableItems = items?.filter((item) => item.isAvailable) || [];

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
    </div>
  );
}
