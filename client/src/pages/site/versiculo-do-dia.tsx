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
  // The proxy returns the image with proper CORS headers
  const proxyImageUrl = backgroundImage 
    ? `/api/proxy-image?url=${encodeURIComponent(backgroundImage)}`
    : null;

  const generateAndShareImage = useCallback(async (platform: 'whatsapp' | 'instagram' | 'download') => {
    if (!shareCardRef.current) return;

    setGenerating(true);
    try {
      const sourceCanvas = await html2canvas(shareCardRef.current, {
        scale: 5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 0,
        width: shareCardRef.current.offsetWidth,
        height: shareCardRef.current.offsetHeight,
      });

      const width = sourceCanvas.width;
      const height = sourceCanvas.height;
      const borderRadius = 50;

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = width;
      finalCanvas.height = height;
      const ctx = finalCanvas.getContext('2d');
      
      if (!ctx) {
        toast({ title: "Erro ao gerar imagem", variant: "destructive" });
        setGenerating(false);
        return;
      }

      ctx.beginPath();
      ctx.moveTo(borderRadius, 0);
      ctx.lineTo(width - borderRadius, 0);
      ctx.quadraticCurveTo(width, 0, width, borderRadius);
      ctx.lineTo(width, height - borderRadius);
      ctx.quadraticCurveTo(width, height, width - borderRadius, height);
      ctx.lineTo(borderRadius, height);
      ctx.quadraticCurveTo(0, height, 0, height - borderRadius);
      ctx.lineTo(0, borderRadius);
      ctx.quadraticCurveTo(0, 0, borderRadius, 0);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(sourceCanvas, 0, 0);

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
            {/* Background image - use proxy URL for CORS compatibility with html2canvas */}
            {proxyImageUrl && (
              <img 
                src={proxyImageUrl}
                crossOrigin="anonymous"
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
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
