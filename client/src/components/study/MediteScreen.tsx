import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  ChevronLeft, 
  ChevronRight, 
  X,
  Leaf,
  Play,
  Pause,
  Volume2,
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

interface MeditationSection {
  type: "reflection" | "meditation";
  title: string;
  content: string;
  prompt?: string;
  duration?: number;
}

interface MediteScreenProps {
  lessonTitle: string;
  sections: MeditationSection[];
  onComplete: () => void;
  onClose: () => void;
  onProgress?: (current: number, total: number) => void;
}

function ReflectionCard({ 
  title, 
  content, 
  prompt,
  journalText,
  onJournalChange
}: { 
  title: string; 
  content: string;
  prompt?: string;
  journalText: string;
  onJournalChange: (text: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center flex-shrink-0">
            <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground mb-2">{title}</h3>
            <div className="text-muted-foreground text-sm">
              <FormattedText content={content} />
            </div>
          </div>
        </div>
      </Card>
      
      {prompt && (
        <div className="text-center py-2">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium italic">
            "{prompt}"
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-foreground">Diario de Reflexao</span>
        </div>
        <Textarea
          placeholder="Escreva suas reflexoes aqui..."
          value={journalText}
          onChange={(e) => onJournalChange(e.target.value)}
          className="min-h-[120px] resize-none border-green-200 dark:border-green-800 focus:border-green-400 dark:focus:border-green-600"
          data-testid="textarea-journal"
        />
      </div>
    </div>
  );
}

function MeditationCard({ 
  title, 
  content, 
  duration,
  isPlaying,
  onTogglePlay
}: { 
  title: string; 
  content: string;
  duration?: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
}) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && duration) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / duration);
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newProgress;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);
  
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center flex-shrink-0">
            <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground mb-2">{title}</h3>
            <div className="text-muted-foreground text-sm">
              <FormattedText content={content} />
            </div>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 bg-gradient-to-r from-green-500 to-emerald-600">
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={onTogglePlay}
            className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30 text-white"
            data-testid="button-play-meditation"
          >
            {isPlaying ? (
              <Pause className="h-7 w-7" />
            ) : (
              <Play className="h-7 w-7 ml-1" />
            )}
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center justify-between text-white mb-2">
              <span className="text-sm font-medium">Musica de Meditacao</span>
              <Volume2 className="h-4 w-4" />
            </div>
            <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            {duration && (
              <p className="text-xs text-white/80 mt-1">
                {Math.floor((progress / 100) * duration)}s / {duration}s
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export function MediteScreen({ 
  lessonTitle, 
  sections: rawSections, 
  onComplete, 
  onClose,
  onProgress 
}: MediteScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [journalTexts, setJournalTexts] = useState<Record<number, string>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  
  const sections = rawSections.length > 0 ? rawSections : [
    { type: "reflection" as const, title: lessonTitle, content: "Conteudo nao disponivel." }
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
      setIsPlaying(false);
    }
  };
  
  const goPrev = () => {
    if (!isFirst) {
      setCurrentIndex(prev => prev - 1);
      setIsPlaying(false);
    }
  };
  
  const handleJournalChange = (text: string) => {
    setJournalTexts(prev => ({ ...prev, [currentIndex]: text }));
  };
  
  return (
    <div className="flex flex-col h-full bg-background" data-testid="medite-screen">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white hover:bg-white/20"
            data-testid="button-close-medite"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5" />
            <span className="font-bold uppercase tracking-wide">Medite</span>
          </div>
          <div className="w-9" />
        </div>
        <p className="text-center text-white/90 text-sm">
          Reflexao Guiada
        </p>
      </div>
      
      <div className="flex items-center justify-center gap-2 py-3 border-b bg-muted/30">
        <span className="text-sm text-muted-foreground">
          Etapa {currentIndex + 1} de {totalSections}
        </span>
        <div className="flex gap-1 ml-2">
          {sections.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1.5 rounded-full transition-all",
                idx === currentIndex 
                  ? "bg-green-600 w-8" 
                  : idx < currentIndex 
                    ? "bg-green-400 w-4" 
                    : "bg-muted w-4"
              )}
            />
          ))}
        </div>
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
              {currentSection.type === 'reflection' ? (
                <ReflectionCard
                  title={currentSection.title}
                  content={currentSection.content}
                  prompt={currentSection.prompt}
                  journalText={journalTexts[currentIndex] || ''}
                  onJournalChange={handleJournalChange}
                />
              ) : (
                <MeditationCard
                  title={currentSection.title}
                  content={currentSection.content}
                  duration={currentSection.duration}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                />
              )}
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
              "h-12 w-12 rounded-full border-green-200 dark:border-green-800",
              isFirst && "opacity-30"
            )}
            data-testid="button-prev-medite"
          >
            <ChevronLeft className="h-6 w-6 text-green-600 dark:text-green-400" />
          </Button>
          
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {currentIndex + 1} de {totalSections}
            </p>
            {isLast && (
              <Button
                onClick={goNext}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-complete-medite"
              >
                Concluir Meditacao
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
                ? "opacity-30 border-green-200 dark:border-green-800" 
                : "bg-green-600 hover:bg-green-700"
            )}
            data-testid="button-next-medite"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      <div className="border-t bg-muted/50 px-4 py-3">
        <div className="flex justify-center gap-8 max-w-lg mx-auto">
          <button 
            className="flex flex-col items-center gap-1 text-muted-foreground opacity-50"
            data-testid="tab-estude-medite"
          >
            <div className="h-1.5 w-12 bg-transparent rounded-full mb-1" />
            <BookOpen className="h-5 w-5" />
            <span className="text-xs font-medium">Estude</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 text-green-600 dark:text-green-400"
            data-testid="tab-medite-active"
          >
            <div className="h-1.5 w-12 bg-green-600 rounded-full mb-1" />
            <Leaf className="h-5 w-5" />
            <span className="text-xs font-medium">Medite</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 text-muted-foreground opacity-50"
            data-testid="tab-responda-medite"
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

export type { MeditationSection };
