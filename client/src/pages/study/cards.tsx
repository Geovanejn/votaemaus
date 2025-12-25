import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/study";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Loader2,
  Sparkles,
  Trophy,
  Star,
  Crown
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CollectibleCard {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sourceType: string;
  sourceId: number;
}

interface UserCard {
  id: number;
  userId: number;
  cardId: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  sourceType: string;
  sourceId: number;
  performance: number | null;
  earnedAt: string;
  card?: CollectibleCard;
}

const rarityConfig = {
  common: {
    label: "Comum",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    borderColor: "border-gray-300 dark:border-gray-600",
    icon: null,
    gradient: "from-gray-200 to-gray-400",
  },
  rare: {
    label: "Raro",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    borderColor: "border-blue-400 dark:border-blue-500",
    icon: Star,
    gradient: "from-blue-400 to-blue-600",
  },
  epic: {
    label: "Epico",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    borderColor: "border-purple-400 dark:border-purple-500",
    icon: Sparkles,
    gradient: "from-purple-400 to-purple-600",
  },
  legendary: {
    label: "Lendario",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    borderColor: "border-amber-400 dark:border-amber-500",
    icon: Crown,
    gradient: "from-amber-400 to-amber-600",
  },
};

function CollectibleCardItem({ userCard }: { userCard: UserCard }) {
  const config = rarityConfig[userCard.rarity];
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="relative"
    >
      <Card 
        className={`overflow-hidden border-2 ${config.borderColor} ${
          userCard.rarity === "legendary" ? "card-legendary" : 
          userCard.rarity === "epic" ? "card-epic" : 
          userCard.rarity === "rare" ? "card-rare" : ""
        }`}
        data-testid={`card-collectible-${userCard.id}`}
      >
        <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />
        
        {userCard.card?.imageUrl ? (
          <div className="relative h-32 overflow-hidden">
            <img 
              src={userCard.card.imageUrl} 
              alt={userCard.card.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        ) : (
          <div className={`h-32 bg-gradient-to-br ${config.gradient} opacity-30`} />
        )}
        
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm line-clamp-1" data-testid={`text-card-name-${userCard.id}`}>
              {userCard.card?.name || "Card Desconhecido"}
            </h3>
            {IconComponent && (
              <IconComponent className={`h-4 w-4 flex-shrink-0 ${
                userCard.rarity === "legendary" ? "text-amber-500" :
                userCard.rarity === "epic" ? "text-purple-500" :
                "text-blue-500"
              }`} />
            )}
          </div>

          <Badge className={`text-xs ${config.color}`}>
            {config.label}
          </Badge>

          {userCard.performance !== null && (
            <div className="mt-2 text-xs text-muted-foreground">
              Desempenho: {Math.round(userCard.performance)}%
            </div>
          )}

          <div className="mt-2 text-xs text-muted-foreground">
            {format(new Date(userCard.earnedAt), "d MMM yyyy", { locale: ptBR })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function CardsCollectionPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: userCards, isLoading, error } = useQuery<UserCard[]>({
    queryKey: ["/api/study/cards"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-muted-foreground">Erro ao carregar seus cards</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const cardsByRarity = {
    legendary: userCards?.filter(c => c.rarity === "legendary") || [],
    epic: userCards?.filter(c => c.rarity === "epic") || [],
    rare: userCards?.filter(c => c.rarity === "rare") || [],
    common: userCards?.filter(c => c.rarity === "common") || [],
  };

  const totalCards = userCards?.length || 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-3 p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/study")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Minha Colecao
            </h1>
            <p className="text-xs text-muted-foreground">
              {totalCards} {totalCards === 1 ? "card" : "cards"} conquistado{totalCards !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 pb-24">
        {totalCards === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-1">Nenhum card ainda</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">
              Complete eventos especiais e revistas para conquistar cards exclusivos!
            </p>
            <Button onClick={() => setLocation("/study/events")} data-testid="button-view-events">
              Ver eventos
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                <Crown className="h-3 w-3 mr-1" />
                {cardsByRarity.legendary.length} Lendarios
              </Badge>
              <Badge variant="outline" className="text-purple-600 border-purple-300">
                <Sparkles className="h-3 w-3 mr-1" />
                {cardsByRarity.epic.length} Epicos
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                <Star className="h-3 w-3 mr-1" />
                {cardsByRarity.rare.length} Raros
              </Badge>
              <Badge variant="outline" className="text-gray-600 border-gray-300">
                {cardsByRarity.common.length} Comuns
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {userCards?.map(card => (
                <CollectibleCardItem key={card.id} userCard={card} />
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
