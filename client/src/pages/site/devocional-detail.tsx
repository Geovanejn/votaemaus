import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft,
  Calendar,
  User,
  Share2,
  BookOpen,
  Loader2
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

  const handleShare = async () => {
    if (navigator.share && devotional) {
      try {
        await navigator.share({
          title: devotional.title,
          text: `${devotional.verse} - ${devotional.verseReference}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-orange-500/80 to-amber-500/70" />
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
                      onClick={handleShare}
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
    </SiteLayout>
  );
}
