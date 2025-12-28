import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AccessibilityToolbar } from "./AccessibilityToolbar";

interface StudySection {
  type: "verse" | "topic" | "conclusion";
  title?: string;
  content: string;
  reference?: string;
}

interface EstudeScreenProps {
  lessonTitle: string;
  sections: StudySection[];
  verseReference?: string;
  verseText?: string;
  onComplete: () => void;
  onClose: () => void;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
}

export function EstudeScreen({
  lessonTitle,
  sections,
  verseReference,
  verseText,
  onComplete,
  onClose,
  initialIndex = 0,
  onIndexChange
}: EstudeScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  const allSections = useMemo(() => {
    if (verseText && verseReference) {
      return [
        { type: "verse" as const, title: "Versículo Base", content: `"${verseText}"`, reference: verseReference },
        ...sections
      ];
    }
    return sections;
  }, [verseText, verseReference, sections]);

  const currentSection = allSections[currentIndex];
  const isLastSlide = currentIndex === allSections.length - 1;
  const totalSlides = allSections.length;

  const textContent = useMemo(() => {
    if (!currentSection) return "";
    return `${currentSection.title || ""} ${currentSection.content}`.replace(/<[^>]*>/g, " ").trim();
  }, [currentSection]);

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
    <div className="flex flex-col p-4">
      <div className="max-w-2xl mx-auto w-full flex flex-col">
        {/* Cabeçalho da sessão */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10">
            <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400" data-testid="session-title-estude">Estude</h3>
            <p className="text-sm text-muted-foreground">{lessonTitle}</p>
          </div>
          <AccessibilityToolbar textContent={textContent} />
        </div>
        
        {/* Versículo base */}
        {verseReference && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300" data-testid="verse-reference">
                Texto base: {verseReference}
              </span>
            </div>
          </div>
        )}
        
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
              className="h-full bg-emerald-500 transition-all duration-300"
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
          >
            <Card className="p-6">
              <div className="space-y-4">
                {currentSection.title && (
                  <h3 className="text-xl font-semibold">{currentSection.title}</h3>
                )}
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  style={{ fontSize: 'var(--study-font-size, 16px)' }}
                  dangerouslySetInnerHTML={{
                    __html: currentSection.content
                  }}
                />
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navegação */}
        <div className="flex gap-3 mt-4 items-center justify-between">
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
                  i === currentIndex ? "w-6 bg-emerald-500" : "w-2 bg-muted"
                )}
                data-testid={`dot-${i}`}
              />
            ))}
          </div>

          {isLastSlide ? (
            <Button
              onClick={onComplete}
              data-testid="button-estude-complete"
              className="flex-1 ml-2 bg-emerald-600 hover:bg-emerald-700"
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
