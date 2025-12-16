import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  MoreVertical,
  Leaf,
  Play,
  Pause,
  Plus,
  Image,
  Mic,
  Bookmark,
  Share2,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Heart,
  HelpCircle,
  Music,
  Type,
  Accessibility
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

interface MeditationSection {
  type: "reflection" | "meditation";
  title: string;
  content: string;
  prompt?: string;
  duration?: number;
  verseReference?: string;
  verseText?: string;
}

// Remove título duplicado do início do conteúdo se existir
function cleanDuplicateTitle(title: string, content: string): string {
  if (!title || !content) return content;
  const titleLower = title.toLowerCase().trim();
  const contentLines = content.split('\n');
  
  if (contentLines.length > 0) {
    const firstLine = contentLines[0].replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '').trim().toLowerCase();
    if (firstLine === titleLower || firstLine.includes(titleLower) || titleLower.includes(firstLine)) {
      return contentLines.slice(1).join('\n').trim();
    }
  }
  return content;
}

interface MediteScreenProps {
  lessonTitle: string;
  sections: MeditationSection[];
  onComplete: () => void;
  onClose: () => void;
  onProgress?: (current: number, total: number) => void;
  onSwitchTab?: (tab: "estude" | "medite" | "responda") => void;
}

export function MediteScreen({ 
  lessonTitle, 
  sections: rawSections, 
  onComplete, 
  onClose,
  onProgress,
  onSwitchTab
}: MediteScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [journalText, setJournalText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
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
    
    // Also include verse text if available
    if (currentSection.verseText) {
      textToRead = `${currentSection.verseText}. ${textToRead}`;
    }
    
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
    { 
      type: "reflection" as const, 
      title: "O Amor Transformador", 
      content: "Pause por um momento e reflita sobre a profundidade desse amor incondicional. Como essa verdade transforma sua vida hoje?",
      verseReference: "João 3:16",
      verseText: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna."
    }
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
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.5;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);
  
  const formatTime = (progress: number) => {
    const totalSeconds = 204;
    const currentSeconds = Math.floor((progress / 100) * totalSeconds);
    const minutes = Math.floor(currentSeconds / 60);
    const seconds = currentSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900" data-testid="medite-screen">
      <div 
        className="text-white p-4 pb-6 rounded-b-3xl"
        style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white hover:bg-white/20"
            data-testid="button-close-medite"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="font-bold text-lg">Medite</h1>
            <p className="text-white/80 text-sm">Reflexao Guiada</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20"
            data-testid="button-menu-medite"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 -mt-4">
        <div className="max-w-lg mx-auto space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-600 text-white text-xs font-bold">
                      {currentIndex + 1}
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      {currentSection.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn("h-8 w-8", fontSize !== 16 ? "text-emerald-600" : "text-muted-foreground")}
                      onClick={toggleFontSize}
                      data-testid="button-font-size-medite"
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn("h-8 w-8", isReading ? "text-emerald-600" : "text-muted-foreground")}
                      onClick={speakText}
                      data-testid="button-accessibility-medite"
                    >
                      <Accessibility className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {currentSection.verseReference && (
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm text-center mb-3">
                    {currentSection.verseReference}
                  </p>
                )}
                
                {currentSection.verseText && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 mb-4">
                    <p className="text-emerald-800 dark:text-emerald-200 text-center italic leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
                      "{currentSection.verseText}"
                    </p>
                  </div>
                )}
                
                <p className="text-muted-foreground text-center leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
                  {cleanDuplicateTitle(currentSection.title, currentSection.content)}
                </p>
              </Card>
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation Arrows and Indicators */}
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className={cn(
                "h-12 w-12 rounded-full",
                currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              )}
              data-testid="button-prev-medite"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <div className="flex items-center gap-2">
              {sections.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    idx === currentIndex ? "w-6 bg-emerald-600" : "w-2 bg-emerald-200 dark:bg-emerald-800"
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
                isLast ? "opacity-30 cursor-not-allowed" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              )}
              data-testid="button-next-medite"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
          
          <Card className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="font-medium text-foreground">Diario de Reflexao</span>
              </div>
              <button className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-1" data-testid="button-new-entry">
                <Plus className="h-4 w-4" />
                Nova
              </button>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-3">
              <Textarea
                placeholder="Escreva suas reflexoes e insights sobre esta meditacao..."
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                className="min-h-[80px] resize-none border-0 bg-transparent focus-visible:ring-0 text-sm"
                data-testid="textarea-journal"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" data-testid="button-add-image">
                  <Image className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" data-testid="button-voice">
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6"
                data-testid="button-save-journal"
              >
                Salvar
              </Button>
            </div>
          </Card>
          
          <div 
            className="rounded-2xl p-4 text-white"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Music className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Musica Contemplativa</p>
                <p className="text-white/70 text-sm">Sons para meditacao</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-12 w-12 rounded-full bg-white text-emerald-600 hover:bg-white/90"
                data-testid="button-play-music"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/70">{formatTime(audioProgress)}</span>
              <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
              <span className="text-xs text-white/70">3:24</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              className="flex-1 flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-2xl"
              data-testid="button-share"
            >
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Share2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm text-muted-foreground">Compartilhar</span>
            </button>
            <button 
              onClick={() => setIsSaved(!isSaved)}
              className="flex-1 flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-2xl"
              data-testid="button-save"
            >
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center",
                isSaved ? "bg-yellow-400" : "bg-yellow-100 dark:bg-yellow-900/30"
              )}>
                <Bookmark className={cn(
                  "h-5 w-5",
                  isSaved ? "text-white fill-white" : "text-yellow-600 dark:text-yellow-400"
                )} />
              </div>
              <span className="text-sm text-muted-foreground">Salvar</span>
            </button>
          </div>
          
          <Card className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-0">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-foreground">Proxima Meditacao</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-sm">Em 2 dias</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Leaf className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Paz Interior</p>
                <p className="text-muted-foreground text-sm">Encontre a paz que excede todo entendimento atraves da presenca de...</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
          
          {isLast && (
            <div className="pt-4">
              <Button
                onClick={onComplete}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6"
                data-testid="button-complete-medite"
              >
                Concluir Meditacao
              </Button>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}

export type { MeditationSection };
