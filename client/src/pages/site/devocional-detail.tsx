import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import html2canvas from "html2canvas";
import { 
  ArrowLeft,
  Calendar,
  User,
  Share2,
  BookOpen,
  Loader2,
  Download,
  Check,
  X
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DevotionalShareCard } from "@/components/DevotionalShareCard";
import { useToast } from "@/hooks/use-toast";

import defaultDevImg from "@assets/stock_images/christian_prayer_spi_92875813.jpg";

interface DevotionalData {
  id: number;
  title: string;
  verse: string;
  verseReference: string;
  content?: string;
  summary?: string;
  imageUrl?: string;
  author?: string;
  publishedAt?: string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function getCategory(title: string): string {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('ora')) return 'Oracao';
  if (lowerTitle.includes('fe') || lowerTitle.includes('fé')) return 'Fe';
  if (lowerTitle.includes('amor')) return 'Amor';
  if (lowerTitle.includes('confia') || lowerTitle.includes('tempos')) return 'Confianca';
  if (lowerTitle.includes('serv')) return 'Servico';
  if (lowerTitle.includes('paz')) return 'Paz';
  return 'Fe';
}

export default function DevocionalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const devotionalId = parseInt(id || '0');
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: devotional, isLoading, isError } = useQuery<DevotionalData>({
    queryKey: ['/api/site/devotionals', devotionalId],
    staleTime: 5 * 60 * 1000,
    enabled: devotionalId > 0,
  });

  const { data: allDevotionals } = useQuery<DevotionalData[]>({
    queryKey: ['/api/site/devotionals'],
    staleTime: 5 * 60 * 1000,
  });

  const relatedDevotionals = allDevotionals?.filter(d => d.id !== devotionalId).slice(0, 3) || [];

  const generateShareImage = useCallback(async () => {
    if (!shareCardRef.current || !devotional) return null;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#111827",
        logging: false,
      });
      
      const dataUrl = canvas.toDataURL("image/png", 0.9);
      setGeneratedImageUrl(dataUrl);
      return dataUrl;
    } catch (err) {
      console.error("Error generating image:", err);
      toast({
        title: "Erro ao gerar imagem",
        description: "Tente novamente ou use o compartilhamento simples.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [devotional, toast]);

  const handleOpenShareDialog = async () => {
    setIsShareDialogOpen(true);
    setGeneratedImageUrl(null);
    setTimeout(() => {
      generateShareImage();
    }, 100);
  };

  const handleDownloadImage = async () => {
    const imageUrl = generatedImageUrl || await generateShareImage();
    if (!imageUrl || !devotional) return;

    const link = document.createElement("a");
    link.download = `devocional-${devotional.title.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = imageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Imagem baixada",
      description: "A imagem foi salva em seus downloads.",
    });
  };

  const handleShareWithImage = async () => {
    if (!devotional) return;

    const imageUrl = generatedImageUrl || await generateShareImage();
    if (!imageUrl) return;

    const shareText = `${devotional.title}\n\n"${devotional.verse}" - ${devotional.verseReference}\n\nLeia o devocional completo: ${window.location.href}`;

    let clipboardSuccess = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
        clipboardSuccess = true;
      }
    } catch {
      clipboardSuccess = false;
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `devocional-${devotional.id}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: devotional.title,
          text: shareText,
          url: window.location.href,
          files: [file],
        });
        setIsShareDialogOpen(false);
        toast({
          title: "Compartilhado com sucesso!",
          description: clipboardSuccess 
            ? "O link tambem foi copiado para a area de transferencia." 
            : "Imagem compartilhada.",
        });
      } else {
        handleDownloadImage();
        toast({
          title: clipboardSuccess ? "Imagem baixada + Link copiado" : "Imagem baixada",
          description: clipboardSuccess 
            ? "Cole o link junto com a imagem ao compartilhar no WhatsApp." 
            : "A imagem foi salva. Copie o link manualmente se desejar.",
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Error sharing:", err);
        handleDownloadImage();
        toast({
          title: clipboardSuccess ? "Imagem baixada + Link copiado" : "Imagem baixada",
          description: clipboardSuccess 
            ? "Cole o link junto com a imagem ao compartilhar." 
            : "A imagem foi salva em seus downloads.",
        });
      }
    }
  };

  const handleSimpleShare = async () => {
    if (!devotional) return;
    
    const shareText = `${devotional.title}\n\n"${devotional.verse}" - ${devotional.verseReference}\n\n${window.location.href}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: devotional.title,
          text: `${devotional.verse} - ${devotional.verseReference}`,
          url: window.location.href,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.log("Error sharing:", err);
        }
      }
    } else {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareText);
          toast({
            title: "Link copiado",
            description: "O link foi copiado para a area de transferencia.",
          });
        } else {
          toast({
            title: "Compartilhamento nao disponivel",
            description: "Copie o link manualmente da barra de endereco.",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Erro ao copiar",
          description: "Copie o link manualmente da barra de endereco.",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="min-h-[60vh] flex items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }

  if (isError || !devotional) {
    return (
      <SiteLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-background gap-4">
          <BookOpen className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Devocional nao encontrado</h2>
          <Link href="/devocionais">
            <Button variant="outline" data-testid="button-back-list">
              Voltar aos Devocionais
            </Button>
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const category = getCategory(devotional.title);
  const date = formatDate(devotional.publishedAt);
  const imageUrl = devotional.imageUrl && !devotional.imageUrl.includes('placeholder') 
    ? devotional.imageUrl 
    : defaultDevImg;

  const contentText = devotional.content || devotional.summary || '';

  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 via-gray-800/60 to-gray-900/50" />
        <div className="relative text-white py-12">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Link href="/devocionais">
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/10 gap-2 mb-6"
                  data-testid="button-back-devotionals"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar aos Devocionais
                </Button>
              </Link>

              <div className="max-w-3xl">
                <div className="flex items-center gap-4 text-sm opacity-90 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {date}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    {category}
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-6" data-testid="devotional-detail-title">
                  {devotional.title}
                </h1>

                <blockquote className="border-l-4 border-white/50 pl-4 py-2">
                  <p className="text-xl italic opacity-95">
                    "{devotional.verse}"
                  </p>
                  <cite className="text-sm opacity-80 mt-2 block">
                    - {devotional.verseReference}
                  </cite>
                </blockquote>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardContent className="p-8">
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    {contentText.split('\n\n').map((paragraph, index) => {
                      if (!paragraph.trim()) return null;
                      if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                        return (
                          <h3 key={index} className="text-xl font-semibold mt-6 mb-3">
                            {paragraph.replace(/\*\*/g, '')}
                          </h3>
                        );
                      }
                      if (paragraph.match(/^\d\./)) {
                        return (
                          <p key={index} className="text-muted-foreground leading-relaxed mb-2">
                            {paragraph.split('**').map((part, i) => 
                              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                            )}
                          </p>
                        );
                      }
                      return (
                        <p key={index} className="text-muted-foreground leading-relaxed mb-4">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-4 mt-8 pt-6 border-t">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{devotional.author || 'Secretaria de Espiritualidade'}</p>
                        <p className="text-sm text-muted-foreground">{date}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleOpenShareDialog}
                      className="gap-2"
                      data-testid="button-share-devotional"
                    >
                      <Share2 className="h-4 w-4" />
                      Compartilhar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Leia tambem
                  </h3>
                  {relatedDevotionals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum outro devocional disponivel.</p>
                  ) : (
                    <div className="space-y-4">
                      {relatedDevotionals.map((related) => (
                        <Link key={related.id} href={`/devocionais/${related.id}`}>
                          <div className="p-3 rounded-lg hover-elevate cursor-pointer">
                            <p className="text-xs text-muted-foreground mb-1">
                              {formatDate(related.publishedAt)}
                            </p>
                            <h4 className="font-medium text-sm">
                              {related.title}
                            </h4>
                            <span className="text-xs text-primary mt-1 inline-block">
                              {getCategory(related.title)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Compartilhar Devocional
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Gerando imagem...</p>
              </div>
            ) : generatedImageUrl ? (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border">
                  <img 
                    src={generatedImageUrl} 
                    alt="Preview do compartilhamento"
                    className="w-full h-auto"
                  />
                  <div className="absolute top-2 right-2">
                    <div className="bg-green-500 text-white rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleShareWithImage}
                    className="gap-2"
                    data-testid="button-share-with-image"
                  >
                    <Share2 className="h-4 w-4" />
                    Compartilhar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadImage}
                    className="gap-2"
                    data-testid="button-download-image"
                  >
                    <Download className="h-4 w-4" />
                    Baixar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <X className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Erro ao gerar imagem</p>
                <Button variant="outline" onClick={generateShareImage} data-testid="button-retry-generate">
                  Tentar novamente
                </Button>
              </div>
            )}
            
            <div className="border-t pt-4">
              <Button 
                variant="ghost" 
                onClick={handleSimpleShare}
                className="w-full gap-2 text-muted-foreground"
                data-testid="button-simple-share"
              >
                Compartilhar apenas link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div 
        style={{ 
          position: "fixed", 
          left: "-9999px", 
          top: "-9999px",
          pointerEvents: "none",
        }}
      >
        <DevotionalShareCard
          ref={shareCardRef}
          title={devotional?.title || ""}
          verse={devotional?.verse || ""}
          verseReference={devotional?.verseReference || ""}
          imageUrl={imageUrl}
        />
      </div>
    </SiteLayout>
  );
}
