import { Star, Gem, Crown, Sparkles, Loader2, Download } from "lucide-react";
import { SiWhatsapp, SiInstagram, SiFacebook, SiX } from "react-icons/si";
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
    compact: "w-[100px] h-[120px]",
    sm: "w-[140px] h-[160px]",
    md: "w-[180px] h-[210px] sm:w-[220px] sm:h-[250px]",
    lg: "w-[280px] h-[320px]",
  };

  const imageHeightClasses = {
    compact: "h-[48px]",
    sm: "h-[68px]",
    md: "h-[88px] sm:h-[108px]",
    lg: "h-[140px]",
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

      <div 
        className="card-shine-beam absolute inset-0 pointer-events-none z-20 rounded-[16px]"
        style={{
          background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.25) 23%, rgba(255,255,255,0.5) 25%, rgba(255,255,255,0.25) 27%, transparent 30%)',
          transform: 'translateX(-100%)',
        }}
      />

      <div className="collectible-card-inner">
        {/* Centered rarity medallion with forged effect */}
        <div className={`collectible-card-medallion collectible-card-medallion-${rarity}`}>
          {rarity === "legendary" ? (
            <Gem className="w-6 h-6 text-white" />
          ) : rarity === "epic" ? (
            <Sparkles className="w-6 h-6 text-white" />
          ) : (
            <Star className="w-6 h-6 text-white" />
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center items-center">
          {/* Text plate with negative relief (inset container) */}
          <div className="collectible-card-text-plate">
            <h3 className={`collectible-card-title ${titleSizeClasses[size]}`}>
              {name}
            </h3>
          </div>
        </div>

        <div 
          className={`collectible-card-image ${imageHeightClasses[size]} overflow-hidden relative`}
        >
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name}
              className="w-full h-full object-cover"
              style={{ imageRendering: 'auto' }}
              crossOrigin="anonymous"
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
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
  const shareUrl = typeof window !== "undefined" ? window.location.origin + "/study" : "";
  const shareText = `Conquistei o card "${card.name}" (${rarityLabels[card.rarity]}) no DeoGlory! Venha estudar a Palavra comigo na UMP Emaus.`;
  const fullShareText = `${shareText}\n\n${shareUrl}`;
  
  // Card style configurations for html2canvas (inline styles needed because CSS classes don't always work)
  const cardStyles: Record<CardRarity, { background: string; border: string; boxShadow: string }> = {
    common: {
      background: 'url(/CARD_COMUM_1766929049960.png) center/cover no-repeat',
      border: '2px solid #A0A8B8',
      boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.4), inset 0 -1px 3px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)',
    },
    rare: {
      background: 'url(/CARD_RARO_1766929049996.png) center/cover no-repeat',
      border: '2px solid #4A90C0',
      boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.3), inset 0 -1px 3px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(59, 130, 246, 0.2)',
    },
    epic: {
      background: 'url(/CARD_ÉPICO_1766929050040.png) center/cover no-repeat',
      border: '2px solid #8B6BA8',
      boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.25), inset 0 -1px 3px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(139, 92, 246, 0.25)',
    },
    legendary: {
      background: 'url(/CARD_LENDÁRIO_1766929050060.png) center/cover no-repeat',
      border: '3px solid #D4A050',
      boxShadow: 'inset 0 1px 4px rgba(255, 255, 255, 0.35), inset 0 -1px 4px rgba(0, 0, 0, 0.6), 0 6px 16px rgba(251, 191, 36, 0.25)',
    },
  };

  const medallionStyles: Record<CardRarity, string> = {
    common: 'linear-gradient(145deg, rgba(160, 168, 184, 0.4), rgba(128, 136, 152, 0.3))',
    rare: 'linear-gradient(145deg, rgba(74, 144, 192, 0.4), rgba(59, 130, 180, 0.3))',
    epic: 'linear-gradient(145deg, rgba(139, 107, 168, 0.4), rgba(120, 92, 150, 0.3))',
    legendary: 'linear-gradient(145deg, rgba(212, 160, 80, 0.5), rgba(180, 140, 60, 0.4))',
  };

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    
    try {
      // Pre-load card background image
      const rarity = card.rarity;
      const bgImages: Record<CardRarity, string> = {
        common: '/CARD_COMUM_1766929049960.png',
        rare: '/CARD_RARO_1766929049996.png',
        epic: '/CARD_ÉPICO_1766929050040.png',
        legendary: '/CARD_LENDÁRIO_1766929050060.png',
      };

      // Pre-load all images
      await Promise.all([
        new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = bgImages[rarity];
        }),
        card.imageUrl ? new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = card.imageUrl!;
        }) : Promise.resolve(),
      ]);
      
      // Pause animations and position shine for capture
      const shineBeams = cardRef.current.querySelectorAll('.card-shine-beam');
      shineBeams.forEach((beam) => {
        const el = beam as HTMLElement;
        el.style.animation = 'none';
        el.style.transform = 'translateX(-40%)';
        el.style.opacity = '1';
      });
      
      // Wait for styles to apply
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // High quality capture - scale 3x for good quality without distorting shadows/borders
      const scale = 3;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#1a1a2e',
        scale: scale,
        useCORS: true,
        logging: false,
        allowTaint: true,
        imageTimeout: 30000,
        onclone: (clonedDoc, clonedElement) => {
          // Apply inline styles to the cloned card element for html2canvas compatibility
          const clonedCard = clonedElement.querySelector('.collectible-card') as HTMLElement;
          if (clonedCard) {
            const styles = cardStyles[rarity];
            clonedCard.style.background = styles.background;
            clonedCard.style.border = styles.border;
            clonedCard.style.boxShadow = styles.boxShadow;
            clonedCard.style.position = 'relative';
            clonedCard.style.overflow = 'hidden';
            clonedCard.style.borderRadius = '16px';
          }

          // Style the inner container
          const clonedInner = clonedElement.querySelector('.collectible-card-inner') as HTMLElement;
          if (clonedInner) {
            clonedInner.style.position = 'relative';
            clonedInner.style.zIndex = '5';
            clonedInner.style.padding = '10px';
            clonedInner.style.display = 'flex';
            clonedInner.style.flexDirection = 'column';
            clonedInner.style.height = '100%';
            clonedInner.style.gap = '6px';
          }

          // Style the medallion - subtle inset effect
          const clonedMedallion = clonedElement.querySelector('.collectible-card-medallion') as HTMLElement;
          if (clonedMedallion) {
            clonedMedallion.style.position = 'relative';
            clonedMedallion.style.alignSelf = 'center';
            clonedMedallion.style.width = '44px';
            clonedMedallion.style.height = '44px';
            clonedMedallion.style.flexShrink = '0';
            clonedMedallion.style.borderRadius = '50%';
            clonedMedallion.style.display = 'flex';
            clonedMedallion.style.alignItems = 'center';
            clonedMedallion.style.justifyContent = 'center';
            clonedMedallion.style.zIndex = '6';
            clonedMedallion.style.background = medallionStyles[rarity];
            // Subtle inset shadow for negative relief
            clonedMedallion.style.boxShadow = 'inset 1px 1px 2px rgba(0, 0, 0, 0.5), inset -1px -1px 1px rgba(255, 255, 255, 0.1)';
          }

          // Style medallion SVG
          const medallionSvg = clonedElement.querySelector('.collectible-card-medallion svg') as HTMLElement;
          if (medallionSvg) {
            medallionSvg.style.opacity = '0.70';
          }

          // Style the text plate - subtle inset
          const clonedTextPlate = clonedElement.querySelector('.collectible-card-text-plate') as HTMLElement;
          if (clonedTextPlate) {
            clonedTextPlate.style.background = 'rgba(0, 0, 0, 0.15)';
            clonedTextPlate.style.borderRadius = '8px';
            clonedTextPlate.style.padding = '4px 10px';
            // Subtle inset shadow
            clonedTextPlate.style.boxShadow = 'inset 1px 1px 1px rgba(0, 0, 0, 0.4), inset -1px -1px 1px rgba(255, 255, 255, 0.08)';
          }

          // Style the title
          const clonedTitle = clonedElement.querySelector('.collectible-card-title') as HTMLElement;
          if (clonedTitle) {
            clonedTitle.style.fontWeight = '700';
            clonedTitle.style.textTransform = 'uppercase';
            clonedTitle.style.letterSpacing = '0.05em';
            clonedTitle.style.textAlign = 'center';
            clonedTitle.style.lineHeight = '1.2';
            clonedTitle.style.color = 'rgba(230, 230, 230, 0.92)';
            clonedTitle.style.textShadow = '0 0 2px rgba(255, 255, 255, 0.12), 1px 1px 0px rgba(0, 0, 0, 0.35)';
          }

          // Style the image container - subtle inset frame
          const clonedImageContainer = clonedElement.querySelector('.collectible-card-image') as HTMLElement;
          if (clonedImageContainer) {
            clonedImageContainer.style.position = 'relative';
            clonedImageContainer.style.borderRadius = '6px';
            clonedImageContainer.style.overflow = 'hidden';
            clonedImageContainer.style.background = 'rgba(0, 0, 0, 0.3)';
            // Subtle inset shadow for engraved effect
            clonedImageContainer.style.boxShadow = 'inset 0 2px 3px rgba(0, 0, 0, 0.5), inset 0 -1px 2px rgba(255, 255, 255, 0.1), inset 2px 0 3px rgba(0, 0, 0, 0.35), inset -2px 0 3px rgba(0, 0, 0, 0.35)';
          }

          // Ensure cloned element has the image loaded properly
          const clonedImage = clonedElement.querySelector('.collectible-card-image img') as HTMLImageElement;
          if (clonedImage && card.imageUrl) {
            clonedImage.src = card.imageUrl;
            clonedImage.style.width = '100%';
            clonedImage.style.height = '100%';
            clonedImage.style.objectFit = 'cover';
          }

          // Hide diamond effects for cleaner capture
          const diamonds = clonedElement.querySelectorAll('.card-diamond-effect');
          diamonds.forEach((d) => {
            (d as HTMLElement).style.display = 'none';
          });

          // Style the shine beam
          const shineBeam = clonedElement.querySelector('.card-shine-beam') as HTMLElement;
          if (shineBeam) {
            shineBeam.style.position = 'absolute';
            shineBeam.style.inset = '0';
            shineBeam.style.pointerEvents = 'none';
            shineBeam.style.zIndex = '20';
            shineBeam.style.borderRadius = '16px';
            shineBeam.style.background = 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.25) 23%, rgba(255,255,255,0.5) 25%, rgba(255,255,255,0.25) 27%, transparent 30%)';
            shineBeam.style.transform = 'translateX(-40%)';
            shineBeam.style.animation = 'none';
          }
        },
      });
      
      // Restore animations
      shineBeams.forEach((beam) => {
        const el = beam as HTMLElement;
        el.style.animation = '';
        el.style.transform = '';
        el.style.opacity = '';
      });
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Error generating card image:', error);
      return null;
    }
  }, [card.imageUrl, card.rarity]);

  const prepareAndShare = useCallback(async (platform: 'whatsapp' | 'instagram' | 'facebook' | 'x') => {
    if (typeof window === "undefined") return;
    
    setIsGenerating(true);
    try {
      const imageBlob = await generateImage();
      
      if (imageBlob) {
        // Create object URL for the generated image
        const imageUrl = URL.createObjectURL(imageBlob);
        setGeneratedImageUrl(imageUrl);
        
        // Try native share with image first (works best on mobile)
        if (navigator.share && platform === 'whatsapp') {
          const file = new File([imageBlob], `card-${card.name.replace(/\s+/g, '-')}.png`, { type: 'image/png' });
          const shareData: ShareData = {
            title: `Card: ${card.name}`,
            text: fullShareText,
            files: [file],
          };
          
          if (navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            toast({
              title: "Compartilhado!",
              description: "Seu card foi compartilhado com sucesso.",
            });
            return;
          }
        }
      }
      
      // Open share URL for each platform with text
      const encodedText = encodeURIComponent(fullShareText);
      const encodedUrl = encodeURIComponent(shareUrl);
      
      let shareLink = '';
      switch (platform) {
        case 'whatsapp':
          shareLink = `https://api.whatsapp.com/send?text=${encodedText}`;
          break;
        case 'instagram':
          // Instagram doesn't support direct web sharing - download image + copy text + try deep link
          if (imageBlob) {
            // Download the image
            const url = URL.createObjectURL(imageBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `card-${card.name.replace(/\s+/g, '-')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
          // Copy caption
          await navigator.clipboard.writeText(fullShareText);
          // Try to open Instagram
          const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
          if (isMobile) {
            // Try deep link to Instagram story camera
            window.location.href = 'instagram://story-camera';
            setTimeout(() => {
              // If deep link didn't work, show instructions
              toast({
                title: "Imagem baixada e texto copiado!",
                description: "Selecione a imagem da galeria e cole a legenda no Instagram.",
              });
            }, 1500);
          } else {
            toast({
              title: "Imagem baixada e texto copiado!",
              description: "Abra o Instagram e poste a imagem com a legenda copiada.",
            });
          }
          return;
        case 'facebook':
          shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
          break;
        case 'x':
          shareLink = `https://twitter.com/intent/tweet?text=${encodedText}`;
          break;
      }
      
      if (shareLink) {
        window.open(shareLink, '_blank', 'width=600,height=400');
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
  }, [card.name, fullShareText, shareUrl, generateImage, toast]);

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
        <div ref={cardRef} className="p-4 rounded-xl relative overflow-hidden" style={{ backgroundColor: '#1a1a2e' }}>
          {/* Shine/glow overlay effect for download image */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.08) 100%)',
              zIndex: 10,
            }}
          />
          <div 
            className="absolute -inset-1 pointer-events-none rounded-xl"
            style={{
              background: card.rarity === 'legendary' 
                ? 'radial-gradient(ellipse at 30% 20%, rgba(255,215,0,0.25) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(255,165,0,0.2) 0%, transparent 50%)'
                : card.rarity === 'epic'
                ? 'radial-gradient(ellipse at 30% 20%, rgba(168,85,247,0.25) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(139,92,246,0.2) 0%, transparent 50%)'
                : card.rarity === 'rare'
                ? 'radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.25) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(96,165,250,0.2) 0%, transparent 50%)'
                : 'radial-gradient(ellipse at 30% 20%, rgba(148,163,184,0.2) 0%, transparent 50%)',
              filter: 'blur(8px)',
              zIndex: 0,
            }}
          />
          <div className="relative z-[5]">
            <CollectibleCard
              name={card.name}
              imageUrl={card.imageUrl}
              rarity={card.rarity}
              orientation="portrait"
              size="lg"
            />
            <p className="text-center text-white/70 text-xs mt-3 font-medium">
              DeoGlory - UMP Emaus
            </p>
          </div>
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

        <div className="flex flex-col items-center gap-3">
          <p className="text-white/60 text-xs">Compartilhar em:</p>
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                prepareAndShare('whatsapp');
              }}
              disabled={isGenerating}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white transition-all disabled:opacity-50"
              data-testid="button-share-whatsapp"
              title="WhatsApp"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <SiWhatsapp className="w-5 h-5" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prepareAndShare('instagram');
              }}
              disabled={isGenerating}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90 text-white transition-all disabled:opacity-50"
              data-testid="button-share-instagram"
              title="Instagram"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <SiInstagram className="w-5 h-5" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prepareAndShare('facebook');
              }}
              disabled={isGenerating}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-[#1877F2] hover:bg-[#166FE5] text-white transition-all disabled:opacity-50"
              data-testid="button-share-facebook"
              title="Facebook"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <SiFacebook className="w-5 h-5" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prepareAndShare('x');
              }}
              disabled={isGenerating}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-black hover:bg-gray-900 text-white transition-all disabled:opacity-50"
              data-testid="button-share-x"
              title="X (Twitter)"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <SiX className="w-5 h-5" />}
            </button>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors disabled:opacity-50 mt-1"
            data-testid="button-download-card"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Baixar Imagem
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
          orientation="portrait"
          onClick={onCardClick ? () => onCardClick(card) : undefined}
          size="md"
        />
      ))}
    </div>
  );
}
