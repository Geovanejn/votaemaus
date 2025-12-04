import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

import devocionalImg1 from "@assets/Fundo Layout stories_1761783891823.png";
import devocionalImg2 from "@assets/Layout stories_1761779211233.png";
import devocionalImg3 from "@assets/fundo_1761781968067.png";

interface DevotionalData {
  id: number;
  title: string;
  verse: string;
  verseReference: string;
  imageUrl?: string;
}

const devotionals: DevotionalData[] = [
  {
    id: 1,
    title: "A Força da Oração",
    verse: "Orai sem cessar.",
    verseReference: "1 Tessalonicenses 5:17",
    imageUrl: devocionalImg1,
  },
  {
    id: 2,
    title: "Confiança em Deus",
    verse: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.",
    verseReference: "Provérbios 3:5",
    imageUrl: devocionalImg2,
  },
  {
    id: 3,
    title: "O Amor de Cristo",
    verse: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.",
    verseReference: "João 3:16",
    imageUrl: devocionalImg3,
  },
];

export function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % devotionals.length);
  }, []);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + devotionals.length) % devotionals.length);
  }, []);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  useEffect(() => {
    const timer = setInterval(goToNext, 8000);
    return () => clearInterval(timer);
  }, [goToNext]);

  const currentDevotional = devotionals[currentIndex];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <div className="relative w-full min-h-[500px] md:min-h-[550px] overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/15 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
      </div>
      
      {currentDevotional.imageUrl && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
            style={{ backgroundImage: `url(${currentDevotional.imageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/85 to-gray-900/70" />
        </>
      )}
      
      <div className="relative h-full container mx-auto px-4 py-16 md:py-20 flex flex-col justify-center">
        <div className="max-w-2xl ml-8 md:ml-16 lg:ml-20">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
          >
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Devocional do Dia
            </span>
          </motion.div>
          
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentDevotional.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <h1
                className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight pr-4"
                data-testid="banner-title"
              >
                {currentDevotional.title}
              </h1>
              
              <blockquote className="border-l-4 border-primary pl-5 py-3 mb-8 bg-white/5 backdrop-blur-sm rounded-r-lg mr-4 md:mr-8">
                <p className="text-lg md:text-2xl text-white/90 italic font-light leading-relaxed">
                  "{currentDevotional.verse}"
                </p>
                <cite className="text-base text-primary mt-3 block not-italic font-medium">
                  — {currentDevotional.verseReference}
                </cite>
              </blockquote>
            </motion.div>
          </AnimatePresence>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/devocionais">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
                data-testid="banner-primary-button"
              >
                Ler Devocional Completo
              </Button>
            </Link>
            <Link href="/membro">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 backdrop-blur-sm"
                data-testid="banner-secondary-button"
              >
                Área do Membro
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.button
        onClick={goToPrev}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-black/30 transition-all duration-300"
        aria-label="Anterior"
        data-testid="banner-prev-button"
      >
        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
      </motion.button>

      <motion.button
        onClick={goToNext}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-black/30 transition-all duration-300"
        aria-label="Próximo"
        data-testid="banner-next-button"
      >
        <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
      </motion.button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {devotionals.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => goToSlide(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className={`transition-all duration-300 ${
              index === currentIndex
                ? "w-6 h-2 bg-primary rounded-full shadow-lg shadow-primary/30"
                : "w-2 h-2 bg-white/30 rounded-full hover:bg-white/50"
            }`}
            aria-label={`Ir para slide ${index + 1}`}
            data-testid={`banner-dot-${index}`}
          />
        ))}
      </div>
    </div>
  );
}
