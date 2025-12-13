import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Bookmark, 
  Highlighter, 
  StickyNote, 
  Share2,
  Type,
  Accessibility,
  BookOpen,
  Heart,
  HelpCircle,
  ChevronLeft,
  ChevronRight
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
  onSwitchTab?: (tab: "estude" | "medite" | "responda") => void;
}

function VerseContent({ 
  content,
  highlightedVerses,
  onToggleHighlight
}: { 
  content: string;
  highlightedVerses: Set<number>;
  onToggleHighlight: (num: number) => void;
}) {
  const verses = content.split(/(?=\d+\s)/).filter(v => v.trim());
  const parsedVerses = verses.map((verse, idx) => {
    const match = verse.match(/^(\d+)\s*([\s\S]*)/);
    if (match) {
      return { number: parseInt(match[1]), text: match[2].trim() };
    }
    return { number: idx + 1, text: verse.trim() };
  });

  if (parsedVerses.length === 0 || (parsedVerses.length === 1 && !parsedVerses[0].text)) {
    return (
      <p className={cn(
        "text-foreground leading-relaxed text-base",
        highlightedVerses.has(1) && "bg-yellow-100 dark:bg-yellow-900/30"
      )}>
        {content}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {parsedVerses.map((verse) => (
        <p 
          key={verse.number}
          className={cn(
            "text-foreground leading-relaxed text-base cursor-pointer transition-colors",
            highlightedVerses.has(verse.number) && "bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 -mx-2 rounded"
          )}
          onClick={() => onToggleHighlight(verse.number)}
          data-testid={`verse-${verse.number}`}
        >
          <span className="text-purple-600 dark:text-purple-400 font-bold mr-1">
            {verse.number}
          </span>
          {verse.text}
        </p>
      ))}
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
  onProgress,
  onSwitchTab
}: EstudeScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [highlightedVerses, setHighlightedVerses] = useState<Set<number>>(new Set());
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const sections = rawSections.length > 0 ? rawSections : [
    { type: "topic" as const, title: lessonTitle, content: "Conteudo nao disponivel." }
  ];
  
  const totalSections = sections.length;
  const currentSection = sections[currentIndex];
  const isLast = currentIndex === totalSections - 1;
  
  useEffect(() => {
    if (onProgress) {
      onProgress(currentIndex + 1, totalSections);
    }
  }, [currentIndex, totalSections, onProgress]);
  
  const goNext = () => {
    if (!isLast) {
      setCurrentIndex(prev => prev + 1);
    }
  };
  
  const goPrev = () => {
    if (currentIndex > 0) {
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
        return (
          <VerseContent
            content={section.content}
            highlightedVerses={highlightedVerses}
            onToggleHighlight={toggleHighlight}
          />
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
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900" data-testid="estude-screen">
      <div 
        className="text-white p-4 rounded-b-3xl"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 50%, #A855F7 100%)' }}
      >
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white hover:bg-white/20"
            data-testid="button-close-estude"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="font-bold text-lg">Estude</h1>
            <p className="text-white/80 text-sm">{extractReference()}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsBookmarked(!isBookmarked)}
            className="text-white hover:bg-white/20"
            data-testid="button-bookmark"
          >
            <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-current")} />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <Card className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-0">
            <div className="flex items-center justify-between mb-4">
              <span className="text-purple-600 dark:text-purple-400 font-medium text-sm">
                {currentSection.title || "Versiculo do Dia"}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" data-testid="button-font-size">
                  <Type className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" data-testid="button-accessibility">
                  <Accessibility className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent(currentSection)}
              </motion.div>
            </AnimatePresence>
          </Card>
          
          {/* Navigation Arrows and Indicators */}
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className={cn(
                "h-12 w-12 rounded-full",
                currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
              )}
              data-testid="button-prev-estude"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <div className="flex items-center gap-2">
              {sections.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    idx === currentIndex ? "w-6 bg-purple-600" : "w-2 bg-purple-200 dark:bg-purple-800"
                  )}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={goNext}
              disabled={isLast}
              className={cn(
                "h-12 w-12 rounded-full",
                isLast ? "opacity-30 cursor-not-allowed" : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
              )}
              data-testid="button-next-estude"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="flex justify-center gap-4 py-2">
            <button 
              className="flex flex-col items-center gap-2"
              data-testid="button-destacar"
            >
              <div className="h-12 w-12 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Highlighter className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-xs text-muted-foreground">Destacar</span>
            </button>
            <button 
              className="flex flex-col items-center gap-2"
              data-testid="button-nota"
            >
              <div className="h-12 w-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <StickyNote className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs text-muted-foreground">Nota</span>
            </button>
            <button 
              className="flex flex-col items-center gap-2"
              data-testid="button-compartilhar"
            >
              <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs text-muted-foreground">Compartilhar</span>
            </button>
          </div>
          
          {currentSection.type === 'verse' && (
            <Card className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-5 bg-purple-600 rounded-full" />
                  <div className="w-1.5 h-5 bg-purple-400 rounded-full" />
                </div>
                <span className="font-bold text-foreground">Comentario</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Este e um dos versiculos mais conhecidos da Biblia, que resume o evangelho de forma clara e direta. O amor de Deus e demonstrado atraves do sacrificio de seu Filho unico para a salvacao de todos que nele creem.
              </p>
            </Card>
          )}
          
          {isLast && (
            <div className="pt-4">
              <Button
                onClick={onComplete}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-6"
                data-testid="button-complete-estude"
              >
                Concluir Estudo
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 border-t px-4 py-3 safe-area-inset-bottom">
        <div className="flex justify-around max-w-lg mx-auto">
          <button 
            className="flex flex-col items-center gap-1 text-purple-600 dark:text-purple-400"
            onClick={() => onSwitchTab?.("estude")}
            data-testid="tab-estude"
          >
            <BookOpen className="h-6 w-6" />
            <span className="text-xs font-medium">Estude</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 text-muted-foreground"
            onClick={() => onSwitchTab?.("medite")}
            data-testid="tab-medite"
          >
            <Heart className="h-6 w-6" />
            <span className="text-xs font-medium">Medite</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 text-muted-foreground"
            onClick={() => onSwitchTab?.("responda")}
            data-testid="tab-responda"
          >
            <HelpCircle className="h-6 w-6" />
            <span className="text-xs font-medium">Responda</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export type { StudySection };
