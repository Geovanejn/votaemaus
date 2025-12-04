import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookOpen, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import devocionalImg1 from "@assets/stock_images/christian_prayer_spi_92875813.jpg";
import devocionalImg2 from "@assets/stock_images/christian_prayer_spi_70fb5265.jpg";
import devocionalImg3 from "@assets/stock_images/christian_bible_stud_56b5ae40.jpg";

interface DevotionalData {
  id: number;
  title: string;
  verse: string;
  verseReference: string;
  summary?: string;
  imageUrl?: string;
}

const fallbackImages = [devocionalImg1, devocionalImg2, devocionalImg3];

const defaultDevotionals: DevotionalData[] = [
  {
    id: 1,
    title: "A Forca da Oracao",
    verse: "Orai sem cessar.",
    verseReference: "1 Tessalonicenses 5:17",
    imageUrl: devocionalImg1,
  },
  {
    id: 2,
    title: "Confianca em Deus",
    verse: "Confia no Senhor de todo o teu coracao.",
    verseReference: "Proverbios 3:5",
    imageUrl: devocionalImg2,
  },
  {
    id: 3,
    title: "O Amor de Cristo",
    verse: "Deus amou o mundo de tal maneira que deu o seu Filho.",
    verseReference: "Joao 3:16",
    imageUrl: devocionalImg3,
  },
];

export function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const { data: devotionals = defaultDevotionals, isLoading, isError } = useQuery<DevotionalData[]>({
    queryKey: ['/api/site/devotionals'],
    staleTime: 5 * 60 * 1000,
    retry: 2,
    select: (data) => {
      if (!data || data.length === 0) return defaultDevotionals;
      return data.map((d, index) => ({
        ...d,
        imageUrl: d.imageUrl && !d.imageUrl.includes('placeholder') 
          ? d.imageUrl 
          : fallbackImages[index % fallbackImages.length],
      }));
    },
  });

  const displayDevotionals = isError ? defaultDevotionals : devotionals;

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % displayDevotionals.length);
  }, [displayDevotionals.length]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + displayDevotionals.length) % displayDevotionals.length);
  }, [displayDevotionals.length]);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (displayDevotionals.length === 0) return;
    const timer = setInterval(goToNext, 8000);
    return () => clearInterval(timer);
  }, [goToNext, displayDevotionals.length]);

  useEffect(() => {
    if (currentIndex >= displayDevotionals.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, displayDevotionals.length]);

  const currentDevotional = displayDevotionals[currentIndex] || defaultDevotionals[0];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-[480px] md:h-[520px] overflow-hidden bg-gray-900 flex items-center justify-center">
        <div className="text-white/60 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[480px] md:h-[520px] overflow-hidden bg-gray-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentDevotional.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          {currentDevotional.imageUrl && (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${currentDevotional.imageUrl})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-gray-900/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-gray-900/30" />
        </motion.div>
      </AnimatePresence>
      
      <div className="relative h-full container mx-auto px-4 flex flex-col justify-center">
        <div className="max-w-xl ml-4 md:ml-12 lg:ml-16">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm rounded-full px-3 py-1.5 mb-4"
          >
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span className="text-primary font-medium text-xs uppercase tracking-wider">
              Devocional do Dia
            </span>
          </motion.div>
          
          <div className="h-[280px] md:h-[300px] overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentDevotional.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="h-full flex flex-col"
              >
                <h1
                  className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight line-clamp-2"
                  data-testid="banner-title"
                >
                  {currentDevotional.title}
                </h1>
                
                <blockquote className="border-l-3 border-primary pl-4 py-2 mb-6 flex-shrink-0">
                  <p className="text-base md:text-xl text-white/90 italic font-light leading-relaxed line-clamp-2">
                    "{currentDevotional.verse}"
                  </p>
                  <cite className="text-sm text-primary mt-2 block not-italic font-medium">
                    - {currentDevotional.verseReference}
                  </cite>
                </blockquote>

                <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                  <Link href="/devocionais">
                    <Button
                      size="default"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
                      data-testid="banner-primary-button"
                    >
                      Ler Devocional
                    </Button>
                  </Link>
                  <Link href="/membro">
                    <Button
                      size="default"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 font-semibold px-6"
                      data-testid="banner-secondary-button"
                    >
                      Area do Membro
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <button
        onClick={goToPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
        aria-label="Anterior"
        data-testid="banner-prev-button"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
        aria-label="Proximo"
        data-testid="banner-next-button"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {displayDevotionals.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? "w-5 h-1.5 bg-primary"
                : "w-1.5 h-1.5 bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Ir para slide ${index + 1}`}
            data-testid={`banner-dot-${index}`}
          />
        ))}
      </div>
    </div>
  );
}
