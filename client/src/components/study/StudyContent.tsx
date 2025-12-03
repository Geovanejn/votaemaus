import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StudySection {
  type: "verse" | "topic" | "conclusion";
  title?: string;
  content: string;
  reference?: string;
  topicNumber?: number;
}

interface StudyContentProps {
  lessonTitle: string;
  sections: StudySection[];
  onComplete: () => void;
}

function VerseSection({ title, reference, content }: { title?: string; reference?: string; content: string }) {
  return (
    <div className="flex flex-col h-full px-6 py-4 overflow-y-auto">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-4">
          <BookOpen className="h-10 w-10 mx-auto text-primary mb-3" />
          <p className="text-sm font-bold text-primary uppercase tracking-wide">
            {title || "Versículo Base"}
          </p>
        </div>
        <Card className="p-6 bg-primary/5 border-primary/20">
          <p className="text-xl text-foreground italic text-center leading-relaxed">
            "{content}"
          </p>
          {reference && (
            <p className="text-sm font-bold text-primary mt-4 text-center">
              — {reference}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function TopicSection({ title, content, topicNumber }: { title: string; content: string; topicNumber?: number }) {
  return (
    <div className="flex flex-col h-full px-6 py-4 overflow-y-auto">
      <div className="max-w-md mx-auto w-full">
        <div className="mb-4">
          {topicNumber !== undefined && topicNumber > 0 && (
            <p className="text-sm font-bold text-primary uppercase tracking-wide mb-2">
              Tópico {topicNumber}
            </p>
          )}
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
        </div>
        <Card className="p-5">
          <p className="text-foreground leading-relaxed whitespace-pre-line">
            {content}
          </p>
        </Card>
      </div>
    </div>
  );
}

function ConclusionSection({ title, content }: { title?: string; content: string }) {
  return (
    <div className="flex flex-col h-full px-6 py-4 overflow-y-auto">
      <div className="max-w-md mx-auto w-full">
        <p className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-4 text-center">
          {title || "Conclusão"}
        </p>
        <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <p className="text-foreground leading-relaxed">
            {content}
          </p>
        </Card>
      </div>
    </div>
  );
}

export function StudyContent({ lessonTitle, sections: rawSections, onComplete }: StudyContentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const sections = rawSections.length > 0 ? rawSections : [
    { type: "topic" as const, title: lessonTitle, content: "Conteúdo não disponível." }
  ];
  
  const totalSections = sections.length;
  const currentSection = sections[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSections - 1;
  
  const goNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };
  
  const goPrev = () => {
    if (!isFirst) {
      setCurrentIndex(prev => prev - 1);
    }
  };
  
  const renderSection = (section: StudySection) => {
    switch (section.type) {
      case "verse":
        return <VerseSection title={section.title} reference={section.reference} content={section.content} />;
      case "topic":
        return <TopicSection title={section.title || ""} content={section.content} topicNumber={section.topicNumber} />;
      case "conclusion":
        return <ConclusionSection title={section.title} content={section.content} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="flex flex-col h-full" data-testid="study-content">
      <div className="flex items-center justify-center gap-1 py-3 border-b">
        {sections.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              idx === currentIndex ? "bg-primary w-6" : idx < currentIndex ? "bg-primary/60" : "bg-muted"
            )}
          />
        ))}
      </div>
      
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full flex items-center justify-center"
          >
            {renderSection(currentSection)}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div className="p-4 border-t">
        <div className="flex items-center justify-center gap-6">
          <Button
            variant="outline"
            size="icon"
            onClick={goPrev}
            disabled={isFirst}
            className={cn("h-12 w-12 rounded-full", isFirst && "opacity-30")}
            data-testid="button-prev"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <div className="flex flex-col items-center">
            <p className="text-sm text-muted-foreground">
              {currentIndex + 1} de {totalSections}
            </p>
            {isLast && (
              <Button
                onClick={goNext}
                size="sm"
                className="mt-2"
                data-testid="button-complete-study"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Concluir Estudo
              </Button>
            )}
          </div>
          
          <Button
            variant={isLast ? "outline" : "default"}
            size="icon"
            onClick={goNext}
            disabled={isLast}
            className={cn("h-12 w-12 rounded-full", isLast && "opacity-30")}
            data-testid="button-next"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { StudySection };
