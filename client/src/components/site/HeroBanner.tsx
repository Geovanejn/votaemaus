import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface BannerSlide {
  id: number;
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  gradient: string;
}

const defaultSlides: BannerSlide[] = [
  {
    id: 1,
    title: "Bem-vindo à UMP Emaús",
    subtitle: "Unidos pela fé, servindo com amor",
    buttonText: "Conheça-nos",
    buttonLink: "/quem-somos",
    secondaryButtonText: "Área do Membro",
    secondaryButtonLink: "/membro",
    gradient: "from-black via-gray-900 to-gray-800",
  },
  {
    id: 2,
    title: "Devocional do Dia",
    subtitle: "Fortaleça sua fé com a Palavra de Deus",
    buttonText: "Ler Devocional",
    buttonLink: "/devocionais",
    gradient: "from-gray-900 via-black to-gray-900",
  },
  {
    id: 3,
    title: "Agenda de Eventos",
    subtitle: "Participe dos nossos encontros e celebrações",
    buttonText: "Ver Agenda",
    buttonLink: "/agenda",
    gradient: "from-black via-gray-800 to-black",
  },
  {
    id: 4,
    title: "Pedidos de Oração",
    subtitle: "Compartilhe suas necessidades conosco",
    buttonText: "Enviar Pedido",
    buttonLink: "/oracao",
    gradient: "from-gray-800 via-black to-gray-900",
  },
];

interface HeroBannerProps {
  slides?: BannerSlide[];
  autoPlayInterval?: number;
}

export function HeroBanner({ 
  slides = defaultSlides, 
  autoPlayInterval = 6000 
}: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      if (newDirection === 1) {
        return prevIndex === slides.length - 1 ? 0 : prevIndex + 1;
      }
      return prevIndex === 0 ? slides.length - 1 : prevIndex - 1;
    });
  }, [slides.length]);

  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      paginate(1);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isPaused, autoPlayInterval, paginate]);

  const currentSlide = slides[currentIndex];

  return (
    <div 
      className="relative w-full h-[70vh] md:h-[60vh] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.3 },
          }}
          className={`absolute inset-0 bg-gradient-to-br ${currentSlide.gradient}`}
        >
          <div className="absolute inset-0 bg-black/30" />
          
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.5, 0.3, 0.5],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          <div className="relative h-full container mx-auto px-4 flex flex-col justify-center items-center text-center">
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 max-w-4xl"
              data-testid="banner-title"
            >
              {currentSlide.title}
            </motion.h1>
            
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl"
              data-testid="banner-subtitle"
            >
              {currentSlide.subtitle}
            </motion.p>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {currentSlide.buttonText && currentSlide.buttonLink && (
                <Link href={currentSlide.buttonLink}>
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground font-semibold px-8"
                    data-testid="banner-primary-button"
                  >
                    {currentSlide.buttonText}
                  </Button>
                </Link>
              )}
              {currentSlide.secondaryButtonText && currentSlide.secondaryButtonLink && (
                <Link href={currentSlide.secondaryButtonLink}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 font-semibold px-8"
                    data-testid="banner-secondary-button"
                  >
                    {currentSlide.secondaryButtonText}
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={() => paginate(-1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        data-testid="banner-prev-button"
      >
        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
      </button>
      
      <button
        onClick={() => paginate(1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        data-testid="banner-next-button"
      >
        <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? "bg-white w-8" 
                : "bg-white/50 hover:bg-white/70"
            }`}
            data-testid={`banner-dot-${index}`}
          />
        ))}
      </div>
    </div>
  );
}
