import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  MoreVertical,
  Share2,
  ChevronRight,
  ChevronLeft,
  Type,
  Accessibility,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import html2canvas from "html2canvas";

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
  const [fontSize, setFontSize] = useState(16);
  const [isReading, setIsReading] = useState(false);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

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

  const getMeditationSummary = () => {
    const allContent = sections.map(s => s.content).join('\n');
    const verseRefs = sections.filter(s => s.verseReference).map(s => s.verseReference).join(', ');
    return { 
      title: lessonTitle,
      summary: allContent.slice(0, 200) + (allContent.length > 200 ? '...' : ''),
      verseReference: verseRefs || sections[0]?.verseReference || ''
    };
  };

  const handleShare = async () => {
    setIsGeneratingShare(true);
    try {
      const summary = getMeditationSummary();
      
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
        gradient.addColorStop(0, '#059669');
        gradient.addColorStop(0.5, '#10B981');
        gradient.addColorStop(1, '#34D399');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1920);
        
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.arc(200, 300, 400, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(880, 1600, 300, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MEDITACAO', 540, 200);
        
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
        const titleLines = wrapText(ctx, summary.title, 900);
        let y = 400;
        titleLines.forEach(line => {
          ctx.fillText(line, 540, y);
          y += 90;
        });
        
        if (summary.verseReference) {
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.font = 'italic 40px system-ui, -apple-system, sans-serif';
          ctx.fillText(summary.verseReference, 540, y + 60);
          y += 120;
        }
        
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '36px system-ui, -apple-system, sans-serif';
        const summaryLines = wrapText(ctx, summary.summary, 900);
        y += 80;
        summaryLines.slice(0, 6).forEach(line => {
          ctx.fillText(line, 540, y);
          y += 50;
        });
        
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '32px system-ui, -apple-system, sans-serif';
        ctx.fillText('UMP Emaus - DeoGlory', 540, 1800);
      }

      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'meditacao-deoglory.png', { type: 'image/png' });
          
          const canShare = typeof navigator.share === 'function' && 
                          typeof navigator.canShare === 'function' &&
                          navigator.canShare({ files: [file] });
          
          if (canShare) {
            try {
              await navigator.share({
                title: 'Meditacao DeoGlory',
                text: `Meditacao: ${summary.title}`,
                files: [file]
              });
            } catch (err: any) {
              if (err?.name !== 'AbortError') {
                downloadImage(blob);
              }
            }
          } else {
            downloadImage(blob);
          }
        } else {
          console.error('Failed to generate image blob');
        }
        setIsGeneratingShare(false);
      }, 'image/png');
    } catch (error) {
      console.error('Error generating share image:', error);
      setIsGeneratingShare(false);
      downloadImage(null);
    }
  };

  const downloadImageFromCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'meditacao-deoglory.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const downloadImage = (blob: Blob | null) => {
    if (!blob) {
      console.error('No blob to download');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meditacao-deoglory.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          
          {/* Complete Button - Only on last section */}
          {isLast && (
            <Button
              onClick={onComplete}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6"
              data-testid="button-complete-medite"
            >
              Concluir Meditacao
            </Button>
          )}
          
          {/* Share Button */}
          <Button
            onClick={handleShare}
            disabled={isGeneratingShare}
            variant="outline"
            className="w-full rounded-xl py-5 border-emerald-300 dark:border-emerald-700"
            data-testid="button-share-medite"
          >
            {isGeneratingShare ? (
              <>
                <Download className="h-5 w-5 mr-2 animate-pulse" />
                Gerando imagem...
              </>
            ) : (
              <>
                <Share2 className="h-5 w-5 mr-2 text-emerald-600" />
                Compartilhar Meditacao
              </>
            )}
          </Button>
        </div>
      </div>
      
    </div>
  );
}

export type { MeditationSection };
