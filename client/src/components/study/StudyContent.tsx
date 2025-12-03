import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StudySection {
  type: "title" | "verse" | "topic" | "conclusion";
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

function parseStudyContent(body: string, title: string): StudySection[] {
  const sections: StudySection[] = [];
  
  sections.push({
    type: "title",
    title: title,
    content: ""
  });
  
  const lines = body.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let currentTopicNumber = 0;
  let currentContent: string[] = [];
  let currentTitle = "";
  let isInTopic = false;
  let foundVerse = false;
  let foundConclusion = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!foundVerse && (line.toLowerCase().includes('versículo') || line.toLowerCase().includes('versiculo') || line.match(/^[A-Za-záéíóúãõâêîôûç\s]+\s+\d+[:\-]\d+/))) {
      if (currentContent.length > 0 && isInTopic) {
        sections.push({
          type: "topic",
          title: currentTitle,
          content: currentContent.join('\n'),
          topicNumber: currentTopicNumber
        });
        currentContent = [];
      }
      
      const nextLine = lines[i + 1] || "";
      const verseMatch = line.match(/([A-Za-záéíóúãõâêîôûç\s]+\s+\d+[:\-]\d+[\-\d]*)/);
      const verseRef = verseMatch ? verseMatch[1] : (nextLine.match(/([A-Za-záéíóúãõâêîôûç\s]+\s+\d+[:\-]\d+[\-\d]*)/) ? nextLine.match(/([A-Za-záéíóúãõâêîôûç\s]+\s+\d+[:\-]\d+[\-\d]*)/)![1] : "");
      
      let verseContent = "";
      if (line.includes('—') || line.includes('-')) {
        verseContent = line.split(/[—\-]/).slice(1).join('-').trim();
      } else if (lines[i + 1] && !lines[i + 1].match(/^\d+\./)) {
        i++;
        verseContent = lines[i];
      }
      
      sections.push({
        type: "verse",
        reference: verseRef || line,
        content: verseContent || line
      });
      foundVerse = true;
      continue;
    }
    
    const topicMatch = line.match(/^(\d+)\.\s*(.+)/);
    if (topicMatch) {
      if (currentContent.length > 0 && isInTopic) {
        sections.push({
          type: "topic",
          title: currentTitle,
          content: currentContent.join('\n'),
          topicNumber: currentTopicNumber
        });
        currentContent = [];
      }
      
      currentTopicNumber = parseInt(topicMatch[1]);
      currentTitle = topicMatch[2].replace(/[📌✨🟦]/g, '').trim();
      isInTopic = true;
      continue;
    }
    
    if (line.toLowerCase().includes('conclusão') || line.toLowerCase().includes('conclusao')) {
      if (currentContent.length > 0 && isInTopic) {
        sections.push({
          type: "topic",
          title: currentTitle,
          content: currentContent.join('\n'),
          topicNumber: currentTopicNumber
        });
        currentContent = [];
      }
      foundConclusion = true;
      currentTitle = "Conclusão";
      isInTopic = false;
      continue;
    }
    
    if (foundConclusion && !line.match(/^(\d+)\./)) {
      currentContent.push(line);
    } else if (isInTopic) {
      currentContent.push(line);
    }
  }
  
  if (foundConclusion && currentContent.length > 0) {
    sections.push({
      type: "conclusion",
      title: "Conclusão",
      content: currentContent.join('\n')
    });
  } else if (currentContent.length > 0 && isInTopic) {
    sections.push({
      type: "topic",
      title: currentTitle,
      content: currentContent.join('\n'),
      topicNumber: currentTopicNumber
    });
  }
  
  if (sections.length <= 1) {
    const paragraphs = body.split('\n\n').filter(p => p.trim().length > 0);
    paragraphs.forEach((p, idx) => {
      sections.push({
        type: "topic",
        title: `Parte ${idx + 1}`,
        content: p.trim(),
        topicNumber: idx + 1
      });
    });
  }
  
  return sections;
}

function TitleSection({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <BookOpen className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-4">{title}</h1>
      <p className="text-muted-foreground">Deslize para começar o estudo</p>
    </div>
  );
}

function VerseSection({ reference, content }: { reference?: string; content: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="w-full max-w-md">
        <p className="text-sm font-bold text-primary uppercase tracking-wide mb-4 text-center">
          Versículo Base
        </p>
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
        <div className="flex items-center gap-3 mb-4">
          {topicNumber && (
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-primary-foreground">{topicNumber}</span>
            </div>
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

function ConclusionSection({ content }: { content: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="w-full max-w-md">
        <p className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-4 text-center">
          Conclusão
        </p>
        <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <p className="text-foreground leading-relaxed text-center">
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
    { type: "title" as const, title: lessonTitle, content: "" }
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
      case "title":
        return <TitleSection title={section.title || lessonTitle} />;
      case "verse":
        return <VerseSection reference={section.reference} content={section.content} />;
      case "topic":
        return <TopicSection title={section.title || ""} content={section.content} topicNumber={section.topicNumber} />;
      case "conclusion":
        return <ConclusionSection content={section.content} />;
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
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={goPrev}
            disabled={isFirst}
            className={cn("flex-shrink-0", isFirst && "invisible")}
            data-testid="button-prev"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            onClick={goNext}
            className="flex-1 py-6 text-lg font-bold"
            data-testid="button-next"
          >
            {isLast ? "CONTINUAR" : "PRÓXIMO"}
            {!isLast && <ChevronRight className="h-5 w-5 ml-2" />}
          </Button>
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-2">
          {currentIndex + 1} de {totalSections}
        </p>
      </div>
    </div>
  );
}

export { parseStudyContent };
export type { StudySection };
