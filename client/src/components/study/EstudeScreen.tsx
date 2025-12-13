import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  Highlighter, 
  StickyNote, 
  Share2,
  X,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

function FormattedText({ content }: { content: string }) {
  if (!content) return null;
  
  const isHtml = content.includes('<') && content.includes('>');
  const isJson = content.startsWith('{') || content.startsWith('[');
  
  if (isHtml) {
    return (
      <div 
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    );
  }
  
  if (isJson) {
    try {
      const parsed = JSON.parse(content);
      if (parsed.content) {
        const extractText = (node: any): string => {
          if (typeof node === 'string') return node;
          if (node.text) return node.text;
          if (node.content && Array.isArray(node.content)) {
            return node.content.map(extractText).join('');
          }
          return '';
        };
        const text = parsed.content.map(extractText).join('\n\n');
        return <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{text}</ReactMarkdown></div>;
      }
    } catch (e) {
    }
  }
  
  return <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{content}</ReactMarkdown></div>;
}

interface StudySection {
  type: "verse" | "topic" | "conclusion";
  title?: string;
  content: string;
  reference?: string;
  topicNumber?: number;
}

interface EstudeScreenProps {
  lessonTitle: string;
  sections: StudySection[];
  verseReference?: string;
  onComplete: () => void;
  onClose: () => void;
  onProgress?: (current: number, total: number) => void;
}

function VerseWithNumber({ 
  verseNumber, 
  content, 
  isHighlighted,
  onHighlight,
  onNote,
  onShare
}: { 
  verseNumber: number; 
  content: string;
  isHighlighted?: boolean;
  onHighlight?: () => void;
  onNote?: () => void;
  onShare?: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  
  return (
    <div 
      className={cn(
        "flex gap-3 py-3 px-2 rounded-md transition-all cursor-pointer",
        isHighlighted && "bg-yellow-100 dark:bg-yellow-900/30",
        showActions && "bg-muted/50"
      )}
      onClick={() => setShowActions(!showActions)}
      data-testid={`verse-${verseNumber}`}
    >
      <span className="text-purple-600 dark:text-purple-400 font-bold text-sm min-w-[24px]">
        {verseNumber}
      </span>
      <div className="flex-1">
        <p className="text-foreground leading-relaxed text-base">
          {content}
        </p>
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 mt-3"
            >
              <Button
                size="sm"
                variant="outline"
                className="bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onHighlight?.();
                }}
                data-testid={`button-highlight-${verseNumber}`}
              >
                <Highlighter className="h-4 w-4 mr-1" />
                Destacar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onNote?.();
                }}
                data-testid={`button-note-${verseNumber}`}
              >
                <StickyNote className="h-4 w-4 mr-1" />
                Nota
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.();
                }}
                data-testid={`button-share-${verseNumber}`}
              >
                <Share2 className="h-4 w-4 mr-1" />
                Compartilhar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TopicContent({ title, content, topicNumber }: { title: string; content: string; topicNumber?: number }) {
  return (
    <div className="py-4">
      <div className="mb-3">
        {topicNumber !== undefined && topicNumber > 0 && (
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-purple-600 text-white text-xs font-bold mr-2">
            {topicNumber}
          </span>
        )}
        <span className="text-lg font-bold text-foreground">{title}</span>
      </div>
      <div className="text-foreground leading-relaxed pl-8">
        <FormattedText content={content} />
      </div>
    </div>
  );
}

function ConclusionContent({ title, content }: { title?: string; content: string }) {
  return (
    <div className="py-4 px-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
      <p className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-3">
        {title || "Conclusao"}
      </p>
      <div className="text-foreground leading-relaxed">
        <FormattedText content={content} />
      </div>
    </div>
  );
}

