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
  onComplete: () => void;
  onClose: () => void;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
}

export function EstudeScreen({
  lessonTitle,
  sections,
  verseReference,
  onComplete,
  onClose,
  initialIndex = 0,
  onIndexChange
}: EstudeScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  const currentSection = sections[currentIndex];
  const isLastSlide = currentIndex === sections.length - 1;
  const totalSlides = sections.length;

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
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
      <div className="flex flex-col">
        {/* Header Gradient Section */}
        <div 
          className="relative px-6 pt-12 pb-16 rounded-b-[40px] shadow-lg overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
          }}
        >
          <div className="max-w-md mx-auto relative z-10 flex flex-col items-center gap-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-white/90 text-sm font-medium uppercase tracking-wider">Seção</span>
              <span className="text-white text-3xl font-black">
                {currentIndex + 1} <span className="text-white/60 text-xl font-medium">/ {totalSlides}</span>
              </span>
            </div>
            
            {/* ProgressBar */}
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mt-2">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / totalSlides) * 100}%` }}
                className="h-full bg-white rounded-full"
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-md mx-auto w-full px-4 -mt-10 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-2xl rounded-[32px] bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-400 text-white shadow-md">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <span className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-xs">
                      Estude
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mb-6 leading-tight">
                    {currentSection.title || lessonTitle}
                  </h3>

                  <div
                    className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed"
                    style={{ fontSize: 'var(--study-font-size, 16px)' }}
                    dangerouslySetInnerHTML={{
                      __html: currentSection.content
                    }}
                  />

                  {verseReference && (
                    <div className="mt-8 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                      <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Texto Base</p>
                      <p className="text-blue-600 dark:text-blue-400 font-bold">{verseReference}</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 px-6 py-6 pb-10 border-t border-zinc-100 dark:border-zinc-800 z-50">
        <div className="max-w-md mx-auto flex gap-4">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="w-16 h-16 rounded-[24px] border-2 border-zinc-100 dark:border-zinc-800 flex-shrink-0"
            size="icon"
          >
            <ChevronLeft className="h-8 w-8 text-zinc-400" />
          </Button>

          {isLastSlide ? (
            <Button
              onClick={onComplete}
              className="flex-1 h-16 rounded-[24px] bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-90 text-white text-lg font-black shadow-xl shadow-blue-500/25 border-0"
            >
              Concluir Estudo
            </Button>
          ) : (
            <Button
              onClick={goNext}
              className="flex-1 h-16 rounded-[24px] bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-90 text-white text-lg font-black shadow-xl shadow-blue-500/25 border-0"
            >
              Continuar
              <ChevronRight className="h-6 w-6 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
