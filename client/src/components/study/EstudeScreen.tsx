import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Bookmark, 
  Type,
  Accessibility,
  BookOpen,
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
  dailyReading?: string;
  onComplete: () => void;
  onClose: () => void;
  onProgress?: (current: number, total: number) => void;
  onSwitchTab?: (tab: "estude" | "medite" | "responda") => void;
}

function VerseContent({ 
  content,
  highlightedVerses,
  onToggleHighlight,
  reference
}: { 
  content: string;
  highlightedVerses: Set<number>;
  onToggleHighlight: (num: number) => void;
  reference?: string;
}) {
  const extractStartVerse = (ref?: string): number => {
    if (!ref) return 1;
    const match = ref.match(/:\s*(\d+)/);
    return match ? parseInt(match[1]) : 1;
  };
  
  const startVerse = extractStartVerse(reference);
  
  // Melhorado: divide por números de versículos no início de linha ou após espaço/quebra
  // Suporta formatos: "25 texto", "\n25 texto", "25. texto"
  const parseVerses = (text: string): Array<{number: number; text: string}> => {
    const result: Array<{number: number; text: string}> = [];
    
    // Regex melhorado para capturar versículos com número seguido de texto
    // Captura: número no início, ou após quebra de linha, seguido de espaço ou ponto
    const versePattern = /(?:^|\n)\s*(\d+)[.\s]+([^\n]*(?:\n(?!\s*\d+[.\s])[^\n]*)*)/g;
    
    let match;
    while ((match = versePattern.exec(text)) !== null) {
      result.push({
        number: parseInt(match[1]),
        text: match[2].trim()
      });
    }
    
    // Se não encontrou versículos com o padrão, tenta split simples
    if (result.length === 0) {
      const simpleVerseParts = text.split(/(?=\d+\s)/).filter(v => v.trim());
      simpleVerseParts.forEach((verse, idx) => {
        const simpleMatch = verse.match(/^(\d+)\s*([\s\S]*)/);
        if (simpleMatch) {
          result.push({ number: parseInt(simpleMatch[1]), text: simpleMatch[2].trim() });
        } else if (verse.trim()) {
          result.push({ number: startVerse + idx, text: verse.trim() });
        }
      });
    }
    
    return result;
  };
  
  const parsedVerses = parseVerses(content);

  // Se não encontrou versículos estruturados, mostra o conteúdo completo
  if (parsedVerses.length === 0 || (parsedVerses.length === 1 && !parsedVerses[0].text)) {
    return (
      <div className={cn(
        "text-foreground leading-relaxed text-base",
        highlightedVerses.has(1) && "bg-yellow-100 dark:bg-yellow-900/30"
      )}>
        <FormattedText content={content} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {parsedVerses.map((verse, idx) => (
        <p 
          key={`${verse.number}-${idx}`}
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
  // Normaliza texto removendo acentos para comparação
  const normalizeText = (text: string) => 
    text.toLowerCase().trim()
      .replace(/[áàâã]/g, 'a')
      .replace(/[éèê]/g, 'e')
      .replace(/[íìî]/g, 'i')
      .replace(/[óòôõ]/g, 'o')
      .replace(/[úùû]/g, 'u')
      .replace(/ç/g, 'c');

  // Remove título duplicado do início do conteúdo se existir
  const cleanContent = (() => {
    if (!title || !content) return content;
    const titleNorm = normalizeText(title);
    const contentLines = content.split('\n').filter(line => line.trim());
    
    // Verifica se a primeira linha é o título (exato ou muito similar)
    if (contentLines.length > 0) {
      const firstLine = contentLines[0]
        .replace(/^#+\s*/, '')
        .replace(/^\*\*|\*\*$/g, '')
        .replace(/^\d+\.\s*/, '')
        .trim();
      const firstLineNorm = normalizeText(firstLine);
      
      if (firstLineNorm === titleNorm || 
          firstLineNorm.includes(titleNorm) || 
          titleNorm.includes(firstLineNorm) ||
          firstLineNorm.replace(/\s+/g, '') === titleNorm.replace(/\s+/g, '')) {
        return contentLines.slice(1).join('\n').trim();
      }
    }
    return content;
  })();

  // Usa o conteúdo original se cleanContent estiver vazio
  const finalContent = cleanContent && cleanContent.trim() ? cleanContent : content;

  return (
    <div className="py-2">
      {title && (
        <div className="flex items-center gap-2 mb-3">
          {topicNumber !== undefined && topicNumber > 0 && (
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-xs font-bold flex-shrink-0">
              {topicNumber}
            </span>
          )}
          <span className="text-lg font-bold text-foreground uppercase">{title}</span>
        </div>
      )}
      <div className="text-foreground leading-relaxed">
        <FormattedText content={finalContent} />
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
  dailyReading,
  onComplete, 
  onClose,
  onProgress,
  onSwitchTab
}: EstudeScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [highlightedVerses, setHighlightedVerses] = useState<Set<number>>(new Set());
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isReading, setIsReading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const toggleFontSize = () => {
    setFontSize(prev => {
      if (prev >= 24) return 14;
      return prev + 2;
    });
  };
  
  const speakText = () => {
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }
    
    const currentSection = sections[currentIndex];
    let textToRead = currentSection.content || '';
    
    // Normalize text - remove HTML tags, JSON structures, and clean up
    const normalizeForSpeech = (text: string): string => {
      // Recursively extract text from any node structure
      const extractTextDeep = (node: any): string => {
        if (node === null || node === undefined) return '';
        if (typeof node === 'string') return node;
        if (typeof node === 'number') return String(node);
        if (Array.isArray(node)) {
          return node.map(extractTextDeep).join(' ');
        }
        if (typeof node === 'object') {
          // Check for text property first (TipTap/ProseMirror format)
          if (node.text) return node.text;
          // Then check for content array
          if (node.content) return extractTextDeep(node.content);
          // Check for children (some editor formats)
          if (node.children) return extractTextDeep(node.children);
          // Check for value
          if (node.value) return extractTextDeep(node.value);
          // Last resort: try all properties
          return Object.values(node).map(extractTextDeep).join(' ');
        }
        return '';
      };
      
      // Try to parse JSON content
      if (text.startsWith('{') || text.startsWith('[')) {
        try {
          const parsed = JSON.parse(text);
          text = extractTextDeep(parsed);
        } catch (e) {
          // Not valid JSON, continue with string
        }
      }
      
      // Remove HTML tags
      text = text.replace(/<[^>]*>/g, ' ');
      // Remove markdown formatting
      text = text.replace(/[#*_~`]/g, '');
      // Replace multiple spaces and newlines with single space
      text = text.replace(/\s+/g, ' ');
      // Trim
      return text.trim();
    };
    
    textToRead = normalizeForSpeech(textToRead);
    
    if ('speechSynthesis' in window && textToRead) {
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      utterance.onend = () => setIsReading(false);
      utterance.onerror = () => setIsReading(false);
      window.speechSynthesis.speak(utterance);
      setIsReading(true);
    }
  };
  
  const sections = rawSections.length > 0 ? rawSections : [
    { type: "topic" as const, title: lessonTitle, content: "Conteúdo não disponível." }
  ];
  
  const totalSlides = 3; // Fixed 3 screens: Topic 1, Topic 2, Conclusion
  const sections = rawSections.length > 0 ? rawSections : [
    { type: "topic" as const, title: lessonTitle, content: "Conteúdo não disponível." }
  ];
  
  // Ensure we only have 3 slides regardless of rawSections length
  const displaySections = useMemo(() => {
    const topics = sections.filter(s => s.type === "topic");
    const conclusion = sections.find(s => s.type === "conclusion") || { type: "conclusion", title: "Conclusão", content: "Fim do estudo." };
    
    return [
      topics[0] || sections[0],
      topics[1] || topics[0] || sections[0],
      conclusion
    ];
  }, [sections]);

  const totalSections = totalSlides;
  const currentSection = displaySections[currentIndex];
  const isLast = currentIndex === totalSections - 1;
  
  useEffect(() => {
    if (onProgress) {
      onProgress(currentIndex + 1, totalSections);
    }
  }, [currentIndex, totalSections, onProgress]);
  
  const goNext = () => {
    if (!isLast) {
      setCurrentIndex(prev => prev + 1);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
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
            reference={section.reference || verseReference}
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
      
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <Card className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {/* Número da seção atual (página) */}
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-purple-600 text-white text-xs font-bold">
                  {currentIndex + 1}
                </span>
                {/* Título no cabeçalho apenas para verse e conclusion - topic tem título interno com número próprio */}
                {currentSection.type !== 'topic' && (
                  <span className="text-lg font-bold text-foreground">
                    {currentSection.title || "Versículo Base"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("min-h-[44px] min-w-[44px] touch-manipulation", fontSize !== 16 ? "text-purple-600" : "text-muted-foreground")}
                  onClick={toggleFontSize}
                  data-testid="button-font-size"
                >
                  <Type className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("min-h-[44px] min-w-[44px] touch-manipulation", isReading ? "text-purple-600" : "text-muted-foreground")}
                  onClick={speakText}
                  data-testid="button-accessibility"
                >
                  <Accessibility className="h-5 w-5" />
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
                style={{ fontSize: `${fontSize}px` }}
                className="study-content-wrapper"
              >
                <div style={{ fontSize: 'inherit' }} className="[&_p]:text-[length:inherit] [&_div]:text-[length:inherit] [&_span:not(.text-purple-600)]:text-[length:inherit]">
                  {renderContent(currentSection)}
                </div>
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
          
          {/* Complete Button - Only show on last screen */}
          {isLast && (
            <Button
              onClick={onComplete}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-6"
              data-testid="button-complete-estude"
            >
              Concluir Estudo
            </Button>
          )}
          
          {/* Daily Reading Card */}
          {dailyReading && (
            <Card className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-5 bg-purple-600 rounded-full" />
                  <div className="w-1.5 h-5 bg-purple-400 rounded-full" />
                </div>
                <span className="font-bold text-foreground">Leitura Diaria</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {dailyReading}
              </p>
            </Card>
          )}
        </div>
      </div>
      
    </div>
  );
}

export type { StudySection };
