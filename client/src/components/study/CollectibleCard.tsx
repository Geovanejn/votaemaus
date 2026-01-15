import { Star, Gem, Crown, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";

export type CardRarity = "common" | "rare" | "epic" | "legendary";
export type CardOrientation = "portrait" | "landscape";

interface CollectibleCardProps {
  name: string;
  imageUrl?: string | null;
  rarity: CardRarity;
  orientation?: CardOrientation;
  sourceType?: "season" | "event";
  onClick?: () => void;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg" | "compact" | "magazine" | "event";
}

const rarityLabels: Record<CardRarity, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Epico",
  legendary: "Lendario",
};

const rarityIcons: Record<CardRarity, LucideIcon> = {
  common: Star,
  rare: Star,
  epic: Gem,
  legendary: Crown,
};

export function CollectibleCard({
  name,
  imageUrl,
  rarity,
  orientation = "portrait",
  sourceType,
  onClick,
  className = "",
  showLabel = true,
  size = "md",
}: CollectibleCardProps) {
  const IconComponent = rarityIcons[rarity];
  const label = rarityLabels[rarity];
  
  const sizeClasses = {
    compact: "w-[100px] h-[120px]",
    sm: "w-[140px] h-[160px]",
    md: "w-[180px] h-[210px] sm:w-[220px] sm:h-[250px]",
    lg: "w-[280px] h-[320px]",
    magazine: "w-[240px] min-h-[320px] sm:w-[280px] sm:min-h-[380px]",
    // Event-specific: wider landscape format
    event: "w-[280px] h-[220px] sm:w-[320px] sm:h-[240px]",
  };

  // For magazine size, we use flex-1 with aspect ratio instead of fixed height
  const imageHeightClasses = {
    compact: "h-[48px]",
    sm: "h-[68px]",
    md: "h-[88px] sm:h-[108px]",
    lg: "h-[140px]",
    magazine: "aspect-[3/4] w-full",
    event: "h-[100px] sm:h-[110px]", // Compact landscape image
  };

  const badgeSizeClasses = {
    compact: "w-7 h-7",
    sm: "w-8 h-8",
    md: "w-10 h-10 sm:w-12 sm:h-12",
    lg: "w-14 h-14",
    magazine: "w-12 h-12 sm:w-14 sm:h-14",
    event: "w-12 h-12 sm:w-14 sm:h-14", // Same size as lg
  };

  const titleSizeClasses = {
    compact: "text-[10px] leading-tight line-clamp-2 px-1",
    sm: "text-xs",
    md: "text-sm sm:text-base",
    lg: "text-lg",
    magazine: "text-base sm:text-lg",
    event: "text-sm sm:text-base", // Event title size
  };

  const subtitleSizeClasses = {
    compact: "text-[8px]",
    sm: "text-[10px]",
    md: "text-[10px] sm:text-xs",
    lg: "text-sm",
    magazine: "text-xs sm:text-sm",
    event: "text-[10px] sm:text-xs",
  };

  const diamondCount = rarity === "legendary" ? 5 : rarity === "epic" ? 3 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`
        collectible-card
        collectible-card-${rarity}
        ${sizeClasses[size]}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      data-testid={`collectible-card-${rarity}`}
    >
      {Array.from({ length: diamondCount }).map((_, i) => (
        <div key={i} className="card-diamond-effect" />
      ))}

      <div 
        className="card-shine-beam absolute inset-0 pointer-events-none z-20 rounded-[16px]"
        style={{
          background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.25) 23%, rgba(255,255,255,0.5) 25%, rgba(255,255,255,0.25) 27%, transparent 30%)',
          transform: 'translateX(-100%)',
        }}
      />

      <div className={`collectible-card-inner ${size === 'magazine' || sourceType === 'season' ? 'collectible-card-inner-magazine' : ''} ${size === 'event' ? 'collectible-card-inner-event' : ''}`}>
        {/* Centered rarity medallion with forged effect */}
        <div className={`collectible-card-medallion collectible-card-medallion-${rarity} ${badgeSizeClasses[size]} ${size === 'magazine' || sourceType === 'season' ? 'my-2' : ''} ${sourceType === 'season' && size === 'compact' ? 'scale-75' : ''}`}>
          {rarity === "legendary" ? (
            <Gem className="w-6 h-6 text-white" />
          ) : rarity === "epic" ? (
            <Sparkles className="w-6 h-6 text-white" />
          ) : (
            <Star className="w-6 h-6 text-white" />
          )}
        </div>

        {/* Text plate - hidden for magazine size and season cards */}
        {size !== 'magazine' && sourceType !== 'season' && (
          <div className={`flex flex-col justify-center items-center ${size === 'event' ? '' : 'flex-1'}`}>
            <div className="collectible-card-text-plate">
              <h3 className={`collectible-card-title ${titleSizeClasses[size]}`}>
                {name}
              </h3>
            </div>
          </div>
        )}

        <div 
          className={`collectible-card-image ${size === 'event' ? 'flex-1' : imageHeightClasses[size]} overflow-hidden relative`}
        >
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name}
              className="w-full h-full object-cover"
              style={{ imageRendering: 'auto' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black/20">
              <IconComponent className="w-8 h-8 text-white/50" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface CollectibleCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    rarity: CardRarity;
    sourceType: "season" | "event";
    sourceName?: string;
    earnedAt?: string;
    performance?: number | null;
  };
}

export function CollectibleCardModal({ isOpen, onClose, card }: CollectibleCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      data-testid="modal-card-view"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="flex flex-col items-center gap-6 max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div ref={cardRef} className="relative">
          <CollectibleCard
            name={card.name}
            imageUrl={card.imageUrl}
            rarity={card.rarity}
            orientation={card.sourceType === "event" ? "landscape" : "portrait"}
            size={card.sourceType === "season" ? "magazine" : card.sourceType === "event" ? "event" : "lg"}
          />
        </div>

        <div className="text-center space-y-2 text-white">
          {card.description && (
            <p className="text-sm text-white/80 max-w-xs">
              {card.description}
            </p>
          )}
          
          {card.sourceName && (
            <p className="text-xs text-white/60">
              {card.sourceType === "event" ? "Evento" : "Revista"}: {card.sourceName}
            </p>
          )}

          {card.earnedAt && (
            <p className="text-xs text-white/50">
              Conquistado em: {new Date(card.earnedAt).toLocaleDateString("pt-BR")}
            </p>
          )}

          {card.performance !== null && card.performance !== undefined && (
            <p className="text-xs text-white/50">
              Desempenho: {Math.round(card.performance)}%
            </p>
          )}
        </div>


        <button
          onClick={onClose}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm transition-colors"
          data-testid="button-close-modal"
        >
          Fechar
        </button>
      </motion.div>
    </motion.div>
  );
}

export function CollectibleCardGrid({ 
  cards, 
  onCardClick,
  emptyMessage = "Nenhum card encontrado"
}: { 
  cards: Array<{
    id: number;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    rarity: CardRarity;
    sourceType: "season" | "event";
    earnedAt?: string;
    performance?: number | null;
  }>;
  onCardClick?: (card: typeof cards[0]) => void;
  emptyMessage?: string;
}) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <Crown className="w-12 h-12 mb-4 opacity-30" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {cards.map((card) => (
        <CollectibleCard
          key={card.id}
          name={card.name}
          imageUrl={card.imageUrl}
          rarity={card.rarity}
          orientation="portrait"
          onClick={onCardClick ? () => onCardClick(card) : undefined}
          size="md"
        />
      ))}
    </div>
  );
}
