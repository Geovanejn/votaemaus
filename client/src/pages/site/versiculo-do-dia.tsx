import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import html2canvas from "html2canvas";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft,
  Calendar,
  Share2,
  BookOpen,
  Loader2,
  Download,
  Clock
} from "lucide-react";
import { SiWhatsapp, SiInstagram } from "react-icons/si";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import logoWhite from "@assets/2-1_1766464654126.png";

interface DailyVersePost {
  id: number;
  verse: string;
  reference: string;
  reflection: string | null;
  imageUrl: string | null;
  publishedAt: string;
  expiresAt: string;
  isActive: boolean;
  stockImage: {
    id: number;
    imageUrl: string;
    category: string;
  } | null;
}

export default function VersiculoDoDiaPage() {
  const [shareOpen, setShareOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const params = useParams<{ date?: string }>();
  const [, navigate] = useLocation();

  const isHistoricalView = !!params.date;

  const { data: todayVerse, isLoading } = useQuery<DailyVersePost>({
    queryKey: isHistoricalView ? ["/api/site/daily-verse", params.date] : ["/api/site/daily-verse"],
    queryFn: async () => {
      const endpoint = isHistoricalView 
        ? `/api/site/daily-verse/${params.date}` 
        : "/api/site/daily-verse";
      const res = await fetch(endpoint);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch verse");
      }
      return res.json();
    },
    retry: false,
  });

  const { data: verseHistory } = useQuery<DailyVersePost[]>({
    queryKey: ["/api/site/daily-verses"],
  });

  const backgroundImage = todayVerse?.stockImage?.imageUrl || todayVerse?.imageUrl;

  // Mutation to record share (only for authenticated users)
  const recordShareMutation = useMutation({
    mutationFn: async (data: { platform: string; versePostId?: number }) => {
      const res = await apiRequest("POST", "/api/study/daily-verse/share", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/daily-verse/shared-today"] });
    },
    onError: () => {
      // Silently fail - sharing should still work even if tracking fails
    },
  });

  // Pre-load image for html2canvas - use proxy URL for CORS compatibility
  const proxyImageUrl = backgroundImage 
    ? `/api/proxy-image?url=${encodeURIComponent(backgroundImage)}`
    : null;

  // State to hold the pre-cropped background image data URL
  const [croppedBgDataUrl, setCroppedBgDataUrl] = useState<string | null>(null);

  // Pre-load and crop background image to match 9:16 aspect ratio (simulates object-fit: cover)
  useEffect(() => {
    if (!proxyImageUrl || !shareOpen) {
      setCroppedBgDataUrl(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Target aspect ratio is 9:16 (width:height)
      const targetAspect = 9 / 16;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      
      let srcX = 0, srcY = 0, srcW = img.naturalWidth, srcH = img.naturalHeight;
      
      if (imgAspect > targetAspect) {
        // Image is wider than target - crop sides (center horizontally)
        srcW = img.naturalHeight * targetAspect;
        srcX = (img.naturalWidth - srcW) / 2;
      } else {
        // Image is taller than target - crop top/bottom (center vertically)
        srcH = img.naturalWidth / targetAspect;
        srcY = (img.naturalHeight - srcH) / 2;
      }
      
      // Create canvas with exact 9:16 ratio at high resolution
      const exportWidth = 1080;
      const exportHeight = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // Draw cropped portion to fill the entire canvas
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, exportWidth, exportHeight);
        setCroppedBgDataUrl(canvas.toDataURL('image/jpeg', 0.95));
        console.log('[DailyVerse] Background image cropped successfully');
      }
    };
    img.onerror = () => {
      console.log('[DailyVerse] Failed to load background image');
      setCroppedBgDataUrl(null);
    };
    img.src = proxyImageUrl;
  }, [proxyImageUrl, shareOpen]);

  const generateAndShareImage = useCallback(async (platform: 'whatsapp' | 'instagram' | 'download') => {
    if (!shareCardRef.current) return;

    setGenerating(true);
    try {
      // Use exact integer dimensions for 9:16 aspect ratio (prevents fractional sizing artifacts)
      const cardWidth = 270; // Fixed integer width
      const cardHeight = 480; // Fixed integer height (9:16 ratio)
      const scale = 6; // Higher scale for better quality
      const borderRadius = 10; // CSS border-radius in px
      
      // Create off-screen container with fully transparent background
      // This prevents blending with Dialog's light background
      const offscreenContainer = document.createElement('div');
      offscreenContainer.style.cssText = `
        position: fixed;
        left: -10000px;
        top: 0;
        width: ${cardWidth}px;
        height: ${cardHeight}px;
        background: transparent;
        padding: 0;
        margin: 0;
        overflow: hidden;
        border-radius: ${borderRadius}px;
      `;
      document.body.appendChild(offscreenContainer);
      
      // Clone the share card into the off-screen container
      const clonedCard = shareCardRef.current.cloneNode(true) as HTMLElement;
      clonedCard.style.cssText = `
        width: ${cardWidth}px;
        height: ${cardHeight}px;
        border-radius: ${borderRadius}px;
        overflow: hidden;
        background: transparent;
        margin: 0;
        padding: 0;
      `;
      offscreenContainer.appendChild(clonedCard);
      
      // Wait for images to load in cloned element
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Capture from the off-screen container (no Dialog background bleeding)
      const sourceCanvas = await html2canvas(clonedCard, {
        scale: scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
        imageTimeout: 15000,
        width: cardWidth,
        height: cardHeight,
      });
      
      // Remove off-screen container
      document.body.removeChild(offscreenContainer);

      // Apply alpha mask to ensure true transparency at rounded corners
      const width = sourceCanvas.width;
      const height = sourceCanvas.height;
      // Use slightly smaller radius (1px less) to cut inside anti-aliased edges
      const scaledRadius = Math.round((borderRadius - 1) * scale);
      // Inset the mask by 1 scaled pixel to remove edge artifacts
      const inset = scale;
      
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = width;
      finalCanvas.height = height;
      const ctx = finalCanvas.getContext('2d');
      
      if (!ctx) {
        toast({ title: "Erro ao gerar imagem", variant: "destructive" });
        setGenerating(false);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw source image first
      ctx.drawImage(sourceCanvas, 0, 0);
      
      // Apply alpha mask using destination-in for true transparency
      // The mask is slightly inset to cut inside anti-aliased edges
      ctx.globalCompositeOperation = 'destination-in';
      ctx.beginPath();
      ctx.moveTo(inset + scaledRadius, inset);
      ctx.lineTo(width - inset - scaledRadius, inset);
      ctx.arcTo(width - inset, inset, width - inset, inset + scaledRadius, scaledRadius);
      ctx.lineTo(width - inset, height - inset - scaledRadius);
      ctx.arcTo(width - inset, height - inset, width - inset - scaledRadius, height - inset, scaledRadius);
      ctx.lineTo(inset + scaledRadius, height - inset);
      ctx.arcTo(inset, height - inset, inset, height - inset - scaledRadius, scaledRadius);
      ctx.lineTo(inset, inset + scaledRadius);
      ctx.arcTo(inset, inset, inset + scaledRadius, inset, scaledRadius);
      ctx.closePath();
      ctx.fillStyle = '#000';
      ctx.fill();
      
      // Post-processing: clean up any remaining white artifacts at corners
      // Scan corner regions and force alpha=0 for pixels with high luminance + low alpha
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const cornerSize = scaledRadius + inset + 10; // Scan area slightly larger than corner radius
      
      // Helper to check and clean a corner region
      const cleanCorner = (startX: number, endX: number, startY: number, endY: number) => {
        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            // If pixel is semi-transparent and bright (white-ish), make fully transparent
            if (a > 0 && a < 250 && r > 200 && g > 200 && b > 200) {
              data[idx + 3] = 0; // Force fully transparent
            }
          }
        }
      };
      
      // Clean all four corners
      cleanCorner(0, cornerSize, 0, cornerSize); // Top-left
      cleanCorner(width - cornerSize, width, 0, cornerSize); // Top-right
      cleanCorner(0, cornerSize, height - cornerSize, height); // Bottom-left
      cleanCorner(width - cornerSize, width, height - cornerSize, height); // Bottom-right
      
      // Also clean the edges (top, bottom, left, right strips)
      const edgeWidth = inset + 5;
      // Top edge
      for (let y = 0; y < edgeWidth; y++) {
        for (let x = cornerSize; x < width - cornerSize; x++) {
          const idx = (y * width + x) * 4;
          if (data[idx + 3] > 0 && data[idx + 3] < 250 && data[idx] > 200 && data[idx + 1] > 200 && data[idx + 2] > 200) {
            data[idx + 3] = 0;
          }
        }
      }
      // Bottom edge
      for (let y = height - edgeWidth; y < height; y++) {
        for (let x = cornerSize; x < width - cornerSize; x++) {
          const idx = (y * width + x) * 4;
          if (data[idx + 3] > 0 && data[idx + 3] < 250 && data[idx] > 200 && data[idx + 1] > 200 && data[idx + 2] > 200) {
            data[idx + 3] = 0;
          }
        }
      }
      // Left edge
      for (let y = cornerSize; y < height - cornerSize; y++) {
        for (let x = 0; x < edgeWidth; x++) {
          const idx = (y * width + x) * 4;
          if (data[idx + 3] > 0 && data[idx + 3] < 250 && data[idx] > 200 && data[idx + 1] > 200 && data[idx + 2] > 200) {
            data[idx + 3] = 0;
          }
        }
      }
      // Right edge
      for (let y = cornerSize; y < height - cornerSize; y++) {
        for (let x = width - edgeWidth; x < width; x++) {
          const idx = (y * width + x) * 4;
          if (data[idx + 3] > 0 && data[idx + 3] < 250 && data[idx] > 200 && data[idx + 1] > 200 && data[idx + 2] > 200) {
            data[idx + 3] = 0;
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);

      const shareUrl = `${window.location.origin}/versiculo-do-dia`;
      const shareText = `✨ *Versículo do Dia* - UMP Emaús ✨\n\nLeia a reflexão completa:\n${shareUrl}`;

      if (platform === 'download') {
        finalCanvas.toBlob(async (blob) => {
          if (!blob) {
            toast({ title: "Erro ao gerar imagem", variant: "destructive" });
            setGenerating(false);
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'versiculo-do-dia.png';
          a.click();
          URL.revokeObjectURL(url);
          toast({ title: "Imagem baixada!" });
          // Record share for mission tracking
          recordShareMutation.mutate({ platform: 'download', versePostId: todayVerse?.id });
          setGenerating(false);
          setShareOpen(false);
        }, 'image/png', 1.0);
      } else if (platform === 'whatsapp') {
        finalCanvas.toBlob(async (blob) => {
          if (!blob) {
            toast({ title: "Erro ao gerar imagem", variant: "destructive" });
            setGenerating(false);
            return;
          }
          const file = new File([blob], 'versiculo-do-dia.png', { type: 'image/png' });
          try {
            await navigator.clipboard.writeText(shareText);
          } catch (e) {
            console.log('Could not copy to clipboard');
          }
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            toast({ 
              title: "Legenda copiada!", 
              description: "Cole no campo 'Adicione uma legenda' do WhatsApp" 
            });
            await navigator.share({
              files: [file],
              title: 'Versiculo do Dia',
            });
          } else {
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            window.open(whatsappUrl, '_blank');
          }
          // Record share for mission tracking
          recordShareMutation.mutate({ platform: 'whatsapp', versePostId: todayVerse?.id });
          setGenerating(false);
          setShareOpen(false);
        }, 'image/png', 1.0);
      } else if (platform === 'instagram') {
        finalCanvas.toBlob(async (blob) => {
          if (!blob) {
            toast({ title: "Erro ao gerar imagem", variant: "destructive" });
            setGenerating(false);
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'versiculo-do-dia.png';
          a.click();
          URL.revokeObjectURL(url);
          toast({ 
            title: "Imagem baixada!", 
            description: "Abra o Instagram e compartilhe nos Stories" 
          });
          // Record share for mission tracking
          recordShareMutation.mutate({ platform: 'instagram', versePostId: todayVerse?.id });
          setGenerating(false);
          setShareOpen(false);
        }, 'image/png', 1.0);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({ title: "Erro ao gerar imagem", variant: "destructive" });
      setGenerating(false);
    }
  }, [todayVerse, toast, recordShareMutation]);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        {todayVerse ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden mb-8">
              <div 
                className="relative h-80 md:h-96 bg-cover bg-center"
                style={{ 
                  backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                  backgroundColor: backgroundImage ? undefined : 'hsl(var(--primary))'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-white">
                  <div className="flex items-center gap-2 mb-4 text-white/80">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {format(new Date(todayVerse.publishedAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">Versículo do Dia</h1>
                  <p className="text-lg md:text-xl italic leading-relaxed">
                    "{todayVerse.verse}"
                  </p>
                  <p className="text-sm md:text-base mt-2 font-medium text-white/90">
                    {todayVerse.reference}
                  </p>
                </div>
              </div>

              <CardContent className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-5 w-5" />
                    <span>Reflexão</span>
                  </div>
                  <Button 
                    onClick={() => setShareOpen(true)}
                    variant="outline"
                    data-testid="button-share"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartilhar
                  </Button>
                </div>

                {todayVerse.reflection ? (
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    {todayVerse.reflection.split('\n').map((paragraph, index) => (
                      <p key={index} className="text-foreground/90 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    Reflexão em preparação...
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Versículo do Dia</h2>
            <p className="text-muted-foreground">
              O versículo de hoje será publicado às 7h da manhã. Volte mais tarde!
            </p>
          </Card>
        )}

        {verseHistory && verseHistory.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Histórico de Versículos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {verseHistory.slice(0, 12).map((verse) => (
                <Card 
                  key={verse.id} 
                  className="overflow-hidden hover-elevate cursor-pointer"
                  onClick={() => {
                    const date = format(new Date(verse.publishedAt), 'yyyy-MM-dd');
                    navigate(`/versiculo-do-dia/${date}`);
                  }}
                  data-testid={`card-verse-${verse.id}`}
                >
                  <div 
                    className="h-32 bg-cover bg-center relative"
                    style={{ 
                      backgroundImage: verse.stockImage?.imageUrl ? `url(${verse.stockImage.imageUrl})` : undefined,
                      backgroundColor: verse.stockImage?.imageUrl ? undefined : 'hsl(var(--primary))'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 text-white">
                      <p className="text-xs opacity-80">
                        {format(new Date(verse.publishedAt), "d MMM yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm italic line-clamp-2 mb-2">
                      "{verse.verse}"
                    </p>
                    <p className="text-xs font-medium text-primary">
                      {verse.reference}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="w-[95vw] max-w-sm sm:max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle>Compartilhar Versículo</DialogTitle>
          </DialogHeader>

          <div 
            ref={shareCardRef}
            style={{ 
              width: '100%',
              aspectRatio: '9/16',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '10px',
              WebkitFontSmoothing: 'antialiased',
              textRendering: 'optimizeLegibility',
            }}
          >
            {/* Background image - use pre-cropped data URL for exact 9:16 aspect ratio match */}
            {(croppedBgDataUrl || proxyImageUrl) && (
              <img 
                src={croppedBgDataUrl || proxyImageUrl || ''}
                crossOrigin="anonymous"
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: croppedBgDataUrl ? 'fill' : 'cover', // Use fill for pre-cropped, cover for loading
                  display: 'block'
                }}
              />
            )}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.3), rgba(0,0,0,0.7))'
            }} />
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '1.5rem',
              color: 'white',
              boxSizing: 'border-box'
            }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.1em',
                  margin: 0,
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)' 
                }}>
                  VERSÍCULO DO DIA
                </h3>
                <p style={{ 
                  fontSize: '0.875rem', 
                  opacity: 0.9,
                  margin: '0.25rem 0 0 0',
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)' 
                }}>
                  {todayVerse && format(new Date(todayVerse.publishedAt), "d 'de' MMMM", { locale: ptBR })}
                </p>
              </div>

              <div style={{ 
                textAlign: 'center', 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '0 1rem'
              }}>
                <div>
                  <p style={{ 
                    fontSize: '1.25rem', 
                    fontStyle: 'italic', 
                    lineHeight: 1.35,
                    margin: '0 0 0.75rem 0',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)' 
                  }}>
                    "{todayVerse?.verse}"
                  </p>
                  <p style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: 600,
                    margin: 0,
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)' 
                  }}>
                    {todayVerse?.reference}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img src={logoWhite} alt="UMP Emaús" style={{ height: '6rem', opacity: 0.95, display: 'block' }} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 justify-center">
            <Button
              onClick={() => generateAndShareImage('whatsapp')}
              disabled={generating}
              className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700"
              data-testid="button-share-whatsapp"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <SiWhatsapp className="mr-2 h-4 w-4" />
                  WhatsApp
                </>
              )}
            </Button>
            <Button
              onClick={() => generateAndShareImage('instagram')}
              disabled={generating}
              className="flex-1 min-w-[120px] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              data-testid="button-share-instagram"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <SiInstagram className="mr-2 h-4 w-4" />
                  Instagram
                </>
              )}
            </Button>
            <Button
              onClick={() => generateAndShareImage('download')}
              disabled={generating}
              variant="outline"
              size="icon"
              data-testid="button-download"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}