export function EstudeScreen({ 
  lessonTitle, 
  sections: rawSections, 
  verseReference,
  onComplete, 
  onClose,
  onProgress 
}: EstudeScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [highlightedVerses, setHighlightedVerses] = useState<Set<number>>(new Set());
  
  const sections = rawSections.length > 0 ? rawSections : [
    { type: "topic" as const, title: lessonTitle, content: "Conteudo nao disponivel." }
  ];
  
  const totalSections = sections.length;
  const currentSection = sections[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSections - 1;
  
  useEffect(() => {
    if (onProgress) {
      onProgress(currentIndex + 1, totalSections);
    }
  }, [currentIndex, totalSections, onProgress]);
  
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
  
  const toggleHighlight = (verseNum: number) => {
    setHighlightedVerses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(verseNum)) {
        newSet.delete(verseNum);
      } else {
        newSet.add(verseNum);
      }
      return newSet;
    });
  };
  
  const extractReference = () => {
    if (verseReference) return verseReference;
    const verseSection = sections.find(s => s.type === 'verse');
    return verseSection?.reference || lessonTitle;
  };
  
  const renderContent = (section: StudySection) => {
    switch (section.type) {
      case "verse":
        const verses = section.content.split(/(?=\d+\s)/).filter(v => v.trim());
        const parsedVerses = verses.map((verse, idx) => {
          const match = verse.match(/^(\d+)\s*(.*)/s);
          if (match) {
            return { number: parseInt(match[1]), text: match[2].trim() };
          }
          return { number: idx + 1, text: verse.trim() };
        });
        
        if (parsedVerses.length === 0 || (parsedVerses.length === 1 && !parsedVerses[0].text)) {
          return (
            <VerseWithNumber
              verseNumber={1}
              content={section.content}
              isHighlighted={highlightedVerses.has(1)}
              onHighlight={() => toggleHighlight(1)}
            />
          );
        }
        
        return (
          <div className="space-y-1">
            {parsedVerses.map((verse) => (
              <VerseWithNumber
                key={verse.number}
                verseNumber={verse.number}
                content={verse.text}
                isHighlighted={highlightedVerses.has(verse.number)}
                onHighlight={() => toggleHighlight(verse.number)}
              />
            ))}
          </div>
        );
      case "topic":
        return <TopicContent title={section.title || ""} content={section.content} topicNumber={section.topicNumber} />;
      case "conclusion":
        return <ConclusionContent title={section.title} content={section.content} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-background" data-testid="estude-screen">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white hover:bg-white/20"
            data-testid="button-close-estude"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <span className="font-bold uppercase tracking-wide">Estude</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20"
            data-testid="button-bookmark"
          >
            <Bookmark className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-center text-white/90 text-sm">
          {extractReference()}
        </p>
      </div>
      
      <div className="flex items-center justify-center gap-1 py-2 border-b bg-muted/30">
        {sections.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "h-1.5 rounded-full transition-all",
              idx === currentIndex 
                ? "bg-purple-600 w-8" 
                : idx < currentIndex 
                  ? "bg-purple-400 w-4" 
                  : "bg-muted w-4"
            )}
          />
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentSection.type === 'verse' && currentSection.title && (
                <div className="text-center mb-4">
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                    {currentSection.title}
                  </p>
                  {currentSection.reference && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {currentSection.reference}
                    </p>
                  )}
                </div>
              )}
              <Card className="p-4">
                {renderContent(currentSection)}
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      <div className="border-t bg-background p-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={goPrev}
            disabled={isFirst}
            className={cn(
              "h-12 w-12 rounded-full border-purple-200 dark:border-purple-800",
              isFirst && "opacity-30"
            )}
            data-testid="button-prev-estude"
          >
            <ChevronLeft className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </Button>
          
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {currentIndex + 1} de {totalSections}
            </p>
            {isLast && (
              <Button
                onClick={goNext}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-complete-estude"
              >
                Concluir Estudo
              </Button>
            )}
          </div>
          
          <Button
            variant={isLast ? "outline" : "default"}
            size="icon"
            onClick={goNext}
            disabled={isLast}
            className={cn(
              "h-12 w-12 rounded-full",
              isLast 
                ? "opacity-30 border-purple-200 dark:border-purple-800" 
                : "bg-purple-600 hover:bg-purple-700"
            )}
            data-testid="button-next-estude"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      <div className="border-t bg-muted/50 px-4 py-3">
        <div className="flex justify-center gap-8 max-w-lg mx-auto">
          <button 
            className="flex flex-col items-center gap-1 text-purple-600 dark:text-purple-400"
            data-testid="tab-estude"
          >
            <div className="h-1.5 w-12 bg-purple-600 rounded-full mb-1" />
            <BookOpen className="h-5 w-5" />
            <span className="text-xs font-medium">Estude</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 text-muted-foreground opacity-50"
            data-testid="tab-medite"
          >
            <div className="h-1.5 w-12 bg-transparent rounded-full mb-1" />
            <div className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-current" />
            </div>
            <span className="text-xs font-medium">Medite</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 text-muted-foreground opacity-50"
            data-testid="tab-responda"
          >
            <div className="h-1.5 w-12 bg-transparent rounded-full mb-1" />
            <div className="h-5 w-5 flex items-center justify-center text-current font-bold">?</div>
            <span className="text-xs font-medium">Responda</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export type { StudySection };
