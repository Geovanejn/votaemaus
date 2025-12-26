import { Star, Gem, Crown, Sparkles, Share2, Loader2, Download, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

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
  size?: "sm" | "md" | "lg" | "compact";
}

const rarityLabels: Record<CardRarity, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Epico",
  legendary: "Lendario",
};

const rarityIcons: Record<CardRarity, typeof Star> = {
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
    compact: "w-[100px] h-[140px]",
    sm: orientation === "portrait" ? "w-[120px] h-[168px]" : "w-[168px] h-[120px]",
    md: orientation === "portrait" ? "w-[160px] h-[224px] sm:w-[200px] sm:h-[280px]" : "w-[224px] h-[160px] sm:w-[280px] sm:h-[200px]",
    lg: orientation === "portrait" ? "w-[240px] h-[336px]" : "w-[336px] h-[240px]",
  };

  const imageHeightClasses = {
    compact: "h-[60px]",
    sm: orientation === "portrait" ? "h-[80px]" : "h-[56px]",
    md: orientation === "portrait" ? "h-[112px] sm:h-[140px]" : "h-[80px] sm:h-[100px]",
    lg: orientation === "portrait" ? "h-[200px]" : "h-[140px]",
  };

  const badgeSizeClasses = {
    compact: "w-7 h-7",
    sm: "w-8 h-8",
    md: "w-10 h-10 sm:w-12 sm:h-12",
    lg: "w-14 h-14",
  };

  const titleSizeClasses = {
    compact: "text-[10px] leading-tight line-clamp-2 px-1",
    sm: "text-xs",
    md: "text-sm sm:text-base",
    lg: "text-lg",
  };

  const subtitleSizeClasses = {
    compact: "text-[8px]",
    sm: "text-[10px]",
    md: "text-[10px] sm:text-xs",
    lg: "text-sm",
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

      <div className="collectible-card-inner">
        <div className={`collectible-card-badge collectible-card-badge-${rarity} ${badgeSizeClasses[size]}`}>
          <IconComponent className="w-1/2 h-1/2 text-gray-700" />
        </div>

        <div className="collectible-card-rarity-icon">
          {rarity === "legendary" ? (
            <Gem className="w-4 h-4 text-white" />
          ) : rarity === "epic" ? (
            <Sparkles className="w-4 h-4 text-white" />
          ) : (
            <Star className="w-4 h-4 text-white" />
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center pt-8">
          <h3 className={`collectible-card-title ${titleSizeClasses[size]} mb-1`}>
            {name}
          </h3>
          {showLabel && (
            <p className={`collectible-card-subtitle ${subtitleSizeClasses[size]}`}>
              {label}
            </p>
          )}
        </div>

        <div className={`collectible-card-image ${imageHeightClasses[size]} mt-2`}>
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name}
              className="w-full h-full object-cover"
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const { toast } = useToast();
  
  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    
    try {
      const scale = Math.max(3, window.devicePixelRatio || 2);
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#1a1a2e',
        scale: scale,
        useCORS: true,
        logging: false,
        allowTaint: true,
        imageTimeout: 0,
      });
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Error generating card image:', error);
      return null;
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (typeof window === "undefined") return;
    
    setIsGenerating(true);
    try {
      const imageBlob = await generateImage();
      const shareText = `Conquistei o card "${card.name}" (${rarityLabels[card.rarity]}) no DeoGlory! Venha estudar a Palavra comigo na UMP Emaus.`;
      
      if (imageBlob && navigator.share) {
        const file = new File([imageBlob], `card-${card.name.replace(/\s+/g, '-')}.png`, { type: 'image/png' });
        const shareData: ShareData = {
          title: `Card: ${card.name}`,
          text: shareText,
          files: [file],
        };
        
        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          setShareSuccess(true);
          toast({
            title: "Compartilhado!",
            description: "Seu card foi compartilhado com sucesso.",
          });
          setTimeout(() => setShareSuccess(false), 2000);
          setIsGenerating(false);
          return;
        }
      }
      
      // Fallback: copy text and suggest download
      const shareUrl = window.location.origin + "/study/cards";
      try {
        await navigator.clipboard.writeText(shareText + " " + shareUrl);
        toast({
          title: "Texto copiado!",
          description: "Baixe a imagem e compartilhe nas redes sociais.",
        });
      } catch {
        toast({
          title: "Compartilhar",
          description: "Baixe a imagem e compartilhe manualmente.",
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        variant: "destructive",
        title: "Erro ao compartilhar",
        description: "Tente baixar a imagem e compartilhar manualmente.",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [card.name, card.rarity, generateImage, toast]);

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    try {
      const imageBlob = await generateImage();
      if (imageBlob) {
        const url = URL.createObjectURL(imageBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `card-${card.name.replace(/\s+/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({
          title: "Download concluido!",
          description: "Agora voce pode compartilhar a imagem.",
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: "destructive",
        title: "Erro no download",
        description: "Nao foi possivel baixar a imagem.",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [card.name, generateImage, toast]);

  if (!isOpen) return null;

  const orientation = card.sourceType === "event" ? "landscape" : "portrait";

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
        <div ref={cardRef} className="p-4 rounded-xl" style={{ backgroundColor: '#1a1a2e' }}>
          <CollectibleCard
            name={card.name}
            imageUrl={card.imageUrl}
            rarity={card.rarity}
            orientation={orientation}
            size="lg"
          />
          <p className="text-center text-white/70 text-xs mt-3 font-medium">
            DeoGlory - UMP Emaus
          </p>
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

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium transition-all disabled:opacity-50"
            data-testid="button-share-card"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : shareSuccess ? (
              <Check className="w-5 h-5" />
            ) : (
              <Share2 className="w-5 h-5" />
            )}
            {shareSuccess ? "Compartilhado!" : "Compartilhar"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors disabled:opacity-50"
            data-testid="button-download-card"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Baixar
          </button>
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
          orientation={card.sourceType === "event" ? "landscape" : "portrait"}
          onClick={onCardClick ? () => onCardClick(card) : undefined}
          size="md"
        />
      ))}
    </div>
  );
}
