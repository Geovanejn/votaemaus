import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MeditationSection {
  type: "reflection" | "meditation";
  title: string;
  content: string;
}

interface MediteScreenProps {
  lessonTitle: string;
  sections: MeditationSection[];
  onComplete: () => void;
  onClose: () => void;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
}

export function MediteScreen({
  lessonTitle,
  sections,
  onComplete,
  onClose,
  initialIndex = 0,
  onIndexChange
}: MediteScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  const currentSection = sections[currentIndex];
  const isLastSlide = currentIndex === sections.length - 1;
  const totalSlides = sections.length;

  const goNext = () => {
    if (!isLastSlide) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!currentSection) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Nenhum conteúdo disponível</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-4">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        {/* Título */}
        <h2 className="text-2xl font-bold mb-2">{lessonTitle}</h2>

        {/* Barra de progresso */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Slide {currentIndex + 1} de {totalSlides}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentIndex + 1) / totalSlides) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalSlides) * 100}%` }}
            />
          </div>
        </div>

        {/* Conteúdo do slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <Card className="p-6 h-full">
              <div className="space-y-4">
                {currentSection.title && (
                  <h3 className="text-xl font-semibold">{currentSection.title}</h3>
                )}
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: currentSection.content
                  }}
                />
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navegação */}
        <div className="flex gap-3 mt-6 items-center justify-between">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentIndex === 0}
            size="icon"
            data-testid="button-prev-slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex gap-2">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === currentIndex ? "w-6 bg-primary" : "w-2 bg-muted"
                )}
                data-testid={`dot-${i}`}
              />
            ))}
          </div>

          {isLastSlide ? (
            <Button
              onClick={onComplete}
              data-testid="button-medite-complete"
              className="flex-1 ml-2"
            >
              Continuar
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={goNext}
              disabled={isLastSlide}
              size="icon"
              data-testid="button-next-slide"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
